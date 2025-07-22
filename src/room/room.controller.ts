import { Controller, Post, Put, Get, Body, Param, Delete, BadRequestException } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    return this.roomService.create(createRoomDto);
  }

  @Put(':roomId')
  async update(
    @Param('roomId') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomService.update(roomId, updateRoomDto);
  }

  @Get('waiting')
  async findAllWaitingRooms(): Promise<RoomResponseDto[]> {
    return this.roomService.findAllWaitingRooms();
  }

  @Get('current/:userId')
  async getUserCurrentRoom(@Param('userId') userId: string) {
    try {
      return await this.roomService.getUserCurrentRoom(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('leave-current')
  async leaveCurrentRoom(@Body() leaveRoomDto: LeaveRoomDto) {
    try {
      return await this.roomService.removeUserFromCurrentRoom(leaveRoomDto.userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':roomId')
  async findOne(@Param('roomId') roomId: string): Promise<RoomResponseDto> {
    return this.roomService.findOneResponse(roomId);
  }

  @Delete(':roomId')
  async remove(@Param('roomId') roomId: string): Promise<{ message: string }> {
    return this.roomService.remove(roomId);
  }


  // Room Management Endpoints
  // Redis-based room management
  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @Body() joinRoomDto: JoinRoomDto
  ) {
    try {
      return await this.roomService.joinRoom(roomId, joinRoomDto.userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':roomId/leave')
  async leaveRoom(
    @Param('roomId') roomId: string,
    @Body() leaveRoomDto: LeaveRoomDto
  ) {
    try {
      return await this.roomService.leaveRoom(roomId, leaveRoomDto.userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':roomId/participants')
  async getRoomParticipants(@Param('roomId') roomId: string) {
    try {
      return await this.roomService.getRoomParticipants(roomId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':roomId/can-start')
  async canStartGame(@Param('roomId') roomId: string) {
    try {
      return await this.roomService.canStartGame(roomId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
