import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { FoodEntryResponseDto } from '../../backend-api/dto/food-entry-response.dto';

export class FoodAnalysisCallbackDto {
  @IsIn(['food', 'not_food'])
  status: 'food' | 'not_food';

  @IsOptional()
  @IsObject()
  entry: FoodEntryResponseDto | null;

  @IsString()
  tgId: string;
}
