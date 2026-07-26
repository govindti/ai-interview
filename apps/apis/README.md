# Backend API

Express.js server powered by Bun, handling the interview lifecycle.

## Structure

```
src/
├── config/          # Zod-validated env config
├── lib/             # Logger, custom error classes
├── middleware/       # Error handler, request logger, Zod validation
├── modules/
│   ├── interview/   # Create interviews, scrape GitHub profiles
│   ├── session/     # OpenAI Realtime voice sessions via WebRTC
│   ├── result/      # AI evaluation (Gemini / GPT-4o)
│   └── linkedin/    # Playwright-based LinkedIn scraper
└── scrapers/        # GitHub API scraper
```

## Scripts

```sh
bun run dev       # Start with hot reload
bun run start     # Start production server
bun run typecheck # Type check only
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_KEY` | Yes | OpenAI API key |
| `GEMINI_API_KEY` | No | Gemini key (falls back to GPT-4o) |
| `PORT` | No | Server port (default: 3001) |
| `PROXY_URL` | No | HTTPS proxy for GitHub API |

## API Endpoints

All prefixed with `/api/v1` (port `3001`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/interview` | Create interview, scrape GitHub |
| `POST` | `/interview/:id/message` | Save transcript message |
| `POST` | `/session/:id` | Start voice session |
| `GET` | `/result/:id` | Get result + trigger evaluation |
| `GET` | `/linkedin?url=` | Scrape LinkedIn profile |
