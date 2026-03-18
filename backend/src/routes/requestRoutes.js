const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, requestController.submitRequest);
router.get('/my', authenticateToken, requestController.getUserRequests);
router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);
router.get('/:id/condition-history/', authenticateToken, authorizeRoles('admin'), requestController.getRequestConditionHistory);
router.put('/:id/approve', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.approveRequest);
router.put('/:id/reject', authenticateToken, authorizeRoles('admin', 'teacher'), requestController.rejectRequest);
router.put('/:id/return', authenticateToken, requestController.returnRequest);

module.exports = router;
