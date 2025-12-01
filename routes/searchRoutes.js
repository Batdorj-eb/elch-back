// routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');

function getTimeAgo(dateString) {
  const now = new Date();
  const published = new Date(dateString);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} өдрийн өмнө`;
  if (diffHours > 0) return `${diffHours} цагийн өмнө`;
  if (diffMins > 0) return `${diffMins} минутын өмнө`;
  return 'Саяхан';
}

/**
 * GET /api/search
 * ✅ ЗАСАГДСАН: description → excerpt
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
      return res.json({
        articles: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        }
      });
    }

    const searchWords = q.trim().split(/\s+/);
    const searchTerm = `%${q.trim()}%`;
    
    // ✅ excerpt ашиглана (description биш)
    let wordConditions = searchWords.map(() => 
      '(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)'
    ).join(' OR ');

    let query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.featured_image, 
        a.featured_image as coverImage,
        a.published_at as publishedAt,
        a.view_count as viewCount,
        a.tags,
        c.name as category,
        c.slug as categorySlug,
        u.full_name as authorName,
        u.avatar as authorAvatar,
        (
          SELECT COUNT(*) FROM comments 
          WHERE article_id = a.id AND status = 'approved'
        ) as commentCount,
        (
          CASE 
            WHEN a.title LIKE ? THEN 100
            WHEN a.excerpt LIKE ? THEN 50
            WHEN a.tags LIKE ? THEN 30
            WHEN a.content LIKE ? THEN 10
            ELSE 0
          END
        ) as relevance
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      AND (${wordConditions})
    `;

    const params = [];
    searchWords.forEach(word => {
      const term = `%${word}%`;
      params.push(term, term, term, term);
    });
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);

    if (category) {
      query += ` AND c.slug = ?`;
      params.push(category);
    }

    query += `
      ORDER BY relevance DESC, a.published_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));

    const [articles] = await db.query(query, params);

    const articlesWithTimeAgo = articles.map(article => ({
      ...article,
      timeAgo: getTimeAgo(article.publishedAt)
    }));

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      AND (${wordConditions})
    `;
    
    const countParams = [];
    searchWords.forEach(word => {
      const term = `%${word}%`;
      countParams.push(term, term, term, term);
    });

    if (category) {
      countQuery += ` AND c.slug = ?`;
      countParams.push(category);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      articles: articlesWithTimeAgo,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      articles: [],
      pagination: {
        total: 0,
        limit: parseInt(limit || 20),
        offset: parseInt(offset || 0),
        hasMore: false
      }
    });
  }
});

/**
 * GET /api/search/suggestions
 * ✅ ЗАСАГДСАН: description → excerpt
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim()}%`;

    // ✅ excerpt ашиглана
    const [suggestions] = await db.query(
      `
      SELECT 
        a.id,
        a.title, 
        a.slug,
        a.cover_image as coverImage,
        a.published_at as publishedAt,
        c.name as category,
        c.slug as categorySlug,
        CASE 
          WHEN a.title LIKE ? THEN 1
          WHEN a.excerpt LIKE ? THEN 2
          ELSE 3
        END as priority
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      AND (
        a.title LIKE ? 
        OR a.excerpt LIKE ?
        OR a.content LIKE ?
      )
      ORDER BY priority ASC, a.published_at DESC
      LIMIT 10
      `,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(suggestions);

  } catch (error) {
    console.error('❌ Suggestions error:', error);
    res.json([]);
  }
});

module.exports = router;