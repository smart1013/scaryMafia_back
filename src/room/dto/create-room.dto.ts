import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  hostUserId?: string;
}