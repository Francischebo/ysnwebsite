const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    pdf: { type: String }, // Path to uploaded PDF file
    photo: { type: String }, // Path to uploaded image
    voiceNote: { type: String }, // Path to uploaded audio
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);