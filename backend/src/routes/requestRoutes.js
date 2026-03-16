const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Requirement: POST /request (Authenticated)
router.post('/', authenticateToken, requestController.submitRequest);

// BE-015: GET current user requests
router.get('/my', authenticateToken, requestController.getUserRequests);

module.exports = router;