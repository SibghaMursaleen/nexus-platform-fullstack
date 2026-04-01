const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadBranding } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { profileValidationRules, validate } = require('../middleware/validator');

// Get current user profile (must be before :id route to prevent pattern mismatch)
router.get('/profile', protect, getProfile);

// Get any user profile by ID (Public-ish)
router.get('/profile/:id', getProfile);

// Update current user profile with optional logo/banner upload (Protected & Validated)
router.put('/profile', protect, uploadBranding, profileValidationRules, validate, updateProfile);

module.exports = router;
