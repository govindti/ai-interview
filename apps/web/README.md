# Frontend (Web)

Next.js 16 App Router application with React 19 and Tailwind CSS v4.

## Structure

```
app/
├── page.tsx                  # Landing page — GitHub URL input
├── interview/[interviewId]/  # Live voice interview page
└── result/[interviewId]/     # Score, feedback, transcript
components/
├── Form.tsx          # GitHub URL form
├── Interview.tsx     # WebRTC voice call + Deepgram transcription
├── VoiceOrb.tsx      # Audio-reactive animated orb visualization
└── Result.tsx        # Score display + conversation transcript
lib/
└── config.ts         # Backend URL constant
```

## Scripts

```sh
bun run dev          # Start dev server on port 3000
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Lint (zero warnings)
bun run check-types  # Type check
```

## Pages

| Route | Description |
|---|---|
| `/` | Enter a GitHub URL to start an interview |
| `/interview/[id]` | Live voice interview with AI + audio orbs |
| `/result/[id]` | Evaluated score, feedback, and transcript |
