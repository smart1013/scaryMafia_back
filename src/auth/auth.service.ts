import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async signup(signupDto: SignupDto) {
        const { userEmail, password, nickname } = signupDto;

        // Check if user already exists
        const existingUser = await this.usersService.findByEmail_signup(userEmail);
        // SELECT * FROM users WHERE userEmail = 'userEmail'
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Check if nickname is already taken
        const existingNickname = await this.usersService.findByNickname_signup(nickname);
        // SELECT * FROM users WHERE nickname = 'nickname'  
        if (existingNickname) {
            throw new ConflictException('Nickname is already taken');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await this.usersService.create({
            userEmail,
            password_hash: hashedPassword,
            nickname,
        });

        return {
            message: 'User created successfully',
            userId: user.userId,
            userEmail: user.userEmail,
            nickname: user.nickname,
        };
    }

    async login(loginDto: LoginDto) {
        const { userEmail, password } = loginDto;

        // Find user by email
        const user = await this.usersService.findByEmail(userEmail);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            message: 'Login successful',
            userId: user.userId,
            userEmail: user.userEmail,
            nickname: user.nickname,
        };
    }
}