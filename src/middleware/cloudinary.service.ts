import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { MulterModuleOptions } from '@nestjs/platform-express';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Get Cloudinary instance
   */
  getCloudinary() {
    return cloudinary;
  }

  /**
   * Create storage configuration for reviews
   */
  createReviewsStorage(): CloudinaryStorage {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'book-store/reviews',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
    });
  }

  /**
   * Create storage configuration for admin uploads
   */
  createAdminStorage(): CloudinaryStorage {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'book-store/admin',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
    });
  }

  /**
   * Create storage configuration for user avatars
   */
  createAvatarStorage(): CloudinaryStorage {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'book-store/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
          },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
        public_id: (req, file) => {
          // Create unique public_id for avatar
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          return `avatar_${timestamp}_${random}`;
        },
      },
    });
  }

  /**
   * Create storage configuration for book images
   */
  createBookStorage(): CloudinaryStorage {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'book-store/books',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
    });
  }

  /**
   * Get multer options for reviews
   */
  getReviewsMulterOptions(): MulterModuleOptions {
    const storage = this.createReviewsStorage();
    return {
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Chỉ được upload file ảnh!'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Max 5 files
      },
    };
  }

  /**
   * Get multer options for admin
   */
  getAdminMulterOptions(): MulterModuleOptions {
    const storage = this.createAdminStorage();
    return {
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Chỉ được upload file ảnh!'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10, // Max 10 files for admin
      },
    };
  }

  /**
   * Get multer options for avatar
   */
  getAvatarMulterOptions(): MulterModuleOptions {
    const storage = this.createAvatarStorage();
    return {
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Chỉ được upload file ảnh!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for avatar
        files: 1, // Only 1 file for avatar
      },
    };
  }

  /**
   * Get multer options for book images
   */
  getBookMulterOptions(): MulterModuleOptions {
    const storage = this.createBookStorage();
    return {
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Chỉ được upload file ảnh!'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10, // Max 10 files for books
      },
    };
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteMultipleImages(publicIds: string[]): Promise<any> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      console.error('Error deleting multiple images from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Get image URL from Cloudinary
   */
  getImageUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, options);
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/i);
      if (matches && matches[1]) {
        return matches[1];
      }
      return null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }
}

