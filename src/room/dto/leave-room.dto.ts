import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
} 