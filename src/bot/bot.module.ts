import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BackendApiModule } from '../backend-api/backend-api.module';
import { BotUpdate } from './bot.update';
import { BotService } from './services/bot.service';
import { LoggingService } from '../common/logging/logging.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || '',
    }),
    BackendApiModule,
  ],
  providers: [
    BotUpdate,
    BotService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('BotService'),
    },
  ],
})
export class BotModule {}
