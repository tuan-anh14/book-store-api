import { Injectable } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History, HistoryDocument } from './schemas/history.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(History.name)
    private historyModel: Model<HistoryDocument>
  ) { }

  create(createHistoryDto: CreateHistoryDto) {
    return 'This action adds a new history';
  }

  async findAll(userId: string) {
    return this.historyModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} history`;
  }

  update(id: number, updateHistoryDto: UpdateHistoryDto) {
    return `This action updates a #${id} history`;
  }

  remove(id: number) {
    return `This action removes a #${id} history`;
  }
}
