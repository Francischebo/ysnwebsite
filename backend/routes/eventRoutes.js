const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/api/events', async(req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching events' });
    }
});

// Add other routes: POST, PUT, DELETE, etc.

module.exports = router;