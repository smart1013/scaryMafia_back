import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

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
}