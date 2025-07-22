import { IsString, IsNotEmpty } from 'class-validator';

export class GetPlayerStateDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
} 