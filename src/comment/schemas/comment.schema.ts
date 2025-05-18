import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
    @Prop({ required: true })
    content: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
    book_id: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    star: number;

    @Prop()
    feeling: string;

    @Prop()
    image: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
