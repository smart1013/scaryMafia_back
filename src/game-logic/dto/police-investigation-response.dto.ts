export class PoliceInvestigationResponseDto {
  success: boolean;
  message: string;
  dayNumber?: number;
  gamePhase?: string;
  investigationResults?: Array<{
    targetUserId: string;
    targetNickname: string;
    targetRole: string;
    isAlive: boolean;
  }> | null;
} 