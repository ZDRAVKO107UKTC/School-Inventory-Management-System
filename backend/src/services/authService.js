const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../../models");
const { Op } = require("sequelize");
const { User, RefreshToken } = db;

const SALT_ROUNDS = 10;

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUsername = (username) => {
    return /^[a-zA-Z0-9_]+$/.test(username);
};

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

const registerUser = async ({ username, email, password, role }) => {
    if (!username || !email || !password) {
        const error = new Error("Username, email and password are required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const finalRole = role ? role.trim().toLowerCase() : "student";

    if (!isValidUsername(trimmedUsername)) {
        const error = new Error("Username can contain only letters, numbers and underscore");
        error.statusCode = 400;
        throw error;
    }

    if (!isValidEmail(normalizedEmail)) {
        const error = new Error("Invalid email format");
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 8) {
        const error = new Error("Password must be at least 8 characters long");
        error.statusCode = 400;
        throw error;
    }

    if (!["student", "teacher", "admin"].includes(finalRole)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [db.Sequelize.Op.or]: [
                { email: normalizedEmail },
                { username: trimmedUsername }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === normalizedEmail) {
            const error = new Error("Email already exists");
            error.statusCode = 409;
            throw error;
        }
        if (existingUser.username === trimmedUsername) {
            const error = new Error("Username already exists");
            error.statusCode = 409;
            throw error;
        }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        username: trimmedUsername,
        email: normalizedEmail,
        password_hash: hashedPassword,
        role: finalRole,
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
    };
};

const loginUser = async ({ email, username, password }) => {
    if ((!email && !username) || !password) {
        const error = new Error("Email or username and password are required");
        error.statusCode = 400;
        throw error;
    }

    let whereClause = {};

    if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        whereClause.email = { [Op.iLike]: normalizedEmail };
    } else {
        const trimmedUsername = username.trim();
        whereClause.username = { [Op.iLike]:trimmedUsername };
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        expires_at: expiresAt
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
        },
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 401;
        throw error;
    }

    // Find refresh token in database
    const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
        include: [{
            model: User,
            as: 'user'
        }]
    });

    if (!tokenRecord) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    // Check if token is expired
    if (tokenRecord.isExpired()) {
        // Delete expired token
        await tokenRecord.destroy();
        const error = new Error("Refresh token has expired");
        error.statusCode = 401;
        throw error;
    }

    // Generate new access token
    const accessToken = generateAccessToken(tokenRecord.user);

    return {
        accessToken,
        user: {
            id: tokenRecord.user.id,
            username: tokenRecord.user.username,
            email: tokenRecord.user.email,
            role: tokenRecord.user.role,
        }
    };
};

const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 401;
        throw error;
    }

    // Delete the refresh token from database
    const deleted = await RefreshToken.destroy({
        where: { token: refreshToken }
    });

    if (deleted === 0) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    return {
        message: "Logout successful",
    };
};

// Cleanup expired tokens (called by cron job)
const cleanupExpiredTokens = async () => {
    const deleted = await RefreshToken.destroy({
        where: {
            expires_at: {
                [db.Sequelize.Op.lt]: new Date()
            }
        }
    });

    console.log(`Cleaned up ${deleted} expired refresh tokens`);
    return deleted;
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    cleanupExpiredTokens,
};
