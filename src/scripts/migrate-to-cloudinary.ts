import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { connect, connection } from 'mongoose';
import { Book, BookSchema } from '../book/schemas/book.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Comment, CommentSchema } from '../comment/schemas/comment.schema';
import { Model } from 'mongoose';

config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file lên Cloudinary
 */
async function uploadToCloudinary(
  filePath: string,
  folder: string,
): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return null;
    }

    console.log(`📤 Uploading: ${filePath} → ${folder}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });

    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Check if URL is a local path that needs migration
 */
function isLocalPath(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return (
    url.startsWith('/images/') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/avatars/') ||
    url.startsWith('public/')
  );
}

/**
 * Convert local path to file system path
 */
function getLocalFilePath(url: string): string {
  if (url.startsWith('/')) {
    return path.join(process.cwd(), 'public', url);
  }
  return path.join(process.cwd(), url);
}

/**
 * Determine Cloudinary folder based on local path
 */
function getCloudinaryFolder(localPath: string): string {
  if (localPath.includes('/avatars/')) {
    return 'book-store/avatars';
  }
  if (localPath.includes('/images/') || localPath.includes('/uploads/')) {
    return 'book-store/admin';
  }
  return 'book-store/admin';
}

/**
 * Migrate Books
 */
async function migrateBooks(BookModel: Model<Book>): Promise<void> {
  console.log('\n📚 Migrating Books...');

  const books = await BookModel.find({});
  let updated = 0;

  for (const book of books) {
    let hasChanges = false;
    const updates: any = {};

    // Migrate thumbnail
    if (book.thumbnail && isLocalPath(book.thumbnail)) {
      const localPath = getLocalFilePath(book.thumbnail);
      const cloudinaryUrl = await uploadToCloudinary(
        localPath,
        'book-store/books',
      );
      if (cloudinaryUrl) {
        updates.thumbnail = cloudinaryUrl;
        hasChanges = true;
      }
    }

    // Migrate slider images
    if (book.slider && Array.isArray(book.slider) && book.slider.length > 0) {
      const newSlider: string[] = [];
      for (const imageUrl of book.slider) {
        if (isLocalPath(imageUrl)) {
          const localPath = getLocalFilePath(imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(
            localPath,
            'book-store/books',
          );
          if (cloudinaryUrl) {
            newSlider.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newSlider.push(imageUrl);
          }
        } else {
          newSlider.push(imageUrl);
        }
      }
      updates.slider = newSlider;
    }

    if (hasChanges) {
      await BookModel.findByIdAndUpdate(book._id, updates);
      updated++;
      console.log(`✅ Updated book: ${book._id}`);
    }
  }

  console.log(`✅ Migrated ${updated} books`);
}

/**
 * Migrate Users
 */
async function migrateUsers(UserModel: Model<User>): Promise<void> {
  console.log('\n👤 Migrating Users...');

  const users = await UserModel.find({
    avatar: { $exists: true, $nin: [null, ''] },
  });
  let updated = 0;

  for (const user of users) {
    if (user.avatar && isLocalPath(user.avatar)) {
      const localPath = getLocalFilePath(user.avatar);
      const cloudinaryUrl = await uploadToCloudinary(
        localPath,
        'book-store/avatars',
      );

      if (cloudinaryUrl) {
        await UserModel.findByIdAndUpdate(user._id, { avatar: cloudinaryUrl });
        updated++;
        console.log(`✅ Updated user: ${user.email || user._id}`);
      }
    }
  }

  console.log(`✅ Migrated ${updated} users`);
}

/**
 * Migrate Comments
 */
async function migrateComments(CommentModel: Model<Comment>): Promise<void> {
  console.log('\n💬 Migrating Comments...');

  const comments = await CommentModel.find({
    images: { $exists: true, $ne: [] },
  });
  let updated = 0;

  for (const comment of comments) {
    if (comment.images && Array.isArray(comment.images) && comment.images.length > 0) {
      let hasChanges = false;
      const newImages: string[] = [];

      for (const imageUrl of comment.images) {
        if (isLocalPath(imageUrl)) {
          const localPath = getLocalFilePath(imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(
            localPath,
            'book-store/reviews',
          );
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl);
          }
        } else {
          newImages.push(imageUrl);
        }
      }

      if (hasChanges) {
        await CommentModel.findByIdAndUpdate(comment._id, { images: newImages });
        updated++;
        console.log(`✅ Updated comment: ${comment._id}`);
      }
    }
  }

  console.log(`✅ Migrated ${updated} comments`);
}

/**
 * Main migration function
 */
async function migrateAll(): Promise<void> {
  try {
    console.log('🚀 Starting migration to Cloudinary...');
    console.log(
      '📋 This will upload all local images to Cloudinary and update database URLs',
    );

    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    await connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    const BookModel = connection.model<Book>(Book.name, BookSchema);
    const UserModel = connection.model<User>(User.name, UserSchema);
    const CommentModel = connection.model<Comment>(Comment.name, CommentSchema);

    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    await migrateBooks(BookModel);
    await migrateUsers(UserModel);
    await migrateComments(CommentModel);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

if (require.main === module) {
  migrateAll()
    .then(() => {
      console.log('\n✅ Script execution completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export { migrateAll };

