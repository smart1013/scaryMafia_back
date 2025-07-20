import { GameParticipant } from 'src/game-participants/game-participants.entity';
import { Room } from 'src/room/room.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ type: 'text', unique: true })
  userEmail: string;

  @Column({ type: 'text' })
  password_hash: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  nickname: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'text', nullable: true })
  img_url: string;

  @OneToMany(() => GameParticipant, gameParticipant => gameParticipant.user)
  gameParticipants: GameParticipant[];

  @OneToMany(() => Room, room => room.hostUser)
  hostedRooms: Room[];
}