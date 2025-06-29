// models/Summit.js
const mongoose = require('mongoose');

const SummitSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Summit', SummitSchema);