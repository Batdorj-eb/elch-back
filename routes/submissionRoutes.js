const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions } = require('../controllers/submissionController');

// Form-аас submit хийхэд
router.post('/', createSubmission);

// Админ dashboard-аас харах
router.get('/', getSubmissions);

module.exports = router;
