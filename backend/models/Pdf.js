const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    filename: { type: String, required: true },
    originalName: { type: String, required: true }, // e.g., chapters, events, media, news, resources
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pdf", pdfSchema);