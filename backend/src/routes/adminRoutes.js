const express = require("express");
const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

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

router.post(
    "/users",
    authenticateToken,
    authorizeRoles("admin"),
    adminController.createUser
);

router.delete(
    "/users/:id",
    authenticateToken,
    authorizeRoles("admin"),
    adminController.deleteUser
);

router.put(
    "/users/:id/role",
    authenticateToken,
    authorizeRoles("admin"),
    adminController.updateUserRole
);

module.exports = router;
