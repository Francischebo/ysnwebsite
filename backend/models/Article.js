const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorName: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: false },
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', articleSchema);