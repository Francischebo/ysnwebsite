const express = require('express');
const router = express.Router();
const { submitApplication } = require('../controllers/joinController');

router.post('/join', submitApplication);

module.exports = router;