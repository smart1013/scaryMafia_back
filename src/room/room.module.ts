import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';
import { GameLogicModule } from '../game-logic/game-logic.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), UsersModule, RedisModule, GameLogicModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService]
})
export class RoomModule {}
