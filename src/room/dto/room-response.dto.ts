export class RoomResponseDto {
  roomId: string;
  title?: string;
  notes?: string;
  status: 'waiting' | 'in_progress' | 'finished';
  created_at: Date;
  hostUser?: {
    userId: string;
    nickname: string;
  };
} 