# Skill: add-bot-command

Use this skill when adding a new Telegram command, event handler, or inline button callback to the bot.

---

## Steps

1. **Add the handler in `bot.update.ts`** — thin routing only, delegate to `BotService`.
2. **Add the method in `BotService`** — all business logic, backend calls, error handling.
3. **Add message formatters in `src/bot/messages/`** if the reply needs a new format (pure functions).
4. **Add keyboard builders in `src/bot/keyboards/`** if the reply needs inline buttons (pure functions).
5. **Register `@Action` handlers** in `bot.update.ts` for any inline button callbacks.

---

## Handler Templates

### Command handler

```ts
// bot.update.ts
@Command('mycommand')
async onMyCommand(ctx: Context): Promise<void> {
  await this.botService.handleMyCommand(ctx);
}

// bot.service.ts
async handleMyCommand(ctx: Context): Promise<void> {
  const tgId = String(ctx.from?.id);
  try {
    const result = await this.backendApi.someCall(tgId, ...);
    await ctx.reply(formatMyResult(result));
  } catch (error) {
    this.logger.error('handleMyCommand failed', error, { tgId });
    await ctx.reply(formatError());
  }
}
```

### Text event handler (non-command plain text)

```ts
// bot.update.ts
@On('text')
async onText(ctx: Context): Promise<void> {
  const message = (ctx as any).message;
  if (!message?.text || message.text.startsWith('/')) return;
  await this.botService.handleText(ctx);
}
```

### Photo handler

```ts
// bot.update.ts
@On('photo')
async onPhoto(ctx: Context): Promise<void> {
  await this.botService.handlePhoto(ctx);
}
```

### Inline button callback

```ts
// bot.update.ts
@Action(/^my_action_(.+)$/)
async onMyAction(ctx: Context): Promise<void> {
  const match = (ctx as any).match as RegExpExecArray;
  const id = match[1];
  await this.botService.handleMyAction(ctx, id);
}

// bot.service.ts
async handleMyAction(ctx: Context, id: string): Promise<void> {
  const tgId = String(ctx.from?.id);
  try {
    // ...
  } catch (error) {
    this.logger.error('handleMyAction failed', error, { tgId, id });
    await ctx.answerCbQuery(formatError());
  }
  await ctx.answerCbQuery();
}
```

---

## Rules

- Always call `ensureRegistered(from)` before the first backend call when the user context is required.
- Send a loading message before slow backend calls (OpenAI analysis): `await ctx.reply('🔍 Analyzing...')`.
- Catch errors at the `BotService` method level — never let them bubble to the update handler.
- `answerCbQuery()` must always be called for `@Action` handlers, even on error (Telegram times it out otherwise).
- For paginated inline keyboards, use `editMessageText` for seamless updates (see `handleHistoryPage`).

---

## Post-Command Checklist

- [ ] Update handler method added to `bot.update.ts` — thin, delegates to `BotService`
- [ ] Business logic method added to `BotService`
- [ ] Message formatter added to `src/bot/messages/` if a new format is needed
- [ ] Keyboard builder added to `src/bot/keyboards/` if inline buttons are needed
- [ ] `ensureRegistered` called where needed
- [ ] Loading reply sent before slow backend calls
- [ ] Error caught, logged, and replied with `formatError()`
- [ ] `PROJECT_GUIDE.md` updated to document the new command
