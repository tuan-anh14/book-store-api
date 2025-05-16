import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoryDocument = History & Document;

@Schema({ timestamps: true })
export class History {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    userId: string;

    @Prop({
        type: [{
            bookName: String,
            quantity: Number,
            _id: String
        }],
        required: true
    })
    detail: Array<{
        bookName: string;
        quantity: number;
        _id: string;
    }>;

    @Prop({ required: true })
    totalPrice: number;
}

export const HistorySchema = SchemaFactory.createForClass(History);