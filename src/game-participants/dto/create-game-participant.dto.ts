import { IsNotEmpty, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { RoleType } from '../../common/enums/role-type.enum';

export class CreateGameParticipantDto {
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(RoleType)
  role: RoleType;

  @IsNotEmpty()
  @IsBoolean()
  isWinner: boolean;
} 