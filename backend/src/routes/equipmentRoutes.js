const express = require('express');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_CONDITIONS = ['new', 'good', 'fair', 'damaged'];
const VALID_STATUSES = ['available', 'checked_out', 'under_repair', 'retired'];
const EDITABLE_FIELDS = ['name', 'type', 'condition', 'quantity', 'status', 'serial_number', 'location', 'photo_url', 'room_id'];
const hasField = (req, field) => Object.prototype.hasOwnProperty.call(req.body || {}, field);
const sanitizeText = (value) => (typeof value === 'string' ? xss(value.trim()) : value);

const positiveIntegerOrNullField = (field, label) => body(field)
    .custom((value, { req }) => {
        if (!hasField(req, field) || value === null || value === '') {
            return true;
        }

        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1) {
            throw new Error(`${label} must be a positive integer`);
        }

        return true;
    })
    .customSanitizer((value) => {
        if (value === null || value === '' || value === undefined) {
            return null;
        }

        return Number(value);
    });

const createEquipmentValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long')
        .customSanitizer(sanitizeText),
    body('type')
        .trim()
        .notEmpty().withMessage('Type is required')
        .isLength({ max: 100 }).withMessage('Type is too long')
        .customSanitizer(sanitizeText),
    body('condition')
        .trim()
        .isIn(VALID_CONDITIONS)
        .withMessage(`Condition must be one of: ${VALID_CONDITIONS.join(', ')}`),
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer')
        .toInt(),
    body('status')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(VALID_STATUSES)
        .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    body('serial_number')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Serial number is too long')
        .customSanitizer(sanitizeText),
    body('location')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('Location is too long')
        .customSanitizer(sanitizeText),
    body('photo_url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_protocol: true }).withMessage('Photo URL must be a valid URL')
        .customSanitizer(sanitizeText),
    positiveIntegerOrNullField('room_id', 'Room ID')
];

const updateEquipmentValidation = [
    body().custom((_, { req }) => {
        if (!EDITABLE_FIELDS.some((field) => hasField(req, field))) {
            throw new Error(`At least one of ${EDITABLE_FIELDS.join(', ')} is required`);
        }
        return true;
    }),
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ max: 100 }).withMessage('Name is too long')
        .customSanitizer(sanitizeText),
    body('type')
        .optional()
        .trim()
        .notEmpty().withMessage('Type cannot be empty')
        .isLength({ max: 100 }).withMessage('Type is too long')
        .customSanitizer(sanitizeText),
    body('condition')
        .optional()
        .trim()
        .isIn(VALID_CONDITIONS)
        .withMessage(`Condition must be one of: ${VALID_CONDITIONS.join(', ')}`),
const { body, validationResult } = require('express-validator');
const xss = require('xss');

const EQUIPMENT_CONDITIONS = ['new', 'good', 'fair', 'damaged'];
const EQUIPMENT_STATUSES = ['available', 'checked_out', 'under_repair', 'retired'];

const optionalUrlValidator = (value) => {
    if (value === '' || value === null || value === undefined) {
        return true;
    }

    try {
        new URL(value);
        return true;
    } catch (_error) {
        throw new Error('Photo URL must be a valid URL');
    }
};

const validateEquipmentCreate = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name is too long')
        .customSanitizer((value) => xss(value)),
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Type is required')
        .isLength({ max: 100 })
        .withMessage('Type is too long')
        .customSanitizer((value) => xss(value)),
    body('condition')
        .notEmpty()
        .isIn(EQUIPMENT_CONDITIONS)
        .withMessage(`Condition must be one of: ${EQUIPMENT_CONDITIONS.join(', ')}`),
    body('status')
        .optional({ nullable: true })
        .isIn(EQUIPMENT_STATUSES)
        .withMessage(`Status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`),
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer')
        .toInt(),
    body('serial_number')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Serial number is too long')
        .customSanitizer((value) => xss(value)),
    body('location')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location is too long')
        .customSanitizer((value) => xss(value)),
    body('photo_url')
        .optional({ nullable: true })
        .trim()
        .custom(optionalUrlValidator)
];

const validateEquipmentUpdate = [
    body('name')
        .optional({ nullable: true })
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name is too long')
        .customSanitizer((value) => xss(value)),
    body('type')
        .optional({ nullable: true })
        .trim()
        .notEmpty()
        .withMessage('Type is required')
        .isLength({ max: 100 })
        .withMessage('Type is too long')
        .customSanitizer((value) => xss(value)),
    body('condition')
        .optional({ nullable: true })
        .isIn(EQUIPMENT_CONDITIONS)
        .withMessage(`Condition must be one of: ${EQUIPMENT_CONDITIONS.join(', ')}`),
    body('status')
        .optional({ nullable: true })
        .isIn(EQUIPMENT_STATUSES)
        .withMessage(`Status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`),
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer')
        .toInt(),
    body('status')
        .optional()
        .trim()
        .isIn(VALID_STATUSES)
        .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    body('serial_number')
        .optional({ nullable: true })
        .custom((value) => value === null || typeof value === 'string')
        .withMessage('Serial number must be a string or null')
        .if((value) => value !== null && value !== undefined)
        .trim()
        .isLength({ max: 100 }).withMessage('Serial number is too long')
        .customSanitizer(sanitizeText),
    body('location')
        .optional({ nullable: true })
        .custom((value) => value === null || typeof value === 'string')
        .withMessage('Location must be a string or null')
        .if((value) => value !== null && value !== undefined)
        .trim()
        .isLength({ max: 255 }).withMessage('Location is too long')
        .customSanitizer(sanitizeText),
    body('photo_url')
        .optional()
        .custom((value) => {
            if (value === null || value === '') {
                return true;
            }
            if (typeof value !== 'string') {
                throw new Error('Photo URL must be a string');
            }
            return true;
        })
        .if((value) => value !== null && value !== undefined && value !== '')
        .trim()
        .isURL({ require_protocol: true }).withMessage('Photo URL must be a valid URL')
        .customSanitizer(sanitizeText),
    positiveIntegerOrNullField('room_id', 'Room ID')
];

const updateStatusValidation = [
    body('status')
        .trim()
        .isIn(VALID_STATUSES)
        .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`)
    body('serial_number')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Serial number is too long')
        .customSanitizer((value) => xss(value)),
    body('location')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location is too long')
        .customSanitizer((value) => xss(value)),
    body('photo_url')
        .optional({ nullable: true })
        .trim()
        .custom(optionalUrlValidator)
];

const validateStatusUpdate = [
    body('status')
        .trim()
        .notEmpty()
        .withMessage('Status is required')
        .isIn(EQUIPMENT_STATUSES)
        .withMessage(`Status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`)
];

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    return next();
};

router.post('/',
    authenticateToken,
    authorizeRoles('admin'),
    createEquipmentValidation,
    validateEquipmentCreate,
    handleValidation,
    equipmentController.createEquipment
);

router.get('/', equipmentController.getEquipment);

router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), equipmentController.getConditionHistory);
router.get('/:id', equipmentController.getEquipmentDetails);

router.put('/:id/status',
    authenticateToken,
    updateStatusValidation,
    validateStatusUpdate,
    handleValidation,
    equipmentController.updateStatus
);

router.put('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    updateEquipmentValidation,
    validateEquipmentUpdate,
    handleValidation,
    equipmentController.updateEquipment
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), equipmentController.deleteEquipment);

module.exports = router;
