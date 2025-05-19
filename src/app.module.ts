import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { CategoryModule } from './category/category.module';
import { FilesModule } from './files/files.module';
import { OrderModule } from './order/order.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommentModule } from './comment/comment.module';
import { PaymentModule } from './payment/payment.module';
import { GeminiController } from './controllers/gemini.controller';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
        // connectionFactory: (connection) => {
        //   connection.plugin(softDeletePlugin);
        //   return connection;
        // }
      }),
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({
      isGlobal: true
    }),

    UsersModule,
    AuthModule,
    BookModule,
    CategoryModule,
    FilesModule,
    OrderModule,
    HistoryModule,
    DashboardModule,
    CommentModule,
    PaymentModule
  ],
  controllers: [AppController, GeminiController],
  providers: [AppService],
})
export class AppModule { }
