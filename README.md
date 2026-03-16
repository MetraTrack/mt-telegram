# mt-bot — MetraTrack Telegram Bot

Telegram-facing frontend for the MetraTrack nutrition tracking app. Stateless bot that delegates all business logic to `mt-backend` via HTTP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 5.7 |
| Telegram | nestjs-telegraf + telegraf |
| Session store | Redis (ioredis) — ephemeral only |
| Backend client | Custom HttpService (fetch-based) |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI |

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
│   ├── controllers/
│   ├── services/
│   └── dto/
├── backend-api/           # Typed HTTP client for mt-backend
│   ├── services/          # BackendApiService
│   └── dto/               # Request/response DTOs mirroring mt-backend
├── bot/                   # nestjs-telegraf update handlers
│   ├── bot.module.ts
│   ├── bot.update.ts      # @Command / @On / @Action handlers (module root)
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

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Register user and show welcome message |
| `/today` | Today's calorie & macro summary |
| `/history` | Paginated list of confirmed food entries |
| `/reviews` | Daily / weekly / monthly AI nutrition reviews |
| _(photo)_ | Analyze meal photo → nutrition summary + confirm button |

---

## Getting Started

### Prerequisites

- Node.js 22+
- Redis
- A running `mt-backend` instance
- A Telegram bot token (create one via [@BotFather](https://t.me/BotFather))

### Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Start in development (watch) mode
npm run start:dev
```

### Swagger UI

Available at: [http://localhost:3001/docs](http://localhost:3001/docs)

### Health check

```
GET /health
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `BACKEND_HOST` | Yes | Base URL of mt-backend (e.g. `http://localhost:3000`) |
| `BACKEND_API_KEY` | Yes | Shared secret for mt-backend requests and inbound callbacks |
| `REDIS_HOST` | Yes | Redis hostname |
| `REDIS_PORT` | Yes | Redis port (default 6379) |
| `REDIS_PASSWORD` | No | Redis password if required |
| `PORT` | No | HTTP port (default 3001) |
| `NODE_ENV` | No | `development` or `production` |

See `.env.example` for all variables with descriptions.

---

## Callback Endpoint

`mt-backend` can POST async analysis results to:

```
POST /internal/food-analysis-result
X-API-KEY: <BACKEND_API_KEY>
```

The bot deduplicates deliveries using Redis keys `analysis:sent:{entryId}` (TTL 300s).

---

## Docker Secrets

`loadDockerSecrets()` (called in `main.ts`) reads files from `/run/secrets/` and injects them as environment variables. Existing env vars take precedence.

---

## Testing

```bash
npm run test
npm run test:cov
```
