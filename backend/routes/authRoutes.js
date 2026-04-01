const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getMe, 
    getUserById,
    verify2FA,
    toggle2FA
} = require('../controllers/authController');

const { 
    registerValidationRules, 
    loginValidationRules, 
    validate 
} = require('../middleware/validator');

// Auth Routes 🔐
router.post('/register', registerValidationRules, validate, registerUser);
router.post('/login', loginValidationRules, validate, loginUser);
router.post('/verify-2fa', verify2FA);

// Profile & Security (Protected)
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, getMe);
router.get('/user/:id', protect, getUserById);
router.put('/toggle-2fa', protect, toggle2FA);

module.exports = router;
