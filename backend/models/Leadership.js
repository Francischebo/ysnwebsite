// filepath: c:\Users\JOYLIM\Desktop\join us\join-us\models\Leadership.js
const mongoose = require('mongoose');

const leadershipSchema = new mongoose.Schema({
    position: String,
    status: { type: String, default: 'vacant' },
    applicantName: String,
    applicantEmail: String,
    resume: String,
});

module.exports = mongoose.model('Leadership', leadershipSchema);