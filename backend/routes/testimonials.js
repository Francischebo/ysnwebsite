const Testimonial = require('./models/Testimonial');

app.post('/api/testimonials', (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { name, role, institution, story } = req.body;

        if (!role || !institution || !story) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        if (story.length < 250 || story.length > 500) {
            return res.status(400).json({ success: false, message: 'Story must be between 250 and 500 words.' });
        }

        if (!req.body.consent) {
            return res.status(400).json({ success: false, message: 'You must consent to publish your testimonial.' });
        }

        try {
            const testimonial = new Testimonial({
                name: name || 'Anonymous',
                role,
                institution,
                story,
                voiceNote: req.files ? .voiceNote ? `/uploads/audio/${req.files.voiceNote[0].filename}` : null,
                photo: req.files ? .photo ? `/uploads/images/${req.files.photo[0].filename}` : null
            });

            await testimonial.save();

            return res.json({
                success: true,
                message: 'Thank you! Your testimonial has been received.',
                data: testimonial
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
        }
    });
});


app.get('/api/testimonials', async(req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve testimonials' });
    }
});