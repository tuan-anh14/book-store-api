import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportRequest, SupportRequestDocument } from './schemas/support-request.schema';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';

@Injectable()
export class SupportRequestService {
  constructor(
    @InjectModel(SupportRequest.name) private supportRequestModel: Model<SupportRequestDocument>
  ) { }

  async create(createSupportRequestDto: CreateSupportRequestDto) {
    return this.supportRequestModel.create(createSupportRequestDto);
  }

  async findAll(page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.supportRequestModel.find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.supportRequestModel.countDocuments({ deleted: { $ne: true } })
    ]);
    return {
      data,
      total,
      page,
      limit
    };
  }

  async findOne(id: string) {
    return this.supportRequestModel.findOne({ _id: id, deleted: { $ne: true } }).exec();
  }

  async update(id: string, updateSupportRequestDto: UpdateSupportRequestDto) {
    return this.supportRequestModel.findByIdAndUpdate(id, updateSupportRequestDto, { new: true }).exec();
  }

  async remove(id: string) {
    // Soft delete
    return this.supportRequestModel.findByIdAndUpdate(id, { deleted: true }, { new: true }).exec();
  }
}
