import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.getUserByEmail(registerDto.email);
        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.createUser({
            email: registerDto.email,
            passwordHash: hashedPassword,
            name: registerDto.name,
        });

        const accessToken = await this.signToken(user.id, user.email, user.name ?? '');  
        return {
            user: { id: user.id, email: user.email, name: user.name },
            accessToken: accessToken,};
    }
    async login(loginDto: LoginDto) {
        const user = await this.usersService.getUserByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = await this.signToken(user.id, user.email, user.name ?? '');
        return { accessToken: accessToken };
    }

    async getMe(userId: string) {
        const user = await this.usersService.getUserById(userId);
        if (!user) {
        throw new NotFoundException('User not found');
        }

        const { id, email, name } = user;
        return { id, email, name };
    }

    private async signToken(userId: string, email: string, name: string): Promise<string> {
        const payload = { sub: userId, email, name };        
        return this.jwtService.signAsync(payload);
    }

}
