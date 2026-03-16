import { Module } from '@nestjs/common';
import { HttpModule } from '../common/http/http.module';
import { BackendApiService } from './services/backend-api.service';
import { LoggingService } from '../common/logging/logging.service';

@Module({
  imports: [HttpModule],
  providers: [
    BackendApiService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('BackendApiService'),
    },
  ],
  exports: [BackendApiService],
})
export class BackendApiModule {}
