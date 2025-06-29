const express = require('express');
const router = express.Router();
const Subscriber = require('../models/subscriberModel');

router.post('/subscribe', async(req, res) => {
    const { email } = req.body;

    try {
        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already subscribed." });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.json({ success: true, message: "Subscribed successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;