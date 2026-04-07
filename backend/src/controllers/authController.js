const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    loginWithGoogleCode,
    loginWithTelegramAuth,
    buildGoogleAuthUrl,
    buildTelegramAuthUrl,
    requestPasswordReset,
    resetPassword: resetPasswordService
} = require("../services/authService");
const {validationResult} = require('express-validator');
const xss = require('xss');

const parseBoolean = (value, fallback = false) => {
    if (typeof value !== 'string') {
        return fallback;
    }

    switch (value.trim().toLowerCase()) {
        case 'true':
        case '1':
        case 'yes':
        case 'on':
            return true;
        case 'false':
        case '0':
        case 'no':
        case 'off':
            return false;
        default:
            return fallback;
    }
};

const getRefreshTokenCookieOptions = () => {
    const secure = parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production');
    const sameSite = process.env.COOKIE_SAME_SITE || 'strict';

    return {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
};

const getRefreshTokenClearOptions = () => {
    const { httpOnly, secure, sameSite } = getRefreshTokenCookieOptions();
    return { httpOnly, secure, sameSite };
};

const getFrontendCallbackUrl = (callbackPath, params = {}) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    const url = new URL(callbackPath, `${frontendUrl}/`);

    Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
};

const register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const userData = {
            ...req.body,
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

        res.cookie('refreshToken', data.refreshToken, getRefreshTokenCookieOptions());

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
        res.clearCookie('refreshToken', getRefreshTokenClearOptions());

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

const googleCallbackRedirect = async (req, res, next) => {
    try {
        const redirectUrl = getFrontendCallbackUrl('/auth/callback/google', {
            code: typeof req.query.code === 'string' ? req.query.code : '',
            state: typeof req.query.state === 'string' ? req.query.state : '',
            error: typeof req.query.error === 'string' ? req.query.error : '',
            error_description: typeof req.query.error_description === 'string' ? req.query.error_description : '',
        });

        return res.redirect(302, redirectUrl);
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const result = await requestPasswordReset({
            email: req.body.email
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const googleExchange = async (req, res, next) => {
    try {
        const { code } = req.body || {};
        const data = await loginWithGoogleCode(code);

        res.cookie('refreshToken', data.refreshToken, getRefreshTokenCookieOptions());

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

        res.cookie('refreshToken', data.refreshToken, getRefreshTokenCookieOptions());

        return res.status(200).json({
            message: 'Telegram authentication successful',
            accessToken: data.accessToken,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const result = await resetPasswordService(req.body);
        res.clearCookie('refreshToken', getRefreshTokenClearOptions());

        return res.status(200).json(result);
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
    googleCallbackRedirect,
    googleExchange,
    telegramAuthUrl,
    telegramVerify,
    forgotPassword,
    resetPassword,
};
