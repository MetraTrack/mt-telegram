# Skill: bot-review-checklist

Use this skill as the review checklist when running the `code-reviewer` agent. Work through each section and report only actual violations.

---

## Update Handler Thinness (`bot.update.ts`)

- [ ] `@Command`, `@On`, `@Action` methods contain no business logic — delegate immediately to `BotService`.
- [ ] `@On('text')` filters out commands: `if (message?.text?.startsWith('/')) return;`
- [ ] No direct backend calls, Redis access, or ctx manipulation beyond routing.

---

## Service Boundaries

- [ ] All business logic is in `BotService` (for update handlers) or `CallbackService` (for callbacks).
- [ ] `CallbackService.handleResult` never throws — errors are logged and swallowed.
- [ ] Callback deliveries are deduplicated via Redis key `analysis:sent:{entryId}` TTL 300s.

---

## BackendApiService

- [ ] All HTTP calls to mt-backend go through `BackendApiService`. No raw `fetch` for JSON endpoints.
- [ ] Analysis endpoints (OpenAI pipeline) use `timeout: 30000` and `retries: 0`.
- [ ] Every call passes `this.apiHeaders` (`X-API-KEY`).
- [ ] New backend methods have a matching DTO in `src/backend-api/dto/`.

---

## Message Formatters

- [ ] Formatters are pure functions with no side effects.
- [ ] Shared formatters (e.g., `formatNotFood`) are source-agnostic — no photo/text-specific wording.
- [ ] No message formatting logic in `BotService` or `BotUpdate`.

---

## Auth Guards

- [ ] `BackendApiKeyGuard` applied on the `CallbackController` (protects `/internal/*`).

---

## Dependency Hygiene

- [ ] No new packages in `package.json` without explicit approval.
- [ ] No alternative HTTP client introduced (axios, got, node-fetch). Use `HttpService` or raw `fetch` for multipart only.
- [ ] No new global module-level side effects outside established `common/` modules.

---

## Documentation Freshness

- [ ] `README.md` updated if: new command added, behavior changed, new env variable introduced.
- [ ] `PROJECT_GUIDE.md` updated if: new command/handler pattern documented.
- [ ] `CLAUDE.md` or relevant agent/skill file updated if a new pattern or convention was established.

---

## Comment Quality

- [ ] No multi-line comment blocks.
- [ ] No JSDoc on standard methods.
- [ ] Comments present only where code alone cannot convey intent.
- [ ] No commented-out code.

---

## Output Format

```
VIOLATIONS:
- <file>:<line> — <what is wrong and why>

OK: <categories with no issues>
```

Report only violations. If none, write: `No violations found.`
