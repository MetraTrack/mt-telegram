import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { CallbackController } from './controllers/callback.controller';
import { CallbackService } from './services/callback.service';
import { LoggingService } from '../common/logging/logging.service';

@Module({
  imports: [TelegrafModule],
  controllers: [CallbackController],
  providers: [
    CallbackService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('CallbackService'),
    },
  ],
})
export class CallbackModule {}
