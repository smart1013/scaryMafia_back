import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUserCount(): Promise<number> {
    return this.usersRepository.count();
  }

  async findByEmail(userEmail: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { userEmail } });
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { nickname } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
}