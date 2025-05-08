import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/decorator/customize';

@Controller("auth") //  route /
export class AuthController {
    constructor(
        private authService: AuthService

    ) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('/login')
    handleLogin(@Request() req) {
        return this.authService.login(req.user);
    }

    // @UseGuards(JwtAuthGuard)
    @Public()
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    // @UseGuards(JwtAuthGuard)
    @Get('profile1')
    getProfile1(@Request() req) {
        return req.user;
    }

}
