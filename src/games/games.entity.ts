import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { GameParticipant } from '../game-participants/game-participants.entity';

export enum WinnerTeam {
  MAFIA = 'mafia',
  CITIZEN = 'citizen',
  VILLAIN = 'villain'
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  gameId: string;

  @Column({ type: 'timestamp' })
  started_at: Date;

  @Column({ type: 'timestamp' })
  ended_at: Date;

  @Column({ 
    type: 'text',
    enum: WinnerTeam
  })
  winner_team: WinnerTeam;

  @OneToMany(() => GameParticipant, gameParticipant => gameParticipant.game)
  participants: GameParticipant[];
}
