const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: { type: String, default: 'Anonymous' },
    role: { type: String, required: true },
    institution: { type: String, required: true },
    story: { type: String, required: true },
    photo: { type: String },
    voiceNote: { type: String },
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Testimonial', testimonialSchema);