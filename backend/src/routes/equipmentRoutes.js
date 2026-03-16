const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Публични маршрути
router.post('/', authenticateToken, authorizeRoles("admin"), equipmentController.createEquipment);
router.get('/', equipmentController.getEquipment);
router.get('/my-requests', authenticateToken, equipmentController.getMyRequests);
router.get('/manager/requests', authenticateToken, authorizeRoles("admin"), equipmentController.getAdminRequests);
router.post('/requests', authenticateToken, equipmentController.submitRequest);

// ДИНАМИЧНИ
router.get('/:id', equipmentController.getEquipmentDetails);
router.put('/:id/status', authenticateToken, equipmentController.updateStatus);
router.delete('/:id', authenticateToken, authorizeRoles("admin"), equipmentController.deleteEquipment);

module.exports = router;