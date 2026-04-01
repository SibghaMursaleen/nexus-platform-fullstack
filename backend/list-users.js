const mongoose = require('mongoose');
require('dotenv').config();

const testConn = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('Users:');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testConn();
