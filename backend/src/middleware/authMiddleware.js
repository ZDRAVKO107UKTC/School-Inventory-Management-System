const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token is missing",
            });
        }

        const token = authHeader.split(" ")[1];

        const blacklistQuery = `
      SELECT id
      FROM token_blacklist
      WHERE token = $1
      LIMIT 1
    `;

        const blacklistResult = await pool.query(blacklistQuery, [token]);

        if (blacklistResult.rows.length > 0) {
            return res.status(401).json({
                message: "Token has been invalidated",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: insufficient permissions",
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
};