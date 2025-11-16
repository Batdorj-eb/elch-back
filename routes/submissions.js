const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Public routes - Нийтэд нээлттэй
router.post('/', submissionController.createSubmission);
router.get('/approved', submissionController.getApprovedSubmissions);

// Admin routes - Админ хандалт
router.get('/', submissionController.getAllSubmissions);
router.get('/:id', submissionController.getSubmissionById);
router.patch('/:id/status', submissionController.updateSubmissionStatus);
router.delete('/:id', submissionController.deleteSubmission);

module.exports = router;