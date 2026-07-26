# Database (@repo/db)

Prisma ORM package for PostgreSQL with shared schema and migrations.

## Schema

**Interview** — `id`, `githubMetadata` (JSON), `status` (Pre/InProgress/Done), `score`, `feedback`

**Message** — `id`, `message`, `type` (User/Assistant), `interviewId`, `createdAt`

## Scripts

```sh
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run dev migrations
bun run db:studio    # Open Prisma Studio GUI
bun run check-types  # Type check
```

## Usage

```ts
import { prisma } from "@repo/db";

const interview = await prisma.interview.create({
  data: { githubMetadata: { ... }, status: "Pre" },
});
```
