import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RedisService } from '../redis/redis.service';
import { GameLogicService } from '../game-logic/game-logic.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private redisService: RedisService,
    private gameLogicService: GameLogicService,
    private usersService: UsersService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    // Validate required players
    if (createRoomDto.requiredPlayers !== undefined) {
      if (createRoomDto.requiredPlayers < 6 || createRoomDto.requiredPlayers > 12) {
        throw new BadRequestException('Required players must be between 6 and 12');
      }
    }

    // Check if user is already in another room (either as host or participant)
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
    
    // Check if user is already in another room (if changing host, and not a delegation)
    if (updateRoomDto.hostUserId && updateRoomDto.hostUserId !== room.hostUser?.userId && !updateRoomDto.isHostDelegation) {
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
    // Check if user is hosting another room (database check)
    const existingHostedRoom = await this.roomRepository.findOne({
      where: { hostUser: { userId } },
      relations: ['hostUser'],
    });
    
    if (existingHostedRoom) {
      throw new ConflictException(`User is already hosting a room (Room ID: ${existingHostedRoom.roomId})`);
    }

    // // Check if user is participating in another room (Redis check)
    // const currentRoomId = await this.redisService.getUserCurrentRoom(userId);
    // if (currentRoomId) {
    //   throw new ConflictException(`User is already in another room (Room ID: ${currentRoomId}). Please leave the current room before creating a new one.`);
    // }
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
    //const gameStartCheck = await this.checkAndStartGame(roomId);
    
    // Check if game can be started
    const gameStartCheck = await this.canStartGame(roomId);
    if (gameStartCheck.canStart) {
      await this.roomRepository.update(roomId, { status: 'in_progress' });
    }
    
    return {
      message: gameStartCheck.canStart 
        ? 'Successfully joined room. Game can be started!' 
        : 'Successfully joined room',
      roomId,
      userId,
      gameStarted: false, // Always false since we're not auto-starting
      waitingMessage: gameStartCheck.canStart 
        ? 'Game can be started!' 
        : gameStartCheck.reason || 'Waiting for more players'
    };
  }

  // Auto-start game when required players are reached
  // private async checkAndStartGame(roomId: string): Promise<{ started: boolean; message?: string }> {
  //   const room = await this.findOne(roomId);
    
  //   // Only check if room is in waiting status
  //   if (room.status !== 'waiting') {
  //     return { started: false };
  //   }

  //   const currentParticipants = await this.redisService.getRoomParticipants(roomId);
  //   const currentCount = currentParticipants.length;
  //   const requiredCount = room.requiredPlayers;

  //   if (currentCount >= requiredCount) {
  //     // Start the game
  //     await this.startGame(roomId);
  //     return { 
  //       started: true, 
  //       message: `Game started! ${currentCount} players joined.` 
  //     };
  //   }

  //   return { 
  //     started: false, 
  //     message: `Waiting for ${requiredCount - currentCount} more players to start.` 
  //   };
  // }

  // Start the game
  async startGame(roomId: string): Promise<void> {
    const canStart = await this.canStartGame(roomId);
    if (!canStart.canStart) {
      throw new ConflictException(canStart.reason);
    }

    // Update room status to in_progress
    // await this.roomRepository.update(roomId, { status: 'in_progress' });
    
    // Get room participants in order
    const participants = await this.redisService.getRoomParticipants(roomId);
    
    // Get user details maintaining the same order
    const userDetails = await this.getUserDetails(participants);
    
    // Extract arrays in the same order
    const playerIds = userDetails.map(user => user.userId);
    const playerNicknames = userDetails.map(user => user.nickname);
    
    // Initialize the game using GameLogicService
    await this.gameLogicService.initializeGame(roomId, playerIds, playerNicknames);
    
    
    console.log(`Game started in room ${roomId} with ${participants.length} players.`);
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
      await this.update(roomId, { hostUserId: newHostId, isHostDelegation: true });
      
      return {
        message: 'Successfully left room and assigned new host.',
        roomId,
        userId,
        roomDeleted: false
      };
    } else {
      return {
        message: 'Successfully left room',
        roomId,
        userId,
        roomDeleted: false
      };
    }
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
    // if (room.status !== 'waiting') {
    //   return { 
    //     canStart: false, 
    //     reason: `Room is not in waiting status. Current status: ${room.status}` 
    //   };
    // }
    
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

  async findAllWaitingRooms(): Promise<RoomResponseDto[]> {
    const waitingRooms = await this.roomRepository.find({
      where: { status: 'waiting' },
      relations: ['hostUser'],
      order: { created_at: 'DESC' } // Most recent first
    });
    
    return waitingRooms.map(room => this.mapToResponseDto(room));
  }

  private async getUserDetails(userIds: string[]): Promise<Array<{ userId: string; nickname: string }>> {
    const userDetails: Array<{ userId: string; nickname: string }> = [];
    
    // Process in the same order as the userIds array
    for (const userId of userIds) {
      try {
        const user = await this.usersService.findById(userId);
        if (user) {
          userDetails.push({
            userId: user.userId,
            nickname: user.nickname
          });
        }
      } catch (error) {
        console.error(`Failed to get user details for userId: ${userId}`, error);
      }
    }
    
    return userDetails;
  }

  // async startGameManually(roomId: string): Promise<{ message: string; success: boolean }> {
  //   const room = await this.findOne(roomId);
    
  //   // Check if user is the host
  //   if (!room.hostUser) {
  //     throw new BadRequestException('Room has no host');
  //   }
    
  //   // Check if game can be started
  //   const canStart = await this.canStartGame(roomId);
  //   if (!canStart.canStart) {
  //     throw new BadRequestException(canStart.reason || 'Game cannot be started');
  //   }
    
  //   // Call the private startGame method
  //   await this.startGame(roomId);
    
  //   return {
  //     message: 'Game started successfully!',
  //     success: true
  //   };
  // }

}
