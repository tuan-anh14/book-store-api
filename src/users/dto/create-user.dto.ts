import { IsEmail, IsNotEmpty } from 'class-validator';

//data transfer object // class = { }
export class CreateUserDto {
    @IsEmail({}, { message: 'Email không đúng định dạng', })
    @IsNotEmpty({ message: 'Email không được để trống', })
    email: string;

    @IsNotEmpty({ message: 'Password không được để trống', })
    password: string;

    @IsNotEmpty({ message: 'Full name không được để trống', })
    fullName: string;

    @IsNotEmpty({ message: 'Address không được để trống', })
    address: string;

    @IsNotEmpty({ message: 'Phone không được để trống', })
    phone: string;

    @IsNotEmpty({ message: 'Role không được để trống', })
    role: string;


}

export class RegisterUserDto {
    @IsEmail({}, { message: 'Email không đúng định dạng', })
    @IsNotEmpty({ message: 'Email không được để trống', })
    email: string;

    @IsNotEmpty({ message: 'Password không được để trống', })
    password: string;

    @IsNotEmpty({ message: 'Full name không được để trống', })
    fullName: string;

    @IsNotEmpty({ message: 'Address không được để trống', })
    address: string;

    @IsNotEmpty({ message: 'Phone không được để trống', })
    phone: string;


}
