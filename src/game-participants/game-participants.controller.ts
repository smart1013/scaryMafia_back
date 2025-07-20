import { Controller, Get, Body, Post, Put, Delete, Param, Patch } from '@nestjs/common';
import { GameParticipantsService } from './game-participants.service';
import { CreateGameParticipantDto } from './dto/create-game-participant.dto';
import { UpdateGameParticipantDto } from './dto/update-game-participant.dto';

@Controller('game-participants')
export class GameParticipantsController {
    constructor(private readonly gameParticipantsService: GameParticipantsService) {}

    @Post()
    create(@Body() createGameParticipantDto: CreateGameParticipantDto) {
        return this.gameParticipantsService.create(createGameParticipantDto);
    }

    @Get('game/:gameId')
    findByGame(@Param('gameId') gameId: string) {
        return this.gameParticipantsService.findByGame(gameId);
    }

    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.gameParticipantsService.findByUser(userId);
    }

    @Get(':gameId/:userId')
    findOne(@Param('gameId') gameId: string, @Param('userId') userId: string) {
        return this.gameParticipantsService.findOne(gameId, userId);
    }

    @Delete(':gameId/:userId')
    remove(@Param('gameId') gameId: string, @Param('userId') userId: string) {
        return this.gameParticipantsService.remove(gameId, userId);
    }

    @Get('user/:userId/stats')
    getUserStats(@Param('userId') userId: string) {
        return this.gameParticipantsService.getUserStats(userId);
    }

    @Get('game/:gameId/winners')
    getGameWinners(@Param('gameId') gameId: string) {
        return this.gameParticipantsService.getGameWinners(gameId);
    }
}
