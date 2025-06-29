// controllers/applicantController.js
const Applicant = require('../models/Applicant');

exports.getAllApplicants = async(req, res) => {
    try {
        const applicants = await Applicant.find().sort({ dateApplied: -1 });
        res.json(applicants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};