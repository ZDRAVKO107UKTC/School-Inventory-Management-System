const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const {authenticateToken, authorizeRoles} = require('../middleware/authMiddleware');
const {body} = require('express-validator');

// Validation Rules for Submitting a Request
// This blocks SQL injection by forcing specific data types
const validateSubmitRequest = [
    body('equipment_id')
        .isInt()
        .withMessage('Equipment ID must be a valid integer')
        .toInt(),
    body('quantity')
        .optional()
        .isInt({min: 1})
        .withMessage('Quantity must be at least 1')
        .toInt(),
    body('request_date')
        .isISO8601()
        .withMessage('Valid start date is required (YYYY-MM-DD)'),
    body('due_date')
        .isISO8601()
        .withMessage('Valid due date is required (YYYY-MM-DD)'),
    body('notes')
        .optional()
        .trim()
];

// --- ROUTES ---

// Submit a new request
router.post('/', authenticateToken, validateSubmitRequest, requestController.submitRequest);

// Get current user's requests
router.get('/my', authenticateToken, requestController.getUserRequests);

// BE-016: GET all requests for admin/teacher moderation
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getAdminRequests);
router.get('/requests', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getAdminRequests);

// Condition History
router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);
router.get('/:id/condition-history/', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);

// Approval / Rejection
router.put('/:id/approve', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.approveRequest);
router.put('/:id/reject', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.rejectRequest);

// Returns
router.put('/:id/return', authenticateToken, requestController.returnRequest);

// BE-021: History Tracking
router.get('/history/equipment/:id', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getEquipmentHistory);
router.get('/history/users/:id', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getUserHistory);

// Delete request (owner/admin/teacher)
router.delete('/:id', authenticateToken, requestController.deleteRequest);

module.exports = router;
