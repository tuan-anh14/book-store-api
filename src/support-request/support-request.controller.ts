import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { ResponseMessage } from 'src/decorator/customize';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('support-request')
export class SupportRequestController {
  constructor(private readonly supportRequestService: SupportRequestService) { }

  @ResponseMessage("Create a new Support Request")
  @Post()
  create(@Body() createSupportRequestDto: CreateSupportRequestDto) {
    return this.supportRequestService.create(createSupportRequestDto);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.supportRequestService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportRequestService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('adminReplyImages', 5, {
      storage: diskStorage({
        destination: './public/images/support',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateData: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    console.log('Files received:', files);
    console.log('Update data:', updateData);

    // Xử lý files nếu có
    if (files && files.length > 0) {
      const fileUrls = files.map(file => `/images/support/${file.filename}`);
      updateData.adminReplyImages = fileUrls;
    }

    return this.supportRequestService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportRequestService.remove(id);
  }
}
