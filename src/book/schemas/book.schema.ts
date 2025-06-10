import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
    @Prop()
    thumbnail: string;

    @Prop([String])
    slider: string[];

    @Prop()
    mainText: string;

    @Prop()
    description: string;

    @Prop()
    author: string;

    @Prop()
    price: number;

    @Prop({ default: 0 })
    sold: number;

    @Prop({ required: true, min: 0, default: 0 })
    quantity: number;

    @Prop()
    category: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;

    @Prop()
    isDeleted: boolean;

    @Prop()
    deletedAt: Date;

    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Comment' }])
    comments: MongooseSchema.Types.ObjectId[];
}

export const BookSchema = SchemaFactory.createForClass(Book);