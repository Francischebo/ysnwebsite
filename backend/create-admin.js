const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const Admin = require('./models/Admin');

async function createAdmin() {
    const username = "admin1";
    const password = "adminFrancis389987653_"; // Change this in prod!

    try {
        const mongoUri = process.env.MONGO_URL;
        if (!mongoUri) throw new Error("MONGO_URL not set");

        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB connected");

        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            console.log("⚠️ Admin already exists");
            return;
        }

        // Do NOT hash password here! Let the schema's pre('save') do it.
        const admin = new Admin({ username, password });
        await admin.save();
        console.log("✅ Admin created successfully");
    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();