import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History, HistoryDocument } from './schemas/history.schema';
import { CreateHistoryDto } from './dto/create-history.dto';
import aqp from 'api-query-params';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(History.name) private historyModel: Model<HistoryDocument>,
  ) { }

  async create(createHistoryDto: CreateHistoryDto): Promise<History> {
    const createdHistory = new this.historyModel(createHistoryDto);
    return createdHistory.save();
  }

  async findAll() {
    return this.historyModel.find().exec();
  }

  async findByUserId(userId: string) {
    return this.historyModel.find({ userId }).exec();
  }

  async findAllWithPaginate(currentPage: number, limit: number, qs: string) {
    const { filter, projection, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.historyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.historyModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems
      },
      result
    }
  }

  findOne(id: string) {
    return this.historyModel.findOne({ _id: id });
  }
}