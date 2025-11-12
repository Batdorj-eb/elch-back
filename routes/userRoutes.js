// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET бүх хэрэглэгчид
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, search } = req.query;
    
    let query = `
      SELECT id, username, email, full_name, role, avatar, created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    
    // Filter by role
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    // Search by name or email
    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [users] = await db.query(query, params);
    
    res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// GET нэг хэрэглэгч
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await db.query(
      `SELECT id, username, email, full_name, role, avatar, created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй.'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// POST шинэ хэрэглэгч үүсгэх
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, full_name, role, avatar } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password заавал оруулна уу.'
      });
    }
    
    // Check if username or email exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username эсвэл email аль хэдийн бүртгэгдсэн байна.'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, full_name, role, avatar) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username, 
        email, 
        hashedPassword, 
        full_name || null, 
        role || 'author',
        avatar || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Хэрэглэгч амжилттай үүсгэгдлээ!',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// PUT хэрэглэгч засах
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, avatar } = req.body;
    
    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй.'
      });
    }
    
    // Check if username or email is taken by another user
    const [duplicate] = await db.query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );
    
    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username эсвэл email өөр хэрэглэгч ашиглаж байна.'
      });
    }
    
    // Update user
    await db.query(
      `UPDATE users 
       SET username = ?, email = ?, full_name = ?, role = ?, avatar = ?
       WHERE id = ?`,
      [username, email, full_name || null, role || 'author', avatar || null, id]
    );
    
    res.json({
      success: true,
      message: 'Хэрэглэгч амжилттай засагдлаа!'
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// PATCH нууц үг солих
// ============================================
router.patch('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    res.json({
      success: true,
      message: 'Нууц үг амжилттай солигдлоо!'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE хэрэглэгч устгах
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Өөрийгөө устгах боломжгүй.'
      });
    }
    
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй.'
      });
    }
    
    res.json({
      success: true,
      message: 'Хэрэглэгч амжилттай устгагдлаа!'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// GET Statistics
// ============================================
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as editors,
        SUM(CASE WHEN role = 'author' THEN 1 ELSE 0 END) as authors
      FROM users
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

module.exports = router;