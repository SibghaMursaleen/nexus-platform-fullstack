const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
require('dotenv').config();

const simulateFetch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const docs = await Document.find().limit(5);
        if (docs.length === 0) {
            console.log('No documents found in DB at all.');
            process.exit(0);
        }
        
        const firstDoc = docs[0];
        const ownerId = firstDoc.owner;
        console.log(`Document: ${firstDoc.name}, OwnerID: ${ownerId}`);
        
        const foundDocs = await Document.find({
            $or: [{ owner: ownerId }, { sharedWith: ownerId }]
        });
        
        console.log(`Simulated fetch for owner ${ownerId} found ${foundDocs.length} documents.`);
        
        const user = await User.findById(ownerId);
        console.log(`User found for this owner ID: ${user ? user.name + ' (' + user.role + ')' : 'NOT FOUND'}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

simulateFetch();
