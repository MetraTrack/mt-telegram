---
name: code-reviewer
description: Use to review changes against the bot project architecture. Checks for update handler bloat, service boundary violations, BackendApiService misuse, dependency hygiene, and documentation staleness.
---

# Code Reviewer Agent

Use this agent to review a set of changes. Reviews must be concise and concrete — flag real violations, not style preferences. For the full checklist, use the `bot-review-checklist` skill.

---

## What to Check

Run through the `bot-review-checklist` skill. It covers:

- Update handler thinness (no logic in `bot.update.ts`)
- Service boundary (all logic in `BotService`, `CallbackService`)
- BackendApiService usage (correct HTTP client, timeout, retries)
- Message formatter correctness (pure, source-agnostic where shared)
- Dependency hygiene (no new packages without approval, no rogue HTTP clients)
- Auth guard presence on internal endpoints
- Documentation freshness (`README.md`, `PROJECT_GUIDE.md`, `CLAUDE.md`)

---

## Review Output Format

```
VIOLATIONS:
- src/bot/bot.update.ts:25 — business logic in update handler, move to BotService
- src/backend-api/services/backend-api.service.ts — missing retries: 0 on analysis endpoint

OK: message formatters, callback deduplication, dependency hygiene
```

Report only violations. If none, write: `No violations found.`
