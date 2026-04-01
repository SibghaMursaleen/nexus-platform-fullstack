const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
require('dotenv').config();

const debugIds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`ID: ${u._id} (Type: ${typeof u._id}), Name: ${u.name}`));
        
        const docs = await Document.find();
        console.log('--- DOCUMENTS ---');
        docs.forEach(d => console.log(`Doc: ${d.name}, OwnerID: ${d.owner} (Type: ${typeof d.owner}), Status: ${d.status}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugIds();
