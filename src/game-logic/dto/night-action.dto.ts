import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class NightActionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @IsOptional()
  roomId?: string; // Will be taken from URL param
} 