import { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegraf/types';

export function confirmEntryKeyboard(entryId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '✅ Confirm meal', callback_data: `confirm_entry_${entryId}` }],
    ],
  };
}

export function historyPaginationKeyboard(page: number, totalPages: number): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[] = [];

  if (page > 1) {
    buttons.push({ text: '← Prev', callback_data: `history_page_${page - 1}` });
  }

  buttons.push({ text: `Page ${page}/${totalPages}`, callback_data: 'noop' });

  if (page < totalPages) {
    buttons.push({ text: 'Next →', callback_data: `history_page_${page + 1}` });
  }

  return { inline_keyboard: [buttons] };
}

export function reviewsKeyboard(activeType: string, page: number, totalPages: number): InlineKeyboardMarkup {
  const types = ['DAILY', 'WEEKLY', 'MONTHLY'];
  const typeRow: InlineKeyboardButton[] = types.map((t) => ({
    text: t === activeType ? `• ${t}` : t,
    callback_data: `reviews_type_${t}_1`,
  }));

  const paginationRow: InlineKeyboardButton[] = [];
  if (page > 1) {
    paginationRow.push({ text: '← Prev', callback_data: `reviews_type_${activeType}_${page - 1}` });
  }
  paginationRow.push({ text: `Page ${page}/${totalPages}`, callback_data: 'noop' });
  if (page < totalPages) {
    paginationRow.push({ text: 'Next →', callback_data: `reviews_type_${activeType}_${page + 1}` });
  }

  return {
    inline_keyboard: [typeRow, paginationRow],
  };
}
