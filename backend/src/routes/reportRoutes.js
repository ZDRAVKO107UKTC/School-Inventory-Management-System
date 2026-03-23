const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/usage', authenticateToken, authorizeRoles('admin'), reportController.getUsageReport);
router.get('/history', authenticateToken, authorizeRoles('admin'), reportController.getHistoryReport);
router.get('/export', authenticateToken, authorizeRoles('admin'), reportController.exportReport);
router.get('/notifications/summary', authenticateToken, authorizeRoles('admin'), reportController.getNotificationSummary);
router.post('/notifications/run', authenticateToken, authorizeRoles('admin'), reportController.runNotificationCycle);

// Reset history
router.delete('/history', authenticateToken, authorizeRoles('admin'), reportController.clearHistory);

module.exports = router;
