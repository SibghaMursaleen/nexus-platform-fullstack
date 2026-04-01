const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'Please provide receiverId and content' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content
        });

        // Populate sender info for the frontend
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture');

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (err) {
        res.status(500).json({ error: 'Server message error', details: err.message });
    }
};

// @desc    Get chat history between two users
// @route   GET /api/messages/:userId
// @access  Private
exports.getChatHistory = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 })
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (err) {
        res.status(500).json({ error: 'Server history error', details: err.message });
    }
};

// @desc    Get all conversations list
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find unique participants for the user's messages
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 });

        const conversationPartners = new Map();

        messages.forEach(msg => {
            const partnerId = msg.sender.toString() === userId 
                ? msg.receiver.toString() 
                : msg.sender.toString();
            
            if (!conversationPartners.has(partnerId)) {
                conversationPartners.set(partnerId, msg);
            }
        });

        // Convert Map to array of conversation objects with populated user info
        const conversations = await Promise.all(
            Array.from(conversationPartners.keys()).map(async (partnerId) => {
                const partner = await User.findById(partnerId).select('name role profilePicture');
                const lastMessage = conversationPartners.get(partnerId);
                
                return {
                    id: partnerId,
                    user: partner,
                    lastMessage,
                    updatedAt: lastMessage.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            count: conversations.length,
            conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt)
        });
    } catch (err) {
        res.status(500).json({ error: 'Server conversation error', details: err.message });
    }
};
