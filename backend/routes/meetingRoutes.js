const express = require('express');
const router = express.Router();
const { 
    scheduleMeeting, 
    getMeetings, 
    updateMeetingStatus,
    cancelMeeting,
    deleteMeeting
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// All meeting routes are protected
router.use(protect);

router.post('/', scheduleMeeting);
router.get('/', getMeetings);
router.put('/:id', updateMeetingStatus);
router.put('/cancel/:id', cancelMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;
