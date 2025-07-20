import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), UsersModule, GamesModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService]
})
export class RoomModule {}
