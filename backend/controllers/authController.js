const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Register a User
exports.registerUser = async (req, res) => {
    try {
        console.log('Registering user:', req.body.email);
        const { name, email, password, role, bio, profilePicture } = req.body;
        
        console.log('Connection State:', mongoose.connection.readyState);
        console.log('Finding user...');
        const existingUser = await User.findOne({ email });
        console.log('User search result:', existingUser ? 'Found' : 'Not found');
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Create a new user
        const newUser = await User.create({ name, email, password, role, bio, profilePicture });
        
        // Response
        res.status(201).json({
            success: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            token: generateToken(newUser._id)
        });
        
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Server registration error', details: err.message });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email and select password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check for 2FA 🔐
        if (user.isTwoFactorEnabled) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFactorCode = otpCode;
            user.twoFactorExpires = Date.now() + 10 * 60 * 1000; // 10 mins
            await user.save();

            console.log(`[Nexus Guard] OTP for ${user.email}: ${otpCode}`);

            return res.status(200).json({
                success: true,
                require2FA: true,
                message: '2FA required. Please check your email (console for demo).',
                userId: user._id
            });
        }
        
        // standard response
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user._id)
        });
        
    } catch (err) {
        res.status(500).json({ error: 'Server login error', details: err.message });
    }
};

// @desc    Verify 2FA Code
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await User.findById(userId).select('+twoFactorCode +twoFactorExpires');

        if (!user || user.twoFactorCode !== code || user.twoFactorExpires < Date.now()) {
            return res.status(401).json({ error: 'Invalid or expired verification code' });
        }

        // Clear code and login
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ error: '2FA verification error' });
    }
};

// @desc    Toggle 2FA
// @route   PUT /api/auth/toggle-2fa
// @access  Private
exports.toggle2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.isTwoFactorEnabled = !user.isTwoFactorEnabled;
        await user.save();

        res.status(200).json({
            success: true,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
            message: `2FA ${user.isTwoFactorEnabled ? 'enabled' : 'disabled'}`
        });
    } catch (err) {
        res.status(500).json({ error: 'Toggle 2FA error' });
    }
};

// Get current user profile
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({ error: 'Server profile error', details: err.message });
    }
};

// Function for Token Generation
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// @desc    Get user by ID (Public info)
// @route   GET /api/auth/user/:id
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name bio profilePicture role');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
