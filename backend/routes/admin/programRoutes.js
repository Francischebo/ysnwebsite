const express = require('express');
const Program = require('../../models/Program');

const router = express.Router();

// Get all programs
router.get('/programs', async(req, res) => {
    const programs = await Program.find();
    res.json(programs);
});

// Create program
router.post('/programs', async(req, res) => {
    const program = new Program(req.body);
    await program.save();
    res.json(program);
});

// Update program
router.put('/programs/:id', async(req, res) => {
    req.body.updatedAt = new Date();
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(program);
});

// Delete program
router.delete('/programs/:id', async(req, res) => {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;