import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiSecurity, ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { BackendApiKeyGuard } from '../../common/guards/backend-api-key.guard';
import { CallbackService } from '../services/callback.service';
import { FoodAnalysisCallbackDto } from '../dto/food-analysis-callback.dto';
import { ErrorResponseDto } from '../../common/error/error-response.dto';

@ApiTags('internal')
@ApiSecurity('api-key')
@UseGuards(BackendApiKeyGuard)
@Controller('internal')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post('food-analysis-result')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive food analysis result from mt-backend',
    description:
      'Async callback posted by mt-backend after photo analysis. Delivers the result to the Telegram user via bot. Protected by shared BACKEND_API_KEY.',
  })
  @ApiBody({ type: FoodAnalysisCallbackDto })
  @ApiResponse({ status: 200, description: 'Result processed.' })
  @ApiResponse({ status: 400, description: 'Invalid request body.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error while sending the Telegram message.', type: ErrorResponseDto })
  async foodAnalysisResult(@Body() dto: FoodAnalysisCallbackDto): Promise<{ ok: boolean }> {
    await this.callbackService.handleResult(dto);
    return { ok: true };
  }
}
