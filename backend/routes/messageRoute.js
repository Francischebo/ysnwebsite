// routes/messageRoute.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST: Save message
router.post('/messages', async(req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json({ message: "Message received!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: All messages (for admin)
router.get('/messages', async(req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;