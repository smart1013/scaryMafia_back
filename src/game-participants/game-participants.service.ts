import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameParticipant } from './game-participants.entity';
import { CreateGameParticipantDto } from './dto/create-game-participant.dto';
import { GamesService } from 'src/games/games.service';
import { RoleType } from '../common/enums/role-type.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class GameParticipantsService {
  constructor(
    @InjectRepository(GameParticipant)
    private gameParticipantsRepository: Repository<GameParticipant>,
    private gamesService: GamesService,
    private usersService: UsersService,
  ) {}

  async create(createGameParticipantDto: CreateGameParticipantDto): Promise<GameParticipant> {
    const { gameId, userId, role, isWinner } = createGameParticipantDto;

    // Check if participant already exists for this game and user
    const existingParticipant = await this.gameParticipantsRepository.findOne({
      where: { gameId, userId }
    });

    if (existingParticipant) {
      throw new ConflictException('User is already a participant in this game');
    }

    // Create new participant
    const participant = this.gameParticipantsRepository.create({
      gameId,
      userId,
      role,
      isWinner
    });

    return this.gameParticipantsRepository.save(participant);
  }

  async findByGame(gameId: string): Promise<GameParticipant[]> {
    // Check if game exists first
    try {
      await this.gamesService.findOne(gameId);
    } catch (error) {
      throw new NotFoundException('Game not found');
    }

    const participants = await this.gameParticipantsRepository.find({
      where: { gameId },
      relations: ['user'],
      order: { role: 'ASC' }
    });
    
    return participants;
  }

  async findByUser(userId: string): Promise<GameParticipant[]> {
    // Check if user exists first
    try {
      await this.usersService.findById(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    const participants = await this.gameParticipantsRepository.find({
      where: { userId },
      relations: ['game'],
      order: { gameId: 'DESC' }
    });
    
    return participants;
  }

  async findOne(gameId: string, userId: string): Promise<GameParticipant> {
    const participant = await this.gameParticipantsRepository.findOne({
      where: { gameId, userId },
      relations: ['user', 'game']
    });
    if (!participant) {
      throw new NotFoundException('Game participant not found');
    }
    return participant;
  }

  async update(gameId: string, userId: string, updateDto: Partial<GameParticipant>): Promise<GameParticipant> {
    const participant = await this.findOne(gameId, userId);
    
    Object.assign(participant, updateDto);
    return this.gameParticipantsRepository.save(participant);
  }

  async remove(gameId: string, userId: string): Promise<void> {
    const participant = await this.findOne(gameId, userId);
    await this.gameParticipantsRepository.remove(participant);
  }

  async getParticipantsByRole(gameId: string): Promise<{ [key: string]: GameParticipant[] }> {
    const participants = await this.findByGame(gameId);
    
    const groupedByRole = participants.reduce((acc, participant) => {
      const role = participant.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(participant);
      return acc;
    }, {} as { [key: string]: GameParticipant[] });

    return groupedByRole;
  }

  async getUserStats(userId: string): Promise<{ totalGames: number; wins: number; losses: number; winRate: number }> {
    const participants = await this.findByUser(userId);
    
    const totalGames = participants.length;
    const wins = participants.filter(p => p.isWinner).length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return {
      totalGames,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100
    };
  }

  async getGameWinners(gameId: string): Promise<GameParticipant[]> {
    return this.gameParticipantsRepository.find({
      where: { gameId, isWinner: true },
      relations: ['user']
    });
  }
}

