// ---------------------------
// 1. Dependencies & Setup
// ---------------------------

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const Testimonial = require('../../models/Testimonial');
const eventRouter = require('../../routes/eventRoutes');
const Article = require('../../models/Article');
const Story = require('../../models/Story');



require("dotenv").config();

// 2. App Initialization
// ---------------------------

const app = express();
const PORT = process.env.PORT || 8000;

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*"
    }
});

// 4. Database Connection
// ---------------------------
const categorySchema = new mongoose.Schema({
    name: String,
    label: String
});
const Category = mongoose.model('Category', categorySchema);



// Routes
const connectDB = require("../../config/db");
const joinRoutes = require("../../routes/joinRoute");
const subscribeRoute = require("../../routes/subscribeRoute");
const eventRoutes = require("../../routes/eventRoutes");
const programRoutes = require("../../routes/admin/programRoutes");
const Message = require("../../models/Message");
const Leadership = require('../../models/Leadership');


// API Routes
app.use('/api', require('../../routes/applicantRoute'));
app.use('/api', require('../../routes/messageRoute'));
app.use('/api', require('../../routes/summitRoute'));
app.use('/api', require('../../routes/chapterRoute'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Models
const Admin = require("../../models/Admin");
const Contact = require("../../models/Contact");
const Payment = require("../../models/paymentModel");


// Socket.IO Events
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // Forward user message to admin
    socket.on("new_message", (data) => {
        io.emit("new_message", data);
    });
    // User sends live message
    socket.on("user_typing", (data) => {
        io.emit("user_typing", data);
    });
    // Coordinator replies
    socket.on("coordinator_reply", (data) => {
        io.emit("coordinator_reply", data);
    });
});
// Ensure upload directories exist
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDirExists("./uploads/audio");
ensureDirExists("./uploads/images");
ensureDirExists("./uploads/pdf");
ensureDirExists('./uploads/stories');
ensureDirExists('./uploads/videos');

// 3. Middleware
// ---------------------------

// Session middleware setup
app.use(session({
    secret: process.env.SESSION_SECRET, // Change this to something secure
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", subscribeRoute);
app.use("/api", require("../../routes/messageRoute"));
app.use("/api", require("../../routes/summitRoute"));
app.use("/api", require("../../routes/chapterRoute"));
app.use("/api", joinRoutes);
app.use("/api/admin", eventRoutes);
app.use("/api/admin", programRoutes);
app.use('/events', eventRouter);
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
// API to fetch articles as JSON
app.get('/api/articles', async(req, res) => {
    try {
        const articles = await require('../../models/Article').find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

app.get('/news', async(req, res) => {
            try {
                const articles = await require('../../models/Article').find().sort({ createdAt: -1 });

                if (!articles || articles.length === 0) {
                    return res.status(404).send('No articles found');
                }

                let articlesHTML = articles.map(article => `
            <div class="category-card">
                <div class="category-content">
                    <h3>${article.title}</h3>
                    ${article.image ? `<img src="${article.image}" alt="${article.title}" style="max-width: 100%; height: auto;">` : ''}
                    <p>${article.content.substring(0, 150)}...</p>
                    <a href="/news/article/${article._id}" class="btn btn-primary">Read More</a>
                </div>
            </div>
        `).join('');

        res.send(`
        `);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).send('Error fetching articles');
    }
});


// Approve an article
app.patch('/api/admin/articles/:id/approve', ensureAuthenticated, async(req, res) => {
    try {
        await require('../../models/Article').findByIdAndUpdate(req.params.id, { status: 'Approved' });
        res.json({ message: 'Article approved.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve article.' });
    }
});

// Reject an article
app.patch('/api/admin/articles/:id/reject', ensureAuthenticated, async(req, res) => {
    try {
        await require('../../models/Article').findByIdAndUpdate(req.params.id, { status: 'Rejected' });
        res.json({ message: 'Article rejected.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject article.' });
    }
});


// Define storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdf') {
            cb(null, './uploads/pdf/');
        } else if (file.fieldname === 'photo') {
            cb(null, './uploads/images/');
        } else if (file.fieldname === 'voiceNote') {
            cb(null, './uploads/audio/');
        } else if (file.fieldname === 'story') {
            cb(null, './uploads/stories/');
        } else if (file.fieldname === 'video') {
            cb(null, './uploads/videos/');
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

// File type validation
function fileFilter(req, file, cb) {
    const allowedMimeTypes = {
        pdf: 'application/pdf',
        photo: 'image/',
        voiceNote: 'audio/',
        story: 'stories/', // Add 'story' for story images
        videos: 'videos/'
    };

    const expectedMimeType = allowedMimeTypes[file.fieldname];

    if (!expectedMimeType) return cb(new Error('Field not allowed'));

    if (!file.mimetype.startsWith(expectedMimeType)) {
        return cb(new Error(`Invalid file type for ${file.fieldname}`));
    }

    cb(null, true);
}

// Define PDF Model
const pdfSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    category: { type: String, required: true }, // e.g., chapters, events, media, news, resources
    uploadDate: { type: Date, default: Date.now }
});

const Pdf = mongoose.model('Pdf', pdfSchema);


// Configure Multer for multiple fields
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter
});

app.post('/api/upload', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 },
    { name: 'story', maxCount: 1 },
    { name: 'videos', maxCount: 1 }
]), async(req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !category) {
            return res.status(400).json({ error: "Title and category are required." });
        }

        let filename = '';
        let originalName = '';
        let fileType = '';

        if (req.files['pdf']) {
            const file = req.files['pdf'][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = 'pdf';
        } else if (req.files['photo']) {
            const file = req.files['photo'][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = 'image';
        } else if (req.files['voiceNote']) {
            const file = req.files['voiceNote'][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = 'audio';
        } else if (req.files['story']) {
            const file = req.files['story'][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = 'stories';
        } else if (req.files['videos']) {
            const file = req.files['videos'][0];
            filename = file.filename;
            originalName = file.originalname;
            fileType = 'videos';
        } else {
            return res.status(400).json({ error: "No valid file uploaded" });
        }

        const newFile = new Pdf({
            title,
            description,
            filename,
            originalName,
            category,
            fileType
        });

        await newFile.save();
        res.status(201).json({ message: "Upload successful", data: newFile });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).json({ error: "Failed to save file info" });
    }
});


app.get('/api/pdfs', async(req, res) => {
    try {
        const files = await Pdf.find().sort({ uploadDate: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Could not retrieve files" });
    }
});

app.delete('/api/pdfs/:id', ensureAuthenticated, async(req, res) => {
    try {
        const file = await Pdf.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        fs.unlinkSync(path.join(__dirname, 'uploads', file.fileType + 's', file.filename));
        await Pdf.findByIdAndDelete(req.params.id);

        res.json({ message: "File deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Route to submit a testimonial
app.post('/api/testimonials', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 },
]), async(req, res) => {
    const { name, role, institution, story, consent } = req.body;

    if (!role || !institution || !story || !consent) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (story.length < 250 || story.length > 500) {
        return res.status(400).json({ success: false, message: 'Story must be between 250 and 500 words.' });
    }

    try {
        const photo = req.files && req.files.photo ? `/uploads/images/${req.files.photo[0].filename}` : null;
        const voiceNote = req.files && req.files.voiceNote ? `/uploads/audio/${req.files.voiceNote[0].filename}` : null;
        const testimonial = new Testimonial({
            name: name || 'Anonymous',
            role,
            institution,
            story,
            photo,
            voiceNote,
            status: 'Pending', // Mark as pending for admin review
        });

        await testimonial.save();

        res.json({
            success: true,
            message: 'Thank you! Your testimonial has been received and is pending review.',
            data: testimonial,
        });
    } catch (error) {
        console.error('Error submitting testimonial:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});


app.get('/api/dashboard/testimonials', async(req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve testimonials.' });
    }
});

app.patch('/api/dashboard/testimonials/:id/approve', async(req, res) => {
    try {
        await Testimonial.findByIdAndUpdate(req.params.id, { status: 'Approved' });
        res.json({ message: 'Testimonial approved.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve testimonial.' });
    }
});

app.patch('/api/dashboard/testimonials/:id/reject', async(req, res) => {
    try {
        await Testimonial.findByIdAndUpdate(req.params.id, { status: 'Rejected' });
        res.json({ message: 'Testimonial rejected.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject testimonial.' });
    }
});


// Route for users to submit articles
app.post('/api/submit-article', async(req, res) => {
    const { title, content, authorName, email } = req.body;

    if (!title || !content || !authorName || !email) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newArticle = await require('../../models/Article').create({
            title,
            content,
            authorName,
            email,
            status: 'Pending', // Mark as pending for admin review
        });

        res.status(201).json({ message: 'Article submitted successfully.', article: newArticle });
    } catch (error) {
        console.error('Error submitting article:', error.message);
        res.status(500).json({ error: 'Failed to submit article.' });
    }
});



app.post('/dashboard', upload.single('image'), async(req, res) => {
    const { title, content, category } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    try {
        await require('../../models/Article').create({ title, content, category, image });
        res.status(201).send("Article added successfully");
    } catch (err) {
        res.status(500).send("Error saving article");
    }
});


// Route to fetch all articles for the admin panel
app.get('/api/dashboard/articles', async(req, res) => {
    try {
        const articles = await require('../../models/Article').find().sort({ createdAt: -1 });
        console.log(articles); // Debugging
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles.' });
    }
});

app.post('/api/submit-story', upload.single('image'), async(req, res) => {
    const { title, content, authorName, email } = req.body;
    const image = req.file ? `/uploads/stories/${req.file.filename}` : null;

    if (!title || !content || !authorName || !email) {
        return res.status(400).json({ error: 'All fields except the image are required.' });
    }

    try {
        const newStory = await require('../../models/Story').create({
            title,
            content,
            authorName,
            email,
            image,
            status: 'Pending', // Mark as pending for admin review
        });

        res.status(201).json({ message: 'Your story has been submitted successfully and is pending review.' });
    } catch (error) {
        console.error('Error submitting story:', error.message);
        res.status(500).json({ error: 'Failed to submit your story. Please try again later.' });
    }
});


app.post('/api/subscribe', async(req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ error: 'You are already subscribed.' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ message: 'Subscription successful!' });
    } catch (error) {
        console.error('Error subscribing:', error.message);
        res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
    }
});

// Add Event Endpoint
app.post('/api/events', async (req, res) => {
    console.log("Request body:", req.body);
    if (!req.body) {
        return res.status(400).json({ success: false, message: 'Request body is missing.' });
    }

    const { title, description, category, date, location, imageUrl } = req.body;

    if (!title || !description || !category || !date || !location ||  !imageUrl) {
        return res.status(400).json({ success: false, message: 'All fields except location are required.' });
    }

    try {
        const newEvent = await require('../../models/Event').create({
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

app.get('/api/events', async (req, res) => {
    try {
        const events = await require('../../models/Event').find().sort({ date: 1 }); // Sort by date
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        const event = await require('../../models/Event').findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
});


app.put('/api/events/:id', async (req, res) => {
    const { title, description, category, date, location, imageUrl } = req.body;

    try {
        const updatedEvent = await require('../../models/Event').findByIdAndUpdate(
            req.params.id,
            { title, description, category, date, location, imageUrl },
            { new: true }
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

// Ensure MongoDB is connected before starting the server
connectDB();

app.post('/login', async(req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            console.log('Invalid username');
            return res.status(400).send('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(400).send('Invalid credentials');
        }

        req.session.adminId = admin._id; // Save admin ID in session
        console.log('Admin logged in:', req.session.adminId);
        res.redirect('/dashboard'); // Redirect to the dashboard
    } catch (err) {
        console.error('❌ Error during login:', err.message);
        res.status(500).send('Internal server error');
    }
});
// Check Auth Middleware
function ensureAuthenticated(req, res, next) {
    if (req.session.adminId) {
        return next(); // Proceed to the next middleware or route handler
    }
    res.redirect('/login'); // Redirect to the login page if not authenticated
}

app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
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

app.get('/api/pdfs/:category', async(req, res) => {
    try {
        const { category } = req.params;
        const pdfs = await Pdf.find({ category }).sort({ uploadDate: -1 });
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

// 6. Routes
// ---------------------------
// Leadership Position Schema
const leadershipSchema = new mongoose.Schema({
    position: String,
    status: { type: String, default: 'vacant' },
    applicantName: String,
    applicantEmail: String,
    resume: String,
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

// 3. Render Admin Dashboard
app.get('/admin/dashboard', async(req, res) => {
    try {
        const applications = await Leadership.find({ status: 'applied' });
        res.render('dashboard', { applications });
    } catch (err) {
        res.status(500).send('Failed to load dashboard');
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

app.get("/token", (req, res) => {
    generateToken();
});

// Transactions
app.get("/transactions", async(req, res) => {
    try {
        const transactions = await Payment.find().sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// M-Pesa Token Generation
const generateToken = async(req, res, next) => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_SECRET_KEY;
    if (!consumerKey || !consumerSecret) {
        return res.status(500).json({ error: "Missing M-Pesa credentials." });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    try {
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials ", {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        req.token = response.data.access_token;
        next();
    } catch (err) {
        console.error(err.message);
        return res
            .status(400)
            .json({ error: "Failed to generate token", details: err.message });
    }
};

app.post("/stk", generateToken, async(req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;
    const date = new Date();
    const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    const shortcode = process.env.MPESA_PAYBILL;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    try {
        const result = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerBuyGoodsOnline",
                Amount: amount,
                PartyA: `254${phone}`,
                PartyB: shortcode,
                PhoneNumber: `254${phone}`,
                CallBackURL: "https://c00d-197-232-62-147.ngrok-free.app/callback ",
                AccountReference: `254${phone}`,
                TransactionDesc: "Payment for Youth Synergy Network",
            }, {
                headers: {
                    Authorization: `Bearer ${req.token}`,
                },
            }
        );

        res.status(200).json(result.data);
    } catch (err) {
        console.error(err.message);
    }
});

app.post("/callback", (req, res) => {
    const callbackData = req.body;
    console.log(callbackData.Body);
    if (!callbackData.Body.stkCallback.CallbackMetadata) {
        console.log(callbackData.Body);
        res.json("Okay");
    }

    const phone = callbackData.Body.stkCallback.CallbackMetadataItem[4].value;
    const trnx_id = callbackData.Body.stkCallback.CallbackMetadataItem[1].value;
    const amount = callbackData.Body.stkCallback.CallbackMetadataItem[0].value;

    const payment = new Payment({
        number: phone,
        amount,
        trnx_id,
    });

    payment
        .save()
        .then((data) => {
            console.log({ message: "Saved Successfully", data });
        })
        .catch((err) => {
            console.log(err.message);
        });

    res.status(200).json({ received: true });
});


app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});