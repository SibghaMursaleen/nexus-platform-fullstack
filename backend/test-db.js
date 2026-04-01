const mongoose = require('mongoose');
require('dotenv').config();

const testConn = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('Users count:', count);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testConn();
