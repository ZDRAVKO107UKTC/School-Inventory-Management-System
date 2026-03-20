const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/usage', authenticateToken, authorizeRoles('admin'), reportController.getUsageReport);
router.get('/history', authenticateToken, authorizeRoles('admin'), reportController.getHistoryReport);
router.get('/export', authenticateToken, authorizeRoles('admin'), reportController.exportReport);

// Reset history
router.delete('/history', authenticateToken, authorizeRoles('admin'), reportController.clearHistory);

module.exports = router;