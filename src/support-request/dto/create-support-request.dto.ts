import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class CreateSupportRequestDto {
    @IsString()
    mainIssue: string;

    @IsOptional()
    @IsString()
    detailIssue?: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    order_number?: string;

    @IsString()
    subject: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    file_list?: string[];
}
