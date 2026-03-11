const authService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Call the service layer
        const user = await authService.loginUser(email, password);

        res.status(200).json({
            message: "Login successful",
            user
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

module.exports = { login };