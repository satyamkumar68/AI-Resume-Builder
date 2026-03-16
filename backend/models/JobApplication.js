const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['saved', 'applied', 'interviewing', 'offer', 'rejected'],
        default: 'saved'
    },
    url: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
