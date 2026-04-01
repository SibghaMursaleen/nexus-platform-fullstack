const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
require('dotenv').config();

const verifyDocuments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name role email');
        console.log('--- Current Users in DB ---');
        console.log(JSON.stringify(users, null, 2));

        const docs = await Document.find();
        console.log('--- Current Documents in DB ---');
        console.log(JSON.stringify(docs, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyDocuments();
