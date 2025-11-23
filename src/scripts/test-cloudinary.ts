import * as dotenv from 'dotenv';
import * as cloudinary from 'cloudinary';

dotenv.config();

/**
 * Test Cloudinary configuration and connection
 * @param cleanup - If true, delete test image after upload (default: false)
 */
async function testCloudinary(cleanup: boolean = false): Promise<void> {
  console.log('🔍 Testing Cloudinary configuration...');

  // Check environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('📋 Environment variables:');
  console.log(
    `  CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Missing'}`,
  );
  console.log(
    `  CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`,
  );
  console.log(
    `  CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'}`,
  );

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('\n❌ Missing Cloudinary environment variables!');
    console.log('💡 Please set the following in your .env file:');
    console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('   CLOUDINARY_API_KEY=your-api-key');
    console.log('   CLOUDINARY_API_SECRET=your-api-secret');
    return;
  }

  cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    console.log('\n🔗 Testing Cloudinary API connection...');
    const result = await cloudinary.v2.api.ping();
    console.log('✅ Cloudinary API connection successful!');
    console.log('📊 API Status:', result);

    console.log('\n📤 Testing image upload...');
    const uploadResult = await cloudinary.v2.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      {
        folder: 'book-store/test',
        resource_type: 'image',
      },
    );

    console.log('✅ Test upload successful!');
    console.log('🔗 Upload URL:', uploadResult.secure_url);
    console.log('🆔 Public ID:', uploadResult.public_id);
    console.log('\n💡 Image is available at the URL above. You can verify it in your browser.');

    if (cleanup) {
      console.log('\n🗑️ Cleaning up test image...');
      await cloudinary.v2.uploader.destroy(uploadResult.public_id);
      console.log('✅ Test image deleted successfully!');
    } else {
      console.log('\n💡 Test image kept for verification. Use --cleanup flag to delete it.');
    }
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    console.error('💡 Please check your Cloudinary credentials and internet connection.');
    throw error;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cleanup = args.includes('--cleanup') || args.includes('-c');
  
  testCloudinary(cleanup)
    .then(() => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testCloudinary };

