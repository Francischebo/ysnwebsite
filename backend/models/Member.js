const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    university: { type: String },
    location: { type: String, required: true },
    role: { type: String, required: true },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', memberSchema);