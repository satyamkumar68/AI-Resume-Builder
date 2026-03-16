const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get top ranked users
// @route   GET /api/leaderboard
// @access  Public (or protected if we want)
const getLeaderboard = asyncHandler(async (req, res) => {
    const { category } = req.query;

    // Only fetch users who opted in and have a score
    const filter = { leaderboardOptIn: true, globalRankScore: { $gt: 0 } };

    if (category && category !== 'All') {
        filter.categoryTrack = category;
    }

    const leaderboard = await User.find(filter)
        .sort({ globalRankScore: -1 })
        .limit(100) // Top 100
        .select('name profilePhoto globalRankScore tier categoryTrack updatedAt');

    // Anonymous handling: if the user opted in, we show their name and photo.
    // If we wanted deeper anonymity, we could add an isAnonymous flag, but for now leaderboardOptIn suffices.

    res.json({
        success: true,
        count: leaderboard.length,
        data: leaderboard
    });
});

module.exports = { getLeaderboard };
