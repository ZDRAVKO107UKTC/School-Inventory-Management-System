const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Публични маршрути
router.get('/equipment', equipmentController.getEquipment);
router.put('/:id/status', equipmentController.updateStatus);

module.exports = router;