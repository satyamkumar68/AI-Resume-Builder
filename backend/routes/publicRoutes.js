const express = require('express');
const router = express.Router();
const { getPublicProfile } = require('../controllers/publicController');

// @route   GET /api/public/profile/:id
// @desc    Get public profile data for a user by their ID
// @access  Public
router.get('/profile/:id', getPublicProfile);

module.exports = router;
