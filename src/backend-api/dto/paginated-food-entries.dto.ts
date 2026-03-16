import { FoodEntryResponseDto } from './food-entry-response.dto';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginatedFoodEntriesDto {
  data: FoodEntryResponseDto[];
  meta: PaginationMeta;
}
