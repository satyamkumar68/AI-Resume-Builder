const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const users = await User.find({});
    users.forEach(u => {
        console.log(`User: ${u.email}`);
        console.log(`Has storedResumes: ${!!u.storedResumes}`);
        if (u.storedResumes) {
            console.log(`Count: ${u.storedResumes.length}`);
            if (u.storedResumes.length > 0) {
                console.log(`First title: ${u.storedResumes[0].title}`);
                console.log(`URL length: ${u.storedResumes[0].url ? u.storedResumes[0].url.length : 0}`);
            }
        }
        console.log('---');
    });
    process.exit(0);
});
