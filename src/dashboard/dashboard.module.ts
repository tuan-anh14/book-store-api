import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { Book, BookSchema } from '../book/schemas/book.schema';
import { Comment, CommentSchema } from '../comment/schemas/comment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Book.name, schema: BookSchema },
            { name: Comment.name, schema: CommentSchema },
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { } 