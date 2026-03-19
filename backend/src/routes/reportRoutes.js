const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/usage', authenticateToken, authorizeRoles('admin'), reportController.getUsageReport);
router.get('/history', authenticateToken, authorizeRoles('admin'), reportController.getHistoryReport);

// BE-024: Export
router.get('/export', authenticateToken, authorizeRoles('admin'), reportController.exportReport);

module.exports = router;