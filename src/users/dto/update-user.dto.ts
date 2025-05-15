import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
    @IsNotEmpty({ message: 'Id không được để trống' })
    _id: string;
}

