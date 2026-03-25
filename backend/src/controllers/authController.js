const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    loginWithGoogleCode,
    loginWithTelegramAuth,
    buildGoogleAuthUrl,
    buildTelegramAuthUrl,
} = require("../services/authService");
const {validationResult} = require('express-validator');
const xss = require('xss');

const register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const userData = {
            ...req.body,
            username: typeof req.body.username === 'string' ? xss(req.body.username) : req.body.username
            username: xss(req.body.username || '')
        };

        const user = await registerUser(userData);

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const data = await loginUser(req.body);

        res.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken: data.accessToken,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required",
            });
        }

        const data = await refreshAccessToken(refreshToken);

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: data.accessToken,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required",
            });
        }

        const result = await logoutUser(refreshToken);
        res.clearCookie('refreshToken');

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const googleAuthUrl = async (req, res, next) => {
    try {
        const url = buildGoogleAuthUrl();
        return res.status(200).json({ url });
    } catch (error) {
        next(error);
    }
};

const googleExchange = async (req, res, next) => {
    try {
        const { code } = req.body || {};
        const data = await loginWithGoogleCode(code);

        res.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Google authentication successful',
            accessToken: data.accessToken,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

const telegramAuthUrl = async (req, res, next) => {
    try {
        const url = buildTelegramAuthUrl();
        return res.status(200).json({ url });
    } catch (error) {
        next(error);
    }
};

const telegramVerify = async (req, res, next) => {
    try {
        const data = await loginWithTelegramAuth(req.body || {});

        res.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Telegram authentication successful',
            accessToken: data.accessToken,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    googleAuthUrl,
    googleExchange,
    telegramAuthUrl,
    telegramVerify,
};
