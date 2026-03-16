const mongoose = require('mongoose');
const fs = require('fs');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/ai_resume_platform');
    const db = mongoose.connection.db;
    const docs = await db.collection('resumes').find({}).sort({ createdAt: -1 }).limit(2).toArray();
    fs.writeFileSync('output.json', JSON.stringify(docs, null, 2));
    process.exit();
}
check();
