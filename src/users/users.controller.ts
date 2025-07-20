import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // get list of all users
    @Get('list')
    async getAllUsers() {
        return this.usersService.findAll();
    }

    // get user by id
    @Get('userId/:userId')
    async getUserById(@Param('userId') userId: string) {
        return this.usersService.findById(userId);
    }

    // get user by nickname
    @Get('nickname/:nickname')
    async getUserByNickname(@Param('nickname') nickname: string) {
        return this.usersService.findByNickname(nickname);
    }

    // get user by email
    @Get('email/:email')
    async getUserByEmail(@Param('email') userEmail: string) {
        return this.usersService.findByEmail(userEmail);
    }

    // get user count
    @Get('count')
    async getUserCount() {
        return this.usersService.getUserCount();
    }

    // update user
    @Put(':userId')
    async updateUser(
        @Param('userId') userId: string,
        // @Param extracts the userId from the URL
        // @Body extracts the updateUserDto from the request body
        @Body() updateUserDto: UpdateUserDto
    ) {
    return this.usersService.update(userId, updateUserDto);
    }
}