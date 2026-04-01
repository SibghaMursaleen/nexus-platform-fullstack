const express = require('express');
const router = express.Router();
const { 
    uploadMiddleware,
    uploadDocument, 
    getDocuments, 
    signDocument,
    deleteDocument,
    viewDocument,
    shareDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// All document routes are protected
router.use(protect);

router.post('/upload', uploadMiddleware, uploadDocument);
router.get('/', getDocuments);
router.put('/:id/sign', signDocument);
router.put('/:id/share', shareDocument); // The final gap! ✅
router.delete('/:id', deleteDocument);
router.get('/:id/view', viewDocument);

module.exports = router;
