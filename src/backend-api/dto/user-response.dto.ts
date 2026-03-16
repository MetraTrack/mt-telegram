export class UserResponseDto {
  id: string;
  tgId: string;
  tgUsername: string | null;
  tgFirstName: string | null;
  tgLastName: string | null;
  tgIsPremium: boolean;
  isBot: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
