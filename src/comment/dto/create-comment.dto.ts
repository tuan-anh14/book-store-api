import { IsNotEmpty, IsString, IsNumber, IsOptional, IsMongoId, Min, Max, IsArray } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsMongoId()
    user_id: string;

    @IsNotEmpty()
    @IsMongoId()
    book_id: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    star: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}
