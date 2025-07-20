import { Module } from '@nestjs/common';
import { GameParticipantsController } from './game-participants.controller';
import { GameParticipantsService } from './game-participants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameParticipant } from './game-participants.entity';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [GameParticipantsController],
  providers: [GameParticipantsService],
  imports: [
    TypeOrmModule.forFeature([GameParticipant]),
    GamesModule,
    UsersModule
  ]
})
export class GameParticipantsModule {}
