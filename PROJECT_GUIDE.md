# mt-bot — Development Guide

> This file is listed in `.gitignore` and is not committed to the repository.
> It serves as a living reference for conventions and architecture decisions.

---

## Project Structure

```
src/
├── common/
│   ├── redis/             # Global RedisService (get/set/del with TTL)
│   ├── http/              # HttpService — fetch wrapper with retry + backoff
│   ├── error/             # Global exception filter + ErrorResponseDto
│   ├── logging/           # LoggingService wrapper over NestJS Logger
│   ├── guards/            # BackendApiKeyGuard — X-API-KEY header validation
│   └── util/              # loadDockerSecrets helper
├── health/                # GET /health
├── backend-api/           # Typed HTTP client for mt-backend
│   ├── services/          # BackendApiService
│   └── dto/               # Request/response DTOs mirroring mt-backend
├── bot/                   # nestjs-telegraf update handlers
│   ├── bot.module.ts
│   ├── bot.update.ts      # @Command / @On / @Action handlers
│   ├── services/          # BotService — business logic
│   ├── keyboards/         # Inline keyboard builders
│   └── messages/          # Pure message formatter functions
├── callback/              # Internal HTTP endpoint for mt-backend callbacks
│   ├── callback.module.ts
│   ├── controllers/       # POST /internal/food-analysis-result
│   ├── services/          # Sends Telegram message via @InjectBot
│   └── dto/
├── app.module.ts
└── main.ts
```

---

## How to Add a New Bot Command

1. Add the handler method to `bot.update.ts` with `@Command('name')` or `@On('photo')`.
2. Delegate all logic to `BotService` — keep the update handler thin.
3. Add a new keyboard builder to `keyboards/` if the response needs inline buttons.
4. Add message formatters to `messages/` — keep them pure functions (no side effects).
5. Add corresponding `@Action('callback_data')` handlers for inline button callbacks.

---

## Common Infrastructure

### LoggingService

Thin wrapper over NestJS `Logger`. Always instantiate with a context string:

```typescript
{
  provide: LoggingService,
  useFactory: () => new LoggingService('MyService'),
}

constructor(private readonly logger: LoggingService) {}
this.logger.info('Something happened', { id });
this.logger.error('Something failed', error);
```

### RedisService

Available globally (`@Global()` module). Used for ephemeral bot session state.
Key naming convention: `<domain>:<action>:<id>` (e.g., `analysis:sent:entryId`).

### HttpService (from `common/http`)

Used exclusively for calls to `mt-backend`. Import `HttpModule` into the consuming module.
Retry count and timeouts are driven by env vars (`HTTP_RETRIES`, `HTTP_TIMEOUT_MS`, `HTTP_RETRY_DELAY_MS`).

### BackendApiKeyGuard

Protects the `/internal/*` callback endpoints from external callers.
Validates `X-API-KEY` header against `BACKEND_API_KEY` env var (same key as backend uses).

---

## Configuration

Direct `process.env` access is used throughout.
Docker secrets are loaded from `/run/secrets` before dotenv in `main.ts` via `loadDockerSecrets()`.

**Rule:** never hard-code secrets or URLs. Every external coordinate belongs in env.

---

## Callback Endpoint

`mt-backend` POSTs async food analysis results to:

```
POST /internal/food-analysis-result
X-API-KEY: <BACKEND_API_KEY>
```

The bot deduplicates deliveries using Redis keys `analysis:sent:{entryId}` (TTL 300s).
The callback service must not throw — log failures and continue.

---

## Deployment

### Docker

The `Dockerfile` uses a two-stage build:
- `builder` stage: installs all deps, compiles TypeScript
- `production` stage: copies `dist/` and `node_modules/` only, no dev tooling

Build and push manually:
```bash
docker build -t <IMAGE_NAME>:prod .
docker push <IMAGE_NAME>:prod
```

### Swarm Stack

`docker-stack.yml` in the project root defines the `bot` service for Docker Swarm / Dokploy.
All environment variables are passed from Dokploy's stack environment.

Required stack variables: see [Secrets](#secrets) section in README.

### GitHub Actions

`.github/workflows/deploy-prod.yml` — manual workflow (`workflow_dispatch`) that:
1. Builds and pushes `<IMAGE_NAME>:prod` and `<IMAGE_NAME>:sha-<git-sha>` to Docker Hub
2. Triggers Dokploy deployment webhook (`DOKPLOY_BOT_WEBHOOK_URL`)

No migration step — this service has no database.

---

## Auth

The bot itself authenticates users by their Telegram `tgId` (passed to `mt-backend`).
The internal callback endpoint is protected by `BackendApiKeyGuard` (`BACKEND_API_KEY`).

---

## Testing

No tests yet. When adding them, unit test services and message formatters directly.
Integration tests should stub `BackendApiService` and `RedisService`.
