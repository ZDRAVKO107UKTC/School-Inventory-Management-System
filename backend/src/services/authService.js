const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../../models");
const { User, RefreshToken } = db;

const SALT_ROUNDS = 10;
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";

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

const getGoogleOAuthConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        const error = new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.");
        error.statusCode = 500;
        throw error;
    }

    return { clientId, clientSecret, redirectUri };
};

const getTelegramOAuthConfig = () => {
    const botId = process.env.TELEGRAM_BOT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const redirectUri = process.env.TELEGRAM_REDIRECT_URI;

    if (!botId || !botToken || !redirectUri) {
        const error = new Error("Telegram OAuth is not configured. Set TELEGRAM_BOT_ID, TELEGRAM_BOT_TOKEN and TELEGRAM_REDIRECT_URI.");
        error.statusCode = 500;
        throw error;
    }

    return { botId, botToken, redirectUri };
};

const toSafeUsernameBase = (value) => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24);
};

const ensureUniqueUsername = async (seed) => {
    const base = (seed && seed.length >= 3 ? seed : 'google_user').slice(0, 24);
    let candidate = base;
    let suffix = 1;

    // Keep appending a suffix until the username is unique.
    while (await User.findOne({ where: { username: candidate } })) {
        const room = 30 - String(suffix).length - 1;
        candidate = `${base.slice(0, Math.max(3, room))}_${suffix}`;
        suffix += 1;
    }

    return candidate;
};

const exchangeGoogleCode = async (code) => {
    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
    const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.id_token) {
        const error = new Error(payload.error_description || payload.error || 'Failed to exchange Google authorization code');
        error.statusCode = 401;
        throw error;
    }

    return payload.id_token;
};

const buildGoogleAuthUrl = () => {
    const { clientId, redirectUri } = getGoogleOAuthConfig();
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const buildTelegramAuthUrl = () => {
    const { botId, redirectUri } = getTelegramOAuthConfig();
    const origin = new URL(redirectUri).origin;
    const params = new URLSearchParams({
        bot_id: botId,
        origin,
        return_to: redirectUri,
        request_access: 'write',
    });

    return `https://oauth.telegram.org/auth?${params.toString()}`;
};

const validateGoogleIdToken = async (idToken) => {
    const params = new URLSearchParams({ id_token: idToken });
    const response = await fetch(`${GOOGLE_TOKEN_INFO_ENDPOINT}?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(payload.error_description || payload.error || 'Invalid Google ID token');
        error.statusCode = 401;
        throw error;
    }

    const { clientId } = getGoogleOAuthConfig();
    if (payload.aud !== clientId) {
        const error = new Error('Google token audience mismatch');
        error.statusCode = 401;
        throw error;
    }

    if (!payload.email || payload.email_verified !== 'true') {
        const error = new Error('Google account email is not verified');
        error.statusCode = 401;
        throw error;
    }

    return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
    };
};

const findOrCreateGoogleUser = async ({ email, name }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
        where: { email: { [Op.iLike]: normalizedEmail } }
    });

    if (existingUser) {
        return existingUser;
    }

    const usernameBase = toSafeUsernameBase(name || normalizedEmail.split('@')[0]);
    const username = await ensureUniqueUsername(usernameBase);
    const generatedPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

    return User.create({
        username,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'student',
    });
};

const verifyTelegramAuthData = (authData) => {
    const { botToken } = getTelegramOAuthConfig();
    const hash = authData.hash;

    if (!hash) {
        const error = new Error('Telegram auth hash is required');
        error.statusCode = 400;
        throw error;
    }

    const dataToCheck = Object.keys(authData)
        .filter((key) => key !== 'hash' && authData[key] !== undefined && authData[key] !== null && authData[key] !== '')
        .sort()
        .map((key) => `${key}=${authData[key]}`)
        .join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataToCheck)
        .digest('hex');

    const provided = Buffer.from(hash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
        const error = new Error('Invalid Telegram authentication signature');
        error.statusCode = 401;
        throw error;
    }

    const authDate = Number(authData.auth_date || 0);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!authDate || nowSeconds - authDate > 24 * 60 * 60) {
        const error = new Error('Telegram authentication data has expired');
        error.statusCode = 401;
        throw error;
    }
};

const findOrCreateTelegramUser = async (authData) => {
    const telegramId = String(authData.id || '').trim();
    if (!telegramId) {
        const error = new Error('Telegram user id is required');
        error.statusCode = 400;
        throw error;
    }

    const syntheticEmail = `tg_${telegramId}@telegram.local`;
    const existingUser = await User.findOne({
        where: { email: { [Op.iLike]: syntheticEmail } }
    });

    if (existingUser) {
        return existingUser;
    }

    const fullName = [authData.first_name, authData.last_name].filter(Boolean).join('_');
    const usernameSeed = toSafeUsernameBase(authData.username || fullName || `telegram_${telegramId}`);
    const username = await ensureUniqueUsername(usernameSeed);
    const generatedPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

    return User.create({
        username,
        email: syntheticEmail,
        password_hash: passwordHash,
        role: 'student',
    });
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
        whereClause = db.Sequelize.where(
            db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
            normalizedEmail
        );
    } else {
        const normalizedUsername = username.trim().toLowerCase();
        whereClause = db.Sequelize.where(
            db.Sequelize.fn('LOWER', db.Sequelize.col('username')),
            normalizedUsername
        );
    }

    const user = await User.findOne({
        where: whereClause,
        attributes: ['id', 'username', 'email', 'role', 'password_hash', 'created_at']
    });

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
        attributes: ['id', 'user_id', 'token', 'expires_at'],
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role']
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

const loginWithGoogleCode = async (code) => {
    if (!code) {
        const error = new Error('Google authorization code is required');
        error.statusCode = 400;
        throw error;
    }

    const idToken = await exchangeGoogleCode(code);
    const googleProfile = await validateGoogleIdToken(idToken);
    const user = await findOrCreateGoogleUser(googleProfile);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        expires_at: expiresAt,
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

const loginWithTelegramAuth = async (authData) => {
    verifyTelegramAuthData(authData);
    const user = await findOrCreateTelegramUser(authData);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        expires_at: expiresAt,
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
    buildGoogleAuthUrl,
    loginWithGoogleCode,
    buildTelegramAuthUrl,
    loginWithTelegramAuth,
    cleanupExpiredTokens,
};
