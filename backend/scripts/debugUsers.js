const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const debugUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ 
            email: { $in: ['entrepreneur@nexus.com', 'investor@nexus.com'] } 
        });
        
        console.log('--- DEBUG START ---');
        console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, balance: u.walletBalance })), null, 2));
        console.log('--- DEBUG END ---');
        
        // Reset passwords just in case
        for (const user of users) {
            user.password = 'password123';
            await user.save();
        }
        console.log('✅ PASSWORDS RESET: password123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugUsers();
