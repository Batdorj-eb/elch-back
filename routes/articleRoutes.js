// routes/articleRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET ARTICLE STATISTICS (for Dashboard)
// ============================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total articles
    const [articlesCount] = await db.query(
      'SELECT COUNT(*) as total FROM articles'
    );

    // Get total views
    const [viewsCount] = await db.query(
      'SELECT SUM(view_count) as total FROM articles'
    );

    // Get total comments
    const [commentsCount] = await db.query(
      'SELECT COUNT(*) as total FROM comments WHERE is_approved = true'
    );

    // Get total categories
    const [categoriesCount] = await db.query(
      'SELECT COUNT(*) as total FROM categories'
    );

    // Get published articles count
    const [publishedCount] = await db.query(
      'SELECT COUNT(*) as total FROM articles WHERE status = "published"'
    );

    // Get draft articles count
    const [draftCount] = await db.query(
      'SELECT COUNT(*) as total FROM articles WHERE status = "draft"'
    );

    res.json({
      success: true,
      data: {
        total_articles: articlesCount[0].total,
        total_views: viewsCount[0].total || 0,
        total_comments: commentsCount[0].total,
        total_categories: categoriesCount[0].total,
        published_articles: publishedCount[0].total,
        draft_articles: draftCount[0].total
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Статистик авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// GET FEATURED ARTICLES
// ============================================
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_featured = 1 AND a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        articles,
        total: articles.length
      }
    });
  } catch (error) {
    console.error('Get featured articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Онцлох нийтлэл авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// GET BREAKING NEWS
// ============================================
router.get('/breaking', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_breaking = 1 AND a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        articles,
        total: articles.length
      }
    });
  } catch (error) {
    console.error('Get breaking news error:', error);
    res.status(500).json({
      success: false,
      message: 'Шуурхай мэдээ авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// GET ALL ARTICLES
// ============================================
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      limit = 20, 
      offset = 0,
      status = null,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by category
    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    // Filter by status
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // Search
    if (search) {
      query += ' AND (a.title LIKE ? OR a.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort
    query += ` ORDER BY a.${sort} ${order}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [articles] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM articles a';
    const countParams = [];
    
    if (category) {
      countQuery += ' LEFT JOIN categories c ON a.category_id = c.id WHERE c.slug = ?';
      countParams.push(category);
    } else {
      countQuery += ' WHERE 1=1';
    }
    
    if (status) {
      countQuery += category ? ' AND a.status = ?' : ' WHERE a.status = ?';
      countParams.push(status);
    }
    
    if (search) {
      const hasWhere = category || status;
      countQuery += hasWhere ? ' AND (a.title LIKE ? OR a.content LIKE ?)' : ' WHERE (a.title LIKE ? OR a.content LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        articles,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Нийтлэл авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// GET SINGLE ARTICLE
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [articles] = await db.query(`
      SELECT 
        a.*,
        a.featured_image as cover_image,
        a.views as view_count,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ? OR a.slug = ?
    `, [id, id]);

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    res.json({
      success: true,
      data: articles[0]
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Нийтлэл авахад алдаа гарлаа.'
    });
  }
});

// ============================================
// CREATE ARTICLE (Admin only)
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      cover_image,
      tags,
      status = 'draft',
      is_featured = false,
      is_breaking = false
    } = req.body;

    // Validation
    if (!title || !slug || !content || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Гарчиг, slug, контент болон ангилал заавал байх ёстой.'
      });
    }

    // Check if slug already exists
    const [existing] = await db.query(
      'SELECT id FROM articles WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ slug аль хэдийн ашиглагдсан байна.'
      });
    }

    // Insert article
    const [result] = await db.query(`
      INSERT INTO articles (
        title, slug, excerpt, content, category_id, author_id,
        cover_image, tags, status, is_featured, is_breaking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      excerpt,
      content,
      category_id,
      req.user.id,
      cover_image,
      tags,
      status,
      is_featured ? 1 : 0,
      is_breaking ? 1 : 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Нийтлэл амжилттай үүсгэгдлээ!',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Нийтлэл үүсгэхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// UPDATE ARTICLE (Admin only)
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      cover_image,
      tags,
      status,
      is_featured,
      is_breaking
    } = req.body;

    // Check if article exists
    const [existing] = await db.query('SELECT id FROM articles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    // Update article
    await db.query(`
      UPDATE articles SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        category_id = ?,
        cover_image = ?,
        tags = ?,
        status = ?,
        is_featured = ?,
        is_breaking = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      title,
      slug,
      excerpt,
      content,
      category_id,
      cover_image,
      tags,
      status,
      is_featured ? 1 : 0,
      is_breaking ? 1 : 0,
      id
    ]);

    res.json({
      success: true,
      message: 'Нийтлэл амжилттай шинэчлэгдлээ!'
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Нийтлэл шинэчлэхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE ARTICLE (Admin only)
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete comments first
    await db.query('DELETE FROM comments WHERE article_id = ?', [id]);

    // Delete article
    const [result] = await db.query('DELETE FROM articles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    res.json({
      success: true,
      message: 'Нийтлэл амжилттай устгагдлаа!'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Нийтлэл устгахад алдаа гарлаа.'
    });
  }
});


// ============================================
// INCREMENT VIEW COUNT (POST /api/articles/slug/:slug/increment-view)
// ============================================
// Энийг articleRoutes.js-ийн доор (module.exports-ийн өмнө) нэмнэ

router.post('/slug/:slug/increment-view', async (req, res) => {
  try {
    const { slug } = req.params;

    // View count нэмэгдүүлэх
    await db.query(
      'UPDATE articles SET views = views + 1 WHERE slug = ? AND status = "published"',
      [slug]
    );

    // Шинэчлэгдсэн view count буцаах
    const [rows] = await db.query(
      'SELECT id, views FROM articles WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Нийтлэл олдсонгүй.' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        articleId: rows[0].id,
        views: rows[0].views
      }
    });

  } catch (error) {
    console.error('View increment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'View count нэмэхэд алдаа гарлаа.' 
    });
  }
});

module.exports = router;