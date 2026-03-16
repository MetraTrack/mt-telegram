import { FoodReviewResponseDto } from './food-review-response.dto';
import { PaginationMeta } from './paginated-food-entries.dto';

export class PaginatedFoodReviewsDto {
  data: FoodReviewResponseDto[];
  meta: PaginationMeta;
}
