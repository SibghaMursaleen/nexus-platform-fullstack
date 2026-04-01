const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const topUp = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Nexus Database');

        const investor = await User.findOneAndUpdate(
            { email: 'investor@nexus.com' }, 
            { walletBalance: 5000000 },
            { new: true }
        );
        const entrepreneur = await User.findOneAndUpdate(
            { email: 'entrepreneur@nexus.com' }, 
            { walletBalance: 500000 },
            { new: true }
        );

        if (investor) console.log(`💰 Investor (${investor.email}): $${investor.walletBalance / 100}`);
        if (entrepreneur) console.log(`🚀 Entrepreneur (${entrepreneur.email}): $${entrepreneur.walletBalance / 100}`);

        process.exit();
    } catch (err) {
        console.error('❌ Top-up Failed:', err);
        process.exit(1);
    }
};

topUp();
