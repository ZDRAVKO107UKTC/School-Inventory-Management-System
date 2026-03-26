const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, documentController.getAllDocuments);
router.post('/upload', authenticateToken, authorizeRoles('admin', 'teacher'), upload.single('file'), documentController.uploadDocument);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), documentController.deleteDocument);

module.exports = router;
