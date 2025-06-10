import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import aqp from 'api-query-params';
import { IUser } from '../users/user.interface';
import { History, HistoryDocument } from '../history/schemas/history.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(History.name) private historyModel: Model<HistoryDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>
  ) { }

  async create(createOrderDto: CreateOrderDto, user: IUser): Promise<Order> {
    // Start a transaction
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      // Check inventory for each book
      for (const item of createOrderDto.detail) {
        const book = await this.bookModel.findById(item._id);
        if (!book) {
          throw new NotFoundException(`Book ${item.bookName} not found`);
        }
        if (book.quantity < item.quantity) {
          throw new BadRequestException(
            `Sách "${item.bookName}" không đủ số lượng trong kho. Còn lại: ${book.quantity} cuốn`
          );
        }

        // Update book quantity and increment sold count
        await this.bookModel.updateOne(
          { _id: item._id },
          {
            $inc: {
              quantity: -item.quantity,
              sold: item.quantity
            }
          },
          { session }
        );
      }

      // Create order
      const createdOrder = new this.orderModel({
        ...createOrderDto,
        userId: user._id,
        status: 'PENDING'
      });
      const savedOrder = await createdOrder.save({ session });

      // Create history record
      await this.historyModel.create([{
        name: createOrderDto.name,
        email: user.email,
        phone: createOrderDto.phone,
        userId: user._id,
        detail: createOrderDto.detail,
        totalPrice: createOrderDto.totalPrice
      }], { session });

      await session.commitTransaction();
      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
