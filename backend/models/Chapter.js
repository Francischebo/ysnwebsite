const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    university: { type: String, required: true },
    location: { type: String, required: true },
    establishedYear: { type: Number, min: 2000, max: 2025, required: true },
    members: { type: Number, min: 0, required: true },
    description: { type: String, required: true },
    pdfPath: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

module.exports = mongoose.model('Chapter', chapterSchema);