import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';
import { HealthResponseDto } from '../dto/health-response.dto';
import { ErrorResponseDto } from '../../common/error/error-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application health status', type: HealthResponseDto })
  @ApiResponse({ status: 500, description: 'Application failed to start.', type: ErrorResponseDto })
  getHealth(): HealthResponseDto {
    return this.healthService.getHealth();
  }
}