const JobApplication = require('../models/JobApplication');

exports.createApplication = async (req, res) => {
    try {
        const { company, role, status, url, location, notes } = req.body;
        const newApp = new JobApplication({
            user: req.user.id,
            company,
            role,
            status,
            url,
            location,
            notes
        });
        const savedApp = await newApp.save();
        res.status(201).json({ success: true, data: savedApp });
    } catch (error) {
        console.error('Create application error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const apps = await JobApplication.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: apps });
    } catch (error) {
        console.error('Get applications error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateApplication = async (req, res) => {
    try {
        let app = await JobApplication.findById(req.params.id);

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Make sure user owns the application
        if (app.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Whitelist allowed fields to prevent Mass Assignment vulnerability
        const allowedFields = ['company', 'role', 'status', 'url', 'location', 'notes'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        app = await JobApplication.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        res.json({ success: true, data: app });
    } catch (error) {
        console.error('Update application error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteApplication = async (req, res) => {
    try {
        const app = await JobApplication.findById(req.params.id);

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (app.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await app.deleteOne();
        res.json({ success: true, message: 'Application removed' });
    } catch (error) {
        console.error('Delete application error', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
