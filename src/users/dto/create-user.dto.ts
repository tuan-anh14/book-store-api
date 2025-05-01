import { IsEmail, IsNotEmpty } from 'class-validator';

//data transfer object, class=object
export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty({
        message: "Email không được để trống!",
    })
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    fullName: string;
    // phone?: number;
}
