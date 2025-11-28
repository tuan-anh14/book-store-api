import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { connect, connection, Model } from 'mongoose';
import { Book, BookDocument, BookSchema } from '../book/schemas/book.schema';
import { User, UserDocument, UserSchema } from '../users/schemas/user.schema';
import { Comment, CommentDocument, CommentSchema } from '../comment/schemas/comment.schema';
import {
  SupportRequest,
  SupportRequestDocument,
  SupportRequestSchema,
} from '../support-request/schemas/support-request.schema';

dotenv.config();

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  MONGO_URL,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary credentials in environment variables.');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

type FolderType = 'book' | 'avatar' | 'comment' | 'support' | 'admin';

const CLOUDINARY_FOLDERS: Record<FolderType, string> = {
  book: 'book-store/books',
  avatar: 'book-store/avatars',
  comment: 'book-store/reviews',
  support: 'book-store/admin',
  admin: 'book-store/admin',
};

interface EntitySummary {
  entity: string;
  processed: number;
  updated: number;
  uploaded: number;
}

interface ArrayMigrationResult {
  values: string[];
  changed: boolean;
  uploads: number;
}

interface LocalFileRecord {
  absolutePath: string;
  relativePath: string;
  folder: FolderType;
}

interface MigrationReport {
  totalLocalFiles: number;
  uploadedFromDb: number;
  uploadedOrphans: number;
  remainingOrphans: { path: string; url: string | null }[];
}

const LOCAL_HOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

const ensureDecoded = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const stripQueryAndHash = (value: string): string => {
  return value.split('?')[0].split('#')[0];
};

const stripOrigin = (value: string): string => {
  if (!value.startsWith('http')) {
    return value;
  }
  try {
    const parsed = new URL(value);
    return parsed.pathname || '';
  } catch {
    return value;
  }
};

const extractFileName = (rawUrl: string): string => {
  const sanitized = ensureDecoded(stripQueryAndHash(rawUrl.trim()));
  const normalized = sanitized.replace(LOCAL_HOST_REGEX, '').replace(/^.*[\\/]/, '');
  return normalized;
};

const normalizeRelativePath = (rawUrl: string): string | null => {
  if (!rawUrl) {
    return null;
  }
  let sanitized = ensureDecoded(stripQueryAndHash(rawUrl.trim()));
  sanitized = sanitized.replace(LOCAL_HOST_REGEX, '');
  sanitized = stripOrigin(sanitized);
  sanitized = sanitized.replace(/^file:\/\//i, '');
  sanitized = sanitized.replace(/^\/+/, '').replace(/\\/g, '/');

  if (!sanitized) {
    return null;
  }

  if (sanitized.startsWith('public/')) {
    return sanitized;
  }

  if (sanitized.startsWith('images/')) {
    return `public/${sanitized}`;
  }

  const folderName = sanitized.split('/')[0];
  if (['avatar', 'book', 'comment', 'support'].includes(folderName)) {
    return `public/images/${sanitized}`;
  }

  if (sanitized.startsWith('uploads/')) {
    return `public/${sanitized}`;
  }

  return null;
};

const filesByName = new Map<string, LocalFileRecord[]>();
let localFilesCache: LocalFileRecord[] = [];

const ensureLocalFilesLoaded = (): void => {
  if (localFilesCache.length > 0) {
    return;
  }
  localFilesCache = [];
  filesByName.clear();
  walkDirectory(path.join(process.cwd(), 'public', 'images'), localFilesCache);
  for (const record of localFilesCache) {
    const name = path.basename(record.relativePath);
    if (!filesByName.has(name)) {
      filesByName.set(name, []);
    }
    filesByName.get(name)?.push(record);
  }
};

const resolveLocalFilePath = (url: string, preferredFolder?: FolderType): string | null => {
  ensureLocalFilesLoaded();
  const relativePath = normalizeRelativePath(url);
  if (relativePath) {
    const absolutePath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  const fallbackName = extractFileName(url);
  if (!fallbackName) {
    return null;
  }
  const matches = filesByName.get(fallbackName);
  if (!matches || matches.length === 0) {
    return null;
  }

  if (preferredFolder) {
    const folderMatch = matches.find((record) => record.folder === preferredFolder);
    if (folderMatch) {
      return folderMatch.absolutePath;
    }
  }

  return matches[0].absolutePath;
};

const isCloudinaryUrl = (url: string): boolean => {
  return typeof url === 'string' && /res\.cloudinary\.com/i.test(url);
};

const uploadFileToCloudinary = async (
  filePath: string,
  folder: FolderType,
  originalValue: string,
): Promise<string | null> => {
  const normalizedFolder = CLOUDINARY_FOLDERS[folder] || CLOUDINARY_FOLDERS.admin;
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found for ${originalValue}: ${filePath}`);
      return null;
    }

    console.log(`📤 Uploading ${filePath} → ${normalizedFolder}`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: normalizedFolder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error: any) {
    console.error(`❌ Error uploading ${originalValue}:`, error?.message || error);
    return null;
  }
};

const processedFiles = new Set<string>();
const uploadedFileMap = new Map<string, string | null>();

const markFileUploaded = (absolutePath: string, secureUrl: string): void => {
  const relativePath = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
  processedFiles.add(relativePath);
  uploadedFileMap.set(relativePath, secureUrl);
};

const migrateSingleImage = async (
  value: string | undefined | null,
  folder: FolderType,
): Promise<{ value: string | undefined | null; changed: boolean; uploaded: number }> => {
  if (!value || typeof value !== 'string' || isCloudinaryUrl(value)) {
    return { value, changed: false, uploaded: 0 };
  }

  const localPath = resolveLocalFilePath(value);
  if (!localPath) {
    return { value, changed: false, uploaded: 0 };
  }

  const uploadedUrl = await uploadFileToCloudinary(localPath, folder, value);
  if (!uploadedUrl) {
    return { value, changed: false, uploaded: 0 };
  }

  markFileUploaded(localPath, uploadedUrl);
  return { value: uploadedUrl, changed: true, uploaded: 1 };
};

const migrateImageArray = async (
  values: string[] | undefined,
  folder: FolderType,
): Promise<ArrayMigrationResult> => {
  if (!values || values.length === 0) {
    return { values: values || [], changed: false, uploads: 0 };
  }

  const migrated: string[] = [];
  let changed = false;
  let uploads = 0;

  for (const value of values) {
    const { value: newValue, changed: isChanged, uploaded } = await migrateSingleImage(
      value,
      folder,
    );
    migrated.push((newValue as string) ?? value);
    if (isChanged) {
      changed = true;
    }
    uploads += uploaded;
  }

  return { values: migrated, changed, uploads };
};

const resolveFolderFromRelativePath = (relativePath: string): FolderType => {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const imagesIndex = parts.indexOf('images');
  if (imagesIndex !== -1 && parts.length > imagesIndex + 1) {
    const folder = parts[imagesIndex + 1] as FolderType;
    if (['book', 'avatar', 'comment', 'support'].includes(folder)) {
      return folder;
    }
  }
  return 'admin';
};

function walkDirectory(dir: string, accumulator: LocalFileRecord[]): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, accumulator);
    } else {
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      const folder = resolveFolderFromRelativePath(relativePath);
      accumulator.push({
        absolutePath: fullPath,
        relativePath,
        folder,
      });
    }
  }
}

const getAllLocalImages = (): LocalFileRecord[] => {
  ensureLocalFilesLoaded();
  return [...localFilesCache];
};

const uploadOrphanFiles = async (localFiles: LocalFileRecord[]): Promise<number> => {
  let uploaded = 0;
  const orphanFiles = localFiles.filter((file) => !processedFiles.has(file.relativePath));
  if (orphanFiles.length === 0) {
    console.log('\n🧹 No orphan files found in public/images');
    return 0;
  }

  console.log(`\n🧹 Uploading ${orphanFiles.length} orphan files from public/images ...`);
  for (const file of orphanFiles) {
    const secureUrl = await uploadFileToCloudinary(file.absolutePath, file.folder, file.relativePath);
    if (secureUrl) {
      uploaded++;
      markFileUploaded(file.absolutePath, secureUrl);
    } else {
      uploadedFileMap.set(file.relativePath, null);
    }
  }

  return uploaded;
};

const writeMigrationReport = (
  localFiles: LocalFileRecord[],
  uploadedOrphans: number,
): void => {
  const report: MigrationReport = {
    totalLocalFiles: localFiles.length,
    uploadedFromDb: processedFiles.size - uploadedOrphans,
    uploadedOrphans,
    remainingOrphans: localFiles
      .filter((file) => !processedFiles.has(file.relativePath))
      .map((file) => ({
        path: file.relativePath,
        url: uploadedFileMap.get(file.relativePath) ?? null,
      })),
  };

  const outputDir = path.join(process.cwd(), 'dist-scripts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'cloudinary-migration-report.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  console.log(`\n📝 Migration report saved to dist-scripts/cloudinary-migration-report.json`);
};

const migrateBooks = async (BookModel: Model<BookDocument>): Promise<EntitySummary> => {
  console.log('\n📚 Migrating Books...');
  const books = await BookModel.find({});
  let updated = 0;
  let uploads = 0;

  for (const book of books) {
    const updates: Partial<Book> = {};
    let hasChanges = false;

    const thumbnailResult = await migrateSingleImage(book.thumbnail, 'book');
    if (thumbnailResult.changed) {
      updates.thumbnail = thumbnailResult.value as string;
      uploads += thumbnailResult.uploaded;
      hasChanges = true;
    }

    if (Array.isArray(book.slider) && book.slider.length > 0) {
      const sliderResult = await migrateImageArray(book.slider, 'book');
      if (sliderResult.changed) {
        updates.slider = sliderResult.values;
        uploads += sliderResult.uploads;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await BookModel.updateOne({ _id: book._id }, { $set: updates });
      updated++;
    }
  }

  console.log(`✅ Books updated: ${updated}, files uploaded: ${uploads}`);
  return { entity: 'Books', processed: books.length, updated, uploaded: uploads };
};

const migrateUsers = async (UserModel: Model<UserDocument>): Promise<EntitySummary> => {
  console.log('\n👤 Migrating Users...');
  const users = await UserModel.find({
    avatar: { $exists: true, $nin: [null, ''] },
  });
  let updated = 0;
  let uploads = 0;

  for (const user of users) {
    const avatarResult = await migrateSingleImage(user.avatar, 'avatar');
    if (avatarResult.changed) {
      await UserModel.updateOne({ _id: user._id }, { $set: { avatar: avatarResult.value } });
      updated++;
      uploads += avatarResult.uploaded;
    }
  }

  console.log(`✅ Users updated: ${updated}, files uploaded: ${uploads}`);
  return { entity: 'Users', processed: users.length, updated, uploaded: uploads };
};

const migrateComments = async (CommentModel: Model<CommentDocument>): Promise<EntitySummary> => {
  console.log('\n💬 Migrating Comments...');
  const comments = await CommentModel.find({
    images: { $exists: true, $ne: [] },
  });
  let updated = 0;
  let uploads = 0;

  for (const comment of comments) {
    const imagesResult = await migrateImageArray(comment.images, 'comment');
    if (imagesResult.changed) {
      await CommentModel.updateOne({ _id: comment._id }, { $set: { images: imagesResult.values } });
      updated++;
      uploads += imagesResult.uploads;
    }
  }

  console.log(`✅ Comments updated: ${updated}, files uploaded: ${uploads}`);
  return { entity: 'Comments', processed: comments.length, updated, uploaded: uploads };
};

const migrateSupportRequests = async (
  SupportModel: Model<SupportRequestDocument>,
): Promise<EntitySummary> => {
  console.log('\n🛠️  Migrating Support Requests...');
  const requests = await SupportModel.find({
    $or: [
      { file_list: { $exists: true, $ne: [] } },
      { adminReplyImages: { $exists: true, $ne: [] } },
    ],
  });

  let updated = 0;
  let uploads = 0;

  for (const request of requests) {
    const updates: Partial<SupportRequest> = {};
    let hasChanges = false;

    const userFilesResult = await migrateImageArray(request.file_list, 'support');
    if (userFilesResult.changed) {
      updates.file_list = userFilesResult.values;
      uploads += userFilesResult.uploads;
      hasChanges = true;
    }

    const adminFilesResult = await migrateImageArray(request.adminReplyImages, 'support');
    if (adminFilesResult.changed) {
      updates.adminReplyImages = adminFilesResult.values;
      uploads += adminFilesResult.uploads;
      hasChanges = true;
    }

    if (hasChanges) {
      await SupportModel.updateOne({ _id: request._id }, { $set: updates });
      updated++;
    }
  }

  console.log(`✅ Support requests updated: ${updated}, files uploaded: ${uploads}`);
  return { entity: 'Support Requests', processed: requests.length, updated, uploaded: uploads };
};

const printSummary = (results: EntitySummary[]): void => {
  console.log('\n📊 Migration Summary');
  console.table(
    results.map((item) => ({
      Entity: item.entity,
      Processed: item.processed,
      Updated: item.updated,
      Uploaded: item.uploaded,
    })),
  );
};

const migrateAll = async (): Promise<void> => {
  try {
    console.log('🚀 Starting migration to Cloudinary...');
    if (!MONGO_URL) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    await connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');

    const BookModel = connection.model<BookDocument>(Book.name, BookSchema);
    const UserModel = connection.model<UserDocument>(User.name, UserSchema);
    const CommentModel = connection.model<CommentDocument>(Comment.name, CommentSchema);
    const SupportModel = connection.model<SupportRequestDocument>(
      SupportRequest.name,
      SupportRequestSchema,
    );

    const localFiles = getAllLocalImages();
    console.log(`📁 Detected ${localFiles.length} files under public/images`);

    const results = [];
    results.push(await migrateBooks(BookModel));
    results.push(await migrateUsers(UserModel));
    results.push(await migrateComments(CommentModel));
    results.push(await migrateSupportRequests(SupportModel));

    const orphanUploads = await uploadOrphanFiles(localFiles);
    printSummary(results);
    writeMigrationReport(localFiles, orphanUploads);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.close();
    console.log('✅ MongoDB connection closed');
  }
};

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

