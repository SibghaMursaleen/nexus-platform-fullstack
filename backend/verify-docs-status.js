const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
require('dotenv').config();

const verifyDocuments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const docs = await Document.find().populate('owner', 'name email');
        console.log('--- Current Documents in DB ---');
        console.log(JSON.stringify(docs, null, 2));
        
        const uploadsDir = './uploads';
        const files = require('fs').readdirSync(uploadsDir);
        console.log('--- Files in uploads/ directory ---');
        console.log(files);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyDocuments();
