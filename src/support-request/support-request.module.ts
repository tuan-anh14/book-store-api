import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportRequestService } from './support-request.service';
import { SupportRequestController } from './support-request.controller';
import { SupportRequest, SupportRequestSchema } from './schemas/support-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportRequest.name, schema: SupportRequestSchema }
    ])
  ],
  controllers: [SupportRequestController],
  providers: [SupportRequestService]
})
export class SupportRequestModule { }
