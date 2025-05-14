import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/user.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Response } from 'express';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }

    //ussername/ pass là 2 tham số thư viện passport nó ném về
    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByUsername(username);
        if (user) {
            const isValid = this.usersService.isValidPassword(pass, user.password);
            if (isValid === true) {
                return user;
            }
        }

        return null;
    }

    async login(user: IUser, response: Response) {
        const { _id, fullName, email, role, phone, avatar } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            email,
            phone,
            fullName,
            role,
            _id,
            avatar
        };

        const refresh_token = this.createRefreshToken(payload);

        const access_token = this.jwtService.sign(payload);

        //update user with refresh token
        await this.usersService.updateUserToken(refresh_token, _id);
        //set refresh token in cookie
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue)
        })

        return {
            user: {
                email,
                phone,
                fullName,
                role,
                avatar,
                id: _id
            },
            access_token,
            refresh_token,
        };
    }

    async register(user: RegisterUserDto) {
        let newUser = await this.usersService.register(user);

        return {
            _id: newUser?._id,
            createdAt: newUser?.createdAt,
        }
    }

    createRefreshToken = (payload: any) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue) / 1000
        })

        return refresh_token;
    }

}
