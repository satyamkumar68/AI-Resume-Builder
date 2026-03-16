const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { useCloudinary } = require('../utils/upload');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Input Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Please provide valid email and password' });
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    res.json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
            user.gender = req.body.gender || user.gender;
            user.age = req.body.age !== undefined ? req.body.age : user.age;
            user.profilePhoto = req.body.profilePhoto !== undefined ? req.body.profilePhoto : user.profilePhoto;
            user.categoryTrack = req.body.categoryTrack || user.categoryTrack;
            user.leaderboardOptIn = req.body.leaderboardOptIn !== undefined ? req.body.leaderboardOptIn : user.leaderboardOptIn;

            if (req.body.storedResumes !== undefined) {
                user.storedResumes = req.body.storedResumes;
            }

            if (req.body.password) {
                if (!req.body.oldPassword) {
                    return res.status(400).json({ message: 'Please provide your current password to set a new password' });
                }
                if (!(await user.matchPassword(req.body.oldPassword))) {
                    return res.status(401).json({ message: 'Current password is incorrect' });
                }
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                age: updatedUser.age,
                profilePhoto: updatedUser.profilePhoto,
                globalRankScore: updatedUser.globalRankScore,
                tier: updatedUser.tier,
                categoryTrack: updatedUser.categoryTrack,
                leaderboardOptIn: updatedUser.leaderboardOptIn,
                storedResumes: updatedUser.storedResumes,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Upload resume PDF file to profile
// @route   POST /api/auth/profile/resume
// @access  Private
const uploadProfileResume = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            let fileUrl = req.file.path;
            if (!useCloudinary) {
                // If local fallback, construct the full URL
                fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            }

            // Append new resume
            user.storedResumes.push({
                title: req.file.originalname.replace('.pdf', ''),
                url: fileUrl
            });

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                age: updatedUser.age,
                profilePhoto: updatedUser.profilePhoto,
                globalRankScore: updatedUser.globalRankScore,
                tier: updatedUser.tier,
                categoryTrack: updatedUser.categoryTrack,
                leaderboardOptIn: updatedUser.leaderboardOptIn,
                storedResumes: updatedUser.storedResumes,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Upload Resume Error:', error);
        res.status(500).json({ message: 'Server error uploading resume' });
    }
};

// @desc    Delete a stored resume link by index
// @route   DELETE /api/auth/profile/resume/:index
// @access  Private
const deleteProfileResume = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const index = parseInt(req.params.index);
            if (index >= 0 && index < user.storedResumes.length) {
                user.storedResumes.splice(index, 1);
                const updatedUser = await user.save();

                res.json({
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    gender: updatedUser.gender,
                    age: updatedUser.age,
                    profilePhoto: updatedUser.profilePhoto,
                    globalRankScore: updatedUser.globalRankScore,
                    tier: updatedUser.tier,
                    categoryTrack: updatedUser.categoryTrack,
                    leaderboardOptIn: updatedUser.leaderboardOptIn,
                    storedResumes: updatedUser.storedResumes,
                    token: generateToken(updatedUser._id),
                });
            } else {
                res.status(400).json({ message: 'Invalid resume index' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Delete Resume Error:', error);
        res.status(500).json({ message: 'Server error deleting resume' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    uploadProfileResume,
    deleteProfileResume,
};
