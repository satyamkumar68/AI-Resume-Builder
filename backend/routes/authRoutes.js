const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, uploadProfileResume, deleteProfileResume } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.post('/profile/resume', protect, upload.single('resume'), uploadProfileResume);
router.delete('/profile/resume/:index', protect, deleteProfileResume);

module.exports = router;
