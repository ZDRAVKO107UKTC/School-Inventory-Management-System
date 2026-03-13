const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Requirement: GET /equipment/{id}
router.get('/:id', equipmentController.getEquipmentDetails);
router.get('/equipment', equipmentController.getEquipment);
router.put('/:id/status', equipmentController.updateStatus);

module.exports = router;