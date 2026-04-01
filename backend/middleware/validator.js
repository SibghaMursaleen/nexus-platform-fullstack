const { body, validationResult } = require('express-validator');

// Error Handling Middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(422).json({
        success: false,
        errors: extractedErrors,
    });
};

// Auth Validation Rules
const registerValidationRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['investor', 'entrepreneur']).withMessage('Invalid user role'),
];

const loginValidationRules = [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Profile Validation Rules (Sanitization focus)
const profileValidationRules = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional().trim().escape().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
    body('startupName').optional().trim().escape(),
    body('industry').optional().trim().escape(),
    body('location').optional().trim().escape(),
    body('pitchSummary').optional().trim().escape(),
];

// Wallet Validation Rules
const transferValidationRules = [
    body('recipientId').isMongoId().withMessage('Invalid recipient identity'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
    body('description').optional().trim().escape(),
];

module.exports = {
    validate,
    registerValidationRules,
    loginValidationRules,
    profileValidationRules,
    transferValidationRules
};
