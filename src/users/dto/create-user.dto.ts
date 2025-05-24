import { IsEmail, IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';

//data transfer object // class = { }
export class CreateUserDto {
    @IsEmail({}, { message: 'Email không đúng định dạng', })
    @IsNotEmpty({ message: 'Email không được để trống', })
    email: string;

    @IsNotEmpty({ message: 'Password không được để trống', })
    password: string;

    @IsNotEmpty({ message: 'Full name không được để trống', })
    fullName: string;

    address: string;

    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại phải có 10 chữ số' })
    phone: string;

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

    address: string;

    @IsOptional()
    phone: string;
}
