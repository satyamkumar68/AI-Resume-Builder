const mongoose = require('mongoose');
const Resume = require('./models/Resume');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const resumes = await Resume.find().sort({ updatedAt: -1 }).limit(3);
        console.log(JSON.stringify(resumes, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
