const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Example: Get all activities (you can expand as needed)
router.get('/', async(req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
});

module.exports = router;