import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {
    // Set up connection event listeners
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  // List operations
  async lpush(key: string, value: string): Promise<void> {
    await this.redis.lpush(key, value);
  }

  async rpush(key: string, value: string): Promise<void> {
    await this.redis.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.redis.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.redis.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    await this.redis.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redis.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.redis.hdel(key, field);
  }

  // Game-specific methods for Mafia game
  async setUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${userId}`, JSON.stringify(sessionData), ttl);
  }

  async getUserSession(userId: string): Promise<any | null> {
    const session = await this.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.delete(`session:${userId}`);
  }

  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    await this.sadd(`room:${roomId}:participants`, userId);
  }

  // Set user's current room
  async setUserCurrentRoom(userId: string, roomId: string): Promise<void> {
    await this.set(`user:${userId}:current_room`, roomId);
  }
  
  // Get user's current room
  async getUserCurrentRoom(userId: string): Promise<string | null> {
    return await this.get(`user:${userId}:current_room`);
  }

  // Get room participant count
  async getRoomParticipantCount(roomId: string): Promise<number> {
    return await this.scard(`room:${roomId}:participants`);
  }

  // Remove user from current room
  async removeUserFromCurrentRoom(userId: string): Promise<void> {
    const currentRoom = await this.getUserCurrentRoom(userId);
    if (currentRoom) {
      await this.removeUserFromRoom(currentRoom, userId);
      await this.delete(`user:${userId}:current_room`);
    }
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.srem(`room:${roomId}:participants`, userId);
  }

  async getRoomParticipants(roomId: string): Promise<string[]> {
    return await this.smembers(`room:${roomId}:participants`);
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    return await this.sismember(`room:${roomId}:participants`, userId);
  }

  async setRoomStatus(roomId: string, status: string): Promise<void> {
    await this.set(`room:${roomId}:status`, status);
  }

  async getRoomStatus(roomId: string): Promise<string | null> {
    return await this.get(`room:${roomId}:status`);
  }

  async setGamePhase(gameId: string, phase: string, ttl: number = 300): Promise<void> {
    await this.set(`game:${gameId}:phase`, phase, ttl);
  }

  async getGamePhase(gameId: string): Promise<string | null> {
    return await this.get(`game:${gameId}:phase`);
  }

  async setPlayerVote(gameId: string, playerId: string, targetId: string): Promise<void> {
    await this.hset(`game:${gameId}:votes`, playerId, targetId);
  }

  async getPlayerVote(gameId: string, playerId: string): Promise<string | null> {
    return await this.hget(`game:${gameId}:votes`, playerId);
  }

  async getAllVotes(gameId: string): Promise<Record<string, string>> {
    return await this.hgetall(`game:${gameId}:votes`);
  }

  async clearGameVotes(gameId: string): Promise<void> {
    await this.delete(`game:${gameId}:votes`);
  }

  async setOnlineUser(userId: string): Promise<void> {
    await this.sadd('online_users', userId);
  }

  async removeOnlineUser(userId: string): Promise<void> {
    await this.srem('online_users', userId);
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.smembers('online_users');
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return await this.sismember('online_users', userId);
  }

  // Connection test methods
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    status: string;
    info?: any;
  }> {
    try {
      const ping = await this.redis.ping();
      const info = await this.redis.info();
      
      return {
        connected: ping === 'PONG',
        status: 'connected',
        info: {
          ping: ping,
          serverInfo: info.split('\r\n').slice(0, 10).join('\n') // First 10 lines of info
        }
      };
    } catch (error) {
      return {
        connected: false,
        status: 'disconnected',
        info: { error: error.message }
      };
    }
  }

  // Night Action Methods
  async setNightAction(roomId: string, dayNumber: number, role: string, targetUserId: string): Promise<void> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    await this.hset(key, `${role}_target`, targetUserId);
    await this.hset(key, `${role}_selected`, 'true');
    await this.expire(key, 3600); // 1 hour TTL
  }

  async getNightAction(roomId: string, dayNumber: number, role: string): Promise<string | null> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    return await this.hget(key, `${role}_target`);
  }

  async getAllNightActions(roomId: string, dayNumber: number): Promise<Record<string, string>> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    return await this.hgetall(key);
  }

  async checkNightActionCompletion(roomId: string, dayNumber: number): Promise<boolean> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    const actions = await this.hgetall(key);
    
    // Check if all required roles have selected
    const requiredRoles = ['mafia', 'doctor', 'police'];
    return requiredRoles.every(role => actions[`${role}_selected`] === 'true');
  }

  async clearNightActions(roomId: string, dayNumber: number): Promise<void> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    await this.delete(key);
  }

  async getNightActionStatus(roomId: string, dayNumber: number): Promise<{
    mafiaSelected: boolean;
    doctorSelected: boolean;
    policeSelected: boolean;
    allComplete: boolean;
  }> {
    const key = `game:${roomId}:night-actions:${dayNumber}`;
    const actions = await this.hgetall(key);
    
    const mafiaSelected = actions['mafia_selected'] === 'true';
    const doctorSelected = actions['doctor_selected'] === 'true';
    const policeSelected = actions['police_selected'] === 'true';
    
    return {
      mafiaSelected,
      doctorSelected,
      policeSelected,
      allComplete: mafiaSelected && doctorSelected && policeSelected
    };
  }

  // Police Investigation Result Methods
  async getPoliceInvestigationResult(roomId: string, dayNumber: number, targetUserId: string): Promise<string | null> {
    const key = `game:${roomId}:investigation:${dayNumber}:${targetUserId}`;
    return await this.get(key);
  }

  async getAllPoliceInvestigationResults(roomId: string, dayNumber: number): Promise<Record<string, string>> {
    // Get all investigation keys for this room and day
    const pattern = `game:${roomId}:investigation:${dayNumber}:*`;
    const keys = await this.redis.keys(pattern);
    
    const results: Record<string, string> = {};
    for (const key of keys) {
      const targetUserId = key.split(':').pop(); // Extract userId from key
      const role = await this.get(key);
      if (targetUserId && role) {
        results[targetUserId] = role;
      }
    }
    
    return results;
  }
}
