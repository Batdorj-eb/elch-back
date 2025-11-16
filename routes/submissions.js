const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken } = require('../middleware/auth');

// Public routes - Нийтэд нээлттэй
router.post('/', submissionController.createSubmission);
router.get('/approved', submissionController.getApprovedSubmissions);

// Admin routes - Админ хандалт
router.get('/', authenticateToken, submissionController.getAllSubmissions);
router.get('/:id', authenticateToken, submissionController.getSubmissionById);
router.patch('/:id/status', authenticateToken, submissionController.updateSubmissionStatus);
router.delete('/:id', authenticateToken, submissionController.deleteSubmission);

module.exports = router;