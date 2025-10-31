// routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET ALL CATEGORIES
// ============================================
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.created_at,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Ангилал авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// GET SINGLE CATEGORY
// ============================================
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [categories] = await db.query(`
      SELECT 
        c.*,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      WHERE c.slug = ? OR c.id = ?
      GROUP BY c.id
    `, [slug, slug]);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ангилал олдсонгүй.'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ангилал авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// CREATE CATEGORY (Admin only)
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Нэр болон slug заавал байх ёстой.'
      });
    }

    // Check if slug exists
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ slug аль хэдийн ашиглагдсан байна.'
      });
    }

    // Insert category
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Ангилал амжилттай үүсгэгдлээ!',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ангилал үүсгэхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// UPDATE CATEGORY (Admin only)
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    // Check if exists
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ангилал олдсонгүй.'
      });
    }

    // Check slug uniqueness (exclude current category)
    const [slugCheck] = await db.query(
      'SELECT id FROM categories WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if (slugCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ slug аль хэдийн ашиглагдсан байна.'
      });
    }

    // Update category
    await db.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description || null, id]
    );

    res.json({
      success: true,
      message: 'Ангилал амжилттай шинэчлэгдлээ!'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ангилал шинэчлэхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE CATEGORY (Admin only)
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has articles
    const [articles] = await db.query(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );

    if (articles[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Энэ ангилалд ${articles[0].count} нийтлэл байна. Эхлээд нийтлэлүүдийг устгана уу.`
      });
    }

    // Delete category
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ангилал олдсонгүй.'
      });
    }

    res.json({
      success: true,
      message: 'Ангилал амжилттай устгагдлаа!'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ангилал устгахад алдаа гарлаа.'
    });
  }
});

module.exports = router;