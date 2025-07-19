import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { userId },
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserCount(): Promise<number> {
    return this.usersRepository.count();
  }


  async findByEmail_signup(userEmail: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { userEmail },
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url']
    });
    return user;
  }

  async findByNickname_signup(nickname: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { nickname },
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url']
    });
    return user;
  }

  async findByEmail(userEmail: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { userEmail },
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { nickname },
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
}