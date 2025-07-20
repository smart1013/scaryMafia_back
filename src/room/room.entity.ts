import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  roomId: string;

  @ManyToOne(() => User, user => user.hostedRooms, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'host_user_id' })
  hostUser: User;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'in_progress' | 'finished';

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

}