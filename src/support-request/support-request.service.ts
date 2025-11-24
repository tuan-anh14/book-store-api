import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportRequest, SupportRequestDocument } from './schemas/support-request.schema';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { MailerService } from '../utils/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportRequestService {
  constructor(
    @InjectModel(SupportRequest.name) private supportRequestModel: Model<SupportRequestDocument>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) { }

  async create(createSupportRequestDto: CreateSupportRequestDto) {
    return this.supportRequestModel.create(createSupportRequestDto);
  }

  async findAll(page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.supportRequestModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.supportRequestModel.countDocuments()
    ]);
    return {
      data,
      total,
      page,
      limit
    };
  }

  async findOne(id: string) {
    return this.supportRequestModel.findById(id).exec();
  }

  async update(id: string, updateData: UpdateSupportRequestDto) {
    // Xử lý update data
    const updatePayload: Partial<SupportRequest> = {
      adminReply: updateData.adminReply,
      status: 'answered',
    };

    // Nếu có ảnh mới
    if (updateData.adminReplyImages && updateData.adminReplyImages.length > 0) {
      updatePayload.adminReplyImages = updateData.adminReplyImages;
    }

    const updated = await this.supportRequestModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).exec();

    console.log('Updated request:', updated);

    // Gửi mail cho khách hàng
    if (updated?.email && updatePayload.adminReply) {
      const html = `
        <h2>Phản hồi khiếu nại từ BookStore</h2>
        <p>${updatePayload.adminReply}</p>
        ${updatePayload.adminReplyImages && updatePayload.adminReplyImages.length > 0 ?
          `<div style="margin-top: 20px;">
            <h3>Ảnh đính kèm:</h3>
            ${updatePayload.adminReplyImages.map((url: string) =>
            `<img src="${url}" style="max-width: 200px; margin: 10px;" />`
          ).join('')}
          </div>`
          : ''
        }
      `;

      try {
        await this.mailerService.sendMail({
          from: `"BookStore" <${this.configService.get<string>('EMAIL_USER')}>`,
          to: updated.email,
          subject: 'Phản hồi khiếu nại từ BookStore',
          html,
        });
        console.log('Email sent successfully to:', updated.email);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    return updated;
  }

  async remove(id: string) {
    return this.supportRequestModel.findByIdAndDelete(id).exec();
  }
}
