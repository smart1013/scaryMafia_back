export class NightActionResponseDto {
  success: boolean;
  message: string;
  role: string;
  targetUserId: string;
  allActionsComplete?: boolean;
} 