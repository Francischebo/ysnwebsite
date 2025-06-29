// routes/applicants.js
const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');

// POST: Submit new applicant
router.post('/apply', async(req, res) => {
    try {
        const applicant = new Applicant(req.body);
        await applicant.save();
        res.status(201).json({ message: "Application received!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all applicants
router.get('/applicants', async(req, res) => {
    try {
        const applicants = await Applicant.find().sort({ dateApplied: -1 });
        res.json(applicants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;