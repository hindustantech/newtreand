import { v2 as cloudinary } from 'cloudinary';

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET must be set in .env.local');
  }
  return { cloudName, apiKey, apiSecret };
}

export function getCloudinary() {
  const { cloudName, apiKey, apiSecret } = getConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

export async function uploadArtwork(buffer, publicId) {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'satrang/artwork',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: { width: 512, height: 512, crop: 'limit' },
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteArtwork(publicId) {
  const cloudinary = getCloudinary();
  return cloudinary.uploader.destroy(publicId);
}

export function artworkPublicId(slug) {
  return `satrang/artwork/${slug}`;
}
