const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "⚡" }, // Emoji or icon string
    image: { type: String }, // Optional image path
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);