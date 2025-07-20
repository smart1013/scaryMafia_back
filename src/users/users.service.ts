import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    return this.usersRepository.find({
      select: ['userId', 'userEmail', 'nickname', 'created_at', 'img_url'],
      order: {
        created_at: 'DESC',
      },
    });
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
    return await this.usersRepository.findOne({
      where: { userEmail },
    });
  }

  async findByNickname_signup(nickname: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { nickname },
    });
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

  async update(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Check if email is being updated and if it's already taken
    if (updateData.userEmail && updateData.userEmail !== user.userEmail) {
      const existingUser = await this.findByEmail_signup(updateData.userEmail);
      if (existingUser) {
        throw new ConflictException('Email is already taken');
      }
    }
    
    // Check if nickname is being updated and if it's already taken
    if (updateData.nickname && updateData.nickname !== user.nickname) {
      const existingUser = await this.findByNickname_signup(updateData.nickname);
      if (existingUser) {
        throw new ConflictException('Nickname is already taken');
      }
    }
    
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }
}