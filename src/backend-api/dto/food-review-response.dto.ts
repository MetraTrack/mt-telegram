import { FoodEntryResponseDto } from './food-entry-response.dto';

export class FoodReviewResponseDto {
  id: string;
  userId: string;
  type: string;
  content: string;
  sourceFoodEntries: FoodEntryResponseDto[];
  sourceReviewIds: string[];
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}
