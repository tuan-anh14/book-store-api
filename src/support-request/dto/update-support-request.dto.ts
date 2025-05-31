import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportRequestDto } from './create-support-request.dto';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateSupportRequestDto extends PartialType(CreateSupportRequestDto) {
    @IsOptional()
    @IsString()
    adminReply?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    adminReplyImages?: string[];
}
