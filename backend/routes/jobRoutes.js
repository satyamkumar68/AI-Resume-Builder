const express = require('express');
const router = express.Router();
const { createApplication, getApplications, updateApplication, deleteApplication } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createApplication)
    .get(protect, getApplications);

router.route('/:id')
    .put(protect, updateApplication)
    .delete(protect, deleteApplication);

module.exports = router;
