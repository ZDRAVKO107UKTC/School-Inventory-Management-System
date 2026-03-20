const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const {authenticateToken, authorizeRoles} = require('../middleware/authMiddleware');

router.post('/', authenticateToken, requestController.submitRequest);
router.get('/my', authenticateToken, requestController.getUserRequests);

// BE-016: GET all requests for admin/teacher moderation
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getAdminRequests);

router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);
router.get('/:id/condition-history/', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);
router.put('/:id/approve', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.approveRequest);
router.put('/:id/reject', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.rejectRequest);
router.put('/:id/return', authenticateToken, requestController.returnRequest);

//BE-021
router.get('/history/equipment/:id', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getEquipmentHistory);

router.get('/history/users/:id',authenticateToken, authorizeRoles('admin', 'teacher'), requestController.getUserHistory);

// Delete request (owner/admin/teacher)
router.delete('/:id', authenticateToken, requestController.deleteRequest);

module.exports = router;
