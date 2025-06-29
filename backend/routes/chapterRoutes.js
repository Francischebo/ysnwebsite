const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const chapterController = require('../controllers/chapterController');

router.post('/submit', upload.single('cApplications'), chapterController.submitChapter);
router.get('/pending', chapterController.getPendingChapters);
router.post('/update-status', chapterController.updateChapterStatus);
router.get('/approved', chapterController.getApprovedChapters);

module.exports = router;