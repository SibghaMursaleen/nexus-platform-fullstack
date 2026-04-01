const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    sendMessage, 
    getChatHistory, 
    getConversations 
} = require('../controllers/messageController');

router.use(protect);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getChatHistory);

module.exports = router;
