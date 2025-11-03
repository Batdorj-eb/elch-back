// routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/search
 * Search articles by title, description, content, tags
 * Query params: q (query), category, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { 
      q = '', 
      category = '', 
      limit = 20, 
      offset = 0 
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Хайлтын түлхүүр үг оруулна уу'
      });
    }

    const searchTerm = `%${q.trim()}%`;
    let query = `
      SELECT 
        a.*,
        c.name as category,
        c.slug as category_slug,
        u.full_name as author,
        (
          SELECT COUNT(*) FROM comments 
          WHERE article_id = a.id AND status = 'approved'
        ) as comment_count
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      AND (
        a.title LIKE ? 
        OR a.description LIKE ? 
        OR a.content LIKE ?
        OR a.tags LIKE ?
      )
    `;

    const params = [searchTerm, searchTerm, searchTerm, searchTerm];

    // Category filter
    if (category) {
      query += ` AND c.slug = ?`;
      params.push(category);
    }

    // Order by relevance (title matches first, then description, then content)
    query += `
      ORDER BY 
        CASE 
          WHEN a.title LIKE ? THEN 1
          WHEN a.description LIKE ? THEN 2
          ELSE 3
        END,
        a.published_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(searchTerm, searchTerm, parseInt(limit), parseInt(offset));

    const [articles] = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      AND (
        a.title LIKE ? 
        OR a.description LIKE ? 
        OR a.content LIKE ?
        OR a.tags LIKE ?
      )
    `;
    const countParams = [searchTerm, searchTerm, searchTerm, searchTerm];

    if (category) {
      countQuery += ` AND c.slug = ?`;
      countParams.push(category);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        query: q
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Хайлт хийхэд алдаа гарлаа'
    });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on popular searches or articles
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = `${q.trim()}%`;

    const [suggestions] = await db.query(
      `
      SELECT DISTINCT title, slug
      FROM articles
      WHERE status = 'published'
      AND title LIKE ?
      ORDER BY published_at DESC
      LIMIT 5
      `,
      [searchTerm]
    );

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Санал авахад алдаа гарлаа'
    });
  }
});

module.exports = router;