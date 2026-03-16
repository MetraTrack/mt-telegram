export class FoodEntryResponseDto {
  id: string;
  userId: string;
  photoId: string;
  analysisProvider: string;
  analysisModel: string;
  mealSummary: string;
  portionGrams: number;
  caloriesKcal: number;
  proteinsGrams: number;
  fatsGrams: number;
  carbsGrams: number;
  confidence: number;
  userCaption: string | null;
  notes: string | null;
  eatenAt: number | null;   // Unix ms, null until confirmed
  createdAt: number;        // Unix ms
  updatedAt: number;        // Unix ms
  deletedAt: number | null; // Unix ms
}
