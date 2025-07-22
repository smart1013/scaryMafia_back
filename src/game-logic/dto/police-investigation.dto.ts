import { IsString, IsNotEmpty } from 'class-validator';

export class PoliceInvestigationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  targetUserId: string;
} 