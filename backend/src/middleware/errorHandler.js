const AppError = require('../utils/AppError');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized responses
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, {
        method: req.method,
        path: req.path,
        statusCode: err.statusCode || 500,
        message: err.message,
        isOperational: err.isOperational,
    });

    // Handle operational errors (expected failures)
    if (err.isOperational) {
        return res.status(err.statusCode || 500).json(err.toJSON());
    }

    // Database constraint violations
    if (err.code === '23505') {
        const constraint = err.constraint || 'unique';
        const field = constraint.includes('email') ? 'email' : 'username';
        const operationalErr = new AppError(
            `${field} already exists`,
            409
        );
        return res.status(409).json(operationalErr.toJSON());
    }

    // Foreign key violations
    if (err.code === '23503') {
        const operationalErr = new AppError(
            'Referenced record not found',
            400
        );
        return res.status(400).json(operationalErr.toJSON());
    }

    // Not null violations
    if (err.code === '23502') {
        const operationalErr = new AppError(
            'Missing required field',
            400
        );
        return res.status(400).json(operationalErr.toJSON());
    }

    // JWT token errors
    if (err.name === 'JsonWebTokenError') {
        const operationalErr = new AppError(
            'Invalid or expired token',
            401
        );
        return res.status(401).json(operationalErr.toJSON());
    }

    // Validation errors from express-validator (if not caught by middleware)
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: err.array(),
        });
    }

    // Unknown/programming errors - don't expose details
    console.error('[UNEXPECTED ERROR]', {
        name: err.name,
        message: err.message,
        stack: err.stack,
    });

    const statusCode = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    return res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
    });
};

module.exports = errorHandler;