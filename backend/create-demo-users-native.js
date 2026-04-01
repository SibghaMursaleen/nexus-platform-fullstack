const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createDemoUsersNative = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const usersCol = db.collection('users');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        const demoUsers = [
            { 
                name: "Demo Entrepreneur", 
                email: "entrepreneur@nexus.com", 
                password: hashedPassword, 
                role: "entrepreneur",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                name: "Demo Investor", 
                email: "investor@nexus.com", 
                password: hashedPassword, 
                role: "investor",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        for (const userData of demoUsers) {
            const existing = await usersCol.findOne({ email: userData.email });
            if (existing) {
                console.log(`User ${userData.email} already exists.`);
            } else {
                await usersCol.insertOne(userData);
                console.log(`User ${userData.email} created (native).`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createDemoUsersNative();
