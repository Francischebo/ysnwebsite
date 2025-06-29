const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Upcoming'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Program', ProgramSchema);