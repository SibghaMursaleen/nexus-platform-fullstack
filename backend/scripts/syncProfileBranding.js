const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const syncProfileBranding = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Entrepreneur: entrepreneur@nexus.com
        const entrepreneur = await User.findOne({ email: 'entrepreneur@nexus.com' });
        if (entrepreneur) {
            entrepreneur.startupName = 'Nexus AI Solutions';
            entrepreneur.industry = 'Artificial Intelligence';
            entrepreneur.location = 'San Francisco, CA';
            entrepreneur.foundedYear = '2023';
            entrepreneur.teamSize = 12;
            entrepreneur.bio = 'Leading the revolution in agentic AI for enterprise infrastructure. We build the future of autonomous systems.';
            entrepreneur.pitchSummary = 'Nexus AI leverages proprietary neural architectures to automate complex DevOps workflows, reducing operational costs by 40%. Our mission is to make infrastructure invisible and intelligent.';
            entrepreneur.bannerUrl = 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg'; // Tech Blueprint
            await entrepreneur.save();
            console.log('✅ Entrepreneur Branding Sync Complete');
        }

        // 2. Investor: investor@nexus.com
        const investor = await User.findOne({ email: 'investor@nexus.com' });
        if (investor) {
            investor.startupName = 'Nexus Capital Partners';
            investor.industry = 'Venture Capital';
            investor.location = 'New York, NY';
            investor.bio = 'Strategic investor focused on Series A-B deep tech and fintech startups. We bridge the gap between innovation and institutional scale.';
            investor.investmentPreferences = ['AI', 'Fintech', 'SaaS', 'CleanTech'];
            investor.bannerUrl = 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'; // Professional Office/Skyline
            await investor.save();
            console.log('✅ Investor Branding Sync Complete');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

syncProfileBranding();
