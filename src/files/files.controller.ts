import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseInterceptors, UploadedFile, UploadedFiles, ParseFilePipeBuilder, HttpStatus, UseFilters, Headers
} from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { HttpExceptionFilter } from 'src/core/http-exception.filter';
import { CloudinaryService } from '../middleware/cloudinary.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Public()
  @Post('upload-cloudinary')
  @ResponseMessage("Upload Single File to Cloudinary")
  @UseInterceptors(FileInterceptor('fileUpload'))
  @UseFilters(new HttpExceptionFilter())
  async uploadFileToCloudinary(
    @UploadedFile() file: Express.Multer.File,
    @Headers('folder_type') folderType: string = 'admin',
  ) {
    if (!file) {
      throw new Error('No file provided');
    } 

    const result = await this.filesService.uploadToCloudinary(file, folderType);
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }

  // @Public()
  // @Post('upload')
  // @ResponseMessage("Upload Single File")
  // @UseInterceptors(FileInterceptor('fileUpload'))
  // @UseFilters(new HttpExceptionFilter())
  // uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   return {
  //     fileName: file.filename
  //   }
  // }

  @Public()
  @Post('upload')
  @ResponseMessage("Upload Single File")
  @UseInterceptors(FileInterceptor('fileUpload'))
  @UseFilters(new HttpExceptionFilter())
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Headers('folder_type') folderType: string = 'admin',
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Upload to Cloudinary
    const result = await this.filesService.uploadToCloudinary(file, folderType);
    
    // Return format compatible with old frontend (fileName is extracted from URL)
    const urlParts = result.url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    return {
      fileName: fileName,
      url: result.url, // Also return URL for new frontend
      publicId: result.publicId,
    };
  }

  @Public()
  @Post('upload-multiple')
  @ResponseMessage("Upload Multiple Files")
  @UseInterceptors(FilesInterceptor('fileUpload', 10))
  @UseFilters(new HttpExceptionFilter())
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Headers('folder_type') folderType: string = 'admin',
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Upload all files to Cloudinary
    const results = await this.filesService.uploadMultipleToCloudinary(files, folderType);
    
    // Return format compatible with old frontend
    const response = results.map(result => {
      const urlParts = result.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return {
        fileName: fileName,
        url: result.url,
        publicId: result.publicId,
      };
    });
    
    return response;
  }

  @Public()
  @Post('upload-multiple-cloudinary')
  @ResponseMessage("Upload Multiple Files to Cloudinary")
  @UseInterceptors(FilesInterceptor('fileUpload', 10))
  @UseFilters(new HttpExceptionFilter())
  async uploadMultipleFilesToCloudinary(
    @UploadedFiles() files: Express.Multer.File[],
    @Headers('folder_type') folderType: string = 'admin',
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const results = await this.filesService.uploadMultipleToCloudinary(files, folderType);
    return results;
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(+id);
  }
}
