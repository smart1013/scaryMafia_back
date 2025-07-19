import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
}