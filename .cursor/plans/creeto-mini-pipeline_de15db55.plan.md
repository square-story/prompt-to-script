---
name: creeto-mini-pipeline
overview: Implement the Creeto AI Mini prompt→research→script pipeline end-to-end on the existing apps/api and apps/web structure, with clean TypeScript layering and a toggleable real/mocked LLM integration.
todos:
  - id: types-and-validators
    content: Implement shared backend types and Zod schemas for pipeline, research, and script outputs.
    status: completed
  - id: env-logger-safety
    content: Set up env config, logger utility, and 2-layer ContentSafetyPipeline with OpenAI Moderation.
    status: completed
  - id: ingestion-and-llm-layer
    content: Implement ingestion service and LLM integration abstraction (real vs mock) plus research and script services.
    status: completed
  - id: controller-and-routes
    content: Create pipeline controller, routes, middlewares, and finalize Express server wiring.
    status: completed
  - id: frontend-api-and-ui
    content: Build frontend API client, PromptForm, ResearchView, ScriptView, and main page with loading and results states.
    status: completed
  - id: workspace-config-and-testing
    content: Align package.json and tsconfig files, add env example, and run end-to-end tests.
    status: completed
isProject: false
---

## Plan

### 1. Understand current layout & align with target

- **Inspect existing backend files**: `apps/api/src/server.ts`, `routes`, `controllers`, and `config/env.ts` to confirm current Express setup and how it differs from the described architecture.
- **Inspect existing frontend files**: `apps/web` (if present) to see current Next.js structure and ensure compatibility with the new single-flow page.
- **Confirm TypeScript + path aliases**: Verify `apps/api/tsconfig.json` and `apps/web/tsconfig.json` align with the `@/` alias requirements; adjust only where needed.

### 2. Core shared types & validation (backend)

- **Create shared types** in `apps/api/src/types/index.ts` exactly as specified for `ApiResponse`, `PipelineInput`, `IngestedContent`, `ResearchOutput`, `ScriptOutput`, `PipelineResult`, and `SafetyResult`.
- **Create Zod schemas** in `apps/api/src/validators/schemas.ts` for `PipelineInputSchema`, `ResearchOutputSchema`, and `ScriptOutputSchema` matching the given shapes and constraints.
- **Ensure exports** so controllers, services, and frontend typings can all reuse these definitions.

### 3. Configuration, logger, and safety utilities

- **Implement env loader** in `apps/api/src/config/env.ts` using Zod to validate `PORT`, `NODE_ENV`, and the three API keys, exporting a typed `env` object.
- **Add logger utility** in `apps/api/src/utils/logger.ts` using `pino`, with environment-based log level and no `console.log` usage elsewhere.
- **Implement safety pipeline** in `apps/api/src/utils/safety.ts`:
  - Add regex-based Layer 1 checks per the provided `BLOCKED_PATTERNS`.
  - Add Layer 2 using OpenAI Moderation API, mapping scores to a `SafetyResult` with `category` and `layer`.
  - Export `ContentSafetyPipeline` that runs Layer 1 then Layer 2, and returns a `SafetyResult` without throwing; higher layers will decide how to handle failures.

### 4. Ingestion service

- **Create `IngestionService`** in `apps/api/src/services/ingestion.service.ts`:
  - Implement `ingestPdf` using `pdf-parse` to extract text, truncate to 3000 chars, and return `IngestedContent` with `sourceType: 'pdf'` and filename as `sourceLabel`.
  - Implement `ingestUrl` using `fetch` + `cheerio` to pull selected tags (`p, article, h1, h2, h3`), join text, truncate to 3000 chars, and label via hostname.
  - Implement `ingestAll` to:
    - Always include the user `prompt` as an `IngestedContent` item (`sourceType: 'prompt'`).
    - Optionally ingest PDF and URLs, logging warnings (via `logger`) but not failing the pipeline on individual ingestion errors.

### 5. LLM integration abstraction (real vs mock)

- **Design a simple LLM client layer** in `apps/api/src/services` or `utils` (e.g. `llmClient.ts`):
  - Provide interfaces for `runPerplexityResearch`, `structureResearchWithClaude`, and `generateScriptWithClaude`.
  - Implement a `mode` switch (env-based) that chooses between real API calls and a deterministic mock implementation returning plausible but static `ResearchOutput` and `ScriptOutput`.
  - Real mode: implement Perplexity chat completion, Anthropic Claude calls, and OpenAI Moderation usage as per the spec; mock mode: return fast, hardcoded-but-typed responses for local testing.
  - Use Zod schemas to validate LLM JSON outputs before returning to services.

### 6. Research service

- **Implement `ResearchService`** in `apps/api/src/services/research.service.ts`:
  - Combine `IngestedContent` entries into a single context string in the specified `[SOURCE: label]\ncontent` format.
  - Call `ContentSafetyPipeline` on the combined input and, if not passed, throw a typed error that the error handler can map to 403.
  - Use the LLM abstraction: call Perplexity for freeform research + citations, then Claude to structure into `ResearchOutput`.
  - Validate Claude output using `ResearchOutputSchema.parse`, retrying once with a corrective prompt on Zod failure before ultimately throwing `Error('Research structuring failed')`.

### 7. Script service

- **Implement `ScriptService`** in `apps/api/src/services/script.service.ts`:
  - Run `ContentSafetyPipeline` on the original prompt; if blocked, throw a typed error for 403.
  - Build the Claude prompt using `research.verifiedFactsSummary`, `research.keyFindings`, and `research.statistics` exactly as described.
  - Use the LLM abstraction to call Claude, then validate the JSON with `ScriptOutputSchema.parse` with a single retry before throwing `Error('Script generation failed')`.
  - Return `ScriptOutput` enriched later in the controller with `sections`.

### 8. Controller & routing

- **Create `PipelineController`** in `apps/api/src/controllers/pipeline.controller.ts`:
  - Implement `run` exactly as outlined: parse `prompt` and `referenceUrls`, validate with `PipelineInputSchema`, call `ingestionService.ingestAll`, then `researchService.run`, then `scriptService.run`.
  - Build ordered `sections` array with word counts from the script fields, and assemble `PipelineResult` including `processingTimeMs` and `safetyPassed: true`.
  - Wrap everything in `try/catch`, using `next(err)` on failure; no business logic beyond orchestration.
  - Ensure response shape is `ApiResponse<PipelineResult>`.
- **Wire routes**:
  - Implement `apps/api/src/routes/pipeline.routes.ts` with multer memory storage and `POST /run` delegating to `pipelineController.run`.
  - Update `apps/api/src/routes/index.ts` to mount `pipelineRoutes` at `/pipeline` while preserving any existing routes needed for v2.

### 9. Middlewares and server wiring

- **Implement `errorHandler`** in `apps/api/src/middlewares/errorHandler.ts`:
  - Detect Zod errors, safety-block errors, external API failures, and timeouts, mapping them to the specified HTTP codes and user-facing messages.
  - Always log full error objects through `logger.error` but return only sanitized messages via `ApiResponse<null>`.
- **Implement `upload` middleware** in `apps/api/src/middlewares/upload.ts` for reusable multer config if needed beyond the pipeline route.
- **Finalize `server.ts`**:
  - Ensure Express app uses `helmet`, `cors`, `express.json`, and mounts `/api/v1` router and the `errorHandler`.
  - Replace any direct `console.info` with `logger.info` while keeping startup logging.

### 10. Frontend API client and types

- **Create `apps/web/src/lib/api.ts`**:
  - Implement `runPipeline(formData: FormData): Promise<PipelineResult>` that posts to `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pipeline/run`.
  - Handle multipart form submission, 120s timeout, and non-2xx responses by throwing `Error` with the backend `message`.
  - Reuse shared TypeScript interfaces for `PipelineResult` (duplicated or imported depending on feasible cross-app sharing).

### 11. Frontend components

- **PromptForm** in `apps/web/src/components/PromptForm.tsx`:
  - Implement a controlled form with prompt textarea, dynamic reference URL list (chips), single-PDF upload (drag/drop or click), and validation mirroring backend minimums.
  - Accept `onSubmit(formData, promptValue)` and `isLoading` props; disable inputs and show loading label when `isLoading` is true.
  - Serialize `referenceUrls` as JSON string in `FormData`.
- **ResearchView** in `apps/web/src/components/ResearchView.tsx`:
  - Render collapsible sections for topic summary, key findings, statistics, controversies, and verified facts.
  - Use Tailwind and minimal shadcn primitives for cards, badges, and collapsible panels; include a prominent "Copy research" button that copies `verifiedFactsSummary`.
- **ScriptView** in `apps/web/src/components/ScriptView.tsx`:
  - Show stats bar (word count, duration, section count) at top.
  - Render six section cards in order with label, purpose subtitle, contenteditable text areas, and per-section word counts; support local edits with reset-to-original behavior.
  - Provide "Copy full script" and "Download .txt" buttons wired to clipboard and client-side download logic.

### 12. Main Next.js page and layout

- **Layout** in `apps/web/src/app/layout.tsx`:
  - Set up dark editorial theme, base fonts, and Tailwind providers.
- **Main page** in `apps/web/src/app/page.tsx`:
  - Implement state machine: `phase` (`idle` | `loading` | `results`), `result`, and `error`.
  - Integrate React Query to manage the `runPipeline` mutation, including error states and retries if desired.
  - Implement loading UI with time-based message rotation and elapsed timer while the mutation is in-flight.
  - Render `PromptForm` in idle/loading, and `ResearchView` + `ScriptView` in results state with responsive layout and sticky top bar summarizing the prompt and a "Start Over" button.

### 13. Styling & Tailwind setup

- **Configure Tailwind** for the web app with the specified color tokens and fonts.
- **Integrate shadcn/ui** selectively for buttons, cards, badges, and collapsible components, ensuring consistent dark theme.
- **Apply UI design rules**: centered form, minimal chrome, clear copy buttons, and accessible confidence badges.

### 14. Workspace configuration & env

- **Ensure `apps/api/package.json` and `apps/web/package.json`** match the provided specs, adding any missing dependencies for fetch/LLM SDKs.
- **Confirm `apps/api/tsconfig.json`** matches the alias configuration; align `apps/web/tsconfig.json` similarly for `@/` imports.
- **Add root `package.json`** configured as a pnpm workspace that includes `apps/api` and `apps/web`.
- **Add `.env.example`** at the repo root (or under `apps/api`) with the specified variables and brief comments.

### 15. Sanity checks and minimal testing

- **Typecheck and lint** backend and frontend to catch TypeScript or obvious runtime issues.
- **Run manual tests** following the specified curl and browser steps to verify: pipeline runs end-to-end, safety blocks clearly, errors are mapped correctly, and the UI behaves according to the state machine.

