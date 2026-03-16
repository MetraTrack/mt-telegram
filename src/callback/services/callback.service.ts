import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { RedisService } from '../../common/redis/redis.service';
import { LoggingService } from '../../common/logging/logging.service';
import { FoodAnalysisCallbackDto } from '../dto/food-analysis-callback.dto';
import { formatFoodEntry, formatNotFood } from '../../bot/messages/food-entry.message';
import { confirmEntryKeyboard } from '../../bot/keyboards/food-entry.keyboard';

@Injectable()
export class CallbackService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly redis: RedisService,
    private readonly logger: LoggingService,
  ) {}

  async handleResult(dto: FoodAnalysisCallbackDto): Promise<void> {
    try {
      if (dto.status === 'food' && dto.entry) {
        const key = `analysis:sent:${dto.entry.id}`;
        const alreadySent = await this.redis.get(key);
        if (alreadySent) {
          this.logger.info('Skipping duplicate callback delivery', { entryId: dto.entry.id });
          return;
        }

        const text = formatFoodEntry(dto.entry);
        const keyboard = confirmEntryKeyboard(dto.entry.id);
        await this.bot.telegram.sendMessage(dto.tgId, text, { reply_markup: keyboard });
        await this.redis.set(key, '1', 300);
      } else if (dto.status === 'not_food') {
        await this.bot.telegram.sendMessage(dto.tgId, formatNotFood());
      }
    } catch (error) {
      this.logger.error('CallbackService.handleResult failed', error, { tgId: dto.tgId });
    }
  }
}
