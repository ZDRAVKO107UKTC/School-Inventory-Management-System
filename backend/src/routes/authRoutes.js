const express = require("express");
const {register, login, refresh, logout} = require("../controllers/authController");
const {body} = require('express-validator');

const router = express.Router();

// Validation for Registration
const validateRegister = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role')
        .optional()
        .trim()
        .isIn(['student', 'teacher', 'admin'])
        .withMessage('Role must be student, teacher, or admin')
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

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
