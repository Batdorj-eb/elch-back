// routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET бүх banners (public)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // ?type=vertical эсвэл ?type=horizontal
    
    let query = 'SELECT * FROM banners WHERE is_active = 1';
    const params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const [banners] = await db.query(query, params);
    
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('❌ Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// GET admin бүх banners (public - no auth)
// ============================================
router.get('/admin', async (req, res) => {
  try {
    const [banners] = await db.query(
      'SELECT * FROM banners ORDER BY type, display_order ASC, created_at DESC'
    );
    
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('❌ Get admin banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// POST шинэ banner үүсгэх
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, type, image_url, link_url, display_order } = req.body;
    
    // Validation
    if (!title || !type || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Нэр, төрөл, зураг заавал оруулна уу.'
      });
    }
    
    if (!['vertical', 'horizontal'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Төрөл буруу байна.'
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO banners (title, type, image_url, link_url, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, type, image_url, link_url || null, display_order || 0]
    );
    
    res.status(201).json({
      success: true,
      message: 'Banner амжилттай нэмэгдлээ!',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('❌ Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// PUT banner засах
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, image_url, link_url, is_active, display_order } = req.body;
    
    // Check if banner exists
    const [existing] = await db.query('SELECT id FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner олдсонгүй.'
      });
    }
    
    await db.query(
      `UPDATE banners 
       SET title = ?, type = ?, image_url = ?, link_url = ?, 
           is_active = ?, display_order = ?
       WHERE id = ?`,
      [title, type, image_url, link_url || null, is_active ?? 1, display_order || 0, id]
    );
    
    res.json({
      success: true,
      message: 'Banner амжилттай засагдлаа!'
    });
  } catch (error) {
    console.error('❌ Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE banner устгах
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM banners WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner олдсонгүй.'
      });
    }
    
    res.json({
      success: true,
      message: 'Banner амжилттай устгагдлаа!'
    });
  } catch (error) {
    console.error('❌ Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

// ============================================
// PATCH toggle active/inactive
// ============================================
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE banners SET is_active = NOT is_active WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Статус солигдлоо!'
    });
  } catch (error) {
    console.error('❌ Toggle banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Алдаа гарлаа.'
    });
  }
});

module.exports = router;