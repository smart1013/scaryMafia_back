import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
} 