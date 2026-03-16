const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seedLeaderboard = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-resume-platform');

        const dummyUsers = [
            {
                name: 'Alex Rivera',
                email: `alex_${Date.now()}@example.com`,
                password: 'password123',
                leaderboardOptIn: true,
                globalRankScore: 920,
                tier: 'Diamond',
                categoryTrack: 'Software Engineering',
                profilePhoto: 'https://i.pravatar.cc/150?u=alex'
            },
            {
                name: 'Sarah Chen',
                email: `sarah_${Date.now()}@example.com`,
                password: 'password123',
                leaderboardOptIn: true,
                globalRankScore: 885,
                tier: 'Platinum',
                categoryTrack: 'Data Science',
                profilePhoto: 'https://i.pravatar.cc/150?u=sarah'
            },
            {
                name: 'Marcus Johnson',
                email: `marcus_${Date.now()}@example.com`,
                password: 'password123',
                leaderboardOptIn: true,
                globalRankScore: 840,
                tier: 'Gold',
                categoryTrack: 'Software Engineering',
                profilePhoto: 'https://i.pravatar.cc/150?u=marcus'
            },
            {
                name: 'Elena Rodriguez',
                email: `elena_${Date.now()}@example.com`,
                password: 'password123',
                leaderboardOptIn: true,
                globalRankScore: 780,
                tier: 'Silver',
                categoryTrack: 'Product Management',
                profilePhoto: 'https://i.pravatar.cc/150?u=elena'
            },
            {
                name: 'David Kim',
                email: `david_${Date.now()}@example.com`,
                password: 'password123',
                leaderboardOptIn: true,
                globalRankScore: 950,
                tier: 'Diamond',
                categoryTrack: 'Design',
                profilePhoto: 'https://i.pravatar.cc/150?u=david'
            }
        ];

        for (const u of dummyUsers) {
            await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true, setDefaultsOnInsert: true });
        }

        console.log('Leaderboard dummy candidates seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedLeaderboard();
