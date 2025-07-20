import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './games.entity';
import { GameParticipant } from 'src/game-participants/game-participants.entity';

@Module({
  controllers: [GamesController],
  providers: [GamesService],
  imports: [TypeOrmModule.forFeature([Game, GameParticipant])],
  exports: [GamesService]
})
export class GamesModule {}
