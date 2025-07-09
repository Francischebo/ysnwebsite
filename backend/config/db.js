// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';
  
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB fails to connect
  }
};

module.exports = connectDB;
