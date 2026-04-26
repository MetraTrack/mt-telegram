import { Injectable } from '@nestjs/common';
import { HttpService } from '../../common/http/http.service';
import { LoggingService } from '../../common/logging/logging.service';
import { TelegramUserDto } from '../dto/telegram-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { GetFoodEntriesParams } from '../dto/get-food-entries-params.dto';
import { PaginatedFoodEntriesDto } from '../dto/paginated-food-entries.dto';
import { FoodEntryResponseDto } from '../dto/food-entry-response.dto';
import { GetFoodReviewsParams } from '../dto/get-food-reviews-params.dto';
import { PaginatedFoodReviewsDto } from '../dto/paginated-food-reviews.dto';
import { FoodAnalysisResponseDto } from '../dto/food-analysis-response.dto';

@Injectable()
export class BackendApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly logger: LoggingService,
  ) {
    this.baseUrl = process.env.BACKEND_HOST || 'http://localhost:3000';
  }

  private get apiHeaders(): Record<string, string> {
    return { 'X-API-KEY': process.env.BACKEND_API_KEY || '' };
  }

  async registerUser(tgUser: TelegramUserDto): Promise<UserResponseDto> {
    this.logger.info('Registering user', { tgId: tgUser.tgId });
    const response = await this.http.post<UserResponseDto>(
      `${this.baseUrl}/users`,
      tgUser,
      this.apiHeaders,
    );
    return response.data;
  }

  async getFoodEntries(tgId: string, params: GetFoodEntriesParams): Promise<PaginatedFoodEntriesDto> {
    const query = new URLSearchParams({ tgId });
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.confirmedOnly !== undefined) query.set('confirmedOnly', String(params.confirmedOnly));
    if (params.dateFrom !== undefined) query.set('dateFrom', String(params.dateFrom));
    if (params.dateTo !== undefined) query.set('dateTo', String(params.dateTo));

    const response = await this.http.get<PaginatedFoodEntriesDto>(
      `${this.baseUrl}/food-entries?${query.toString()}`,
      this.apiHeaders,
    );
    return response.data;
  }

  async confirmFoodEntry(tgId: string, entryId: string): Promise<FoodEntryResponseDto> {
    const response = await this.http.patch<FoodEntryResponseDto>(
      `${this.baseUrl}/food-entries/${entryId}/confirm?tgId=${tgId}`,
      {},
      this.apiHeaders,
    );
    return response.data;
  }

  async getFoodReviews(tgId: string, params: GetFoodReviewsParams): Promise<PaginatedFoodReviewsDto> {
    const query = new URLSearchParams({ tgId });
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.type !== undefined) query.set('type', params.type);
    if (params.dateFrom !== undefined) query.set('dateFrom', String(params.dateFrom));
    if (params.dateTo !== undefined) query.set('dateTo', String(params.dateTo));

    const response = await this.http.get<PaginatedFoodReviewsDto>(
      `${this.baseUrl}/food-reviews?${query.toString()}`,
      this.apiHeaders,
    );
    return response.data;
  }

  async analyzeTextFood(tgId: string, textDescription: string): Promise<FoodAnalysisResponseDto> {
    try {
      const response = await this.http.request<FoodAnalysisResponseDto>({
        method: 'POST',
        url: `${this.baseUrl}/food-analysis/analyze-text?tgId=${tgId}`,
        body: { textDescription },
        headers: this.apiHeaders,
        timeout: 30000,
        retries: 0,
      });
      return response.data;
    } catch (error) {
      this.logger.error('analyzeTextFood failed', error);
      throw error;
    }
  }

  async analyzeFood(
    tgId: string,
    photoBuffer: Buffer,
    telegramFileId: string,
    mimeType: string,
    userCaption?: string | null,
  ): Promise<FoodAnalysisResponseDto> {
    const formData = new FormData();
    const blob = new Blob([photoBuffer.buffer as ArrayBuffer], { type: mimeType });
    formData.append('photo', blob, 'photo.jpg');
    formData.append('telegramFileId', telegramFileId);
    if (userCaption) {
      formData.append('userCaption', userCaption);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}/food-analysis/analyze?tgId=${tgId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': process.env.BACKEND_API_KEY || '' },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const errorMessage = (body as any)?.message ?? response.statusText;
        const errorCode = (body as any)?.errorCode;
        const detail = errorCode ? ` [${errorCode}]` : '';
        throw new Error(`HTTP ${response.status}${detail}: ${errorMessage}`);
      }

      return (await response.json()) as FoodAnalysisResponseDto;
    } catch (error) {
      clearTimeout(timeoutId);
      this.logger.error('analyzeFood failed', error);
      throw error;
    }
  }
}
