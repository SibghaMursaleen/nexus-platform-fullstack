const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a meeting title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    startTime: {
        type: Date,
        required: [true, 'Please add a start time']
    },
    endTime: {
        type: Date,
        required: [true, 'Please add an end time']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
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
    meetingLink: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexing for fast conflict detection and user search
meetingSchema.index({ sender: 1, startTime: 1, endTime: 1 });
meetingSchema.index({ receiver: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
