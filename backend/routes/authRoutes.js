// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { logoutUser } = require('../services/authService');

// GET /auth/logout
router.get('/auth/logout', (req, res) => {
    try {
        logoutUser(res);
        res.status(200).json({
            success: true,
            message: "Session ended successfully. Access revoked."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error during logout"
        });
    }
});

module.exports = router;