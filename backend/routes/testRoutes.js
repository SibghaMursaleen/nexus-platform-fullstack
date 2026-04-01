const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Entrepreneur Dashboard (Protected, Entrepreneur Only)
router.get('/entrepreneur-data', protect, authorize('entrepreneur'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the Entrepreneur dashboard!',
        data: 'This is sensitive startup data.'
    });
});

// Investor Dashboard (Protected, Investor Only)
router.get('/investor-data', protect, authorize('investor'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the Investor dashboard!',
        data: 'This is sensitive investment data.'
    });
});

module.exports = router;
