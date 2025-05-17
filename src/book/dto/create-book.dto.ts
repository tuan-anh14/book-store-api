// create-book.dto.ts
import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateBookDto {
    @IsString()
    thumbnail: string;

    @IsArray()
    @IsString({ each: true })
    slider: string[];

    @IsString()
    mainText: string;

    @IsString()
    description: string;

    @IsString()
    author: string;

    @IsNumber()
    price: number;

    @IsNumber()
    @IsOptional()
    sold?: number;

    @IsNumber()
    quantity: number;

    @IsString()
    category: string;
}
