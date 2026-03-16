import { FoodEntryResponseDto } from '../../backend-api/dto/food-entry-response.dto';
import { FoodReviewResponseDto } from '../../backend-api/dto/food-review-response.dto';
import { PaginationMeta } from '../../backend-api/dto/paginated-food-entries.dto';

export function formatFoodEntry(entry: FoodEntryResponseDto): string {
  const lines: string[] = [`🍽 ${entry.mealSummary}`];

  if (entry.userCaption) {
    lines.push(`💬 Your note: ${entry.userCaption}`);
  }

  lines.push(
    `━━━━━━━━━━━━━━━━`,
    `🔥 Calories: ${entry.caloriesKcal} kcal`,
    `🥩 Protein:  ${entry.proteinsGrams} g`,
    `🥑 Fat:      ${entry.fatsGrams} g`,
    `🍞 Carbs:    ${entry.carbsGrams} g`,
    `⚖️ Portion:  ${entry.portionGrams} g`,
  );

  if (entry.notes) {
    lines.push(`📝 ${entry.notes}`);
  }

  if (entry.confidence < 0.7) {
    lines.push(`⚠️ Low confidence estimate`);
  }

  return lines.join('\n');
}

export function formatFoodEntryList(entries: FoodEntryResponseDto[], meta: PaginationMeta): string {
  if (entries.length === 0) {
    return 'No entries found.';
  }

  const list = entries
    .map((e, i) => {
      const date = e.eatenAt
        ? new Date(e.eatenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—';
      return `${i + 1}. ${date} — ${e.mealSummary} (${e.caloriesKcal} kcal)`;
    })
    .join('\n');

  return `📋 Food History (page ${meta.page}/${meta.totalPages}):\n\n${list}`;
}

export function formatDailySummary(entries: FoodEntryResponseDto[]): string {
  if (entries.length === 0) {
    return '📭 No food entries for today yet. Send a photo to start tracking!';
  }

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.caloriesKcal,
      protein: acc.protein + e.proteinsGrams,
      fat: acc.fat + e.fatsGrams,
      carbs: acc.carbs + e.carbsGrams,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  const summary = [
    `📅 Today's Summary`,
    `━━━━━━━━━━━━━━━━`,
    `🔥 Total Calories: ${totals.calories} kcal`,
    `🥩 Total Protein:  ${totals.protein} g`,
    `🥑 Total Fat:      ${totals.fat} g`,
    `🍞 Total Carbs:    ${totals.carbs} g`,
    ``,
    `Meals (${entries.length}):`,
  ].join('\n');

  const list = entries
    .map((e, i) => {
      const time = e.eatenAt
        ? new Date(e.eatenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '—';
      return `${i + 1}. ${time} — ${e.mealSummary} (${e.caloriesKcal} kcal)`;
    })
    .join('\n');

  return `${summary}\n${list}`;
}

export function formatReview(review: FoodReviewResponseDto): string {
  const lines = [
    `📊 ${review.type} Review`,
    `━━━━━━━━━━━━━━━━`,
    review.content,
    ``,
    `Based on ${review.sourceFoodEntries.length} meal(s)`,
  ];
  return lines.join('\n');
}

export function formatNotFood(): string {
  return `🚫 That doesn't look like food. Try sending a clearer photo of a meal.`;
}

export function formatError(): string {
  return `⚠️ Something went wrong. Please try again.`;
}
