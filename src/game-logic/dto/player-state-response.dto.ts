import { RoleType } from '../../common/enums/role-type.enum';

export class PlayerStateResponseDto {
  userId: string;
  nickname: string;
  role: RoleType;
  isAlive: boolean;
  voteTarget?: string;
  isProtected?: boolean;
  lastAction?: string;
} 