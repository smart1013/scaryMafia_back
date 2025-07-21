import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private redisService: RedisService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    // Validate required players
    if (createRoomDto.requiredPlayers !== undefined) {
      if (createRoomDto.requiredPlayers < 6 || createRoomDto.requiredPlayers > 12) {
        throw new BadRequestException('Required players must be between 6 and 12');
      }
    }

    // Check if user is already in another room
    if (createRoomDto.hostUserId) {
      await this.checkUserRoomConstraint(createRoomDto.hostUserId);
    }
    
    // Create room with proper hostUser mapping
    const roomData = {
      title: createRoomDto.title,
      notes: createRoomDto.notes,
      hostUser: createRoomDto.hostUserId ? { userId: createRoomDto.hostUserId } : undefined,
      requiredPlayers: createRoomDto.requiredPlayers ?? 8
    };
    
    const room = this.roomRepository.create(roomData);
    const savedRoom = await this.roomRepository.save(room);

    if (createRoomDto.hostUserId) {
      await this.redisService.setUserCurrentRoom(createRoomDto.hostUserId, savedRoom.roomId);
      await this.redisService.addUserToRoom(savedRoom.roomId, createRoomDto.hostUserId);
    }
    return this.mapToResponseDto(savedRoom);
  }

  async update(roomId: string, updateRoomDto: UpdateRoomDto): Promise<RoomResponseDto> {
    const room = await this.findOne(roomId);
    
    // Check if user is already in another room (if changing host)
    if (updateRoomDto.hostUserId && updateRoomDto.hostUserId !== room.hostUser?.userId) {
      await this.checkUserRoomConstraint(updateRoomDto.hostUserId);
    }
    
    // Update room with proper hostUser mapping
    const updateData = {
      title: updateRoomDto.title,
      notes: updateRoomDto.notes,
      status: updateRoomDto.status,
      hostUser: updateRoomDto.hostUserId ? { userId: updateRoomDto.hostUserId } : room.hostUser
    };
    
    Object.assign(room, updateData);
    const updatedRoom = await this.roomRepository.save(room);
    return this.mapToResponseDto(updatedRoom);
  }

  async findOne(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomId },
      relations: ['hostUser'],
    });
    
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    
    return room;
  }

  async findOneResponse(roomId: string): Promise<RoomResponseDto> {
    const room = await this.findOne(roomId);
    return this.mapToResponseDto(room);
  }

  async remove(roomId: string): Promise<{ message: string }> {
    const room = await this.findOne(roomId);
    await this.roomRepository.remove(room);
    return { message: 'Room deleted successfully' };
  }

  private async checkUserRoomConstraint(userId: string): Promise<void> {
    const existingRoom = await this.roomRepository.findOne({
      where: { hostUser: { userId } },
      relations: ['hostUser'],
    });
    
    if (existingRoom) {
      throw new ConflictException(`User is already hosting a room (Room ID: ${existingRoom.roomId})`);
    }
  }

  private mapToResponseDto(room: Room): RoomResponseDto {
    return {
      roomId: room.roomId,
      title: room.title,
      notes: room.notes,
      status: room.status,
      created_at: room.created_at,
      requiredPlayers: room.requiredPlayers,
      hostUser: room.hostUser ? {
        userId: room.hostUser.userId,
        nickname: room.hostUser.nickname,
      } : undefined,
    };
  }

  async joinRoom(roomId: string, userId: string): Promise<{ message: string; roomId: string; userId: string; gameStarted?: boolean; waitingMessage?: string }> {
    // Check if room exists
    const room = await this.findOne(roomId);
    

    const isAlreadyInRoom = await this.redisService.isUserInRoom(roomId, userId);
    if (isAlreadyInRoom) {
      return {
        message: 'User is already in this room',
        roomId,
        userId
      };
    }

    if (room.hostUser?.userId === userId) {
      return {
        message: 'User is the host of this room',
        roomId,
        userId
      };
    }

    // Check if user is already in another room
    const currentRoom = await this.redisService.getUserCurrentRoom(userId);
    // Check if user is already in another room
    if (currentRoom) {
      // Remove from current room first
      await this.leaveRoom(currentRoom, userId);
    }

    // Check room capacity (Mafia games typically 6-12 players)
    const participantCount = await this.redisService.getRoomParticipantCount(roomId);
    if (participantCount > 12) {
      throw new ConflictException('Room is full (maximum 12 players)');
    }

    // Check if room is in waiting status
    if (room.status !== 'waiting') {
      throw new ConflictException('Cannot join room - game is already in progress or finished');
    }

    // Add user to room
    await this.redisService.addUserToRoom(roomId, userId);
    await this.redisService.setUserCurrentRoom(userId, roomId);

    // Check if game should auto-start
    const gameStartCheck = await this.checkAndStartGame(roomId);

    return {
      message: gameStartCheck.started 
        ? (gameStartCheck.message || 'Game started!') 
        : 'Successfully joined room',
      roomId,
      userId,
      gameStarted: gameStartCheck.started,
      waitingMessage: gameStartCheck.message || 'Waiting for more players'
    };
  }

  // Auto-start game when required players are reached
  private async checkAndStartGame(roomId: string): Promise<{ started: boolean; message?: string }> {
    const room = await this.findOne(roomId);
    
    // Only check if room is in waiting status
    if (room.status !== 'waiting') {
      return { started: false };
    }

    const currentParticipants = await this.redisService.getRoomParticipants(roomId);
    const currentCount = currentParticipants.length;
    const requiredCount = room.requiredPlayers;

    if (currentCount >= requiredCount) {
      // Start the game
      await this.startGame(roomId);
      return { 
        started: true, 
        message: `Game started! ${currentCount} players joined.` 
      };
    }

    return { 
      started: false, 
      message: `Waiting for ${requiredCount - currentCount} more players to start.` 
    };
  }

  // Start the game
  private async startGame(roomId: string): Promise<void> {
    // Update room status to in_progress
    await this.roomRepository.update(roomId, { status: 'in_progress' });
    
    // Here you can add additional game initialization logic:
    // - Assign roles to players
    // - Set up game state
    // - Initialize game phases
    // - Send notifications to all players
    
    console.log(`Game started in room ${roomId}`);
  }

  async leaveRoom(roomId: string, userId: string): Promise<{ message: string; roomId: string; userId: string; roomDeleted?: boolean }> {
    // Check if user is actually in this room
    const isInRoom = await this.redisService.isUserInRoom(roomId, userId);
    if (!isInRoom) {
      throw new NotFoundException('User is not in this room');
    }
  
    // Remove user from room
    await this.redisService.removeUserFromRoom(roomId, userId);
    await this.redisService.delete(`user:${userId}:current_room`);
  
    // Check remaining participants
    const remainingParticipants = await this.redisService.getRoomParticipants(roomId);
    
    // If no participants left, delete the room
    if (remainingParticipants.length === 0) {
      await this.remove(roomId);
      return {
        message: 'Successfully left room. Room deleted as no participants remain.',
        roomId,
        userId,
        roomDeleted: true
      };
    }
  
    // If user was the host, assign new host
    const room = await this.findOne(roomId);
    if (room.hostUser?.userId === userId) {
      // Assign new host (first remaining participant)
      const newHostId = remainingParticipants[0];
      await this.update(roomId, { hostUserId: newHostId });
    }
  
    return {
      message: 'Successfully left room',
      roomId,
      userId,
      roomDeleted: false
    };
  } 

  async getRoomParticipants(roomId: string): Promise<{
    roomId: string;
    participants: string[];
    count: number;
    requiredPlayers: number;
    canStartGame: boolean;
    reason?: string;
  }> {
    // Check if room exists
    const room = await this.findOne(roomId);

    // Get participants from Redis
    const participants = await this.redisService.getRoomParticipants(roomId);
    const count = participants.length;

    // Check if game can start
    const gameCheck = await this.canStartGame(roomId);

    return {
      roomId,
      participants,
      count,
      requiredPlayers: room.requiredPlayers,
      canStartGame: gameCheck.canStart,
      reason: gameCheck.reason
    };
  }

  async canStartGame(roomId: string): Promise<{ canStart: boolean; reason?: string }> {
    const room = await this.findOne(roomId);
    const participantCount = await this.redisService.getRoomParticipantCount(roomId);
    
    if (participantCount < room.requiredPlayers) {
      return { 
        canStart: false, 
        reason: `Need at least ${room.requiredPlayers} players to start. Current: ${participantCount}` 
      };
    }
    
    if (participantCount > 12) {
      return { 
        canStart: false, 
        reason: `Too many players. Maximum: 12. Current: ${participantCount}` 
      };
    }
    
    // Check room status
    if (room.status !== 'waiting') {
      return { 
        canStart: false, 
        reason: `Room is not in waiting status. Current status: ${room.status}` 
      };
    }
    
    return { canStart: true };
  }

  async getUserCurrentRoom(userId: string): Promise<{ roomId: string | null; roomInfo?: any }> {
    const currentRoomId = await this.redisService.getUserCurrentRoom(userId);
    
    if (!currentRoomId) {
      return { roomId: null };
    }

    // Get room details
    const room = await this.findOne(currentRoomId);
    const participants = await this.redisService.getRoomParticipants(currentRoomId);
    
    return {
      roomId: currentRoomId,
      roomInfo: {
        title: room.title,
        status: room.status,
        participantCount: participants.length,
        isHost: room.hostUser?.userId === userId
      }
    };
  }

  async removeUserFromCurrentRoom(userId: string): Promise<{ message: string; roomId?: string }> {
    const currentRoom = await this.redisService.getUserCurrentRoom(userId);
    
    if (!currentRoom) {
      return { message: 'User is not in any room' };
    }

    await this.leaveRoom(currentRoom, userId);
    return { 
      message: 'User removed from room successfully',
      roomId: currentRoom
    };
  }

}
