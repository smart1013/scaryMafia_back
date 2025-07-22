import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { GamePhase } from '../common/enums/game-phase.enum';
import { GetPlayerStateDto } from './dto/get-player-state.dto';
import { PlayerStateResponseDto } from './dto/player-state-response.dto';

@Controller('game-logic')
export class GameLogicController {
  constructor(
    private readonly gameLogicService: GameLogicService,
  ) {}

  @Get('state/:roomId')
  async getGameState(@Param('roomId') roomId: string) {
    return await this.gameLogicService.getGameState(roomId);
  }

  @Get('public-state/:roomId')
  async getPublicGameState(
    @Param('roomId') roomId: string,
    @Body('userId') userId?: string
  ) {
    return await this.gameLogicService.getPublicGameState(roomId, userId);
  }

  @Post('transition-night/:roomId')
  async transitionToNight(@Param('roomId') roomId: string) {
    return await this.gameLogicService.transitionToNight(roomId);
  }

  @Post('transition-night-result/:roomId')
  async transitionToNightResult(@Param('roomId') roomId: string) {
    return await this.gameLogicService.transitionToNightResult(roomId);
  }

  @Post('transition-day/:roomId')
  async transitionToDay(@Param('roomId') roomId: string) {
    return await this.gameLogicService.transitionToDay(roomId);
  }

  @Post('transition-vote/:roomId')
  async transitionToVote(@Param('roomId') roomId: string) {
    return await this.gameLogicService.transitionToVote(roomId);
  }

  @Post('transition-day-result/:roomId')
  async transitionToDayResult(@Param('roomId') roomId: string) {
    return await this.gameLogicService.transitionToDayResult(roomId);
  }

  @Get('check-win/:roomId')
  async checkWinConditions(@Param('roomId') roomId: string) {
    return await this.gameLogicService.checkWinConditions(roomId);
  }

  @Get('player/state')
  async getPlayerState(@Body() getPlayerStateDto: GetPlayerStateDto) {
    const playerState = await this.gameLogicService.getPlayerState(
      getPlayerStateDto.roomId, 
      getPlayerStateDto.userId
    );
    if (!playerState) {
      throw new NotFoundException('Player not found in this game or game not found');
    }
    return playerState;
  }

}