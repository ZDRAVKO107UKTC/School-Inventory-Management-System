const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access token is missing" });
        }

        const token = authHeader.split(" ")[1];

        // ДЕБЪГ: Проверяваме дали секретът въобще съществува в този файл
        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL ERROR: JWT_SECRET is undefined in authMiddleware!");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        // ДЕБЪГ: Тук ще видим истинската причина в терминала на VS Code
        console.error("JWT Verify Error Detail:", error.message);
        
        return res.status(401).json({
            message: "Invalid or expired token",
            error_detail: error.message // Временно го връщаме и в JSON, за да го видиш в Postman
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: insufficient permissions" });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };