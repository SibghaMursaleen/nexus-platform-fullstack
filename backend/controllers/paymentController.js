const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Create Stripe Checkout Session for Deposit
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // 1. Create a pending transaction record
        const transaction = await Transaction.create({
            user: req.user.id,
            type: 'deposit',
            amount,
            status: 'pending',
            description: `Adding $${amount / 100} to Nexus Wallet`
        });

        // 2. Mocking Stripe for the demo if no key is provided
        // In a real production app, we would use stripe.checkout.sessions.create
        if (process.env.STRIPE_SECRET_KEY === 'sk_test_mock' || !process.env.STRIPE_SECRET_KEY) {
            return res.status(200).json({
                success: true,
                isMock: true,
                message: 'Stripe Secret Key missing. Using Mock Checkout.',
                checkoutUrl: `/dashboard/wallet?mock_success=true&tx=${transaction._id}`,
                transactionId: transaction._id
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Nexus Wallet Deposit',
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/dashboard/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard/wallet?canceled=true`,
            metadata: {
                transactionId: transaction._id.toString(),
                userId: req.user.id
            }
        });

        transaction.stripeSessionId = session.id;
        await transaction.save();

        res.status(200).json({
            success: true,
            checkoutUrl: session.url,
            sessionId: session.id
        });

    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({ error: 'Failed to initiate deposit', details: err.message });
    }
};

// @desc    Handle Successful Deposit (Mock or Sync)
// @route   POST /api/payments/confirm-deposit
// @access  Private
exports.confirmDeposit = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const transaction = await Transaction.findById(transactionId);

        if (!transaction || transaction.user.toString() !== req.user.id) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status === 'completed') {
            return res.status(400).json({ error: 'Transaction already completed' });
        }

        // Finalize balance
        const user = await User.findById(req.user.id);
        user.walletBalance += transaction.amount;
        await user.save();

        transaction.status = 'completed';
        await transaction.save();

        res.status(200).json({
            success: true,
            newBalance: user.walletBalance,
            transaction
        });

    } catch (err) {
        res.status(500).json({ error: 'Confirmation failed' });
    }
};

// @desc    Transfer funds from Investor to Entrepreneur
// @route   POST /api/payments/transfer
// @access  Private
exports.transferFunds = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { recipientId, amount, description } = req.body;
        const senderId = req.user.id;

        if (senderId === recipientId) {
            return res.status(400).json({ error: 'Cannot transfer funds to yourself' });
        }

        const sender = await User.findById(senderId).session(session);
        const recipient = await User.findById(recipientId).session(session);

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        if (sender.walletBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Update balances
        sender.walletBalance -= amount;
        recipient.walletBalance += amount;

        await sender.save({ session });
        await recipient.save({ session });

        // Record Transactions for both
        await Transaction.create([{
            user: senderId,
            type: 'transfer_sent',
            amount: -amount,
            status: 'completed',
            receiver: recipientId,
            description: description || `Investment in ${recipient.name}`
        }], { session });

        await Transaction.create([{
            user: recipientId,
            type: 'transfer_received',
            amount: amount,
            status: 'completed',
            sender: senderId,
            description: description || `Investment from ${sender.name}`
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            newBalance: sender.walletBalance
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: 'Transfer failed', details: err.message });
    }
};

// @desc    Withdraw funds from Nexus Wallet
// @route   POST /api/payments/withdraw
// @access  Private
exports.withdrawFunds = async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (user.walletBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // 1. Record the transaction
        const transaction = await Transaction.create({
            user: userId,
            type: 'withdraw',
            amount: -amount,
            status: 'completed', // For mock demo, we assume instant withdrawal
            description: `Withdrawal to ${bankDetails?.bankName || 'External Account'}`
        });

        // 2. Clear balance
        user.walletBalance -= amount;
        await user.save();

        res.status(200).json({
            success: true,
            newBalance: user.walletBalance,
            transaction
        });

    } catch (err) {
        res.status(500).json({ error: 'Withdrawal failed' });
    }
};
// @route   GET /api/payments/history
// @access  Private
exports.getTransactionHistory = async (req, res) => {
    try {
        const history = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name')
            .populate('receiver', 'name');

        res.status(200).json({
            success: true,
            history
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
