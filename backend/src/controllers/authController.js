const { registerUser, loginUser, logoutUser } = require("../services/authService");

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

        return res.status(200).json({
            message: "Login successful",
            token: data.token,
            user: data.user,
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token is missing",
            });
        }

        const token = authHeader.split(" ")[1];

        const result = await logoutUser(token);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    logout,
};