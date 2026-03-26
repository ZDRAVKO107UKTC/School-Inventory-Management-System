/**
 * Input Validators - express-validator schemas
 * Centralized validation rules for all API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

// ============= AUTH VALIDATORS =============
const authValidators = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
  ],
  
  signup: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .escape()
      .withMessage('Username must be 3-50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be 8+ chars, including uppercase, lowercase, and number'),
    body('role')
      .optional()
      .isIn(['user', 'admin', 'staff'])
      .withMessage('Invalid role'),
  ],

  resetPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be 8+ chars, including uppercase, lowercase, and number'),
  ],
};

// ============= EQUIPMENT VALIDATORS =============
const equipmentValidators = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .escape()
      .withMessage('Equipment name must be 2-100 characters'),
    body('type')
      .trim()
      .isIn(['laptop', 'desktop', 'tablet', 'projector', 'camera', 'other'])
      .withMessage('Invalid equipment type'),
    body('serialNumber')
      .trim()
      .escape()
      .optional({ checkFalsy: true })
      .withMessage('Serial number must be valid'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('location')
      .trim()
      .escape()
      .optional({ checkFalsy: true }),
    body('status')
      .isIn(['active', 'inactive', 'damaged', 'maintenance'])
      .optional()
      .withMessage('Invalid status'),
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid equipment ID required'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .escape()
      .optional({ checkFalsy: true })
      .withMessage('Equipment name must be 2-100 characters'),
    body('quantity')
      .isInt({ min: 0 })
      .optional()
      .withMessage('Quantity must be a non-negative integer'),
    body('status')
      .isIn(['active', 'inactive', 'damaged', 'maintenance'])
      .optional()
      .withMessage('Invalid status'),
  ],

  getPaginated: [
    query('page')
      .isInt({ min: 1 })
      .toInt()
      .optional()
      .withMessage('Page must be a positive integer'),
    query('limit')
      .isInt({ min: 1, max: 100 })
      .toInt()
      .optional()
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .trim()
      .escape()
      .optional()
      .withMessage('Search term must be valid'),
    query('status')
      .isIn(['active', 'inactive', 'damaged', 'maintenance'])
      .optional()
      .withMessage('Invalid status filter'),
  ],
};

// ============= REQUEST VALIDATORS =============
const requestValidators = {
  create: [
    body('equipmentId')
      .isInt({ min: 1 })
      .withMessage('Valid equipment ID required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 500 })
      .escape()
      .withMessage('Reason must be 5-500 characters'),
    body('requestDate')
      .isISO8601()
      .withMessage('Valid ISO8601 date required'),
    body('returnDate')
      .isISO8601()
      .optional()
      .custom((val, { req }) => {
        if (val && new Date(val) <= new Date(req.body.requestDate)) {
          throw new Error('Return date must be after request date');
        }
        return true;
      })
      .withMessage('Invalid return date'),
  ],

  approve: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid request ID required'),
    body('notes')
      .trim()
      .escape()
      .optional()
      .isLength({ max: 300 })
      .withMessage('Notes must be under 300 characters'),
  ],

  reject: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid request ID required'),
    body('rejectionReason')
      .trim()
      .isLength({ min: 5, max: 300 })
      .escape()
      .withMessage('Rejection reason must be 5-300 characters'),
  ],
};

// ============= DOCUMENT VALIDATORS =============
const documentValidators = {
  uploadDocument: [
    body('category')
      .isIn(['POLICIES', 'MANUALS', 'FORMS', 'OTHER'])
      .withMessage('Invalid document category'),
    body('title')
      .trim()
      .isLength({ min: 2, max: 100 })
      .escape()
      .withMessage('Document title must be 2-100 characters'),
    body('description')
      .trim()
      .escape()
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be under 500 characters'),
  ],

  deleteDocument: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid document ID required'),
  ],
};

// ============= ADMIN VALIDATORS =============
const adminValidators = {
  updateUser: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid user ID required'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .escape()
      .optional()
      .withMessage('Username must be 3-50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .optional()
      .withMessage('Valid email required'),
    body('role')
      .isIn(['user', 'admin', 'staff'])
      .optional()
      .withMessage('Invalid role'),
  ],

  createUser: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .escape()
      .withMessage('Username must be 3-50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be 8+ chars, including uppercase, lowercase, and number'),
    body('role')
      .isIn(['user', 'admin', 'staff'])
      .withMessage('Invalid role'),
  ],
};

// ============= SPATIAL VALIDATORS =============
const spatialValidators = {
  updateLocation: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid equipment ID required'),
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .toFloat()
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .toFloat()
      .withMessage('Longitude must be between -180 and 180'),
    body('buildingName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .escape()
      .optional()
      .withMessage('Building name must be 1-100 characters'),
    body('roomNumber')
      .trim()
      .isLength({ max: 20 })
      .escape()
      .optional()
      .withMessage('Room number must be under 20 characters'),
  ],
};

// ============= VALIDATION MIDDLEWARE =============
/**
 * Middleware to check for validation errors
 * Use after all validators in route chains
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
};

module.exports = {
  authValidators,
  equipmentValidators,
  requestValidators,
  documentValidators,
  adminValidators,
  spatialValidators,
  handleValidationErrors,
  validationResult,
};
