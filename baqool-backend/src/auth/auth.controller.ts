import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // @UseGuards(JwtAuthGuard)
    // @Get('me')
    // async me(@Req() req) {
    // const user = await this.usersService.getUserById(req.user.userId);
    // const { passwordHash, ...safeUser } = user;
    // return safeUser;
    // }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        //  req.user.userId comes from JwtStrategy.validate()
        return this.authService.getMe(req.user.userId);
    }
}
