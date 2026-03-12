const express = require("express");
const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        return res.status(200).json({
            message: "Welcome to the admin dashboard",
            user: req.user,
        });
    }
);

router.delete(
    "/users/:id",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        return res.status(200).json({
            message: `Admin is allowed to delete user with id ${req.params.id}`,
        });
    }
);

module.exports = router;