// routes/articleRoutes.js - FIXED VERSION with featured_image support

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET ARTICLE STATISTICS (for Dashboard)
// ============================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [articlesCount] = await db.query(
      'SELECT COUNT(*) as total FROM articles'
    );
    const [viewsCount] = await db.query(
      'SELECT SUM(view_count) as total FROM articles'
    );
    const [commentsCount] = await db.query(
      'SELECT COUNT(*) as total FROM comments WHERE is_approved = true'
    );
    const [categoriesCount] = await db.query(
      'SELECT COUNT(*) as total FROM categories'
    );
    const [publishedCount] = await db.query(
      'SELECT COUNT(*) as total FROM articles WHERE status = "published"'
    );
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
// GET /api/articles/featured - Бүх онцлох мэдээнүүд (1-5)
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.show_author,
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_featured IS NOT NULL 
        AND a.is_featured BETWEEN 1 AND 5
        AND a.status = 'published'
      ORDER BY a.is_featured ASC, a.created_at DESC
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

// GET /api/articles/featured/main - Ерөнхий онцлох (is_featured = 1)
router.get('/featured/main', async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.show_author,
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_featured = 1 
        AND a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: articles[0] || null
    });
  } catch (error) {
    console.error('Get main featured article error:', error);
    res.status(500).json({
      success: false,
      message: 'Ерөнхий онцлох нийтлэл авахад алдаа гарлаа.'
    });
  }
});

// GET /api/articles/featured/secondary - Дэд онцлох (is_featured = 2-5)
router.get('/featured/secondary', async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content, 
        a.cover_image, a.featured_image,
        a.category_id, a.author_id, 
        a.show_author,
        a.view_count, a.views,
        a.status, a.tags,
        a.is_featured, a.is_breaking, 
        a.created_at, a.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_featured BETWEEN 2 AND 5
        AND a.status = 'published'
      ORDER BY a.is_featured ASC, a.created_at DESC
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
    console.error('Get secondary featured articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Дэд онцлох нийтлэл авахад алдаа гарлаа.'
    });
  }
});


// GET /api/articles/featured/check/:priority - Featured slot эзлэгдсэн эсэхийг шалгах
router.get('/featured/check/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const priorityNum = parseInt(priority);

    // Validate priority
    if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Priority 1-5 хооронд байх ёстой.'
      });
    }

    const [articles] = await db.query(`
      SELECT id, title, slug
      FROM articles
      WHERE is_featured = ? 
        AND status = 'published'
      LIMIT 1
    `, [priorityNum]);

    res.json({
      success: true,
      data: {
        taken: articles.length > 0,
        article: articles[0] || null
      }
    });
  } catch (error) {
    console.error('Check featured slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Featured slot шалгахад алдаа гарлаа.'
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
        a.show_author,
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
        a.show_author,
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

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (a.title LIKE ? OR a.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.${sort} ${order}`;
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
// ✅ FIXED: Removed alias, returns both fields properly
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [articles] = await db.query(`
      SELECT 
        a.*,
        a.views as view_count,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.username as author_username,
        u.avatar
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ? OR a.slug = ?
    `, [id, id]);
    
    // ✅ REMOVED: a.featured_image as cover_image
    // Now properly returns featured_image field

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
// POST/PATCH validation function (router-ээс ГАДУУР!)
// ============================================
function validateFeaturedPriority(value) {
  // null эсвэл undefined эсвэл хоосон string бол OK
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  const num = parseInt(value);
  
  // 1-5 хооронд байх ёстой
  if (isNaN(num) || num < 1 || num > 5) {
    throw new Error('is_featured must be null or between 1 and 5');
  }
  
  return num;
}

async function clearFeaturedSlot(priority, currentArticleId = null) {
  if (!priority || priority < 1 || priority > 5) return;
  
  // Тухайн priority-тай бусад мэдээг олох
  const [existing] = await db.query(
    'SELECT id FROM articles WHERE is_featured = ? AND id != ? AND status = "published"',
    [priority, currentArticleId || 0]
  );
  
  // Байвал is_featured-ийг null болгох
  if (existing.length > 0) {
    await db.query(
      'UPDATE articles SET is_featured = NULL WHERE id = ?',
      [existing[0].id]
    );
    console.log(`✅ Cleared slot ${priority} from article ${existing[0].id}`);
  }
}
//Create article
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      show_author,
      featured_image,
      tags,
      status = 'draft',
      is_featured = null,
      is_breaking = false
    } = req.body;

    if (!title || !slug || !content || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Гарчиг, slug, контент болон ангилал заавал байх ёстой.'
      });
    }

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

    const validatedFeatured = validateFeaturedPriority(is_featured);

    // ✅ NEW: Clear slot if taking featured position
    if (validatedFeatured && status === 'published') {
      await clearFeaturedSlot(validatedFeatured);
    }

    const [result] = await db.query(`
      INSERT INTO articles (
        title, slug, excerpt, content, category_id, author_id,
        show_author, featured_image, tags, status, is_featured, is_breaking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      excerpt,
      content,
      category_id,
      req.user.id,
      show_author || 1,
      featured_image,
      tags,
      status,
      validatedFeatured,
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
    const statusCode = error.message.includes('is_featured') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Нийтлэл үүсгэхэд алдаа гарлаа.'
    });
  }
});

// UPDATE засах
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      featured_image,
      show_author,
      tags,
      status,
      is_featured,
      is_breaking
    } = req.body;

    const [existing] = await db.query('SELECT id, is_featured FROM articles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    const validatedFeatured = is_featured !== undefined 
      ? validateFeaturedPriority(is_featured)
      : existing[0].is_featured;

    // ✅ NEW: Clear slot if changing to featured position and status is published
    if (validatedFeatured && status === 'published') {
      await clearFeaturedSlot(validatedFeatured, parseInt(id));
    }

    await db.query(`
      UPDATE articles SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        category_id = ?,
        show_author = ?,
        featured_image = ?,
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
      show_author,
      featured_image,
      tags,
      status,
      validatedFeatured,
      is_breaking ? 1 : 0,
      id
    ]);

    res.json({
      success: true,
      message: 'Нийтлэл амжилттай шинэчлэгдлээ!'
    });
  } catch (error) {
    console.error('Update article error:', error);
    const statusCode = error.message.includes('is_featured') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Нийтлэл шинэчлэхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE ARTICLE (Admin only)
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM comments WHERE article_id = ?', [id]);
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
// INCREMENT VIEW COUNT
// ============================================
router.post('/slug/:slug/increment-view', async (req, res) => {
  try {
    const { slug } = req.params;

    await db.query(
      'UPDATE articles SET views = views + 1 WHERE slug = ? AND status = "published"',
      [slug]
    );

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

// ============================================
// SUMMARY OF CHANGES:
// ============================================
// 1. GET /:id (line 250): Removed "a.featured_image as cover_image" alias
//    - Now returns featured_image properly
// 
// 2. POST / (line 288, 320, 330): cover_image → featured_image
//    - Request body field changed
//    - INSERT query column changed
//    - Values array updated
//
// 3. PUT /:id (line 365, 391, 405): cover_image → featured_image
//    - Request body field changed
//    - UPDATE query column changed
//    - Values array updated
//
// Result: Backend now properly saves and returns featured_image field
//         matching frontend expectations
// ============================================