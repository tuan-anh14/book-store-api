import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/user.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Response } from 'express';
import { MailerService } from '../utils/mailer';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailerService: MailerService,
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
        const { _id, fullName, email, role, phone, avatar, address } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            email,
            phone,
            fullName,
            role,
            _id,
            avatar,
            address
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
                address,
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

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>("JWT_REFRESH_SECRET")
            })
            let user = await this.usersService.findUserByToken(refreshToken);
            if (user) {
                const { _id, fullName, email, role, phone, avatar, address } = user;
                const payload = {
                    sub: "token refresh",
                    iss: "from server",
                    _id,
                    fullName,
                    email,
                    role,
                    phone,
                    avatar,
                    address
                };

                const refresh_token = this.createRefreshToken(payload);

                //update user with refresh token
                await this.usersService.updateUserToken(refresh_token, _id.toString());

                //set refresh_token as cookies
                response.clearCookie("refresh_token");

                response.cookie('refresh_token', refresh_token, {
                    httpOnly: true,
                    maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE") as StringValue)
                })


                return {
                    access_token: this.jwtService.sign(payload),
                    user: {
                        _id,
                        fullName,
                        email,
                        role,
                        phone,
                        avatar,
                        address
                    }
                };
            } else {
                throw new BadRequestException(`Refresh token không hợp lệ. Vui lòng login.`)
            }
        } catch (error) {
            throw new BadRequestException(`Refresh token không hợp lệ. Vui lòng login.`)
        }
    }

    logout = async (response: Response, user: IUser) => {
        await this.usersService.updateUserToken("", user._id);
        response.clearCookie("refresh_token");
        return "Logout successfully";
    };

    registerWithVerification = async (dto: RegisterUserDto) => {
        const { email, fullName, password, phone } = dto;
        const existingUser = await this.usersService.findOneByUsername(email);
        if (existingUser) throw new BadRequestException('Email đã tồn tại!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        const expirationTime = Date.now() + 10 * 60 * 1000; // 10 phút

        const newUser = await this.usersService.create({
            email,
            fullName,
            password: hashedPassword,
            phone,
            verificationCode,
            verificationExpires: new Date(expirationTime),
            isVerified: false,
        });

        // Gửi mail
        await this.mailerService.sendMail({
            from: `"BookStore" <${this.configService.get<string>('EMAIL_USER')}>`,
            to: email,
            subject: 'Mã xác thực tài khoản BookStore',
            html: `<p>Mã xác thực của bạn là: <strong>${verificationCode}</strong>. Có hiệu lực trong 10 phút.</p>`,
        });

        return { message: 'Đăng ký thành công. Đã gửi mã xác thực email!', data: { email } };
    }

    verifyEmail = async ({ email, code }: { email: string, code: string }) => {
        const user = await this.usersService.findOneByUsername(email);
        if (!user) throw new BadRequestException('User not found');
        if (!user.verificationCode || !user.verificationExpires)
            throw new BadRequestException('Chưa có mã xác thực, hãy đăng ký lại!');

        if (user.verificationExpires.getTime() < Date.now())
            throw new BadRequestException('Mã xác thực đã hết hạn!');

        if (user.verificationCode !== parseInt(code))
            throw new BadRequestException('Mã xác thực không đúng!');

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationExpires = null;
        await user.save();

        return { message: 'Xác thực email thành công!' };
    }

    forgotPassword = async ({ email }: { email: string }) => {
        const user = await this.usersService.findOneByUsername(email);
        if (!user) throw new BadRequestException('Không tìm thấy người dùng!');

        const randomPassword = Math.round(100000 + Math.random() * 99000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user.password = hashedPassword;
        await user.save();

        await this.mailerService.sendMail({
            from: `"BookStore" <${this.configService.get<string>('EMAIL_USER')}>`,
            to: email,
            subject: 'Mật khẩu mới',
            html: `<h1>${randomPassword}</h1>. Vui lòng không chia sẻ với ai.`,
        });

        return { message: 'Đã gửi mật khẩu mới về email!' };
    }
}
