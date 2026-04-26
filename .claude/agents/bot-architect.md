---
name: bot-architect
description: Use when adding a new bot command, handler, backend API call, or callback path. Enforces module anatomy, service/update boundaries, BackendApiService patterns, logging, and message formatter conventions.
---

# Bot Architect Agent

Use this agent when adding a new Telegram command, event handler, backend API integration, or callback path.

---

## Module Anatomy

```
src/
├── common/           # Infrastructure: http/, redis/, logging/, guards/, error/, util/
├── backend-api/      # Typed HTTP client for mt-backend (BackendApiService + DTOs)
├── bot/              # nestjs-telegraf handlers and business logic
│   ├── bot.update.ts       # @Command / @On / @Action — thin routing layer only
│   ├── services/           # BotService — all business logic
│   ├── keyboards/          # Inline keyboard builders (pure functions)
│   └── messages/           # Message formatter functions (pure, no side effects)
├── callback/         # POST /internal/food-analysis-result — receives async backend results
└── health/           # GET /health
```

---

## Update Handler Rules (`bot.update.ts`)

- `@Command`, `@On`, `@Action` handlers delegate immediately to `BotService`. No logic.
- `@On('text')` must skip commands: `if (message?.text?.startsWith('/')) return;`
- Keep the update file thin — it is a routing adapter, not a business layer.

---

## BotService Rules

- All bot business logic lives in `BotService`.
- Always call `ensureRegistered(from)` before any backend call that requires a user.
- Send a loading reply before any async backend call so the user gets immediate feedback.
- Catch errors at the method level, log with `LoggingService`, and reply with `formatError()`.
- Never let errors propagate to the Telegraf update handler.

---

## BackendApiService Rules

- All HTTP calls to mt-backend go through `BackendApiService`.
- For JSON endpoints use `this.http.post/get/patch` (via `HttpService`).
- For multipart/form-data use raw `fetch` (as in `analyzeFood`).
- Analysis endpoints that call OpenAI need a 30s timeout and `retries: 0` to avoid duplicate entries.
- Always pass `this.apiHeaders` (`X-API-KEY`) on every call.

---

## Message Formatters

- Pure functions in `src/bot/messages/`. No side effects, no Telegraf context.
- Source-agnostic messages (e.g., `formatNotFood`) must not reference a specific input type.
- Reuse existing formatters before creating new ones.

---

## Keyboard Builders

- Pure functions in `src/bot/keyboards/`. Return inline keyboard objects.
- No business logic in keyboards.

---

## Callback Service Rules

- `CallbackService.handleResult` must never throw — catch, log, and continue.
- Deduplicate food-result deliveries via Redis: key `analysis:sent:{entryId}`, TTL 300s.
- The callback DTO shape is defined by `FoodAnalysisCallbackDto`.

---

## LoggingService

Instantiate with a context string:

```ts
{ provide: LoggingService, useFactory: () => new LoggingService('MyService') }
```

Use `logger.info(msg, meta?)`, `logger.error(msg, error?, meta?)`, `logger.warn(msg, meta?)`.

---

## Keeping Documentation Updated

- New bot command → update `PROJECT_GUIDE.md`
- New env variable → update `.env.example` (if one exists) and `README.md`
- New pattern or convention → update the relevant agent or skill file and `CLAUDE.md`
