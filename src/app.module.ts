import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './common/redis/redis.module';
import { ErrorModule } from './common/error/error.module';
import { HealthModule } from './health/health.module';
import { BotModule } from './bot/bot.module';
import { CallbackModule } from './callback/callback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    RedisModule,
    ErrorModule,
    HealthModule,
    BotModule,
    CallbackModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
