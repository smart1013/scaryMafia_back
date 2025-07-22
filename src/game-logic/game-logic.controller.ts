import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { GamePhase } from '../common/enums/game-phase.enum';
import { GetPlayerStateDto } from './dto/get-player-state.dto';
import { PlayerStateResponseDto } from './dto/player-state-response.dto';
import { NightActionDto } from './dto/night-action.dto';
import { NightActionResponseDto } from './dto/night-action-response.dto';
import { PoliceInvestigationDto } from './dto/police-investigation.dto';
import { PoliceInvestigationResponseDto } from './dto/police-investigation-response.dto';

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

  // Night Action Endpoints
  @Post('night-action/mafia/:roomId')
  async mafiaNightAction(
    @Param('roomId') roomId: string,
    @Body() nightActionDto: NightActionDto
  ): Promise<NightActionResponseDto> {
    return await this.gameLogicService.processNightAction(
      roomId, 
      nightActionDto.userId, 
      'mafia', 
      nightActionDto.targetUserId
    );
  }

  @Post('night-action/doctor/:roomId')
  async doctorNightAction(
    @Param('roomId') roomId: string,
    @Body() nightActionDto: NightActionDto
  ): Promise<NightActionResponseDto> {
    return await this.gameLogicService.processNightAction(
      roomId, 
      nightActionDto.userId, 
      'doctor', 
      nightActionDto.targetUserId
    );
  }

  @Post('night-action/police/:roomId')
  async policeNightAction(
    @Param('roomId') roomId: string,
    @Body() nightActionDto: NightActionDto
  ): Promise<NightActionResponseDto> {
    return await this.gameLogicService.processNightAction(
      roomId, 
      nightActionDto.userId, 
      'police', 
      nightActionDto.targetUserId
    );
  }

  @Get('night-actions/:roomId')
  async getNightActions(@Param('roomId') roomId: string) {
    return await this.gameLogicService.getNightActions(roomId);
  }

  @Get('night-action-status/:roomId')
  async getNightActionStatus(@Param('roomId') roomId: string) {
    return await this.gameLogicService.getNightActionStatus(roomId);
  }

  // Police Investigation Result Endpoint
  @Get('police-investigation-result/:roomId')
  async getPoliceInvestigationResult(@Param('roomId') roomId: string): Promise<PoliceInvestigationResponseDto> {
    return await this.gameLogicService.getPoliceInvestigationResult(roomId);
  }

  // Get all police investigation results (for game master/host)
  @Get('police-investigation-results/:roomId')
  async getAllPoliceInvestigationResults(@Param('roomId') roomId: string) {
    return await this.gameLogicService.getAllPoliceInvestigationResults(roomId);
  }

}