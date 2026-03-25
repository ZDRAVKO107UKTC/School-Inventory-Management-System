const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const xss = require('xss');

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validateGoogleSheetsExport = [
    body('report_type')
        .notEmpty()
        .withMessage('report_type is required')
        .trim()
        .isIn(['usage', 'history'])
        .withMessage('report_type must be usage or history'),
    body('spreadsheet_id')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 128 })
        .withMessage('spreadsheet_id is too long'),
    body('spreadsheet_title')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 150 })
        .withMessage('spreadsheet_title is too long')
        .customSanitizer((value) => xss(value)),
    body('sheet_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('sheet_name is too long')
        .customSanitizer((value) => xss(value)),
    body('write_mode')
        .optional({ nullable: true })
        .trim()
        .isIn(['replace', 'append'])
        .withMessage('write_mode must be replace or append'),
    body('startDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('startDate must be a valid ISO date'),
    body('endDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('endDate must be a valid ISO date'),
    body('status')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 50 })
        .withMessage('status is too long'),
    body('equipment_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('equipment_id must be a positive integer')
        .toInt()
];

router.get('/usage', authenticateToken, authorizeRoles('admin'), reportController.getUsageReport);
router.get('/history', authenticateToken, authorizeRoles('admin'), reportController.getHistoryReport);
router.get('/export', authenticateToken, authorizeRoles('admin'), reportController.exportReport);
router.get('/integrations/status', authenticateToken, authorizeRoles('admin'), reportController.getIntegrationStatus);
router.post('/export/google-sheets', authenticateToken, authorizeRoles('admin'), validateGoogleSheetsExport, handleValidation, reportController.exportReportToGoogleSheets);
router.get('/notifications/summary', authenticateToken, authorizeRoles('admin'), reportController.getNotificationSummary);
router.post('/notifications/run', authenticateToken, authorizeRoles('admin'), reportController.runNotificationCycle);

// Reset history
router.delete('/history', authenticateToken, authorizeRoles('admin'), reportController.clearHistory);

module.exports = router;
