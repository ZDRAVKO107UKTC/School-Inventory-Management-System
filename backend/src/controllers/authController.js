const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} = require("../services/authService");

const register = async (req, res, next) => {
    try {
        const user = await registerUser(req.body);

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const data = await loginUser(req.body);

        // Set refresh token as httpOnly cookie for security
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
        // Get refresh token from cookie or request body
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
        // Get refresh token from cookie or request body
        const refreshToken = req.cookies.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required",
            });
        }

        const result = await logoutUser(refreshToken);

        // Clear the refresh token cookie
        res.clearCookie('refreshToken');

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
};
