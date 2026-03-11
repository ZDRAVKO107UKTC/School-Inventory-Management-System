const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the POST endpoint
router.post('/login', authController.login);

module.exports = router;