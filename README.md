# AI Interview

An AI-powered voice interview platform that conducts real-time technical interviews using WebRTC, evaluates candidates with AI, and provides detailed feedback — all driven by a candidate's GitHub profile.

## Features

- **GitHub-powered interviews** — Scrapes a candidate's public repos to tailor interview questions
- **Real-time voice AI** — WebRTC-based voice calls with OpenAI's Realtime API (`gpt-realtime` model)
- **Live transcription** — Deepgram WebSocket API for real-time speech-to-text
- **AI evaluation** — Gemini 3.5 Flash (or GPT-4o fallback) scores and provides feedback on the interview
- **Animated UI** — Reactive audio orbs visualizing AI and candidate voice levels in real time
- **LinkedIn scraping** — Optional Playwright-based LinkedIn profile scraper (via DataImpulse proxy)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun 1.3.14 |
| Monorepo | Turborepo 2.10.7 |
| Backend | Express 5.2.1 (Bun) |
| Frontend | Next.js 16.2.0 (App Router), React 19 |
| Database | PostgreSQL 16, Prisma ORM |
| AI (Voice) | OpenAI Realtime API |
| AI (Evaluation) | Google Gemini 3.5 Flash / OpenAI GPT-4o |
| Transcription | Deepgram WebSocket API |
| CSS | Tailwind CSS v4 |
| UI | Radix UI, shadcn/ui-style components |

## Project Structure

```
ai-interview/
├── apps/
│   ├── apis/              # Backend API server (Express + Bun)
│   │   └── src/
│   │       ├── config/    # Zod-validated environment config
│   │       ├── lib/       # Logger, custom errors
│   │       ├── middleware/ # Error handler, validation, request logging
│   │       ├── modules/   # interview, session, result, linkedin
│   │       └── scrapers/  # GitHub API scraper
│   └── web/               # Frontend (Next.js)
│       ├── app/           # Pages: /, /interview/[id], /result/[id]
│       ├── components/    # Form, Interview, VoiceOrb, Result
│       └── lib/           # Backend URL config
├── packages/
│   ├── db/                # Prisma ORM + PostgreSQL schema
│   ├── ui/                # Shared React component library
│   ├── eslint-config/     # Shared ESLint configs
│   └── typescript-config/ # Shared tsconfig presets
├── docker-compose.yml     # PostgreSQL container
└── turbo.json             # Turborepo pipeline config
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3+
- [Docker](https://www.docker.com/) (for PostgreSQL)
- OpenAI API key
- (Optional) Google Gemini API key, Deepgram API key

### 1. Install dependencies

```sh
bun install
```

### 2. Start the database

```sh
bun run db:up
```

### 3. Set up environment variables

Copy the example env file and fill in your API keys:

```sh
cp .env.example apps/apis/.env
```

**Required:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_KEY` | OpenAI API key (voice + fallback evaluation) |

**Optional:**

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini key for evaluation (falls back to GPT-4o) |
| `DATAIMPULSE_PROXY_URL` | Proxy URL for LinkedIn scraping |
| `DATAIMPULSE_PROXY_USERNAME` | DataImpulse proxy username |
| `DATAIMPULSE_PROXY_PASSWORD` | DataImpulse proxy password |

### 4. Run migrations and generate Prisma client

```sh
bun run db:migrate
bun run db:generate
```

### 5. Start the dev servers

```sh
bun run dev
```

This starts:
- **Frontend** at `http://localhost:3000`
- **Backend** at `http://localhost:3001`

## How It Works

```
┌─────────────┐     POST /api/v1/interview     ┌─────────────┐
│  Landing     │ ──────────────────────────────>│  Backend     │
│  Page        │                                │  scrapes     │
│  (GitHub URL)│                                │  GitHub API  │
└──────┬──────┘                                └──────┬──────┘
       │                                              │
       │  navigate to /interview/[id]                 │ creates Interview
       ▼                                              ▼
┌─────────────┐    WebRTC SDP offer/answer       ┌─────────────┐
│  Interview   │ <──────────────────────────────>│  Session     │
│  Page        │    Deepgram transcription       │  Module      │
│  (Voice Orb) │ ──────────────────────────────>│              │
└──────┬──────┘    AI sideband transcripts       │  OpenAI      │
       │                                          │  Realtime    │
       │  navigate to /result/[id]                │  API         │
       ▼                                          └─────────────┘
┌─────────────┐    GET /api/v1/result/[id]       ┌─────────────┐
│  Result      │ <──────────────────────────────>│  Result      │
│  Page        │    (triggers AI evaluation)     │  Module      │
│  Score +     │                                 │  Gemini /    │
│  Feedback    │                                 │  GPT-4o      │
└─────────────┘                                 └─────────────┘
```

## Database Schema

**Interview** — Stores interview session and GitHub metadata.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `githubMetadata` | JSON | Scraped GitHub profile data |
| `status` | Enum | `Pre`, `InProgress`, `Done` |
| `score` | Int | AI-evaluated score (1-10) |
| `feedback` | String? | AI-generated feedback |

**Message** — Individual conversation messages.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `message` | String | Transcript text |
| `type` | Enum | `User`, `Assistant` |
| `interviewId` | UUID | Foreign key to Interview |
| `createdAt` | DateTime | Timestamp |

## API Endpoints

All endpoints prefixed with `/api/v1`. Backend runs on port `3001`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/interview` | Create interview, scrape GitHub profile |
| `POST` | `/interview/:interviewId/message` | Save a user transcript message |
| `POST` | `/session/:interviewId` | Start voice session, return SDP answer |
| `GET` | `/result/:interviewId` | Get result (triggers AI evaluation if pending) |
| `GET` | `/linkedin?url=` | Scrape a LinkedIn profile page |

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page — enter a GitHub URL to start an interview |
| `/interview/[id]` | Live voice interview with AI interviewer + audio orbs |
| `/result/[id]` | Score, feedback, and full conversation transcript |

## Available Scripts

```sh
bun run dev          # Start all apps in dev mode
bun run build        # Build all apps and packages
bun run lint         # Lint all apps and packages
bun run format       # Format code with Prettier
bun run check-types  # Type check all packages
bun run db:up        # Start PostgreSQL container
bun run db:down      # Stop PostgreSQL container
bun run db:reset     # Reset database (delete data + restart)
bun run db:migrate   # Run Prisma migrations
bun run db:generate  # Generate Prisma client
bun run db:studio    # Open Prisma Studio GUI
```
