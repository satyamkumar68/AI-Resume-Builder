const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'My Resume'
    },
    content: {
        // Schema tailored to the ATS builder form
        contact: {
            fullName: String,
            email: String,
            phone: String,
            linkedin: String,
            portfolio: String
        },
        summary: String,
        theme: {
            type: String,
            default: 'modern'
        },
        experience: [{
            id: String,
            company: String,
            role: String,
            startDate: String,
            endDate: String,
            description: String
        }],
        education: [{
            id: String,
            institution: String,
            degree: String,
            year: String
        }],
        skills: [String],
        projects: [{
            id: String,
            title: String,
            link: String,
            description: String
        }]
    },
    analysisAnalysis: {
        score: { type: Number, default: 0 },
        missingKeywords: [String],
        feedback: String
    }
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
