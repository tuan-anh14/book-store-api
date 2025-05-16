import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDetailDto {
    @IsString()
    @IsNotEmpty()
    bookName: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsString()
    @IsNotEmpty()
    _id: string;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsNumber()
    @IsNotEmpty()
    totalPrice: number;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderDetailDto)
    detail: OrderDetailDto[];
}
