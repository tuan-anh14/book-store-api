import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { ResponseMessage } from 'src/decorator/customize';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../middleware/cloudinary.service';

@Controller('support-request')
export class SupportRequestController {
  constructor(
    private readonly supportRequestService: SupportRequestService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

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
      storage: memoryStorage(),
      // storage: diskStorage({
      //   destination: './public/images/support',
      //   filename: (req, file, cb) => {
      //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      //     cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      //   },
      // }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateSupportRequestDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    console.log('[SupportRequest] Update called with:', {
      id,
      hasFiles: !!files && files.length > 0,
      filesCount: files?.length || 0,
      adminReply: updateData.adminReply,
    });

    // Tạo object mới để tránh mutate updateData gốc
    const updatePayload: UpdateSupportRequestDto = {
      adminReply: updateData.adminReply,
    };

    // Xử lý files nếu có - upload lên Cloudinary
    if (files && files.length > 0) {
      console.log(`[SupportRequest] Uploading ${files.length} files to Cloudinary...`);
      console.log('[SupportRequest] Files info:', files.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        hasBuffer: !!f.buffer,
      })));
      
      const cloudinary = this.cloudinaryService.getCloudinary();
      const uploadPromises = files.map((file) => {
        return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
          if (!file.buffer) {
            reject(new Error('File buffer is missing'));
            return;
          }

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'book-store/admin',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else if (!result) {
                reject(new Error('Upload result is undefined'));
              } else {
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      });

      try {
        const uploadResults = await Promise.all(uploadPromises);
        const cloudinaryUrls = uploadResults.map((result) => result.url);
        updatePayload.adminReplyImages = cloudinaryUrls;
        console.log(`[SupportRequest] Successfully uploaded ${cloudinaryUrls.length} files to Cloudinary`);
        console.log('[SupportRequest] Cloudinary URLs:', cloudinaryUrls);
      } catch (error) {
        console.error('[SupportRequest] Error uploading to Cloudinary:', error);
        throw new BadRequestException(
          `Failed to upload files to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } else {
      console.log('[SupportRequest] No files provided, skipping upload');
    }

    console.log('[SupportRequest] Final updatePayload:', updatePayload);
    return this.supportRequestService.update(id, updatePayload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportRequestService.remove(id);
  }
}
