'use strict';

const crypto = require('crypto');
const DEFAULT_MAX_UPLOAD_BYTES = Number.parseInt(process.env.STORAGE_MAX_UPLOAD_BYTES || `${10 * 1024 * 1024}`, 10);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/tiff'
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/ogg'
]);

const sanitizeSegment = (value, fallback) => {
  const sanitized = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._/-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/.]+|[-/.]+$/g, '');

  return sanitized || fallback;
};

const getStorageProvider = () => 'cloudinary';

const isCloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const getStorageStatus = () => ({
  provider: 'cloudinary',
  configured: isCloudinaryConfigured(),
  maxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  defaultFolder: process.env.STORAGE_DEFAULT_FOLDER || 'equipment-media'
});

const resolveUploadSource = async ({ dataBase64, remoteUrl, contentType }) => {
  if (Boolean(dataBase64) === Boolean(remoteUrl)) {
    throw new Error('Provide exactly one of data_base64 or remote_url');
  }

  if (dataBase64) {
    const normalizedValue = String(dataBase64).trim();
    const dataUriMatch = normalizedValue.match(/^data:([^;]+);base64,(.+)$/);
    const effectiveContentType = dataUriMatch?.[1] || contentType || 'application/octet-stream';
    const encodedPayload = dataUriMatch?.[2] || normalizedValue;
    const buffer = Buffer.from(encodedPayload, 'base64');

    return {
      buffer,
      contentType: effectiveContentType,
      sourceType: 'base64'
    };
  }

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote asset (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || contentType || 'application/octet-stream',
    sourceType: 'remote'
  };
};

const ensureUploadWithinLimit = (buffer) => {
  if (buffer.length > DEFAULT_MAX_UPLOAD_BYTES) {
    throw new Error(`Upload exceeds max size of ${DEFAULT_MAX_UPLOAD_BYTES} bytes`);
  }
};

const inferCloudinaryResourceType = (contentType, fileName) => {
  const normalizedContentType = String(contentType || '').toLowerCase();
  const extension = String(fileName || '').split('.').pop()?.toLowerCase();

  if (IMAGE_MIME_TYPES.has(normalizedContentType)) {
    return 'image';
  }

  if (VIDEO_MIME_TYPES.has(normalizedContentType)) {
    return 'video';
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tif', 'tiff'].includes(extension)) {
    return 'image';
  }

  if (['mp4', 'mov', 'webm', 'ogg'].includes(extension)) {
    return 'video';
  }

  return 'raw';
};

const buildStorageObjectName = (folder, fileName) => {
  const safeFolder = sanitizeSegment(folder || process.env.STORAGE_DEFAULT_FOLDER || 'equipment-media', 'equipment-media');
  const safeFileName = sanitizeSegment(String(fileName || `upload-${Date.now()}`).replace(/[\\/]+/g, '-'), `upload-${Date.now()}`);
  return `${safeFolder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
};

const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');

const uploadToCloudinary = async ({ fileName, contentType, dataBase64, remoteUrl, folder }) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFolder = sanitizeSegment(folder || process.env.STORAGE_DEFAULT_FOLDER || 'equipment-media', 'equipment-media');
  const safeFileName = sanitizeSegment(String(fileName || `upload-${Date.now()}`).replace(/[\\/]+/g, '-'), `upload-${Date.now()}`);
  const publicId = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`.replace(/\.[^.]+$/, '');
  const resourceType = inferCloudinaryResourceType(contentType, fileName);

  const signingParams = {
    folder: safeFolder,
    public_id: publicId,
    timestamp
  };

  const signaturePayload = Object.keys(signingParams)
    .sort()
    .map((key) => `${key}=${signingParams[key]}`)
    .join('&');

  const signature = sha1(`${signaturePayload}${process.env.CLOUDINARY_API_SECRET}`);
  const formData = new FormData();
  formData.append('timestamp', String(timestamp));
  formData.append('folder', signingParams.folder);
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);

  if (remoteUrl) {
    formData.append('file', remoteUrl);
  } else {
    formData.append('file', `data:${contentType || 'application/octet-stream'};base64,${dataBase64}`);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || 'Cloudinary upload failed');
  }

  return {
    provider: 'cloudinary',
    url: payload.secure_url || payload.url,
    storagePath: payload.public_id,
    resourceType: payload.resource_type,
    contentType: contentType || null,
    bytes: payload.bytes || null,
    format: payload.format || null,
    uploadedAt: payload.created_at || new Date().toISOString()
  };
};

const uploadMedia = async ({ fileName, contentType, dataBase64, remoteUrl, folder }) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  return uploadToCloudinary({ fileName, contentType, dataBase64, remoteUrl, folder });
};

module.exports = {
  getStorageProvider,
  getStorageStatus,
  isCloudinaryConfigured,
  uploadMedia
};
