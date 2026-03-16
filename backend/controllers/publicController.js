const User = require('../models/User');

// @desc    Get public profile data for a user by their ID
// @route   GET /api/public/profile/:id
// @access  Public
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Only return safe, non-sensitive data
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    gender: user.gender,
                    profilePhoto: user.profilePhoto,
                    globalRankScore: user.globalRankScore,
                    tier: user.tier,
                    categoryTrack: user.categoryTrack,
                    storedResumes: user.storedResumes, // Safe public links to uploaded PDFs
                    // Excluded: email, phone, age, password, etc.
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Fetch Public Profile Error:', error.message);
        // Handle Invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(500).json({ success: false, message: 'Server error fetching public profile' });
    }
};

module.exports = {
    getPublicProfile,
};
