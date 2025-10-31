// Authentication routes
// URL paths: /api/auth/...

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (Нээлттэй)
// ============================================

// POST /api/auth/register - Бүртгүүлэх
router.post('/register', authController.register);

// POST /api/auth/login - Нэвтрэх
router.post('/login', authController.login);

// ============================================
// PROTECTED ROUTES (Token шаардлагатай)
// ============================================

// GET /api/auth/profile - Хэрэглэгчийн мэдээлэл авах
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
