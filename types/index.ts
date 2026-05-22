```typescript
/**
 * types/index.ts
 * Central type definitions for CRM para agencias de marketing digital con automatización IA
 * Covers auth, billing, domain, and shared utility types.
 */

// ─────────────────────────────────────────────
// ENUMS & UNION TYPES
// ─────────────────────────────────────────────

export type PlanName = "free" | "starter" | "professional" | "agency" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "unpaid";

export type UserRole = "owner" | "admin" | "manager" | "agent" | "viewer";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost"
  | "on_hold";

export type DealStage =
  | "discovery"
  | "proposal"
  | "negotiation"
  | "contract_sent"
  | "closed_won"
  | "closed_lost";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "note"
  | "task"
  | "whatsapp"
  | "demo"
  | "proposal"
  | "ai_touchpoint";

export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";

export type CampaignChannel =
  | "email"
  | "whatsapp"
  | "sms"
  | "social_media"
  | "google_ads"
  | "meta_ads"
  | "linkedin_ads"
  | "tiktok_ads";

export type AIAutomationType =
  | "lead_scoring"
  | "email_drafting"
  | "follow_up_sequence"
  | "sentiment_analysis"
  | "proposal_generation"
  | "churn_prediction"
  | "upsell_suggestion"
  | "content_generation";

export type AIAutomationStatus = "idle" | "running" | "completed" | "failed" | "scheduled";

export type ContactType = "lead" | "prospect" | "client" | "partner" | "vendor";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type NotificationChannel = "in_app" | "email" | "slack" | "webhook";

// ─────────────────────────────────────────────
// CORE AUTH & BILLING TYPES
// ─────────────────────────────────────────────

/** Authenticated user account */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: UserRole;
  plan: PlanName;
  created_at: string; // ISO 8601
  updated_at: string;
  subscription_status: SubscriptionStatus;
  agency_id?: string | null; // null for workspace owners
  timezone: string;
  locale: string;
  onboarding_completed: boolean;
  last_seen_at?: string | null;
}

/** Billing plan definition */
export interface Plan {
  id: string;
  name: PlanName;
  display_name: string;
  price: number; // in cents (USD)
  price_annual: number; // in cents (USD), annual billing
  currency: string;
  stripe_price_id: string;
  stripe_price_id_annual?: string | null;
  features: PlanFeatures;
  limits: PlanLimits;
  is_active: boolean;
  is_popular?: boolean;
}

/** Feature flags per plan */
export interface PlanFeatures {
  ai_lead_scoring: boolean;
  ai_email_drafting: boolean;
  ai_proposal_generation: boolean;
  ai_sentiment_analysis: boolean;
  ai_churn_prediction: boolean;
  ai_content_generation: boolean;
  advanced_reporting: boolean;
  custom_fields: boolean;
  api_access: boolean;
  white_label: boolean;
  priority_support: boolean;
  team_collaboration: boolean;
  zapier_integration: boolean;
  custom_integrations: boolean;
  sso: boolean;
}

/** Quantitative limits per plan */
export interface PlanLimits {
  contacts: number; // -1 = unlimited
  deals: number;
  campaigns: number;
  team_members: number;
  ai_requests_per_month: number;
  storage_gb: number;
  email_sends_per_month: number;
}

/** Active Stripe subscription record */
export interface Subscription {
  id: string;
  user_id: string;
  agency_id: string;
  plan: PlanName;
  status: SubscriptionStatus;
  current_period_start: string; // ISO 8601
  current_period_end: string; // ISO 8601
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  trial_end?: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// APP CONFIGURATION
// ─────────────────────────────────────────────

/** Global application settings (stored per agency/tenant) */
export interface AppSettings {
  agency_id: string;

  /** Branding */
  company_name: string;
  company_logo_url?: string | null;
  primary_color: string;
  timezone: string;
  locale: string;
  currency: string;

  /** CRM pipeline configuration */
  default_pipeline_id?: string | null;
  lead_auto_assign: boolean;
  lead_rotation_strategy: "round_robin" | "load_balanced" | "manual";

  /** AI configuration */
  ai_enabled: boolean;
  ai_auto_lead_scoring: boolean;
  ai_follow_up_enabled: boolean;
  ai_language: string; // e.g. "es", "en"
  ai_tone: "formal" | "friendly" | "neutral";

  /** Notifications */
  notification_channels: NotificationChannel[];
  slack_webhook_url?: string | null;
  email_notifications: boolean;

  /** Integrations */
  google_ads_account_id?: string | null;
  meta_ads_account_id?: string | null;
  hubspot_sync_enabled: boolean;
  zapier_enabled: boolean;
  webhook_url?: string | null;

  /** Email */
  email_sender_name: string;
  email_sender_address: string;
  email_provider: "resend" | "sendgrid" | "mailgun" | "smtp";

  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// GENERIC API RESPONSE WRAPPER
// ─────────────────────────────────────────────

/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

/** Pagination / request metadata */
export interface ApiMeta {
  total?: number;
  page?: number;
  per_page?: number;
  has_more?: boolean;
  request_id?: string;
  duration_ms?: number;
}

/** Structured API error */
export interface ApiError {
  code: string; // e.g. "NOT_FOUND", "UNAUTHORIZED", "VALIDATION_ERROR"
  message: string;
  details?: Record<string, string[]> | null; // field-level validation errors
  status: number; // HTTP status code
}

/** Paginated list wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ─────────────────────────────────────────────
// DOMAIN — AGENCY / WORKSPACE
// ─────────────────────────────────────────────

/** Marketing agency workspace (top-level tenant) */
export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  size: "1-5" | "6-20" | "21-50" | "51-200" | "200+";
  country: string;
  owner_id: string;
  subscription_id?: string | null;
  plan: PlanName;
  created_at: string;
  updated_at: string;
}

/** Agency team member */
export interface TeamMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: UserRole;
  invited_at: string;
  joined_at?: string | null;
  is_active: boolean;
  assigned_pipeline_ids: string[];
  user?: Pick<User, "id" | "email" | "name" | "avatar_url">;
}

// ─────────────────────────────────────────────
// DOMAIN — CONTACTS & LEADS
// ─────────────────────────────────────────────

/** Contact (lead, prospect, or client) */
export interface Contact {
  id: string;
  agency_id: string;
  type: ContactType;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  company?: string | null;
  job_title?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;
  status: LeadStatus;
  source: LeadSource;
  assigned_to?: string | null; // team member user_id
  tags: string[];
  custom_fields: Record<string, unknown>;

  /** AI-generated fields */
  ai_score?: number | null; // 0–100
  ai_score_reason?: string | null;
  ai_sentiment?: "positive" | "neutral" | "negative" | null;
  ai_churn_risk?: "low" | "medium" | "high" | null;
  ai_next_action_suggestion?: string | null;

  /** Timestamps */
  last_contacted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadSource =
  | "organic_search"
  | "paid_search"
  | "social_media"
  | "referral"
  | "cold_outreach"
  | "website_form"
  | "event"
  | "partner"
  | "ai_identified"
  | "import"
  | "other";

// ─────────────────────────────────────────────
// DOMAIN — PIPELINE & DEALS
// ─────────────────────────────────────────────

/** Sales pipeline definition */
export interface Pipeline {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  stages: PipelineStage[];
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Individual stage within a pipeline */
export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  order: number;
  color: string;
  probability: number; // 0–100 (%)
  deal_stage: DealStage;
  auto_actions?: StageAutomation[];
}

/** Automation triggered on stage entry */
export interface StageAutomation {
  id: string;
  trigger: "on_enter" | "on_exit" | "after_n_days";
  days?: number; // used when trigger = "after_n_days"
  action: "send_email" | "assign_task" | "notify_team" | "run_ai_automation" | "send_whatsapp";
  template_id?: string | null;
  ai_automation_type?: AIAutomationType | null;
}

/** Deal / opportunity */
export interface Deal {
  id: string;
  agency_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string;
  title: string;
  value: number; // in cents
  currency: string;
  probability: number; // 0–100 (%)
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  deal_stage: DealStage;
  assigned_to?: string | null;
  tags: string[];
  lost_reason?: string | null;
  custom_fields: Record<string, unknown>;

  /** AI insights */
  ai_win_probability?: number | null;
  ai_risk_flags?: string[];
  ai_recommended_actions?: string[];

  created_at: string;
  updated_at: string;

  /** Computed / joined */
  contact?: Pick<Contact, "id" | "first_name" | "last_name" | "email" | "company">;
}

// ─────────────────────────────────────────────
// DOMAIN — ACTIVITIES & TASKS
// ─────────────────────────────────────────────

/** Activity log entry on a contact or deal */
export interface Activity {
  id: string;
  agency_id: string;
  contact_id?: string | null;
  deal_id?: string | null;
  type: ActivityType;
  subject: string;
  body?: string | null;
  direction?: "inbound" | "outbound" | null;
  duration_minutes?: number | null; // for calls / meetings
  outcome?: string | null;
  created_by: string;
  ai_generated: boolean;
  metadata: Record<string, unknown>;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

/** Task assigned to a team member */
export interface Task {
  id: string;
  agency_id: string;
  contact_id?: string | null;
  deal_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  ai_suggested: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// DOMAIN — CAMPAIGNS & MARKETING
// ─────────────────────────────────────────────

/** Marketing campaign */
export interface Campaign {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  status: CampaignStatus;
  audience_filter: AudienceFilter;
  template_id?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by: string;

  /** AI-assisted fields */
  ai_generated_content: boolean;
  ai_optimized_send_time: boolean;

  /** Performance metrics */
  metrics?: CampaignMetrics;

  created_at: string;
  updated_at: string;
}

/** Segment / filter used to define campaign audience */
export interface AudienceFilter {
  contact_types?: ContactType[];
  lead_statuses?: LeadStatus[];
  tags?: string[];
  ai_score_min?: number;
  ai_score_max?: number;
  assigned_to?: string[];
  pipeline_ids?: string[];
  created_after?: string;
  created_before?: string;
  custom_field_filters?: Array<{ field: string; operator: string; value: unknown }>;
}

/** Campaign performance stats */
export interface CampaignMetrics {
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  conversions: number;
  revenue_attributed: number; // in cents
  open_rate: number; // percentage
  click_rate: number; // percentage
  conversion_rate: number; // percentage
}

/** Reusable message / email template */
export interface Template {
  id: string;
  agency_id: string;
  name: string;
  channel: CampaignChannel;
  subject?: string | null; // for email
  body: string; // supports {{variables}}
  variables: string[];
  ai_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// DOMAIN — AI AUTOMATIONS
// ─────────────────────────────────────────────

/** AI automation job / run record */
export interface AIAutomation {
  id: string;
  agency_id: string;
  type: AIAutomationType;
  status: AIAutomationStatus;
  triggered_by: "user" | "schedule" | "pipeline_stage" | "system";
  triggered_by_user_id?: string | null;

  /** Input context for the AI */
  input: AIAutomationInput;

  /** Output from the AI */
  output?: AIAutomationOutput | null;

  tokens_used?: number | null;
  model_used?: string | null;
  error_message?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface AIAutomationInput {
  contact_id?: string | null;
  deal_id?: string | null;
  campaign_id?: string | null;
  prompt_override?: string | null;
  context: Record<string, unknown>;
}

export interface AIAutomationOutput {
  text?: string | null; // drafted email, proposal text, etc.
  score?: number | null; // lead score
  sentiment?: "positive" | "neutral" | "negative" | null;
  risk_level?: "low" | "medium" | "high" | null;
  suggestions?: string[];
  structured_data?: Record<string, unknown>;
}

/** Usage tracking for AI credits */
export interface AIUsage {
  id: string;
  agency_id: string;
  user_id: string;
  automation_type: AIAutomationType;
  tokens_used: number;
  cost_usd_cents: number;
  created_at: string;
}

// ─────────────────────────────────────────────
// DOMAIN — REPORTS & ANALYTICS
// ─────────────────────────────────────────────

/** Dashboard KPI snapshot */
export interface DashboardMetrics {
  period: "today" | "week" | "month" | "quarter" | "year" | "custom";
  period_start: string;
  period_end: string;

  /** CRM KPIs */
  total_contacts: number;
  new_contacts: number;
  total_deals: number;
  deals_won: number;
  deals_lost: number;
  pipeline_value: number; // in cents
  closed_revenue: number; // in cents
  average_deal_size: number; // in cents
  win_rate: number; // percentage

  /** Activity KPIs */
  total_activities: number;
  calls_made: number;
  emails_sent: number;
  meetings_held: number;

  /** Campaign KPIs */
  campaigns_active: number;
  campaign_leads_generated: number;

  /** AI KPIs */
  ai_automations_run: number;
  ai_tokens_used: number;
  ai_suggested_actions_taken: number;
}

/** Pipeline performance breakdown per stage */
export interface PipelineReport {
  pipeline_id: string;
  pipeline_name: string;
  stages: Array<{
    stage_id: string;
    stage_name: string;
    deals_count: number;
    total_value: number;
    avg_days_in_stage: number;
    conversion_rate: number; // to next stage
  }>;
  total_value: number;
  avg_cycle_days: number;
}

// ─────────────────────────────────────────────
// DOMAIN — INVOICES & BILLING (client-facing)
// ─────────────────────────────────────────────

/** Invoice issued by the agency to their client */
export interface Invoice {
  id: string;
  agency_id: string;
  contact_id: string;
  deal_id?: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number; // in cents
  tax_rate: number; // percentage
  tax_amount: number; // in cents
  total: number; // in cents
  currency: string;
  issued_at: string;
  due_at: string;
  paid_at?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number; // in cents
  total: number; // in cents
}

// ─────────────────────────────────────────────
// DOMAIN — NOTIFICATIONS
// ─────────────────────────────────────────────

/** In-app / cross-channel notification */
export interface Notification {
  id: string;
  agency_id: string;
  user_id: string;
  title: string;
  body: string;
  type:
    | "deal_updated"
    | "task_due"
    | "lead_scored"
    | "campaign_completed"
    | "ai_suggestion"
    | "subscription_alert"
    | "mention"
    | "system";
  resource_type?: "contact" | "deal" | "task" | "campaign" | "invoice" | null;
  resource_id?: string | null;
  is_read: boolean;
  channel: NotificationChannel;
  created_at: string;
}

// ─────────────────────────────────────────────
// UTILITY / SHARED TYPES
// ─────────────────────────────────────────────

/** Minimal user reference for dropdowns / assignments */
export type UserRef = Pick<User, "id" | "name" | "email" | "avatar_url">;

/** Generic key-value option for selects */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

/** Date range filter */
export interface DateRange {
  from: string; // ISO 8601
  to: string; // ISO 8601
}

/** Sortable column definition */
export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

/** Pagination params for API requests */
export interface PaginationParams {
  page: number;
  per_page: number;
  sort?: SortConfig;
}

/** Form state wrapper */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isLoading: boolean;
  isDirty: boolean;
}

/** Webhook event payload */
export interface WebhookEvent {
  id: string;
  type: string;
  agency_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Supabase / DB row base fields */
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}
```