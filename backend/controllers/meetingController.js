const Meeting = require('../models/Meeting');
const User = require('../models/User');

// @desc    Schedule a new meeting
// @route   POST /api/meetings
// @access  Private
exports.scheduleMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, receiverId } = req.body;
        const senderId = req.user.id;

        // Validation: End time after Start time
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start < new Date()) {
            return res.status(400).json({ error: 'Cannot schedule a meeting in the past' });
        }

        if (start >= end) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        // Conflict Detection: Check for BOTH participants
        // Overlap: (new_start < existing_end) AND (new_end > existing_start)
        const conflict = await Meeting.findOne({
            $or: [
                { sender: senderId },
                { receiver: senderId },
                { sender: receiverId },
                { receiver: receiverId }
            ],
            status: { $in: ['accepted', 'pending'] }, // Check pending too for request safety
            startTime: { $lt: end },
            endTime: { $gt: start }
        });

        if (conflict) {
            return res.status(409).json({ 
                error: 'Conflict detected. One of the participants already has a meeting scheduled during this time.' 
            });
        }

        const meeting = await Meeting.create({
            title,
            description,
            startTime: start,
            endTime: end,
            sender: senderId,
            receiver: receiverId,
            meetingLink: `/dashboard/meeting/pending` // Will be updated on acceptance
        });

        res.status(201).json({
            success: true,
            meeting
        });

    } catch (err) {
        console.error('Schedule Meeting Error:', err);
        res.status(500).json({ error: 'Server scheduling error', details: err.message });
    }
};

// @desc    Get all user meetings (sent or received)
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const meetings = await Meeting.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .populate('sender', 'name email role')
        .populate('receiver', 'name email role')
        .sort({ startTime: 1 });

        res.status(200).json({
            success: true,
            count: meetings.length,
            meetings
        });
    } catch (err) {
        res.status(500).json({ error: 'Server fetch meetings error', details: err.message });
    }
};

// @desc    Update meeting status (Accept/Reject)
// @route   PUT /api/meetings/:id
// @access  Private
exports.updateMeetingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const meetingId = req.params.id;
        const userId = req.user.id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Only the receiver can update the status (Accept/Reject)
        if (meeting.receiver.toString() !== userId) {
            return res.status(401).json({ error: 'Not authorized to update this invitation' });
        }

        // Conflict check if accepting
        if (status === 'accepted') {
            const conflict = await Meeting.findOne({
                _id: { $ne: meetingId },
                $or: [
                    { sender: meeting.sender },
                    { receiver: meeting.sender },
                    { sender: meeting.receiver },
                    { receiver: meeting.receiver }
                ],
                status: 'accepted',
                startTime: { $lt: meeting.endTime },
                endTime: { $gt: meeting.startTime }
            });

            if (conflict) {
                return res.status(409).json({ 
                    error: 'Cannot accept. Conflict detected in schedule.' 
                });
            }
        }

        meeting.status = status;
        
        // If accepted, generate the actual Meeting Hub link
        if (status === 'accepted') {
            meeting.meetingLink = `/dashboard/meeting/${meeting._id}`;
        }
        
        await meeting.save();

        res.status(200).json({
            success: true,
            meeting
        });

    } catch (err) {
        res.status(500).json({ error: 'Server update status error', details: err.message });
    }
};
// @desc    Cancel a meeting
// @route   PUT /api/meetings/cancel/:id
// @access  Private
exports.cancelMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

        // Only participants can cancel
        if (meeting.sender.toString() !== req.user.id && meeting.receiver.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        meeting.status = 'cancelled';
        await meeting.save();

        res.status(200).json({ success: true, meeting });
    } catch (err) {
        res.status(500).json({ error: 'Cancel error', details: err.message });
    }
};

// @desc    Delete a meeting (Cleanup)
// @route   DELETE /api/meetings/:id
// @access  Private
exports.deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

        // Only the sender can fully delete the request (for cleanup)
        if (meeting.sender.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized to delete this request' });
        }

        await meeting.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ error: 'Delete error', details: err.message });
    }
};
