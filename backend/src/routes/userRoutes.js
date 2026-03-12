const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateToken, (req, res) => {
    return res.status(200).json({
        message: "User profile accessed successfully",
        user: req.user,
    });
});

module.exports = router;