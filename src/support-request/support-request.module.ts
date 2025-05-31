import { Module } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { SupportRequestController } from './support-request.controller';

@Module({
  controllers: [SupportRequestController],
  providers: [SupportRequestService]
})
export class SupportRequestModule {}
