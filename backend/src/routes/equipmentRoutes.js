const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
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
    next();
};

// --- ROUTES ---

router.post('/',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipmentCreate,
    handleValidation,
    equipmentController.createEquipment
);

router.get('/', equipmentController.getEquipment);

router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), equipmentController.getConditionHistory);
router.get('/:id', equipmentController.getEquipmentDetails);

router.put('/:id/status',
    authenticateToken,
    validateStatusUpdate,
    handleValidation,
    equipmentController.updateStatus
);

router.put('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipmentUpdate,
    handleValidation,
    equipmentController.updateEquipment
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), equipmentController.deleteEquipment);

module.exports = router;
