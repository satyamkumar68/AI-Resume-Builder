const express = require('express');
const router = express.Router();
const { getUserAnalytics, saveInterview, saveResumeAnalysis, evaluateGlobalRank } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/dashboard-stats').get(protect, getUserAnalytics);
router.route('/interviews').post(protect, saveInterview);
router.route('/resume-analysis').post(protect, saveResumeAnalysis);
router.route('/rank').post(protect, evaluateGlobalRank);

module.exports = router;
