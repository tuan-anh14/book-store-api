import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true })
    name: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
