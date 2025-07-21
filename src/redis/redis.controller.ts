import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('test')
  async testConnection() {
    const isConnected = await this.redisService.testConnection();
    return {
      success: isConnected,
      message: isConnected ? 'Redis is connected!' : 'Redis connection failed',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getStatus() {
    return await this.redisService.getConnectionStatus();
  }

  @Get('ping')
  async ping() {
    const isConnected = await this.redisService.testConnection();
    return {
      pong: isConnected,
      timestamp: new Date().toISOString(),
    };
  }
} 