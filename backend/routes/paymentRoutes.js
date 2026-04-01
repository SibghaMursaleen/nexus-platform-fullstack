const express = require('express');
const router = express.Router();
const { 
    createCheckoutSession, 
    confirmDeposit, 
    transferFunds, 
    getTransactionHistory 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const { transferValidationRules, validate } = require('../middleware/validator');

router.get('/history', protect, getTransactionHistory);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/confirm-deposit', protect, confirmDeposit);
router.post('/transfer', protect, transferValidationRules, validate, transferFunds);

module.exports = router;
