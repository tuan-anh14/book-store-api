import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserInfoDto {
    @IsString()
    @IsNotEmpty({ message: '_id không được để trống' })
    _id: string;

    @IsString()
    @IsNotEmpty({ message: 'Full name không được để trống' })
    fullName: string;

    @IsString()
    @IsNotEmpty({ message: 'Phone không được để trống' })
    phone: string;

    @IsString()
    address: string;

    @IsString()
    @IsOptional()
    avatar?: string;
} 