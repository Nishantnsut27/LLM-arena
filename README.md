# LLM Arena
> A modern, open-source platform for head-to-head evaluation of Large Language Models.

**Live Demo**: [Live Demo](https://llmarenaai.vercel.app/)

## Overview
LLM Arena is an interactive application designed to crowdsource human preference for various Large Language Models (LLMs). The subjective nature of AI responses makes traditional benchmarks insufficient for judging model quality. LLM Arena solves this by allowing users to prompt up to three different models simultaneously. Users evaluate the responses side-by-side and vote for the best one. The resulting data powers an honest, community-driven leaderboard.

## Key Features
* **Multi-Model Prompting**: Prompt up to three large language models simultaneously from a single unified interface.
* **Parallel Streaming Responses**: Responses from multiple models stream into the UI concurrently, allowing users to compare speed and time-to-first-token in real-time.
* **Global & Personal Leaderboards**: View aggregate model win-rates across the entire platform, or filter the leaderboard to see your own personal model preferences based solely on your voting history.
* **Dynamic Model Catalog**: Seamless integration with OpenRouter provides a dynamic list of cutting-edge models, complete with real-time context window limitations and pricing data.
* **Shareable Threads**: Every conversation generates a unique public link, allowing users to share interesting model battles with the community.
* **Historical Thread Tracking**: Authenticated users can view their past prompts, model responses, and votes in an organized sidebar.

## How It Works
1. **Prompt Submission**: A user selects up to three models from the catalog, types a prompt into the composer, and hits send.
2. **Parallel Generation**: The Next.js backend leverages the Vercel AI SDK to open parallel streaming connections to the selected models via OpenRouter.
3. **Evaluation**: The user reads the streaming text from the models side-by-side.
4. **Voting**: The user clicks the trophy icon on the response they feel is best.
5. **Data Capture**: A Next.js Server Action records the vote in the PostgreSQL database. The UI records the win/loss data for the leaderboard.

## Technology Stack

**Frontend**
* [Next.js 16.3.0](https://nextjs.org/) (App Router)
* [React 19](https://react.dev/)
* [TailwindCSS v4](https://tailwindcss.com/)
* [Lucide React](https://lucide.dev/) (Icons)

**Backend**
* Next.js Server Actions & Route Handlers

**Database**
* [PostgreSQL](https://www.postgresql.org/) (Hosted via Prisma Postgres)
* [Prisma ORM](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-pg`)

**APIs & Services**
* **Authentication**: [Clerk](https://clerk.com/)
* **AI/LLM Routing**: [OpenRouter](https://openrouter.ai/)
* **Generative UI**: [Vercel AI SDK](https://sdk.vercel.ai/)
* **Security**: [Arcjet](https://arcjet.com/)

## Technical Highlights
* **Zero-API-Route Mutations**: All database updates (creating threads, casting votes) are handled securely via Next.js Server Actions, reducing boilerplate.
* **Edge-Ready Database Connection**: Uses the `@prisma/adapter-pg` driver adapter, ensuring the database connections perform efficiently in serverless environments.
* **Granular Security Controls**: Utilizes Arcjet to protect the public thread-sharing routes against automated scraping and volumetric bot attacks via IP-based sliding window rate limits.
* **Custom Prisma Output**: Configured a custom generation path for the Prisma Client to avoid node_module conflicts and integrated it into the Vercel deployment lifecycle using a `postinstall` script.

## Installation and Setup

### Prerequisites
* Node.js (v18+)
* pnpm (v10+)
* A PostgreSQL database
* Accounts for Clerk, OpenRouter, and Arcjet

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nishantnsut27/LLM-arena.git
   cd LLM-arena
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**
   Copy the example environment file and fill in your actual keys:
   ```bash
   cp .env.example .env
   ```

4. **Initialize the Database**
   Push the Prisma schema to your PostgreSQL database and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the Development Server**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Usage
* **Arena**: The main interface at `/`. Sign in, pick your models, and send a prompt. Wait for the streams to finish, then click the trophy icon to vote.
* **Leaderboard**: Navigate to `/leaderboard` to see the global rankings. Toggle to "Just me" to see your personal stats.
* **Models**: Navigate to `/models` to browse the catalog of available models pulled directly from OpenRouter.

## Environment Variables
The following environment variables are required in your `.env` file. **Never commit your actual `.env` file to version control.**

* `DATABASE_URL`: Your PostgreSQL connection string.
* `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Found in the Clerk dashboard; required for frontend auth.
* `CLERK_SECRET_KEY`: Found in the Clerk dashboard; required for backend auth validation.
* `OPENROUTER_API_KEY`: Used to authenticate requests to the OpenRouter API for model generation.
* `ARCJET_KEY`: Used to initialize the Arcjet security client for route protection.

## API / Integration Details
* **OpenRouter**: Acts as the single unified API for accessing dozens of different LLMs (OpenAI, Anthropic, Google, Meta, etc.) without needing separate API keys for each provider.
* **Clerk**: Handles all user identity, session management, and sign-in modals. The application relies on Clerk's `userId` to map interactions to the local database.
* **Arcjet**: Intercepts requests on public routes (like shared threads) and applies Shield and Bot Detection rules, throwing Next.js `forbidden()` boundaries if malicious traffic is detected.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
