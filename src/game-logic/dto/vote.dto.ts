import { IsString, IsNotEmpty } from 'class-validator';

export class VoteDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  targetUserId: string;
} 