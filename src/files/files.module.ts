import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    CloudinaryModule,
    // MulterModule.registerAsync({
    //   useClass: MulterConfigService,
    // })
  ]
})

export class FilesModule { }
