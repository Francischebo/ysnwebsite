const Event = require('../models/Event');

// controllers/eventController.js
exports.createEvent = async(req, res) => {
    const { title, description, category, date, location, imageUrl } = req.body;

    if (!title || !description || !category || !date) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const created = await Event.create({
            title,
            description,
            category,
            date: new Date(date), // Convert string to Date
            location,
            imageUrl
        });
        res.json({ success: true, event: created });
    } catch (err) {
        console.error("Error creating event:", err); // Log error
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllEvents = async(req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.render('events-index', { events });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};

// filepath: c:\Users\JOYLIM\Desktop\join us\join-us\controllers\eventController.js
exports.getEventById = async(req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.getAllEventsForAdmin = async(req, res) => {
    try {
        const events = await Event.find().sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateEvent = async(req, res) => {
    const { id } = req.params;
    try {
        const updated = await Event.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, event: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteEvent = async(req, res) => {
    const { id } = req.params;
    try {
        await Event.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};