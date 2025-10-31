// Нийтлэлүүдтэй ажиллах controller
// CRUD үйлдлүүд: Create, Read, Update, Delete

const db = require('../config/database');

// ============================================
// БҮТЭН НИЙТЛЭЛҮҮД АВАХ (Get All Articles)
// ============================================
const getAllArticles = async (req, res) => {
  try {
    // Query параметрүүд авах (filter, pagination)
    const { 
      category, 
      status = 'published', 
      limit = 20, 
      offset = 0,
      search 
    } = req.query;

    // Query бүтээх
    let query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.featured_image,
        a.status,
        a.is_featured,
        a.is_breaking,
        a.views,
        a.likes,
        a.published_at,
        a.created_at,
        c.name as category_name,
        c.slug as category_slug,
        u.full_name as author_name,
        u.username as author_username
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Status filter
    if (status) {
      query += ' AND a.status = ?';
      queryParams.push(status);
    }

    // Category filter
    if (category) {
      query += ' AND c.slug = ?';
      queryParams.push(category);
    }

    // Search filter
    if (search) {
      query += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Ordering
    query += ' ORDER BY a.published_at DESC, a.created_at DESC';

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [articles] = await db.query(query, queryParams);

    // Total count авах (pagination-д зориулж)
    let countQuery = 'SELECT COUNT(*) as total FROM articles a WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }
    if (category) {
      countQuery += ' AND a.category_id IN (SELECT id FROM categories WHERE slug = ?)';
      countParams.push(category);
    }
    if (search) {
      countQuery += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Get all articles алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НЭГЭН НИЙТЛЭЛ АВАХ (Get Single Article)
// ============================================
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Нийтлэлийн мэдээлэл авах
    const [articles] = await db.query(`
      SELECT 
        a.*,
        c.name as category_name,
        c.slug as category_slug,
        u.full_name as author_name,
        u.username as author_username,
        u.avatar as author_avatar
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.slug = ? AND a.status = 'published'
    `, [slug]);

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    const article = articles[0];

    // Tags авах
    const [tags] = await db.query(`
      SELECT t.id, t.name, t.slug
      FROM tags t
      INNER JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
    `, [article.id]);

    article.tags = tags;

    // Views тоолуур нэмэх
    await db.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Get article by slug алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НИЙТЛЭЛ ҮҮСГЭХ (Create Article) - Админ хэрэглэгч
// ============================================
const createArticle = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      status,
      is_featured,
      is_breaking,
      tags
    } = req.body;

    // Validation
    if (!title || !content || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Гарчиг, агуулга, ангилал заавал шаардлагатай.'
      });
    }

    // Slug давхацаж байгаа эсэхийг шалгах
    const [existingSlugs] = await db.query(
      'SELECT id FROM articles WHERE slug = ?',
      [slug]
    );

    if (existingSlugs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ slug аль хэдийн ашиглагдаж байна.'
      });
    }

    // Author ID авах (logged in user)
    const author_id = req.user.id;

    // Published огноо
    const published_at = status === 'published' ? new Date() : null;

    // Нийтлэл үүсгэх
    const [result] = await db.query(`
      INSERT INTO articles 
      (title, slug, excerpt, content, featured_image, category_id, author_id, status, is_featured, is_breaking, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      author_id,
      status || 'draft',
      is_featured || false,
      is_breaking || false,
      published_at
    ]);

    const articleId = result.insertId;

    // Tags холбох
    if (tags && Array.isArray(tags)) {
      for (const tagId of tags) {
        await db.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [articleId, tagId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Нийтлэл амжилттай үүсгэгдлээ!',
      data: {
        id: articleId,
        title,
        slug
      }
    });

  } catch (error) {
    console.error('Create article алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НИЙТЛЭЛ ЗАСАХ (Update Article)
// ============================================
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Нийтлэл байгаа эсэхийг шалгах
    const [articles] = await db.query('SELECT * FROM articles WHERE id = ?', [id]);

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    // Update query бүтээх
    const allowedFields = [
      'title', 'slug', 'excerpt', 'content', 'featured_image',
      'category_id', 'status', 'is_featured', 'is_breaking'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }

    // Status нь published болсон бол published_at засах
    if (updateData.status === 'published' && articles[0].published_at === null) {
      updates.push('published_at = ?');
      values.push(new Date());
    }

    values.push(id);

    // Update ажиллуулах
    await db.query(
      `UPDATE articles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Tags update хийх
    if (updateData.tags && Array.isArray(updateData.tags)) {
      // Хуучин tags устгах
      await db.query('DELETE FROM article_tags WHERE article_id = ?', [id]);
      
      // Шинэ tags нэмэх
      for (const tagId of updateData.tags) {
        await db.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Нийтлэл амжилттай засагдлаа!'
    });

  } catch (error) {
    console.error('Update article алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НИЙТЛЭЛ УСТГАХ (Delete Article)
// ============================================
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Устгах
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
    console.error('Delete article алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// FEATURED ARTICLES АВАХ
// ============================================
const getFeaturedArticles = async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.featured_image,
        a.views, a.published_at,
        c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published' AND a.is_featured = true
      ORDER BY a.published_at DESC
      LIMIT 4
    `);

    res.json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get featured articles алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// Export
module.exports = {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getFeaturedArticles
};
