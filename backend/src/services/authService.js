const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const SALT_ROUNDS = 10;

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUsername = (username) => {
    return /^[a-zA-Z0-9_]+$/.test(username);
};

const registerUser = async ({ name, username, email, password, role }) => {
    if (!name || !username || !email || !password) {
        const error = new Error("Name, username, email and password are required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const finalRole = role ? role.trim().toLowerCase() : "user";

    if (trimmedName.length < 2) {
        const error = new Error("Name must be at least 2 characters long");
        error.statusCode = 400;
        throw error;
    }

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

    if (!["user", "admin"].includes(finalRole)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
    }

    const existingUserQuery = `
        SELECT id, email, username
        FROM users
        WHERE email = $1 OR username = $2
            LIMIT 1
    `;

    const existingUserResult = await pool.query(existingUserQuery, [
        normalizedEmail,
        trimmedUsername,
    ]);

    if (existingUserResult.rows.length > 0) {
        const existingUser = existingUserResult.rows[0];

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

    const insertUserQuery = `
        INSERT INTO users (name, username, email, password, role)
        VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, username, email, role, created_at
    `;

    const insertResult = await pool.query(insertUserQuery, [
        trimmedName,
        trimmedUsername,
        normalizedEmail,
        hashedPassword,
        finalRole,
    ]);

    const user = insertResult.rows[0];

    return {
        id: user.id,
        name: user.name,
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

    let userQuery = "";
    let queryParams = [];

    if (email) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            const error = new Error("Invalid email format");
            error.statusCode = 400;
            throw error;
        }

        userQuery = `
            SELECT id, name, username, email, password, role, created_at
            FROM users
            WHERE email = $1
                LIMIT 1
        `;
        queryParams = [normalizedEmail];
    } else {
        const trimmedUsername = username.trim();

        if (!isValidUsername(trimmedUsername)) {
            const error = new Error("Invalid username format");
            error.statusCode = 400;
            throw error;
        }

        userQuery = `
            SELECT id, name, username, email, password, role, created_at
            FROM users
            WHERE username = $1
                LIMIT 1
        `;
        queryParams = [trimmedUsername];
    }

    const result = await pool.query(userQuery, queryParams);

    if (result.rows.length === 0) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
        },
    };
};

const logoutUser = async (token) => {
    if (!token) {
        const error = new Error("Access token is missing");
        error.statusCode = 401;
        throw error;
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        const error = new Error("Invalid or expired token");
        error.statusCode = 401;
        throw error;
    }

    const expiresAt = new Date(decoded.exp * 1000);

    const insertBlacklistQuery = `
    INSERT INTO token_blacklist (token, expires_at)
    VALUES ($1, $2)
    ON CONFLICT (token) DO NOTHING
  `;

    await pool.query(insertBlacklistQuery, [token, expiresAt]);

    return {
        message: "Logout successful",
    };
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
};