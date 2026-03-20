const express = require('express');
const router = express.Router();
const spatialController = require('../controllers/spatialController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public/Common routes (Students, Teachers, Admins)
router.get('/floors', authenticateToken, spatialController.getAllFloors);

// Admin only routes
router.post('/floors', authenticateToken, authorizeRoles('admin'), spatialController.createFloor);
router.put('/floors/:id', authenticateToken, authorizeRoles('admin'), spatialController.updateFloor);
router.delete('/floors/:id', authenticateToken, authorizeRoles('admin'), spatialController.deleteFloor);

router.post('/rooms', authenticateToken, authorizeRoles('admin'), spatialController.createRoom);
router.put('/rooms/:id', authenticateToken, authorizeRoles('admin'), spatialController.updateRoom);
router.delete('/rooms/:id', authenticateToken, authorizeRoles('admin'), spatialController.deleteRoom);

router.post('/assign', authenticateToken, authorizeRoles('admin', 'teacher'), spatialController.assignEquipmentToRoom);

module.exports = router;
