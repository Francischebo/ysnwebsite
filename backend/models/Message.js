// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);