import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportRequestDocument = SupportRequest & Document;

@Schema({ timestamps: true })
export class SupportRequest {
    @Prop({ required: true })
    mainIssue: string;

    @Prop()
    detailIssue: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    order_number: string;

    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: [String], default: [] })
    file_list: string[]; // Chỉ lưu đường dẫn file ảnh

    @Prop({ default: 'pending' })
    status: 'pending' | 'answered';

    @Prop()
    adminReply: string;

    @Prop({ type: [String], default: [] })
    adminReplyImages: string[];
}

export const SupportRequestSchema = SchemaFactory.createForClass(SupportRequest);
