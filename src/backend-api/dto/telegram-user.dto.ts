export class TelegramUserDto {
  tgId: string;
  tgUsername: string | null;
  tgFirstName: string | null;
  tgLastName: string | null;
  tgLanguageCode: string | null;
  tgIsPremium: boolean;
  isBot: boolean;
}
