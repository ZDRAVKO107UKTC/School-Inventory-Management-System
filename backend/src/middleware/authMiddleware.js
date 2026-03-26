const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user data to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token is missing', 401));
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('🔴 CRITICAL ERROR: JWT_SECRET is not defined in environment');
      return next(new AppError('Internal server error - missing configuration', 500));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid or malformed token', 401));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }

    console.error('[Auth Error]', error.message);
    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: requires one of roles [${allowedRoles.join(', ')}]`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };

