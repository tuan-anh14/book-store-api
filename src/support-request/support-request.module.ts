import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportRequestService } from './support-request.service';
import { SupportRequestController } from './support-request.controller';
import { SupportRequest, SupportRequestSchema } from './schemas/support-request.schema';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportRequest.name, schema: SupportRequestSchema }
    ]),
    AuthModule,
    ConfigModule
  ],
  controllers: [SupportRequestController],
  providers: [SupportRequestService]
})
export class SupportRequestModule { }
