import { IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['waiting', 'in_progress', 'finished'])
  status?: 'waiting' | 'in_progress' | 'finished';

  @IsOptional()
  @IsUUID()
  hostUserId?: string;

  @IsOptional()
  @IsBoolean()
  isHostDelegation?: boolean;
}
