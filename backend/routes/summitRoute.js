// routes/summitRoute.js
const express = require('express');
const router = express.Router();
const Summit = require('../models/Summit');

// GET All Summits (for client & admin)
router.get('/summits', async(req, res) => {
    try {
        const summits = await Summit.find().sort({ year: -1 });
        res.json(summits);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching summits' });
    }
});

// POST New Summit (Admin Only)
router.post('/summits', async(req, res) => {
    const { year, title, date, location, description, imageUrl } = req.body;
    try {
        const newSummit = new Summit({ year, title, date, location, description, imageUrl });
        await newSummit.save();
        res.status(201).json(newSummit);
    } catch (err) {
        res.status(500).json({ message: 'Failed to save summit' });
    }
});

// DELETE Summit by ID
router.delete('/summits/:id', async(req, res) => {
    try {
        await Summit.findByIdAndDelete(req.params.id);
        res.json({ message: 'Summit deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting summit' });
    }
});

// UPDATE Summit
router.put('/summits/:id', async(req, res) => {
    try {
        const updated = await Summit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating summit' });
    }
});

module.exports = router;