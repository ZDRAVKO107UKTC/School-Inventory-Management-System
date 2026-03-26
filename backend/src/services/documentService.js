const { Document } = require('../../models');
const { uploadStream } = require('../utils/cloudinaryClient');
const fs = require('fs');
const path = require('path');

const getAllDocuments = async (filters = {}) => {
  try {
    const where = {};
    if (filters.category) where.category = filters.category;
    
    return await Document.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    console.error('Error in getAllDocuments:', error);
    throw error;
  }
};

const uploadDocument = async (file, data, userId) => {
  try {
    const filename = data.name || file.originalname;
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-z0-9.]/gi, '_')}`;
    
    // Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadStream(file.buffer, {
        folder: 'sims/global_documents',
        resource_type: 'auto',
        public_id: safeFilename.replace(/\.[^/.]+$/, "")
      });
    } catch (err) {
      console.warn('Cloudinary upload failed for global document. Falling back to local storage.');
      
      const uploadDir = path.join(__dirname, '../../public/uploads/global_documents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(filePath, file.buffer);
      
      // Gateway proxies /api/admin to admin-service (port 5003). 
      // admin-service serves /uploads from backend/public/uploads.
      uploadResult = {
        secure_url: `/uploads/global_documents/${safeFilename}`,
        format: safeFilename.split('.').pop() || 'pdf',
        resource_type: 'auto',
        bytes: file.size || 102400
      };
    }

    // Save to DB
    const newDoc = await Document.create({
      name: filename,
      category: data.category || 'General',
      url: uploadResult.secure_url,
      format: uploadResult.format || (file.mimetype ? file.mimetype.split('/')[1] : 'unknown'),
      size: `${Math.round((uploadResult.bytes || file.size) / 1024)} KB`,
      uploaded_by: userId
    });

    return newDoc;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
};

const deleteDocument = async (id) => {
  try {
    const doc = await Document.findByPk(id);
    if (!doc) throw new Error('Document not found');
    
    await doc.destroy();
    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
};

module.exports = {
  getAllDocuments,
  uploadDocument,
  deleteDocument
};
