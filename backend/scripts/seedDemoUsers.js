const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const users = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Sarah Johnson',
    email: 'sarah@techwave.io',
    password: 'password123',
    role: 'entrepreneur',
    walletBalance: 100000,
    bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
    profilePicture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c1d1',
    name: 'Michael Rodriguez',
    email: 'michael@vcinnovate.com',
    password: 'password123',
    role: 'investor',
    walletBalance: 2500000,
    bio: 'Early-stage investor with focus on B2B SaaS and fintech.',
    profilePicture: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    name: 'David Chen',
    email: 'david@greenlife.co',
    password: 'password123',
    role: 'entrepreneur',
    walletBalance: 100000,
    bio: 'Environmental scientist turned entrepreneur. Passionate about sustainable solutions.',
    profilePicture: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c1d2',
    name: 'Jennifer Lee',
    email: 'jennifer@impactvc.org',
    password: 'password123',
    role: 'investor',
    walletBalance: 100000,
    bio: 'Impact investor focused on climate tech and sustainable agriculture.',
    profilePicture: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    for (const userData of users) {
      try {
        console.log(`⏳ Processing: ${userData.name}...`);
        
        // 1. Delete if user exists by ID (Cleanup)
        await User.findByIdAndDelete(userData._id);
        
        // 2. Delete if user exists by EMAIL (Cleanup for unique constraint)
        await User.findOneAndDelete({ email: userData.email.toLowerCase() });

        // 3. Create fresh hardened user
        const newUser = new User(userData);
        await newUser.save();
        console.log(`✅ Created user: ${userData.name} (${userData._id})`);
      } catch (saveErr) {
        console.error(`❌ Failed to create ${userData.name}:`, saveErr.message);
        if (saveErr.errors) {
          Object.keys(saveErr.errors).forEach(key => {
            console.error(`   - ${key}: ${saveErr.errors[key].message}`);
          });
        }
      }
    }

    console.log('✨ Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();
