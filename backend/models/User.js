const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
        default: ''
    },
    age: {
        type: Number,
        default: null
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    globalRankScore: {
        type: Number,
        default: 0
    },
    tier: {
        type: String,
        enum: ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        default: 'Unranked'
    },
    categoryTrack: {
        type: String,
        enum: ['Software Engineering', 'Data Science', 'Design', 'Product Management', 'Marketing', 'Other'],
        default: 'Software Engineering'
    },
    leaderboardOptIn: {
        type: Boolean,
        default: false
    },
    storedResumes: [{
        title: { type: String, required: true },
        url: { type: String, required: true }
    }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
