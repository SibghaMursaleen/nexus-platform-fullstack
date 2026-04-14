const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['investor', 'entrepreneur'],
        default: 'entrepreneur'
    },
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    // Branding Fields
    bannerUrl: {
        type: String,
        default: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg' // Professional Blueprint/Tech Banner
    },
    startupLogoUrl: {
        type: String,
        default: ''
    },
    startupName: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    foundedYear: {
        type: String,
        default: ''
    },
    teamSize: {
        type: Number,
        default: 1
    },
    pitchSummary: {
        type: String,
        default: ''
    },
    investmentPreferences: {
        type: [String],
        default: []
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative']
    },
    // Investor Specific Fields 💹
    investmentInterests: {
        type: [String],
        default: []
    },
    investmentStage: {
        type: [String],
        default: []
    },
    portfolioCompanies: {
        type: [String],
        default: []
    },
    minimumInvestment: {
        type: String,
        default: '$0'
    },
    maximumInvestment: {
        type: String,
        default: '$0'
    },
    totalInvestments: {
        type: Number,
        default: 0
    },
    // Entrepreneur Specific Fields 🚀
    fundingNeeded: {
        type: String,
        default: '$0'
    },
    // UI & Status Fields
    isOnline: {
        type: Boolean,
        default: false
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    // 2-Factor Authentication 🔐
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorCode: String,
    twoFactorExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
