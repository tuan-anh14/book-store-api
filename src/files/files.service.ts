import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CloudinaryService } from '../middleware/cloudinary.service';

@Injectable()
export class FilesService {
  constructor(private cloudinaryService: CloudinaryService) {}

  /**
   * Upload file to Cloudinary
   * @param file - Multer file object
   * @param folderType - Type of folder: 'book', 'avatar', 'comment', 'support', or default 'admin'
   * @returns Object with url and publicId
   */
  async uploadToCloudinary(
    file: Express.Multer.File,
    folderType: string = 'admin',
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Map folderType to Cloudinary folder
    const folderMap: { [key: string]: string } = {
      book: 'book-store/books',
      avatar: 'book-store/avatars',
      comment: 'book-store/reviews',
      support: 'book-store/admin',
      admin: 'book-store/admin',
    };

    const cloudinaryFolder = folderMap[folderType] || folderMap['admin'];

    try {
      const cloudinary = this.cloudinaryService.getCloudinary();
      
      // Upload to Cloudinary using buffer
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload file to Cloudinary: ${error.message}`,
      );
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of Multer file objects
   * @param folderType - Type of folder: 'book', 'avatar', 'comment', 'support', or default 'admin'
   * @returns Array of objects with url and publicId
   */
  async uploadMultipleToCloudinary(
    files: Express.Multer.File[],
    folderType: string = 'admin',
  ): Promise<{ url: string; publicId: string }[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload all files in parallel
    const uploadPromises = files.map(file => 
      this.uploadToCloudinary(file, folderType)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload files to Cloudinary: ${error.message}`,
      );
    }
  }

  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }
}
