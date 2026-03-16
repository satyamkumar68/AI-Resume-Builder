const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobRole: {
        type: String,
        required: true
    },
    questions: [{
        questionText: String,
        userAnswer: String,
        aiEvaluation: String,
        score: Number
    }],
    overallScore: {
        type: Number,
        default: 0
    },
    overallFeedback: String
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview;
