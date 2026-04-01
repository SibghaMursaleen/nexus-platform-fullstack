const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Document name is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'signed', 'rejected'],
        default: 'pending'
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    signatureData: {
        type: String, // Base64 signature image
        default: ''
    },
    signedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    signedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexing for owner and shared access
documentSchema.index({ owner: 1 });
documentSchema.index({ sharedWith: 1 });

module.exports = mongoose.model('Document', documentSchema);
