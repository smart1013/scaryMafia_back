export class RoomResponseDto {
  roomId: string;
  title?: string;
  notes?: string;
  status: 'waiting' | 'in_progress' | 'finished';
  created_at: Date;
  requiredPlayers: number;
  hostUser?: {
    userId: string;
    nickname: string;
  };
} 