const documentService = require('../services/documentService');

const getAllDocuments = async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    
    const docs = await documentService.getAllDocuments(filters);
    return res.status(200).json(docs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const userId = req.user ? req.user.id : null;
    const doc = await documentService.uploadDocument(req.file, req.body, userId);
    
    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await documentService.deleteDocument(id);
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDocuments,
  uploadDocument,
  deleteDocument
};
