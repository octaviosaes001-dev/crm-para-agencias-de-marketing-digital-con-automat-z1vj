```sql
-- ============================================================
-- CRM para agencias de marketing digital con automatización IA
-- Database Setup — Supabase PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search on contacts/companies

-- ============================================================
-- USERS
-- Extends Supabase auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  avatar_url          TEXT,
  plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (
                        subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled')
                      ),
  usage_count         INTEGER NOT NULL DEFAULT 0,       -- AI actions consumed this billing period
  usage_limit         INTEGER NOT NULL DEFAULT 50,      -- limit per plan
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-insert user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_plan ON public.users(plan);

-- ============================================================
-- SUBSCRIPTIONS
-- Stripe billing state per user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  status                  TEXT NOT NULL DEFAULT 'inactive' CHECK (
                            status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'incomplete')
                          ),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: select own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (webhook handler)
CREATE POLICY "subscriptions: service role full access"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================
-- CLIENTS (core domain — 1 of 3)
-- Companies / accounts managed by the agency
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- agency owner
  company_name    TEXT NOT NULL,
  industry        TEXT,                        -- e.g. 'ecommerce', 'saas', 'retail'
  website         TEXT,
  logo_url        TEXT,
  -- Primary contact
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  -- Business state
  status          TEXT NOT NULL DEFAULT 'prospect' CHECK (
                    status IN ('prospect', 'active', 'paused', 'churned')
                  ),
  monthly_budget  NUMERIC(12, 2),              -- client's ad/marketing budget (USD)
  lifetime_value  NUMERIC(12, 2) DEFAULT 0,   -- computed revenue from client
  acquisition_channel TEXT,                   -- how the agency got this client
  notes           TEXT,
  tags            TEXT[],                      -- e.g. ['seo', 'paid-ads', 'social']
  -- AI enrichment
  ai_summary      TEXT,                        -- AI-generated company summary
  ai_last_enriched_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: select own"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clients: insert own"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: update own"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: delete own"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX idx_clients_company_name_trgm ON public.clients USING GIN(company_name gin_trgm_ops);

-- ============================================================
-- CAMPAIGNS (core domain — 2 of 3)
-- Marketing campaigns linked to clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (
                    channel IN ('google_ads', 'meta_ads', 'email', 'seo', 'content', 'tiktok_ads', 'linkedin_ads', 'other')
                  ),
  objective       TEXT NOT NULL CHECK (
                    objective IN ('brand_awareness', 'lead_generation', 'conversions', 'traffic', 'engagement', 'retention')
                  ),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (
                    status IN ('draft', 'active', 'paused', 'completed', 'canceled')
                  ),
  -- Budget & dates
  budget          NUMERIC(12, 2),
  spent           NUMERIC(12, 2) DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  -- KPIs
  impressions     BIGINT DEFAULT 0,
  clicks          BIGINT DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  revenue         NUMERIC(12, 2) DEFAULT 0,   -- attributed revenue
  -- AI fields
  ai_strategy     TEXT,                        -- AI-generated campaign strategy
  ai_insights     TEXT,                        -- AI-generated performance insights
  ai_last_analyzed_at TIMESTAMPTZ,
  -- Metadata
  external_id     TEXT,                        -- ID on the ad platform
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: select own"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campaigns: insert own"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns: update own"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns: delete own"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_channel ON public.campaigns(channel);
CREATE INDEX idx_campaigns_start_date ON public.campaigns(start_date);

-- ============================================================
-- INTERACTIONS (core domain — 3 of 3)
-- Touchpoints, tasks, and AI-generated content per client
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id     UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (
                    type IN (
                      'meeting', 'call', 'email_sent', 'email_received',
                      'proposal', 'report', 'task', 'note',
                      'ai_copy', 'ai_report', 'ai_strategy'  -- AI-generated artifacts
                    )
                  ),
  title           TEXT NOT NULL,
  body            TEXT,                          -- notes, email body, or AI output
  -- Task-specific
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  priority        TEXT CHECK (priority IN ('low', 'medium', 'high')),
  -- AI metadata
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_prompt       TEXT,                          -- prompt used to generate this content
  ai_model        TEXT,                          -- e.g. 'gpt-4o'
  tokens_used     INTEGER DEFAULT 0,
  -- Attachments (stored in Supabase Storage, URLs here)
  attachment_urls TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions: select own"
  ON public.interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "interactions: insert own"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interactions: update own"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interactions: delete own"
  ON public.interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX idx_interactions_campaign_id ON public.interactions(campaign_id);
CREATE INDEX idx_interactions_type ON public.interactions(type);
CREATE INDEX idx_interactions_due_date ON public.interactions(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_interactions_created_at ON public.interactions(created_at DESC);

-- ============================================================
-- USAGE_LOGS
-- Tracks every AI action for billing / analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (
                action IN (
                  'ai_copy_generation',
                  'ai_campaign_strategy',
                  'ai_performance_insights',
                  'ai_client_enrichment',
                  'ai_email_draft',
                  'ai_report_generation'
                )
              ),
  -- Related resources (optional foreign keys stored as UUID to avoid strict FK)
  client_id   UUID,
  campaign_id UUID,
  -- Token & cost tracking
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model       TEXT,                   -- e.g. 'gpt-4o', 'gpt-4o-mini'
  -- Request context
  metadata    JSONB DEFAULT '{}',     -- prompt length, response length, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_logs: select own"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_logs: insert own"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all for analytics/billing
CREATE POLICY "usage_logs: service role full access"
  ON public.usage_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_created ON public.usage_logs(user_id, created_at DESC);

-- ============================================================
-- HELPER FUNCTION — Increment usage_count atomically
-- Call from server-side after every AI action
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET usage_count = usage_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION — Reset usage counts (cron: monthly)
-- Schedule via pg_cron or Supabase Edge Function
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET usage_count = 0
  WHERE subscription_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMPUTED VIEW — Client summary for dashboard
-- ============================================================
CREATE OR REPLACE VIEW public.client_summary AS
SELECT
  c.id,
  c.user_id,
  c.company_name,
  c.status,
  c.monthly_budget,
  c.lifetime_value,
  c.tags,
  COUNT(DISTINCT cam.id)                              AS total_campaigns,
  COUNT(DISTINCT cam.id) FILTER (WHERE cam.status = 'active') AS active_campaigns,
  SUM(cam.spent)                                      AS total_spent,
  SUM(cam.conversions)                                AS total_conversions,
  MAX(i.created_at)                                   AS last_interaction_at
FROM public.clients c
LEFT JOIN public.campaigns  cam ON cam.client_id = c.id
LEFT JOIN public.interactions i ON i.client_id  = c.id
GROUP BY c.id;

-- RLS on view is inherited from base tables via SECURITY INVOKER (default)
```