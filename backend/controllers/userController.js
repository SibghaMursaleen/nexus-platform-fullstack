const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer Setup for Profile Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profiles/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    }
});

exports.uploadBranding = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

// @desc    Get user profile by ID or current user
// @route   GET /api/users/profile/:id or GET /api/users/profile
// @access  Public / Private
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id || (req.user && req.user.id);
        
        if (!userId) {
            return res.status(400).json({ error: 'User identity is missing.' });
        }

        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found in Nexus database.' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ error: 'Server profile error', details: err.message });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { 
            name, bio, startupName, industry, location, 
            foundedYear, teamSize, pitchSummary, investmentPreferences 
        } = req.body;

        const fieldsToUpdate = {
            name, 
            bio, 
            startupName, 
            industry, 
            location, 
            foundedYear, 
            teamSize: teamSize ? Number(teamSize) : 1, 
            pitchSummary, 
            investmentPreferences: Array.isArray(investmentPreferences) ? investmentPreferences : []
        };

        // If files were uploaded
        if (req.files) {
            if (req.files.logo) {
                fieldsToUpdate.startupLogoUrl = `/uploads/profiles/${req.files.logo[0].filename}`;
            }
            if (req.files.banner) {
                fieldsToUpdate.bannerUrl = `/uploads/profiles/${req.files.banner[0].filename}`;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            user
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ error: 'Server update error', details: err.message });
    }
};
