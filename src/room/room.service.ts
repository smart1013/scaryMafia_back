import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    // Check if user is already in another room
    if (createRoomDto.hostUserId) {
      await this.checkUserRoomConstraint(createRoomDto.hostUserId);
    }
    
    // Create room with proper hostUser mapping
    const roomData = {
      title: createRoomDto.title,
      notes: createRoomDto.notes,
      hostUser: createRoomDto.hostUserId ? { userId: createRoomDto.hostUserId } : undefined
    };
    
    const room = this.roomRepository.create(roomData);
    const savedRoom = await this.roomRepository.save(room);
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
      hostUser: room.hostUser ? {
        userId: room.hostUser.userId,
        nickname: room.hostUser.nickname,
      } : undefined,
    };
  }
}
