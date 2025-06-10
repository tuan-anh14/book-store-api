import { IsEnum, IsNotEmpty } from 'class-validator';

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export class UpdateOrderStatusDto {
    @IsNotEmpty()
    @IsEnum(OrderStatus, {
        message: 'Status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED'
    })
    status: OrderStatus;
} 