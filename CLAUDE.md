# CLAUDE.md — MetraTrack Telegram Bot

MetraTrack bot is a NestJS Telegram bot that receives food photos and text descriptions from users, forwards them to `mt-backend` for OpenAI analysis, and delivers results back to users via async callbacks. Follow established patterns; do not invent new ones.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (Express) |
| Language | TypeScript |
| Telegram | nestjs-telegraf + Telegraf |
| HTTP client | Native `fetch` wrapper (`HttpService`) |
| Cache | Redis (RedisService) |
| Validation | class-validator + class-transformer |
| Auth | API key (`X-API-KEY`) header — no JWT |

---

## Project Structure

```
src/
├── common/
│   ├── redis/         # Global RedisService (get/set/del with TTL)
│   ├── http/          # HttpService — fetch wrapper with retry + backoff
│   ├── error/         # Global exception filter + ErrorResponseDto
│   ├── logging/       # LoggingService (thin NestJS Logger wrapper)
│   ├── guards/        # BackendApiKeyGuard — X-API-KEY header validation
│   └── util/          # loadDockerSecrets, date helpers
├── health/            # GET /health
├── backend-api/       # Typed HTTP client for mt-backend
│   ├── services/      # BackendApiService
│   └── dto/           # Request/response DTOs mirroring mt-backend shapes
├── bot/               # nestjs-telegraf update handlers
│   ├── bot.update.ts  # @Command / @On / @Action — thin routing layer only
│   ├── services/      # BotService — all business logic
│   ├── keyboards/     # Inline keyboard builders (pure functions)
│   └── messages/      # Message formatter functions (pure, no side effects)
├── callback/          # POST /internal/food-analysis-result
│   ├── controllers/   # CallbackController — receives async backend callbacks
│   ├── services/      # CallbackService — sends Telegram replies
│   └── dto/           # FoodAnalysisCallbackDto
├── app.module.ts
└── main.ts
```

---

## Architectural Rules

- **Update handlers stay thin.** `bot.update.ts` delegates immediately to `BotService`. No logic.
- **`@On('text')` must skip commands:** check `message.text.startsWith('/')` and return early.
- **All business logic in services.** `BotService` for update flows, `CallbackService` for callback flows.
- **All HTTP calls to mt-backend go through `BackendApiService`.**
- **Analysis endpoints need `timeout: 30000` and `retries: 0`** to avoid creating duplicate entries.
- **Message formatters are pure functions.** No side effects, no context. Shared formatters must be source-agnostic.
- **`CallbackService.handleResult` must never throw.** Catch, log, and continue.
- **Callback deduplication** via Redis key `analysis:sent:{entryId}` TTL 300s.

---

## Food Analysis Flow

Both photo and text analysis follow the same async pattern:

1. Bot receives update → sends loading reply → calls `BackendApiService`
2. Backend processes (OpenAI analysis, ~10–30s) and fires `POST /internal/food-analysis-result`
3. `CallbackService.handleResult` sends the Telegram reply (food entry card or not-food message)

The bot does not use the HTTP response body from the analysis call — the result always arrives via callback.

---

## Auth

- **Internal callbacks** (`/internal/*`) are protected by `BackendApiKeyGuard` (`X-API-KEY` vs `BACKEND_API_KEY` env var).
- **Backend API calls** pass `X-API-KEY` via `BackendApiService.apiHeaders`.
- No user authentication — users are identified by Telegram `tgId`.

---

## LoggingService

Instantiate with a context string via `useFactory`:

```ts
{ provide: LoggingService, useFactory: () => new LoggingService('MyService') }
```

Use `logger.info(msg, meta?)`, `logger.error(msg, error?, meta?)`, `logger.warn(msg, meta?)`.

---

## RedisService

Available globally (`@Global()` module). Key naming: `<domain>:<action>:<id>`.

---

## Configuration

Direct `process.env` access is used throughout. Docker secrets are loaded from `/run/secrets` before dotenv in `main.ts` via `loadDockerSecrets()`. Never hard-code secrets or URLs.

---

## Testing

No tests yet. When adding them, unit-test `BotService` methods and message formatters directly. Stub `BackendApiService` and `RedisService`.

---

## Maintenance Rules

When you change the project:
- **`README.md`** — update when adding commands, changing behavior, or adding env variables.
- **`PROJECT_GUIDE.md`** — update when adding new commands or handler patterns.
- **`CLAUDE.md`** and relevant `.claude/agents/` or `.claude/skills/` files when a new convention is established.

---

## Dependency Policy

- Do not add dependencies automatically.
- Suggest only when a dependency clearly solves a real problem. Never install without explicit confirmation.
- Never alter `package.json`, infrastructure config (Docker, CI), or `package-lock.json` without explicit instruction.

---

## Never Touch Without Explicit Request

- `.env` files and secrets
- Deployment configuration (Dockerfile, Docker Compose, CI pipelines, GitHub Actions)
- Infrastructure-critical settings (CORS, throttler)

---

## Canonical Commands

```bash
npm run start:dev    # Development watch mode
npm run build        # Compile to dist/
npm run start:prod   # Run compiled build
npm run lint         # ESLint with auto-fix
npm run format       # Prettier
```