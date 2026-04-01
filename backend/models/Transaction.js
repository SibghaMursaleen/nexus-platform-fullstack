const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdraw', 'transfer_sent', 'transfer_received'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    stripeSessionId: {
        type: String
    },
    description: {
        type: String
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Index for performance
transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
