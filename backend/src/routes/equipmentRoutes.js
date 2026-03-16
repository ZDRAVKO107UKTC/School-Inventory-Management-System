const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Публични маршрути
router.post('/', authenticateToken, authorizeRoles("admin"), equipmentController.createEquipment);
router.get('/', equipmentController.getEquipment);

// ДИНАМИЧНИ
router.get('/:id', equipmentController.getEquipmentDetails);
router.put('/:id/status', authenticateToken, equipmentController.updateStatus);
router.delete('/:id', authenticateToken, authorizeRoles("admin"), equipmentController.deleteEquipment);

module.exports = router;