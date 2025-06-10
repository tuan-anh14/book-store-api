import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { History, HistorySchema } from '../history/schemas/history.schema';
import { Book, BookSchema } from '../book/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: History.name, schema: HistorySchema },
      { name: Book.name, schema: BookSchema }
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule { }
