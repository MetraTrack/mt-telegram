import { FoodEntryResponseDto } from './food-entry-response.dto';

export class FoodAnalysisResponseDto {
  status: 'food' | 'not_food';
  entry: FoodEntryResponseDto | null;
  tgId: string;
}
