const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createDemoUsers = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        const demoUsers = [
            { name: "Demo Entrepreneur", email: "entrepreneur@nexus.com", password: "password123", role: "entrepreneur" },
            { name: "Demo Investor", email: "investor@nexus.com", password: "password123", role: "investor" }
        ];
        
        for (const userData of demoUsers) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                console.log(`User ${userData.email} already exists.`);
            } else {
                await User.create(userData);
                console.log(`User ${userData.email} created successfully.`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createDemoUsers();
