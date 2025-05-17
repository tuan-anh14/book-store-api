import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import aqp from 'api-query-params';
import { IUser } from '../users/user.interface';
import { History, HistoryDocument } from '../history/schemas/history.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(History.name) private historyModel: Model<HistoryDocument>
  ) { }

  async create(createOrderDto: CreateOrderDto, user: IUser): Promise<Order> {
    // Tạo order mới
    const createdOrder = new this.orderModel({
      ...createOrderDto,
      userId: user._id,
      status: 'PENDING'
    });
    const savedOrder = await createdOrder.save();

    // Tạo history record
    const historyData = {
      name: createOrderDto.name,
      email: user.email,
      phone: createOrderDto.phone,
      userId: user._id,
      detail: createOrderDto.detail,
      totalPrice: createOrderDto.totalPrice
    };
    await this.historyModel.create(historyData);

    return savedOrder;
  }

  async findAll() {
    return this.orderModel.find().exec();
  }

  async findAllWithPaginate(currentPage: number, limit: number, qs: string) {
    const { filter, projection, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.orderModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.orderModel.find(filter)
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
    return this.orderModel.findOne({ _id: id });
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.orderModel.updateOne(
      { _id: id },
      { ...updateOrderDto }
    );
  }

  remove(id: string) {
    return this.orderModel.deleteOne({ _id: id });
  }
}
