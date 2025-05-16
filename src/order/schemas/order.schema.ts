import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    totalPrice: number;

    @Prop({ required: true })
    type: string;

    @Prop({
        type: [{
            bookName: String,
            quantity: Number,
            _id: String
        }], required: true
    })
    detail: Array<{
        bookName: string;
        quantity: number;
        _id: string;
    }>;

    @Prop({ default: 'PENDING' })
    status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
