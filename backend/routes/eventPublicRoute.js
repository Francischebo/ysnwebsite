router.get('/upcoming-events', async(req, res) => {
    const events = await Event.find({ status: 'Upcoming' }).limit(5);
    res.json(events);
});