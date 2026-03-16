const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Публични маршрути
router.get('/equipment', equipmentController.getEquipment);
router.get('/:id', equipmentController.getEquipmentDetails);

// Admin-only маршрути
router.post(
    '/equipment', 
    authenticateToken, 
    authorizeRoles('admin'), 
    equipmentController.createEquipment
);

// BE-011: Обновяване на техника
router.put(
    '/:id', 
    authenticateToken, 
    authorizeRoles('admin'), 
    equipmentController.updateEquipment
);

module.exports = router;