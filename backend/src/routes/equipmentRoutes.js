const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator'); // Added validationResult
const xss = require('xss');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// 1. Validation Logic
const validateEquipment = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long')
        .customSanitizer(value => xss(value)),
    body('type')
        .trim()
        .notEmpty().withMessage('Type is required')
        .customSanitizer(value => xss(value)),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description is too long')
        .customSanitizer(value => xss(value)),
    body('is_sensitive')
        .optional()
        .isBoolean().withMessage('is_sensitive must be a boolean')
];

const validateEquipmentUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Name is too long')
        .customSanitizer(value => xss(value)),
    body('type')
        .optional()
        .trim()
        .customSanitizer(value => xss(value)),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description is too long')
        .customSanitizer(value => xss(value)),
    body('is_sensitive')
        .optional()
        .isBoolean().withMessage('is_sensitive must be a boolean')
];

const validateMediaUpload = [
    body('file_name')
        .trim()
        .notEmpty()
        .withMessage('file_name is required')
        .isLength({ max: 255 })
        .withMessage('file_name is too long')
        .customSanitizer((value) => xss(value)),
    body('content_type')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 127 })
        .withMessage('content_type is too long')
        .customSanitizer((value) => xss(value)),
    body('data_base64')
        .optional({ nullable: true })
        .isString()
        .withMessage('data_base64 must be a string'),
    body('remote_url')
        .optional({ nullable: true })
        .trim()
        .custom((value) => {
            if (value && !/^https?:\/\//i.test(value)) {
                throw new Error('remote_url must be a valid URL starting with http:// or https://');
            }
            return true;
        }),
    body('folder')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('folder is too long')
        .customSanitizer((value) => xss(value)),
    body().custom(({ data_base64: dataBase64, remote_url: remoteUrl }) => {
        if (Boolean(dataBase64) === Boolean(remoteUrl)) {
            throw new Error('Provide exactly one of data_base64 or remote_url');
        }
        return true;
    })
];

// 2. Helper to catch validation errors
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msg = errors.array().map(e => `${e.path || e.param}: ${e.msg}`).join(', ');
        return res.status(400).json({ message: msg, errors: errors.array() });
    }
    next();
};

// --- ROUTES ---

// Upload equipment media/documents
router.post('/upload',
    authenticateToken,
    authorizeRoles('admin', 'teacher'),
    upload.single('file'),
    equipmentController.uploadFile
);

// Added validation and error handling to POST
router.post('/',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipment,
    handleValidation,
    equipmentController.createEquipment
);

router.get('/', equipmentController.getEquipment);

router.post('/media/upload',
    authenticateToken,
    authorizeRoles('admin'),
    validateMediaUpload,
    handleValidation,
    equipmentController.uploadMedia
);

router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin', 'teacher', 'student'), equipmentController.getConditionHistory);
// Note: You had a duplicate route here for condition-history/ (trailing slash),
// Express usually handles this automatically, but keeping it is fine.

router.get('/:id', equipmentController.getEquipmentDetails);

router.put('/:id/status', authenticateToken, equipmentController.updateStatus);

// Added validation and error handling to PUT
router.put('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipmentUpdate,
    handleValidation,
    equipmentController.updateEquipment
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), equipmentController.deleteEquipment);

module.exports = router;