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
    author: string;

    @Prop()
    price: number;

    @Prop({ default: 0 })
    sold: number;

    @Prop()
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
}

export const BookSchema = SchemaFactory.createForClass(Book);