const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const findNexusUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ 
            email: { $in: ['entrepreneur@nexus.com', 'investor@nexus.com'] } 
        });
        
        console.log('--- USER DATA START ---');
        console.log(JSON.stringify(users.map(u => ({ email: u.email, id: u._id, role: u.role })), null, 2));
        console.log('--- USER DATA END ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findNexusUsers();
