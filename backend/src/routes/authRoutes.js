const express = require("express");
const {
    register,
    login,
    refresh,
    logout,
    googleAuthUrl,
    googleExchange,
    telegramAuthUrl,
    telegramVerify,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");
const { body } = require('express-validator');

const router = express.Router();
const VALID_ROLES = ['student', 'teacher', 'admin'];

// Validation for Registration
const validateRegister = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role')
        .optional({ checkFalsy: true })
        .trim()
        .toLowerCase()
        .isIn(VALID_ROLES)
        .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`)
];

// Validation for Login
const validateLogin = [
    body('email')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Enter a valid email address')
        .normalizeEmail(),
    body('username')
        .optional({ checkFalsy: true })
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body().custom(({ email, username }) => {
        if (!email && !username) {
            throw new Error('Email or username is required');
        }
        return true;
    })
];

const validateForgotPassword = [
    body('email')
        .isEmail()
        .withMessage('Enter a valid email address')
        .normalizeEmail()
];

const validateResetPassword = [
    body('token')
        .trim()
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
];

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/logout", logout);
router.get("/google/url", googleAuthUrl);
router.post("/google/exchange", googleExchange);
router.get("/telegram/url", telegramAuthUrl);
router.post("/telegram/verify", telegramVerify);

module.exports = router;