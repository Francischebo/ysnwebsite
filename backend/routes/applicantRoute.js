// routes/applicantRoute.js
const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');

router.get('/applicants', applicantController.getAllApplicants);

module.exports = router;