const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const router = express.Router();
const helmet = require("helmet");
const morgan = require("morgan");
const axios = require("axios");
const bcrypt = require("bcryptjs");
require('dotenv').config({ path: path.join(__dirname, './.env') });
const Resource = require("./models/Resource");
const Category = require("./models/Category");
const Payment = require("./models/paymentModel");
const ChapterApplication = require('./models/Chapter');

// Models
const Member = require('./models/Member');
const Chapter = require("./models/Chapter");
const Article = require("./models/Article");
const Event = require("./models/Event");
const Blog = require('./models/Blog');
const Admin = require("./models/Admin");
const Applicant = require("./models/Applicant");
const Contact = require("./models/Contact");
const Leadership = require("./models/Leadership");
const Message = require("./models/Message");
const Pdf = require("./models/Pdf");
const Program = require("./models/Program");
const Story = require("./models/Story");
const Subscriber = require("./models/Subscriber");
const Summit = require("./models/Summit");
const Testimonial = require("./models/Testimonial");



// Routes
const connectDB = require("./config/db");
const joinRoutes = require("./routes/joinRoute");
const subscribeRoute = require("./routes/subscribeRoute");
const eventRoutes = require("./routes/eventRoutes");
const programRoutes = require("./routes/admin/programRoutes");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;
const http = require("http").createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    credentials: true
}));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Root route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

// Routes
app.use('/api/chapters', require('./routes/chapterRoutes'));

// Admin route
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ---------------------------
// 2. Middleware Setup
// ---------------------------
// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Security & logging
app.use(helmet());
app.use(morgan("dev"));

// Ensure upload directories exist
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDirExists("./uploads/audio");
ensureDirExists("./uploads/images");
ensureDirExists("./uploads/pdf");
ensureDirExists('./uploads/stories');
ensureDirExists('./uploads/videos');
ensureDirExists("./uploads/resume");
ensureDirExists("./uploads/resources");
ensureDirExists("./uploads/chapterApplications");


// filepath: c:\Users\JOYLIM\Desktop\join us\join-us\server.js (or your multer config file)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdf') {
            cb(null, './uploads/pdf/');
        } else if (file.fieldname === 'photo' || file.fieldname === 'image') {
            cb(null, './uploads/images/');
        } else if (file.fieldname === 'voiceNote') {
            cb(null, './uploads/audio/');
        } else if (file.fieldname === 'story') {
            cb(null, './uploads/stories/');
        } else if (file.fieldname === 'video') {
            cb(null, './uploads/videos/');
        } else if (file.fieldname === 'resume') {
            cb(null, './uploads/resume/');
        } else if (file.fieldname === 'resources') {
            cb(null, './uploads/resources/');
        } else if (file.fieldname === 'applicationLetter') {
            cb(null, './uploads/applications/');
        } else if (file.fieldname === 'chapterApplications') {
            cb(null, './uploads/chapterApplications/');
        } else if (file.fieldname === 'pdf') { // added for consistency
            cb(null, './uploads/chapterApplications/');
        } else {
            cb(new Error('Unexpected field'));
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

function fileFilter(req, file, cb) {
    const allowedTypes = {
        file: 'application/pdf',
        pdf: 'application/pdf',
        photo: 'image/',
        image: 'image/', // <-- Add this line
        voiceNote: 'audio/',
        story: 'stories/', // This may need to be adjusted to a real mimetype
        video: 'video/',
        resources: 'application/pdf',
        resume: 'application/',
        applicationLetter: 'application/pdf'
    };
    const expectedType = allowedTypes[file.fieldname];
    if (!expectedType) return cb(new Error('Field not allowed'));

    // Check mimetype
    if (!file.mimetype.startsWith(expectedType) && expectedType !== '') {
        return cb(new Error(`Invalid file type for ${file.fieldname}`));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 1000 * 1024 * 1024 }, // 100MB
    fileFilter
});


// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('backend/uploads'));
app.use(express.static(path.join(__dirname, "backend")));
// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// ---------------------------
// 5. API Routes
// ---------------------------
const activityRoutes = require('./routes/activity');
app.use('/api/activities', activityRoutes);
// Mount route modules
app.use("/api", joinRoutes);
app.use("/api", subscribeRoute);
app.use("/api", eventRoutes);
app.use("/api", programRoutes);
app.use("/api", require("./routes/messageRoute"));
app.use("/api", require("./routes/summitRoute"));
app.use("/api", require("./routes/chapterRoutes"));
app.use("/api", require("./routes/applicantRoute"));
app.use('/uploads/applications', express.static('uploads/applications'));


const Activity = require('./models/Activity');


app.get('/api/members', async(req, res) => {
    try {
        const applicants = await Applicant.find().sort({ dateApplied: -1 });
        res.json(applicants);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch applicants.' });
    }
});

// Submit Activity (admin or user)
app.post('/api/submit-activity', upload.single('image'), async(req, res) => {
    const { chapterId, title, description, icon } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!chapterId || !title || !description) {
        return res.status(400).json({ error: 'All fields except image/icon are required.' });
    }

    try {
        const newActivity = await Activity.create({
            chapterId,
            title,
            description,
            icon: icon || "⚡",
            image,
            status: 'Pending'
        });
        res.status(201).json({ message: 'Activity submitted successfully.', activity: newActivity });
    } catch (err) {
        console.error("Activity submission error:", err);
        res.status(500).json({ error: 'Failed to submit activity.' });
    }
});

// List all activities for admin
app.get('/api/dashboard/activities', ensureAuthenticated, async(req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
});

// Get activities for a chapter (user side)
app.get('/api/activities/chapter/:chapterId', async(req, res) => {
    try {
        const activities = await Activity.find({ chapterId: req.params.chapterId, status: 'Approved' }).sort({ createdAt: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
});

// Get single activity
app.get('/api/activities/:id', async(req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ error: 'Not found' });
        res.json(activity);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve activity (admin)
app.patch('/api/admin/activities/:id/approve', ensureAuthenticated, async(req, res) => {
    try {
        const activity = await Activity.findByIdAndUpdate(
            req.params.id, { status: 'Approved' }, { new: true }
        );
        if (!activity) return res.status(404).json({ error: 'Activity not found' });
        res.json({ message: 'Activity approved', activity });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve activity' });
    }
});

// Reject activity (admin)
app.patch('/api/admin/activities/:id/reject', ensureAuthenticated, async(req, res) => {
    try {
        const activity = await Activity.findByIdAndUpdate(
            req.params.id, { status: 'Rejected' }, { new: true }
        );
        if (!activity) return res.status(404).json({ error: 'Activity not found' });
        res.json({ message: 'Activity rejected', activity });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject activity' });
    }
});

// --- Submit Program (Admin or User) ---
app.post('/api/program', async(req, res) => {
    const { name, category, description, status } = req.body;

    if (!name || !category || !description || !status) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newProgram = await Program.create({
            name,
            category,
            description,
            status
        });
        res.status(201).json({ message: 'Program submitted successfully.', program: newProgram });
    } catch (error) {
        console.error('Error saving program:', error.message);
        res.status(500).json({ error: 'Failed to submit program.' });
    }
});

// --- Admin: List All Programs ---
app.get('/api/dashboard/programs', ensureAuthenticated, async(req, res) => {
    try {
        const programs = await Program.find().sort({ createdAt: -1 });
        res.json(programs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching programs' });
    }
});

// --- Admin: Update a Program ---
app.patch('/api/admin/program/:id', ensureAuthenticated, async(req, res) => {
    const { name, category, description, status } = req.body;
    try {
        const program = await Program.findByIdAndUpdate(
            req.params.id, { name, category, description, status, updatedAt: new Date() }, { new: true, runValidators: true }
        );
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json({ message: 'Program updated', program });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update program' });
    }
});

// --- Admin: Delete a Program ---
app.delete('/api/admin/program/:id', ensureAuthenticated, async(req, res) => {
    try {
        const program = await Program.findByIdAndDelete(req.params.id);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json({ message: 'Program deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete program' });
    }
});

// --- Public: Get All Programs ---
app.get('/api/program', async(req, res) => {
    try {
        const programs = await Program.find().sort({ createdAt: -1 });
        res.json(programs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching programs' });
    }
});

// --- Public: Get Single Program ---
app.get('/api/program/:id', async(req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json(program);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching program' });
    }
});

// Articles
app.get('/api/articles', async(req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

app.post("/api/categories", async(req, res) => {
    const { name, label } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    try {
        const newCategory = new Category({ name, label });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: "Failed to save category" });
    }
});

app.get('/categories', async(req, res) => {
    try {
        const categories = await Category.find(); // Replace with your database logic
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
app.get('/api/categories', (req, res) => {
    res.json([
        { name: "legal", label: "Legal" },
        { name: "mental-health", label: "Mental Health" },
        { name: "environment", label: "Environment" },
        { name: "sanitary", label: "Sanitary Dignity" },
        { name: "chapter", label: "University Chapter" },
        { name: "policy", label: "Policy Forum" },
        { name: "events", label: "Events" },
        { name: "news", label: "News" },
        { name: "media", label: "Media" },
        { name: "report", label: "Report" },
        { name: "toolkit", label: "Toolkit" },
        { name: "training", label: "Training" },
        { name: "branding", label: "Branding" },
        { name: "publication", label: "Publication" },
        { name: "resources", label: "Resources" }
    ]);
});

// --- Unified Article Submission (Admin & User) ---

// Submit Article (from admin or user)
app.post('/api/submit-article', upload.single('image'), async(req, res) => {
    const { title, content, authorName, email } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!title || !content || !authorName || !email) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newArticle = await Article.create({
            title,
            content,
            authorName,
            email,
            image,
            status: 'Pending',
        });
        res.status(201).json({ message: 'Article submitted successfully.', article: newArticle });
    } catch (error) {
        console.error('Error saving article:', error.message);
        res.status(500).json({ error: 'Failed to submit article.' });
    }
});
// --- Admin: List All Articles ---
app.get('/api/dashboard/articles', ensureAuthenticated, async(req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

// --- Admin: Approve Article ---
app.patch('/api/admin/articles/:id/approve', ensureAuthenticated, async(req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(
            req.params.id, { status: 'Approved' }, { new: true }
        );
        if (!article) return res.status(404).json({ error: 'Article not found' });
        res.json({ message: 'Article approved', article });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve article' });
    }
});

// --- Admin: Reject Article ---
app.patch('/api/admin/articles/:id/reject', ensureAuthenticated, async(req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(
            req.params.id, { status: 'Rejected' }, { new: true }
        );
        if (!article) return res.status(404).json({ error: 'Article not found' });
        res.json({ message: 'Article rejected', article });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject article' });
    }
});

// Update an article
app.patch('/api/admin/articles/:id', ensureAuthenticated, async(req, res) => {
    const { title, content, category, imageUrl } = req.body;
    const article = await Article.findByIdAndUpdate(
        req.params.id, { title, content, category, imageUrl }, { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json(article);
});

// --- Public: Get Approved Articles ---
app.get('/api/articles', async(req, res) => {
    try {
        const articles = await Article.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});



// ...existing code...
app.get('/api/articles/:id', async(req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article || article.status !== 'Approved') {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching article' });
    }
});

app.get('/news/article/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'news-article.html'));
});;

// Get a single article (for editing)
app.get('/api/admin/articles/:id', ensureAuthenticated, async(req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json(article);
});

// Update an article
app.patch('/api/admin/articles/:id', ensureAuthenticated, async(req, res) => {
    const { title, content, category, imageUrl } = req.body;
    const article = await Article.findByIdAndUpdate(
        req.params.id, { title, content, category, imageUrl }, { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json(article);
});

// Delete an article
app.delete('/api/admin/articles/:id', ensureAuthenticated, async(req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Article deleted' });
});


// Stories/blogs
app.post('/api/submit-story', upload.single('image'), async(req, res) => {
    const { title, content, authorName, email } = req.body;
    const image = req.file ? `/uploads/stories/${req.file.filename}` : null;

    if (!title || !content || !authorName || !email) {
        return res.status(400).json({ error: 'All fields except image are required.' });
    }

    try {
        const newStory = await Story.create({
            title,
            content,
            authorName,
            email,
            image,
            status: 'Pending'
        });
        res.status(201).json({ message: 'Story submitted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to submit story.' });
    }
});


// List all stories for admin
app.get('/api/dashboard/stories', ensureAuthenticated, async(req, res) => {
    try {
        const stories = await Story.find().sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching stories' });
    }
});

// Example for Express.js
app.get('/api/stories/:id', async(req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Not found' });
        res.json(story);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve a story
app.patch('/api/admin/stories/:id/approve', ensureAuthenticated, async(req, res) => {
    try {
        const story = await Story.findByIdAndUpdate(
            req.params.id, { status: 'Approved' }, { new: true }
        );
        if (!story) return res.status(404).json({ error: 'Story not found' });
        res.json({ message: 'Story approved', story });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve story' });
    }
});

// Reject a story
app.patch('/api/admin/stories/:id/reject', ensureAuthenticated, async(req, res) => {
    try {
        const story = await Story.findByIdAndUpdate(
            req.params.id, { status: 'Rejected' }, { new: true }
        );
        if (!story) return res.status(404).json({ error: 'Story not found' });
        res.json({ message: 'Story rejected', story });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject story' });
    }
});


app.post('/api/testimonials', upload.fields([{ name: 'photo' }, { name: 'voiceNote' }]), async(req, res) => {
    try {
        const { name, role, institution, story } = req.body;
        if (!role || !institution || !story) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }
        const testimonial = new Testimonial({
            name,
            role,
            institution,
            story,
            photo: req.files.photo ? `/uploads/${req.files.photo[0].filename}` : '',
            voiceNote: req.files.voiceNote ? `/uploads/${req.files.voiceNote[0].filename}` : '',
            status: 'Pending'
        });
        await testimonial.save();
        res.json({ success: true, message: 'Testimonial submitted for review.' });
    } catch (err) {
        console.error('Testimonial POST error:', err); // <-- ADD THIS LINE
        res.status(500).json({ message: 'Server error.' });
    }
});

app.get('/api/testimonials', async(req, res) => {
    try {
        // Only fetch testimonials that are approved
        const testimonials = await Testimonial.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ message: 'Could not fetch testimonials.' });
    }
});

// Get all testimonials (for admin)
app.get('/api/admin/testimonials', async(req, res) => {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
});

// Approve/reject testimonial (admin)
app.post('/api/admin/testimonials/:id/status', async(req, res) => {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }
    await Testimonial.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
});

// Submit story
app.post('/api/stories', upload.fields([{ name: 'photo' }, { name: 'voiceNote' }]), async(req, res) => {
    try {
        const { title, content, authorName, email, image } = req.body;
        if (!title || !content || !authorName || !email || !image) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }
        const storytelling = new Story({
            title,
            content,
            authorName,
            email,
            image: req.files.photo ? `/uploads/${req.files.photo[0].filename}` : '',
            status: 'Pending'
        });
        await storytelling.save();
        res.json({ success: true, message: 'Story submitted for review.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get stories (for user page)
app.get('/api/stories', async(req, res) => {
    const stories = await Story.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.json(stories);
});


// Get all Stories (for admin)
app.get('/api/admin/stories', async(req, res) => {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
});

// Approve/reject story (admin)
app.post('/api/admin/stories/:id/status', async(req, res) => {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }
    await Story.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
});
//Subscribers

app.post('/api/subscribe', async(req, res) => {
    const { email } = req.body;
    try {
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email address.' });
        }
        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, error: 'User already subscribed.' });
        }
        // Save new subscriber
        const newSubscriber = new Subscriber({
            email,
            subscribedAt: new Date() // ✅ Set current date
        });

        await newSubscriber.save();

        res.json({ success: true, message: "Subscribed successfully!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

app.get('/api/dashboard/subscribers', async(req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching subscribers' });
    }
});
// Add Event Endpoint
app.post('/api/events', upload.single('image'), async(req, res) => {
    // Get fields from body
    const { title, description, category, date, location } = req.body;

    // Determine imageUrl
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/images/${req.file.filename}`;
    } else if (req.body.imageUrl) {
        // Convert Windows path to web path if needed
        imageUrl = req.body.imageUrl.replace(/\\/g, '/');
    }

    // Validate required fields
    if (!title || !description || !category || !date || !location || !imageUrl) {
        return res.status(400).json({ success: false, message: 'All fields including image are required.' });
    }

    try {
        const newEvent = await require('./models/Event').create({
            title,
            description,
            category,
            date,
            location,
            imageUrl,
        });

        res.status(201).json({ success: true, message: 'Event added successfully.', event: newEvent });
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ success: false, message: 'Failed to save event.' });
    }
});
app.get('/api/events', async(req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events); // ✅ Send JSON response
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching events' });
    }
});
app.get('/api/events/:id', async(req, res) => {
    try {
        const event = await require('./models/Event').findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

app.delete('/api/events/:id', async(req, res) => {
    try {
        const event = await require('./models/Event').findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
});


app.put('/api/events/:id', async(req, res) => {
    const { title, description, category, date, location, imageUrl } = req.body;

    try {
        const updatedEvent = await require('./models/Event').findByIdAndUpdate(
            req.params.id, { title, description, category, date, location, imageUrl }, { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        res.json({ success: true, message: 'Event updated successfully.', event: updatedEvent });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Failed to update event.' });
    }
});


// PDF Upload
// Unified PDF/resource upload endpoint
app.post('/api/upload', (req, res, next) => {
    // Detect if it's a single or multi upload based on Content-Type and fields
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Check if 'pdf' is the only file field
        if (req.query.single === 'true') {
            upload.single('pdf')(req, res, next);
        } else {
            upload.fields([
                { name: 'pdf', maxCount: 1 },
                { name: 'photo', maxCount: 1 },
                { name: 'voiceNote', maxCount: 1 },
                { name: 'story', maxCount: 1 },
                { name: 'videos', maxCount: 1 }
            ])(req, res, next);
        }
    } else {
        res.status(400).json({ error: 'Invalid content type' });
    }
}, async(req, res) => {
    const { title, description, category } = req.body;
    if (!title, !description) return res.status(400).json({ error: 'Title and description are required' });

    // Handle single file upload (pdf)
    if (req.file) {
        try {
            const newFile = new Pdf({
                title,
                description,
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileType: 'pdf',
                category
            });
            await newFile.save();
            return res.status(201).json({ message: 'Upload successful', data: newFile });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to save file info' });
        }
    }

    // Handle multi-field upload
    let fileType = '',
        filename = '',
        originalName = '';
    const fileFields = ['pdf', 'photo', 'voiceNote', 'story', 'videos'];
    for (let field of fileFields) {
        if (req.files && req.files[field]) {
            const file = req.files[field][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = field;
            break;
        }
    }
    if (!fileType) return res.status(400).json({ error: 'No valid file uploaded' });

    try {
        const newFile = new Pdf({ title, description, filename, originalName, category, fileType });
        await newFile.save();
        res.status(201).json({ message: 'Upload successful', data: newFile });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to save file info' });
    }
});

// Blog upload route
app.post('/api/blogs', upload.fields([
    { name: 'pdf' },
    { name: 'photo' },
    { name: 'voiceNote' }
]), async(req, res) => {
    try {
        const { title, description } = req.body;
        const pdf = req.files.pdf ? `/uploads/${req.files.pdf[0].filename}` : '';
        const photo = req.files.photo ? `/uploads/${req.files.photo[0].filename}` : '';
        const voiceNote = req.files.voiceNote ? `/uploads/${req.files.voiceNote[0].filename}` : '';

        // Save to DB
        const blog = new Blog({
            title,
            description,
            pdf,
            photo,
            voiceNote,
            status: 'Pending'
        });
        await blog.save();

        res.json({ success: true, message: 'Blog uploaded successfully!' });
    } catch (err) {
        console.error('Blog upload error:', err);
        res.status(500).json({ error: 'Failed to upload blog.' });
    }
});

app.get('/api/blogs', async(req, res) => {
    try {
        const blogs = await Blog.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'Could not retrieve blogs' });
    }
});


app.get('/api/admin/blogs', async(req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'Could not retrieve blogs' });
    }
});


// Approve a blog
app.patch('/api/admin/blogs/:id/approve', async(req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id, { status: 'Approved' }, { new: true }
        );
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.json({ message: 'Blog approved', blog });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve blog' });
    }
});

// Reject a blog
app.patch('/api/admin/blogs/:id/reject', async(req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id, { status: 'Rejected' }, { new: true }
        );
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.json({ message: 'Blog rejected', blog });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject blog' });
    }
});

app.get('/api/articles/:id', async(req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json(article);
});

app.get('/news/article/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'news-article.html'));
});

// Get All PDFs
app.get('/api/pdfs', async(req, res) => {
    try {
        const pdfs = await Pdf.find().sort({ uploadDate: -1 });
        res.json(pdfs);
    } catch (err) {
        res.status(500).json({ error: 'Could not retrieve files' });
    }
});

// Delete PDF
app.delete('/api/pdfs/:id', ensureAuthenticated, async(req, res) => {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "File not found" });

    const filePath = path.join(__dirname, 'uploads/pdf', pdf.filename);
    fs.unlinkSync(filePath); // Delete file from disk
    await Pdf.findByIdAndDelete(req.params.id);

    res.json({ message: "PDF deleted successfully" });
});

app.get("/api/download/:id", async(req, res) => {
    try {
        const pdf = await Pdf.findById(req.params.id);
        if (!pdf) return res.status(404).send("File not found");

        const filePath = path.join(__dirname, process.env.UPLOAD_DIR, pdf.filename);
        if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

        res.header("Content-Type", "application/pdf");
        res.header(
            "Content-Disposition",
            `attachment; filename="${pdf.originalName}"`
        );
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

//6. Routes
// ---------------------------
// Leadership Position Schema
const leadershipSchema = new mongoose.Schema({
    position: String,
    status: { type: String, default: 'vacant' },
    applicantName: String,
    applicantEmail: String,
    resume: String,
});


// POST /api/vacant-positions
app.post('/api/vacant-positions', async(req, res) => {
    const { position } = req.body;
    if (!position) return res.status(400).json({ error: 'Position title is required.' });
    try {
        const leadership = new Leadership({ position, status: 'vacant' });
        await leadership.save();
        res.status(201).json({ message: 'Vacant position posted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to post position.' });
    }
});
// Routes
// 1. Get Vacant Positions
app.get('/api/vacant-positions', async(req, res) => {
    try {
        const positions = await Leadership.find({ status: 'vacant' });
        res.json(positions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
});

// 2. Submit Application
app.post('/api/apply', upload.single('resume'), async(req, res) => {
    const { position, applicantName, applicantEmail } = req.body;
    const resume = req.file ? req.file.path : null;

    try {
        const positionToUpdate = await Leadership.findOne({ position, status: 'vacant' });
        if (!positionToUpdate) {
            return res.status(400).json({ error: 'Position not available' });
        }

        positionToUpdate.status = 'applied';
        positionToUpdate.applicantName = applicantName;
        positionToUpdate.applicantEmail = applicantEmail;
        positionToUpdate.resume = resume;

        await positionToUpdate.save();
        res.json({ message: 'Application submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// Get all leadership applications (status: 'applied')
app.get('/api/applications', async(req, res) => {
    try {
        const applications = await Leadership.find({ status: 'applied' });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// 3. Render Admin Dashboard
app.get('/admin/dashboard', async(req, res) => {
    try {
        const applications = await Leadership.find({ status: 'applied' });
        res.render('dashboard', { applications });
    } catch (err) {
        res.status(500).send('Failed to load dashboard');
    }
});

// POST: Create a new resource
app.post('/api/resources', upload.single('resources'), async(req, res) => {
    try {
        const { title, description, category } = req.body;
        const resources = req.file ? req.file.path : null;
        if (!title || !description || !category || !resources) {
            return res.status(400).json({ error: 'All fields and file are required.' });
        }
        const newResource = await Resource.create({
            title,
            description,
            category,
            resources,
            createdAt: new Date()
        });
        res.status(201).json({ message: 'Resource uploaded successfully.', resource: newResource });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to upload resource.' });
    }
});


app.get('/api/resources', async(req, res) => {
    try {
        const resources = await Resource.find(); // assuming you're using Mongoose
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch resources.' });
    }
});


app.get('/api/resources/download/:id', async(req, res) => {
    try {
        const resourceId = req.params.id;

        // Fetch the resource by ID
        const resource = await Resource.findById(resourceId);

        if (!resource || !resource.resources) {
            return res.status(404).json({ error: 'Resource or file not found.' });
        }

        // Full path to the file stored on the server
        const filePath = path.resolve(resource.resources); // e.g., uploads/filename.pdf

        // Send the file to the client
        res.download(filePath);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to download file.' });
    }
});

// PUT: Edit a resource
app.put('/api/resources/:id', upload.single('resources'), async(req, res) => {
    try {
        const { title, description, category } = req.body;
        const update = { title, description, category };
        if (req.file) update.filer = `/uploads/resources/${req.filer.filename}`;
        const updated = await Resource.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!updated) return res.status(404).json({ error: 'Resource not found.' });
        res.json({ message: 'Resource updated.', resource: updated });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to update resource.' });
    }
});

// DELETE: Delete a resource
app.delete('/api/resources/:id', async(req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) return res.status(404).json({ error: 'Resource not found.' });
        // Optionally, delete the file from disk
        if (resource.fileUrl) {
            const filePath = path.join(__dirname, resource.fileUrl);
            fs.unlink(filePath, () => {});
        }
        res.json({ message: 'Resource deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to delete resource.' });
    }
});

// Contact Route
app.post("/api/contact", async(req, res) => {
    const { fullName, email, phone, subject, message, newsletter } = req.body;
    if (!fullName || !email || !subject || !message) {
        return res
            .status(400)
            .json({ success: false, message: "All required fields must be filled." });
    }
    try {
        const newContact = new Contact({
            fullName,
            email,
            phone,
            subject,
            message,
            newsletter,
        });
        await newContact.save();
        return res.json({
            success: true,
            message: "Message saved successfully.",
            data: newContact,
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ success: false, message: "Server error. Please try again later." });
    }
});

app.get("/api/contact", async(req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to retrieve messages." });
    }
});


router.post('/join', async(req, res) => {
    try {
        const { fullName, email, phone, university, location, role, message } = req.body;
        if (!fullName || !email || !phone || !role || !location) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }
        // Save to Members collection
        const newMember = await Member.create({
            fullName,
            email,
            phone,
            university,
            location,
            role,
            message
        });
        res.status(201).json({ message: 'Application received!', member: newMember });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});
// ...existing code...


// ...existing code...
router.get('/members', async(req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch members.' });
    }
});
// ...existing code...

// Submit a new chapter application (with optional application letter)
app.post('/api/chapters', upload.single('cApplications'), async(req, res) => {
    try {
        const { university, location, establishedYear, members, description } = req.body;
        const cApplications = req.file ? `/uploads/chapterApplications/${req.file.filename}` : null;

        console.log("REQ.BODY:", req.body); // 👈 Make sure these fields exist
        console.log("REQ.FILE:", req.file);

        const year = parseInt(establishedYear);
        const memberCount = parseInt(members);

        if (!university || !location || isNaN(year) || isNaN(memberCount) || !description) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const application = await ChapterApplication.create({
            university,
            location,
            establishedYear,
            members,
            description,
            cApplications,
            status: 'Pending' // <-- Set status to Pending
        });

        res.status(201).json({ message: 'Application submitted successfully!', application });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit application.' });
    }
});

// Admin: List all chapter applications (for review)
app.get('/api/admin/chapter-applications', ensureAuthenticated, async(req, res) => {
    try {
        const applications = await ChapterApplication.find().sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// Admin: Approve a chapter application
app.patch('/api/admin/chapter-applications/:id/approve', ensureAuthenticated, async(req, res) => {
    try {
        const application = await ChapterApplication.findByIdAndUpdate(
            req.params.id, { status: 'Approved' }, { new: true }
        );
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Chapter application approved', application });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve application.' });
    }
});

// Admin: Reject a chapter application
app.patch('/api/admin/chapter-applications/:id/reject', ensureAuthenticated, async(req, res) => {
    try {
        const application = await ChapterApplication.findByIdAndUpdate(
            req.params.id, { status: 'Rejected' }, { new: true }
        );
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Chapter application rejected', application });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reject application.' });
    }
});

// Admin: Delete a chapter application
app.delete('/api/admin/chapter-applications/:id', ensureAuthenticated, async(req, res) => {
    try {
        const application = await ChapterApplication.findByIdAndDelete(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Chapter application deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete application.' });
    }
});

// Public: List only approved chapters for users to view
app.get('/api/chapters', async(req, res) => {
    try {
        const chapters = await ChapterApplication.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.json(chapters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chapters.' });
    }
});

app.get('/api/chapter-applications/:id/download', async(req, res) => {
    try {
        const chapter = await ChapterApplication.findById(req.params.id);
        if (!chapter || !chapter.cApplications) {
            return res.status(404).send('File not found');
        }

        const filePath = path.join(__dirname, chapter.cApplications); // adjust path if needed
        res.download(filePath); // Sends the file to the browser as a download
    } catch (err) {
        res.status(500).send('Server error');
    }
});
// ...existing code...

// POST /api/summits
app.post('/api/summits', async(req, res) => {
    try {
        const summit = await Summit.create(req.body);
        res.status(201).json(summit);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save summit.' });
    }
});

// GET /api/summits
app.get('/api/summits', async(req, res) => {
    try {
        const summits = await Summit.find().sort({ year: -1, date: -1 });
        res.json(summits);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summits.' });
    }
});


// Auth
app.post('/login', async(req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).send('Invalid credentials');

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).send('Invalid credentials');

        req.session.adminId = admin._id;
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send('Internal server error');
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.session.adminId) return next();
    res.redirect('/admin/login.html');
}

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin', 'login.html'));
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../admin', 'index.html'));
});


// M-Pesa
const generateToken = async(req, res, next) => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_SECRET_KEY}`).toString("base64");
    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials ", {
            headers: { Authorization: `Basic ${auth}` }
        });
        req.token = response.data.access_token;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Failed to generate token' });
    }
};

app.post("/stk", generateToken, async(req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;
    const date = new Date();
    const timestamp = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_PAYBILL;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    try {
        const result = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest ", {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerBuyGoodsOnline",
            Amount: amount,
            PartyA: `254${phone}`,
            PartyB: shortcode,
            PhoneNumber: `254${phone}`,
            CallBackURL: "https://your-ngrok-url/callback",
            AccountReference: `254${phone}`,
            TransactionDesc: "Payment for Youth Synergy Network"
        }, {
            headers: { Authorization: `Bearer ${req.token}` }
        });
        res.status(200).json(result.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// GET /transactions - Return list of payments
app.get("/transactions", async(req, res) => {
    try {
        const transactions = await Payment.find().sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err.message);
        res.status(500).json({ error: "Failed to load transactions" });
    }
});

app.post("/callback", (req, res) => {
    const callbackData = req.body;
    console.log(callbackData.Body);

    if (!callbackData.Body.stkCallback.CallbackMetadata) {
        console.log(callbackData.Body);
        res.json("Okay");
        return;
    }

    const phone = callbackData.Body.stkCallback.CallbackMetadataItem[4].value;
    const trnx_id = callbackData.Body.stkCallback.CallbackMetadataItem[1].value;
    const amount = callbackData.Body.stkCallback.CallbackMetadataItem[0].value;

    const payment = new Payment({ number: phone, amount, trnx_id });
    payment.save()
        .then(() => console.log("Payment saved"))
        .catch((err) => console.error(err));

    res.status(200).json({ received: true });
});



// ---------------------------
connectDB().then(() => {
    http.listen(PORT, () => {
        console.log(`✅ Server running at http://localhost:${PORT}`);
    });
});
