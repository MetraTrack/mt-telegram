import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { BackendApiService } from '../../backend-api/services/backend-api.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggingService } from '../../common/logging/logging.service';
import { TelegramUserDto } from '../../backend-api/dto/telegram-user.dto';
import { formatWelcome } from '../messages/welcome.message';
import {
  formatFoodEntry,
  formatFoodEntryList,
  formatDailySummary,
  formatReview,
  formatError,
} from '../messages/food-entry.message';
import {
  confirmEntryKeyboard,
  historyPaginationKeyboard,
  reviewsKeyboard,
} from '../keyboards/food-entry.keyboard';

@Injectable()
export class BotService {
  constructor(
    private readonly backendApi: BackendApiService,
    private readonly redis: RedisService,
    private readonly logger: LoggingService,
  ) {}

  async handleStart(ctx: Context): Promise<void> {
    const from = ctx.from;
    if (!from) return;

    await this.ensureRegistered(from);
    await ctx.reply(formatWelcome(from.first_name ?? 'there'));
  }

  private buildTgUser(from: NonNullable<Context['from']>): TelegramUserDto {
    return {
      tgId: String(from.id),
      tgUsername: from.username ?? null,
      tgFirstName: from.first_name ?? null,
      tgLastName: from.last_name ?? null,
      tgLanguageCode: from.language_code ?? null,
      tgIsPremium: (from as any).is_premium ?? false,
      isBot: from.is_bot ?? false,
    };
  }

  private async ensureRegistered(from: NonNullable<Context['from']>): Promise<void> {
    try {
      await this.backendApi.registerUser(this.buildTgUser(from));
    } catch (error) {
      this.logger.error('ensureRegistered failed', error, { tgId: String(from.id) });
    }
  }

  async handlePhoto(ctx: Context): Promise<void> {
    const from = ctx.from;
    const message = (ctx as any).message;
    if (!from || !message?.photo) return;

    const tgId = String(from.id);

    await this.ensureRegistered(from);
    await ctx.reply('📸 Analyzing your meal...');

    try {
      const photo = message.photo[message.photo.length - 1];
      const fileId = photo.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.href);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const caption = message.caption ?? null;
      await this.backendApi.analyzeFood(tgId, buffer, fileId, 'image/jpeg', caption);
    } catch (error) {
      this.logger.error('handlePhoto failed', error, { tgId });
      await ctx.reply(formatError());
    }
  }

  async handleHistory(ctx: Context, page = 1): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const result = await this.backendApi.getFoodEntries(tgId, { confirmedOnly: true, page, limit: 5 });
      const text = formatFoodEntryList(result.data, result.meta);
      const keyboard = historyPaginationKeyboard(result.meta.page, result.meta.totalPages);
      await ctx.reply(text, { reply_markup: keyboard });
    } catch (error) {
      this.logger.error('handleHistory failed', error, { tgId });
      await ctx.reply(formatError());
    }
  }

  async handleHistoryPage(ctx: Context, page: number): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const result = await this.backendApi.getFoodEntries(tgId, { confirmedOnly: true, page, limit: 5 });
      const text = formatFoodEntryList(result.data, result.meta);
      const keyboard = historyPaginationKeyboard(result.meta.page, result.meta.totalPages);
      await (ctx as any).editMessageText(text, { reply_markup: keyboard });
    } catch (error) {
      this.logger.error('handleHistoryPage failed', error, { tgId });
      await ctx.answerCbQuery(formatError());
    }
    await ctx.answerCbQuery();
  }

  async handleToday(ctx: Context): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const now = new Date();
      const dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const dateTo = dateFrom + 86400000 - 1;

      const result = await this.backendApi.getFoodEntries(tgId, { dateFrom, dateTo, page: 1, limit: 20 });
      const text = formatDailySummary(result.data);
      await ctx.reply(text);
    } catch (error) {
      this.logger.error('handleToday failed', error, { tgId });
      await ctx.reply(formatError());
    }
  }

  async handleReviews(ctx: Context, type = 'DAILY', page = 1): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const result = await this.backendApi.getFoodReviews(tgId, { type, page, limit: 3 });
      if (result.data.length === 0) {
        await ctx.reply(`No ${type.toLowerCase()} reviews available yet.`);
        return;
      }
      const text = result.data.map((r) => formatReview(r)).join('\n\n─────────────────\n\n');
      const keyboard = reviewsKeyboard(type, result.meta.page, result.meta.totalPages);
      await ctx.reply(text, { reply_markup: keyboard });
    } catch (error) {
      this.logger.error('handleReviews failed', error, { tgId });
      await ctx.reply(formatError());
    }
  }

  async handleReviewsTypeSwitch(ctx: Context, type: string, page: number): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const result = await this.backendApi.getFoodReviews(tgId, { type, page, limit: 3 });
      const text =
        result.data.length > 0
          ? result.data.map((r) => formatReview(r)).join('\n\n─────────────────\n\n')
          : `No ${type.toLowerCase()} reviews available yet.`;
      const keyboard = reviewsKeyboard(type, result.meta.page, result.meta.totalPages);
      await (ctx as any).editMessageText(text, { reply_markup: keyboard });
    } catch (error) {
      this.logger.error('handleReviewsTypeSwitch failed', error, { tgId });
      await ctx.answerCbQuery(formatError());
    }
    await ctx.answerCbQuery();
  }

  async handleConfirmEntry(ctx: Context, entryId: string): Promise<void> {
    const tgId = String(ctx.from?.id);

    try {
      const entry = await this.backendApi.confirmFoodEntry(tgId, entryId);
      const time = entry.eatenAt
        ? new Date(entry.eatenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await (ctx as any).editMessageReplyMarkup({ inline_keyboard: [] });
      await (ctx as any).editMessageText(
        `${formatFoodEntry(entry)}\n\n✅ Confirmed at ${time}`,
      );
    } catch (error) {
      this.logger.error('handleConfirmEntry failed', error, { tgId, entryId });
      await ctx.answerCbQuery(formatError());
    }
    await ctx.answerCbQuery();
  }
}
