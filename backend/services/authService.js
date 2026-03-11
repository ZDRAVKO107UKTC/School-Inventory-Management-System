// services/authService.js

const logoutUser = (res) => {
    // Премахваме бисквитката с име 'token'
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true само в продукция
        sameSite: 'strict'
    });
};

module.exports = { logoutUser };