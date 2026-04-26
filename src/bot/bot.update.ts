import { Update, Command, On, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './services/bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Command('start')
  async onStart(ctx: Context): Promise<void> {
    await this.botService.handleStart(ctx);
  }

  @On('photo')
  async onPhoto(ctx: Context): Promise<void> {
    await this.botService.handlePhoto(ctx);
  }

  @On('text')
  async onText(ctx: Context): Promise<void> {
    const message = (ctx as any).message;
    if (!message?.text || message.text.startsWith('/')) return;
    await this.botService.handleText(ctx);
  }

  @Command('history')
  async onHistory(ctx: Context): Promise<void> {
    await this.botService.handleHistory(ctx);
  }

  @Action(/^history_page_(\d+)$/)
  async onHistoryPage(ctx: Context): Promise<void> {
    const match = (ctx as any).match as RegExpExecArray;
    const page = parseInt(match[1], 10);
    await this.botService.handleHistoryPage(ctx, page);
  }

  @Command('today')
  async onToday(ctx: Context): Promise<void> {
    await this.botService.handleToday(ctx);
  }

  @Command('reviews')
  async onReviews(ctx: Context): Promise<void> {
    await this.botService.handleReviews(ctx);
  }

  @Action(/^reviews_type_(\w+)_(\d+)$/)
  async onReviewsType(ctx: Context): Promise<void> {
    const match = (ctx as any).match as RegExpExecArray;
    const type = match[1];
    const page = parseInt(match[2], 10);
    await this.botService.handleReviewsTypeSwitch(ctx, type, page);
  }

  @Action(/^confirm_entry_(.+)$/)
  async onConfirmEntry(ctx: Context): Promise<void> {
    const match = (ctx as any).match as RegExpExecArray;
    const entryId = match[1];
    await this.botService.handleConfirmEntry(ctx, entryId);
  }
}
