import { Module } from '@nestjs/common';
import { GameLogicController } from './game-logic.controller';
import { GameLogicService } from './game-logic.service';
import { RoleAssignmentService } from './services/role-assignment.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [GameLogicController],
  providers: [GameLogicService, RoleAssignmentService],
  exports: [GameLogicService, RoleAssignmentService],
})
export class GameLogicModule {}
