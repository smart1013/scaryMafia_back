import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';


@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.create(createGameDto);
  }

  @Get('list')
  findAll() {
    return this.gamesService.findAll();
  }

  @Get('count')
  getGameCount() {
    return this.gamesService.getGameCount();
  }

  @Get(':gameId')
  findOne(@Param('gameId') gameId: string) {
    return this.gamesService.findOne(gameId);
  }
}
