const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Requirement: POST /request (Authenticated)
router.post('/', authenticateToken, requestController.submitRequest);

// BE-015: GET current user requests
router.get('/my', authenticateToken, requestController.getUserRequests);

// BE-020: GET condition history for a request (Admin only)
router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);

// BE-017: PUT /request/{id}/approve (Admin or Teacher)
router.put('/:id/approve', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.approveRequest);

// BE-018: PUT /request/{id}/reject (Admin or Teacher)
router.put('/:id/reject', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.rejectRequest);

// BE-019: PUT /request/{id}/return (Authenticated)
router.put('/:id/return', authenticateToken, requestController.returnRequest);

module.exports = router;
