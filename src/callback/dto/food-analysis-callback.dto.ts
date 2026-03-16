import { IsString, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FoodEntryResponseDto } from '../../backend-api/dto/food-entry-response.dto';

export class FoodAnalysisCallbackDto {
  @IsIn(['food', 'not_food'])
  status: 'food' | 'not_food';

  @IsOptional()
  @ValidateNested()
  @Type(() => FoodEntryResponseDto)
  entry: FoodEntryResponseDto | null;

  @IsString()
  tgId: string;
}
