const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/resume
// @desc    Create or update a user's resume
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { id, title, content } = req.body;

        let resume;
        if (id) {
            resume = await Resume.findOne({ _id: id, user: req.user._id });
            if (resume) {
                resume.title = title || resume.title;
                resume.content = content;
                await resume.save();
                return res.status(200).json({ success: true, data: resume });
            } else {
                return res.status(404).json({ message: 'Resume not found or unauthorized' });
            }
        }

        resume = await Resume.create({
            user: req.user._id,
            title: title || 'My Resume',
            content
        });

        res.status(200).json({ success: true, data: resume });
    } catch (error) {
        console.error('Save Resume Error:', error.message);
        res.status(500).json({ message: 'Server Error saving resume' });
    }
});

// @route   GET /api/resume
// @desc    Get user's latest resume
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        if (!resume) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: resume });
    } catch (error) {
        console.error('Fetch Resume Error:', error.message);
        res.status(500).json({ message: 'Server Error fetching resume' });
    }
});

// @route   GET /api/resume/all
// @desc    Get all user resumes
// @access  Private
router.get('/all', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: resumes });
    } catch (error) {
        console.error('Fetch All Resumes Error:', error.message);
        res.status(500).json({ message: 'Server Error fetching resumes' });
    }
});

// @route   DELETE /api/resume/:id
// @desc    Delete a resume
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
        if (!resume) {
            return res.status(404).json({ message: 'No resume found' });
        }
        await resume.deleteOne();
        res.status(200).json({ success: true, message: 'Resume deleted' });
    } catch (error) {
        console.error('Delete Resume Error:', error.message);
        res.status(500).json({ message: 'Server Error deleting resume' });
    }
});

module.exports = router;
