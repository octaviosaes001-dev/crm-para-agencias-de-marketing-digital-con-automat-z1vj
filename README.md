```markdown
# CRM para Agencias de Marketing Digital con Automatización IA

CRM para agencias de marketing digital con automatización IA es una plataforma SaaS diseñada para agilizar y optimizar la gestión de clientes mediante inteligencia artificial avanzada. Es ideal para agencias que buscan mejorar la eficiencia operativa y aumentar la satisfacción del cliente.

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS v4
- **Backend**: Supabase
- **Payments**: Stripe
- **AI**: OpenAI, Claude, Gemini

## Prerequisites

- Node.js 18+
- Supabase account
- API keys for Stripe, OpenAI, Claude, and Gemini

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/marketing-crm-ia.git
   cd marketing-crm-ia
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   Create a `.env.local` file in the root directory and add the following variables:

   ```plaintext
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   STRIPE_SECRET_KEY=
   OPENAI_API_KEY=
   CLAUDE_API_KEY=
   GEMINI_API_KEY=
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable Name              | Description                         |
|----------------------------|-------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL   | Supabase project URL                |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase project's anon key      |
| STRIPE_SECRET_KEY          | Stripe secret key for payments      |
| OPENAI_API_KEY             | API key for OpenAI integration      |
| CLAUDE_API_KEY             | API key for Claude integration      |
| GEMINI_API_KEY             | API key for Gemini integration      |

## Project Structure

- **/pages**: Includes all Next.js pages.
- **/components**: Reusable React components.
- **/styles**: Tailwind CSS styles.
- **/lib**: Utility functions and Supabase client.
- **/api**: Serverless API functions.

## Key Features

- **Client Management**: Manage client information and interactions.
- **AI Automation**: Leverage AI for task automation and insights.
- **Payment Processing**: Integrated with Stripe for seamless transactions.
- **Customizable Dashboards**: Tailor dashboards to agency needs.

## Deployment to Vercel

1. Push your code to a Git repository.
2. Go to [Vercel](https://vercel.com) and import your repository.
3. Set up the necessary environment variables in Vercel.
4. Deploy your application.

## API Documentation

### Main Endpoints

- **GET /api/clients**: Retrieves a list of clients.
- **POST /api/clients**: Adds a new client.
- **PUT /api/clients/:id**: Updates client information.
- **DELETE /api/clients/:id**: Removes a client.
- **POST /api/ai/process**: Processes tasks using AI.

## License

This project is licensed under the MIT License.
```
