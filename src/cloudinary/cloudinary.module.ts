import { Module } from '@nestjs/common';
import { CloudinaryService } from '../middleware/cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}

