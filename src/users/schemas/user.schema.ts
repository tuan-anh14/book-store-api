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

    @Prop()
    avatar: string;

    @Prop({ default: "USER" })
    role: string;

    @Prop()
    isActive: boolean;

    @Prop()
    refreshToken: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;

    @Prop()
    verificationCode?: number;

    @Prop()
    verificationExpires?: Date;

    @Prop({ default: false })
    isVerified?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
