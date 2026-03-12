# Creeto AI — Prompt to Script Pipeline

**Stack:** Node.js · Express · TypeScript · Supabase · Supermemory · Perplexity · Claude · BullMQ · Redis

---

## Pipeline Flows (test in order)

| # | Flow | Endpoint | Job |
|---|------|----------|-----|
| 1 | Content Safety | middleware — runs automatically | SAFETY_CHECK |
| 2 | Fact-Check | POST /api/v1/factcheck/run | FACT_CHECK |
| 3 | Hook Generation | POST /api/v1/scripts/hooks | HOOK_GENERATE |
| 4 | Script Generation | POST /api/v1/scripts/generate | SCRIPT_GENERATE |
| 5 | Script Approval | PATCH /api/v1/scripts/:id/approve | — |

---

## Setup

```bash
cp .env.example .env
# Fill in all keys

cd apps/api
pnpm install

# Run Supabase migration
# paste supabase/migrations/001_init.sql into Supabase SQL editor

# Dev server
pnpm dev
```

## Test Flow 1 — Fact-Check

```bash
curl -X POST http://localhost:4000/api/v1/factcheck/run \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "topic": "AI is replacing software engineers",
    "prompt": "Make a video about AI tools replacing dev jobs",
    "contextSnippets": []
  }'
```

## Test Flow 2 — Hook Generation

```bash
curl -X POST http://localhost:4000/api/v1/scripts/hooks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "topic": "AI is replacing software engineers"
  }'
```

## Test Flow 3 — Script Generation

```bash
curl -X POST http://localhost:4000/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "topic": "AI is replacing software engineers",
    "selectedHook": { "variant": "A", "text": "Your hook text here", "toneDescriptor": "urgent" },
    "hookVariants": []
  }'
```

---

## Architecture

```
Request → Controller (try/catch, HTTP only)
            → Service (business logic, external APIs)
              → Repository (Supabase queries only)

Safety:   ContentSafetyPipeline() → required await before every LLM call
Research: Perplexity sonar-pro → per-claim verification with citations
Memory:   Supermemory.search() → persona + RAG context in one call
Script:   Claude claude-sonnet-4-20250514 → Zod validated JSON output
```

---

## Key Enforcement Rules

1. No `SCRIPT_GENERATE` without `FACT_CHECK` status = `SUCCEEDED`
2. `ContentSafetyPipeline()` must pass before every Claude/OpenAI call
3. Every LLM response validated by Zod before Supabase insert
