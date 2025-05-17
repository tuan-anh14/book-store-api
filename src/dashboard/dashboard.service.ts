import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,
        @InjectModel(Book.name)
        private bookModel: Model<BookDocument>,
    ) { }

    async getDashboardStats() {
        const [countUser, countOrder, countBook] = await Promise.all([
            this.userModel.countDocuments(),
            this.orderModel.countDocuments(),
            this.bookModel.countDocuments(),
        ]);

        return {
            countUser,
            countOrder,
            countBook,
        };
    }
} 