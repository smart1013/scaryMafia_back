import { Controller, Post, Put, Get, Body, Param } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

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

  @Get(':roomId')
  async findOne(@Param('roomId') roomId: string): Promise<RoomResponseDto> {
    return this.roomService.findOneResponse(roomId);
  }
}
