const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexing for faster conversation fetching
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
