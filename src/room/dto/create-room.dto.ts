import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  hostUserId?: string;

  @IsInt()
  @Min(8)
  @Max(12)
  requiredPlayers?: number;
}