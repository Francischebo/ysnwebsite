const Chapter = require('../models/Chapter');

exports.submitChapter = async(req, res) => {
    try {
        const { university, location, establishedYear, members, description } = req.body;
        const pdfPath = req.file ? req.file.path : null;

        const chapter = new Chapter({
            university,
            location,
            establishedYear,
            members,
            description,
            pdfPath
        });

        await chapter.save();
        res.status(201).json({ message: 'Chapter submitted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit chapter' });
    }
};

exports.getPendingChapters = async(req, res) => {
    try {
        const chapters = await Chapter.find({ status: 'pending' });
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch chapters' });
    }
};

exports.updateChapterStatus = async(req, res) => {
    try {
        const { id, status } = req.body;
        await Chapter.findByIdAndUpdate(id, { status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update chapter status' });
    }
};

exports.getApprovedChapters = async(req, res) => {
    try {
        const chapters = await Chapter.find({ status: 'approved' });
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch approved chapters' });
    }
};