import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from '../games/games.entity';
import { User } from '../users/users.entity';
import { RoleType } from '../common/enums/role-type.enum';

@Entity('game_participants')
export class GameParticipant {
  @PrimaryColumn('uuid')
  gameId: string;

  @PrimaryColumn('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: RoleType
  })
  role: RoleType;

  @Column({ type: 'boolean' })
  isWinner: boolean;

  @ManyToOne(() => Game, game => game.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
