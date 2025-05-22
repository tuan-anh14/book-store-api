import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop()
    fullName: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop()
    phone: string;

    @Prop()
    address: string;

    @Prop({ default: 'public/avatar/default-avatar.png' })
    avatar: string;

    @Prop()
    role: string;

    @Prop()
    isActive: boolean;

    @Prop()
    refreshToken: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
