# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager:** `pnpm` only — never use npm or yarn.

```bash
# Install dependencies
pnpm install

# Run all apps in development
pnpm dev

# Run a single app
pnpm --filter api dev
pnpm --filter web dev

# Build all
pnpm build

# Lint all
pnpm lint
```

**No test suite exists** — no test framework is configured.

## Architecture

Monorepo with two apps (`apps/api`, `apps/web`) and empty shared `packages/`.

### API (`apps/api`) — Express + TypeScript on port 4000

Strict layered architecture — do not mix concerns:

```
Controller  →  Service  →  Repository
(HTTP only)   (business)  (Supabase only)
```

- **Controllers** (`src/controllers/`): try/catch on every method, HTTP request/response only, no business logic.
- **Services** (`src/services/`): business logic + external API calls, no DB queries.
- **Repositories** (`src/repositories/`): all Supabase queries, nothing else.
- **Validators** (`src/validators/schemas.ts`): Zod schemas for all I/O; every LLM response must be validated before writing to Supabase.
- **Prompts** (`src/prompts/`): externalized LLM prompt templates.

**API routes** (base: `/api/v1`):
- `POST /pipeline/run` — full pipeline: ingest → research → script
- `POST /factcheck/run` — standalone fact-check
- `POST /scripts/hooks` — generate hook variants
- `POST /scripts/generate` — generate full script
- `PATCH /scripts/:scriptId/approve` — approve script

**Response shape** (always):
```typescript
{ success: boolean, message: string, data?: T }
```

**Path aliases** (use these, not relative paths):
`@/controllers`, `@/services`, `@/repositories`, `@/types`, `@/utils`, `@/config`, `@/validators`, `@/workers`, `@/queue`, `@/prompts`

### Web (`apps/web`) — Next.js 14 (App Router) on port 3000

- `src/app/` — App Router pages and layout
- `src/components/` — React components (`PromptForm`, `ResearchView`, `ScriptView`)
- `src/lib/api.ts` — `runPipeline()` client function calling the API
- `src/types/pipeline.ts` — shared frontend types
- Uses TanStack Query (`@tanstack/react-query`) for data fetching

### Pipeline Flow

1. User submits prompt (+ optional PDF/URLs) via `PromptForm`
2. `POST /api/v1/pipeline/run` → `PipelineController`
3. `ingestionService.ingestAll()` — extracts text from PDF/URLs with Cheerio/pdf-parse
4. **Safety check** (`ContentSafetyPipeline`) — 4 layers: keyword filter → OpenAI Moderation → rules engine → Claude misinformation pre-check. **Required before every LLM call.**
5. `runResearch()` → OpenAI GPT-4o, validated by `ResearchOutputSchema`
6. `generateScript()` → Claude (`claude-sonnet-4-20250514`), validated by `VideoScriptSchema`
7. Returns `PipelineResult { research, script, processingTimeMs }`

### LLM Configuration

- Claude model: `claude-sonnet-4-20250514`
- Perplexity: `sonar-pro` with `return_citations: true`
- `LLM_MODE=mock` (in `.env`) skips real API calls and returns mock data — use this for development
- Max 3 retry attempts on Zod parse failure for LLM responses

### Key Enforcement Rules

1. `ContentSafetyPipeline()` must pass before every Claude/OpenAI generation call
2. No `SCRIPT_GENERATE` without prior `FACT_CHECK` status = `SUCCEEDED`
3. Every LLM response validated by Zod before Supabase insert
4. No `console.log` — use `pino` logger
5. No raw LLM text blobs stored in Supabase
6. No `any` types in TypeScript

### Environment Variables

Copy `.env.example` → `.env`. Key variables:
- `LLM_MODE=mock` — set to `real` to use actual APIs
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL=redis://localhost:6379` — required for BullMQ job queue
- `NEXT_PUBLIC_API_URL=http://localhost:4000` — web app API base URL

Database schema: `apps/api/supabase_migration.sql`
