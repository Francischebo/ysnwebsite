const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorName: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String },
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Story', storySchema);