import { Controller, Post, UseGuards, Get, Body, Res, Req } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { IUser } from 'src/users/user.interface';

import { UsersService } from 'src/users/users.service';

@Controller("auth") // route sẽ là /api/v1/auth
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('/login')
    @ResponseMessage("Login")
    handleLogin(
        @Req() req,
        @Res({ passthrough: true }) response: Response
    ) {
        return this.authService.login(req.user, response);
    }

    // @Public()
    // @ResponseMessage('Register a new user')
    // @Post('/register')
    // handleRegister(@Body() registerUserDto: RegisterUserDto) {
    //     return this.authService.register(registerUserDto);
    // }

    @Public()
    @Post('/register')
    @ResponseMessage('Register with email verification')
    async registerWithVerification(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.registerWithVerification(registerUserDto);
    }

    @Public()
    @Post('/verify-email')
    @ResponseMessage('Verify email')
    async verifyEmail(@Body() body: { email: string, code: string }) {
        return this.authService.verifyEmail(body);
    }

    @Public()
    @Post('/forgot-password')
    @ResponseMessage('Forgot password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body);
    }

    @ResponseMessage('Get user information')
    @Get('/account')
    async handleGetAccount(@User() user: IUser) {
        const temp = await this.usersService.findOne(user._id);
        return { user: temp };
    }

    @Public()
    @ResponseMessage("Get User by refresh token")
    @Get('/refresh')
    handleRefreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        const refreshToken = request.cookies["refresh_token"];
        return this.authService.processNewToken(refreshToken, response);
    }

    @ResponseMessage("Logout User")
    @Post('/logout')
    handleLogout(
        @Res({ passthrough: true }) response: Response,
        @User() user: IUser
    ) {
        return this.authService.logout(response, user);
    }
}
