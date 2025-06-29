const Applicant = require('../models/Applicant');

exports.submitApplication = async(req, res) => {
    try {
        const newApplicant = new Applicant(req.body);
        await newApplicant.save();
        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error submitting application", error: err.message });
    }
};