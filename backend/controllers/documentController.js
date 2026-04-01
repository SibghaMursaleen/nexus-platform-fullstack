const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Document = require('../models/Document');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only document files and images are allowed!'));
        }
    }
}).single('document');

exports.uploadMiddleware = upload;

// @desc    Upload a new document
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        const { name } = req.body;
        const document = await Document.create({
            name: name || req.file.originalname,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileType: path.extname(req.file.originalname).substring(1).toUpperCase(),
            fileSize: req.file.size,
            owner: req.user.id
        });

        res.status(201).json({
            success: true,
            document
        });

    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Server upload error', details: err.message });
    }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
    try {
        const userId = req.user._id; // Using ObjectId
        console.log(`Fetching documents for user ID: ${userId} (${req.user.role})`);
        
        // Find documents owned by the user or shared with them
        const documents = await Document.find({
            $or: [{ owner: userId }, { sharedWith: userId }]
        }).sort({ createdAt: -1 });

        console.log(`Found ${documents.length} documents.`);

        res.status(200).json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (err) {
        console.error('Fetch Documents Error:', err);
        res.status(500).json({ error: 'Server fetch documents error', details: err.message });
    }
};

// @desc    Sign a document
// @route   PUT /api/documents/:id/sign
// @access  Private
exports.signDocument = async (req, res) => {
    try {
        const { signatureData } = req.body;
        const documentId = req.params.id;
        const userId = req.user.id;

        // Find document
        const document = await Document.findById(documentId);
        if (!document) {
            console.log(`[Sign Error] Document not found: ${documentId}`);
            return res.status(404).json({ error: 'Document not found' });
        }

        console.log(`[Sign Success] Updating document ${documentId} with signature of length ${signatureData.length}`);
        document.status = 'signed';
        document.signatureData = signatureData;
        document.signedBy = userId;
        document.signedAt = Date.now();

        await document.save();

        res.status(200).json({
            success: true,
            document
        });
    } catch (err) {
        res.status(500).json({ error: 'Server signature error', details: err.message });
    }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Only owner can delete (or handle admin later)
        if (document.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this document' });
        }

        // Remove from physical storage
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await document.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Document removed'
        });
    } catch (err) {
        res.status(500).json({ error: 'Server delete error', details: err.message });
    }
};

// @desc    View/Stream a document
// @route   GET /api/documents/:id/view
// @access  Private
exports.viewDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Authorization check: owner or shared with
        const userId = req.user.id;
        const isOwner = document.owner.toString() === userId;
        const isShared = document.sharedWith && document.sharedWith.includes(userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ error: 'Not authorized to view this document' });
        }

        // Resolve absolute path
        const absolutePath = path.resolve(__dirname, '..', document.filePath);
        console.log(`[View Request] Serving file: ${absolutePath}`);
        
        if (!fs.existsSync(absolutePath)) {
            console.log(`[View Error] File missing on disk: ${absolutePath}`);
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.sendFile(absolutePath);
    } catch (err) {
        console.error('Server view error:', err);
        res.status(500).json({ error: 'Server view error', details: err.message });
    }
};

// @desc    Share a document with another user by email
// @route   PUT /api/documents/:id/share
// @access  Private
exports.shareDocument = async (req, res) => {
    try {
        const { recipientEmail } = req.body;
        const documentId = req.params.id;
        const senderId = req.user.id;

        // 1. Find the recipient user
        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ error: `User with email ${recipientEmail} not found` });
        }

        // 2. Find document and check ownership
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (document.owner.toString() !== senderId) {
            return res.status(403).json({ error: 'Only the owner can share this document' });
        }

        // 3. Add recipient to sharedWith array if not already there
        if (!document.sharedWith.includes(recipient._id)) {
            document.sharedWith.push(recipient._id);
            await document.save();
        }

        res.status(200).json({
            success: true,
            message: `Document shared with ${recipient.name}`,
            document
        });

    } catch (err) {
        console.error('Share Error:', err);
        res.status(500).json({ error: 'Server sharing error', details: err.message });
    }
};
