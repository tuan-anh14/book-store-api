import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class UpdateBookDto {
    @IsString()
    mainText: string;

    @IsString()
    author: string;

    @IsNumber()
    price: number;

    @IsNumber()
    quantity: number;

    @IsString()
    category: string;

    @IsString()
    description: string;

    @IsString()
    @IsOptional()
    thumbnail?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    slider?: string[];
}
