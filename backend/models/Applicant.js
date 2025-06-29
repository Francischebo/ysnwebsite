// models/Applicant.js
const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    university: { type: String },
    location: { type: String, required: true },
    role: { type: String, required: true },
    message: { type: String },
    dateApplied: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Applicant', ApplicantSchema);