import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RoleType } from '../../common/enums/role-type.enum';

export class UpdateGameParticipantDto {
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsOptional()
  @IsBoolean()
  isWinner?: boolean;
} 