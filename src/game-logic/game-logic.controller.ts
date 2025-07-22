import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';

@Controller('game-logic')
export class GameLogicController {
  constructor(private readonly gameLogicService: GameLogicService) {}

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

  @Post('start-night/:roomId')
  async startFirstNight(@Param('roomId') roomId: string) {
    return await this.gameLogicService.startFirstNight(roomId);
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


}
