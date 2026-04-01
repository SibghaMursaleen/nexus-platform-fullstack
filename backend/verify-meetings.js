const mongoose = require('mongoose');
const User = require('./models/User');
const Meeting = require('./models/Meeting');
require('dotenv').config();

const verifyScheduling = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Get our demo users
        const entrepreneur = await User.findOne({ email: 'entrepreneur@nexus.com' });
        const investor = await User.findOne({ email: 'investor@nexus.com' });
        
        if (!entrepreneur || !investor) {
            console.error('Demo users not found. Run create-demo-users-native.js first.');
            process.exit(1);
        }

        // 2. Clear previous test meetings
        await Meeting.deleteMany({ 
            $or: [
                { sender: entrepreneur._id }, 
                { receiver: entrepreneur._id },
                { sender: investor._id },
                { receiver: investor._id }
            ]
        });
        console.log('Cleaned up previous test meetings.');

        // 3. Create an ACCEPTED meeting for tomorrow 10:00 - 11:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const endHour = new Date(tomorrow);
        endHour.setHours(11, 0, 0, 0);

        const baseMeeting = await Meeting.create({
            title: 'Base Meeting (Accepted)',
            startTime: tomorrow,
            endTime: endHour,
            sender: entrepreneur._id,
            receiver: investor._id,
            status: 'accepted'
        });
        console.log('Created base accepted meeting.');

        // 4. Test Conflict Detection Logic (Manual check inside script)
        const checkConflict = async (start, end) => {
            return await Meeting.findOne({
                $or: [
                    { sender: entrepreneur._id },
                    { receiver: entrepreneur._id },
                    { sender: investor._id },
                    { receiver: investor._id }
                ],
                status: 'accepted',
                startTime: { $lt: end },
                endTime: { $gt: start }
            });
        };

        // Test A: Exact same time
        const conflictA = await checkConflict(tomorrow, endHour);
        console.log('Test A (Exact match):', conflictA ? 'Conflict Detected ✅' : 'FAILED ❌');

        // Test B: Overlapping start (9:30 - 10:30)
        const startB = new Date(tomorrow);
        startB.setMinutes(-30);
        const endB = new Date(tomorrow);
        endB.setMinutes(30);
        const conflictB = await checkConflict(startB, endB);
        console.log('Test B (Overlapping start):', conflictB ? 'Conflict Detected ✅' : 'FAILED ❌');

        // Test C: Overlapping end (10:30 - 11:30)
        const startC = new Date(tomorrow);
        startC.setMinutes(30);
        const endC = new Date(endHour);
        endC.setMinutes(30);
        const conflictC = await checkConflict(startC, endC);
        console.log('Test C (Overlapping end):', conflictC ? 'Conflict Detected ✅' : 'FAILED ❌');

        // Test D: Fully enclosed (10:15 - 10:45)
        const startD = new Date(tomorrow);
        startD.setMinutes(15);
        const endD = new Date(tomorrow);
        endD.setMinutes(45);
        const conflictD = await checkConflict(startD, endD);
        console.log('Test D (Enclosed):', conflictD ? 'Conflict Detected ✅' : 'FAILED ❌');

        // Test E: Non-overlapping (11:01 - 12:00)
        const startE = new Date(endHour);
        startE.setMinutes(1);
        const endE = new Date(startE);
        endE.setHours(startE.getHours() + 1);
        const conflictE = await checkConflict(startE, endE);
        console.log('Test E (No overlap):', conflictE ? 'FAILED ❌' : 'No Conflict Detected ✅');

        console.log('Verification Complete.');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

verifyScheduling();
