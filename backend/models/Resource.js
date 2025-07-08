const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g., 'toolkit', 'report', etc.
    resources: { type: String, required: true },
    originalName: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resource", resourceSchema);