import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { WinnerTeam } from '../games.entity';
import { Type } from 'class-transformer';

export class CreateGameDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  started_at: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  ended_at: Date;

  @IsNotEmpty()
  @IsEnum(WinnerTeam)
  winner_team: WinnerTeam;
} 