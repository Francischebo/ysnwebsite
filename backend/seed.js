// seeds/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const Leadership = require('./models/Leadership');

async function seedPositions() {
    try {
        const mongoUri = process.env.ADMIN_URL;
        if (!mongoUri) throw new Error("MONGO_URL not set");

        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB connected");

        await Leadership.deleteMany({});
        await Leadership.insertMany([
            { position: 'Treasurer' },
            { position: 'Regional Coordinator' },
            { position: 'Programs Officer' },
        ]);
        console.log("✅ Seed data inserted");
    } catch (err) {
        console.error("❌ Error seeding data:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedPositions();