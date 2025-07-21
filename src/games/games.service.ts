import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './games.entity';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {}

  async create(createGameDto: CreateGameDto): Promise<Game> {
    const game = this.gamesRepository.create(createGameDto);
    return this.gamesRepository.save(game);
  }

  async findAll(): Promise<Game[]> {
    return this.gamesRepository.find({
      relations: ['participants'],
      order: { started_at: 'DESC' }
    });
  }

  async findOne(gameId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { gameId },
      relations: ['participants'],
      select: {
        gameId: true,
        started_at: true,
        ended_at: true,
        winner_team: true,
        participants: {
          userId: true
        }
      }
    });
    
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    
    return game;
  }


  async getGameCount(): Promise<number> {
    return this.gamesRepository.count();
  }
}
