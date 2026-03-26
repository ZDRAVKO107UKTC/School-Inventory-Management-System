const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret'
});

/**
 * Upload a buffer directly to Cloudinary via upload_stream
 * @param {Buffer} buffer - The file buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadStream
};
