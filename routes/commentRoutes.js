// routes/commentRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET COMMENTS FOR ARTICLE
// ============================================
router.get('/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;

    const [comments] = await db.query(`
      SELECT 
        c.id, c.article_id, c.user_name, c.user_email, c.content,
        c.likes, c.parent_id, c.is_approved, c.created_at
      FROM comments c
      WHERE c.article_id = ? AND c.is_approved = true AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `, [articleId]);

    // Get replies for each comment
    for (let comment of comments) {
      const [replies] = await db.query(`
        SELECT 
          c.id, c.article_id, c.user_name, c.user_email, c.content,
          c.likes, c.parent_id, c.is_approved, c.created_at
        FROM comments c
        WHERE c.parent_id = ? AND c.is_approved = true
        ORDER BY c.created_at ASC
      `, [comment.id]);
      
      comment.replies = replies;
    }

    res.json({
      success: true,
      data: {
        comments,
        total: comments.length
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

// ============================================
// ADD COMMENT
// ============================================
router.post('/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { user_name, user_email, content, parent_id } = req.body;

    // Validation
    if (!user_name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Нэр болон сэтгэгдэл заавал байх ёстой.'
      });
    }

    // 🔥 ШИНЭЧЛЭГДСЭН: is_approved = true (auto-approve for development)
    const [result] = await db.query(`
      INSERT INTO comments (article_id, user_name, user_email, content, parent_id, is_approved)
      VALUES (?, ?, ?, ?, ?, true)
    `, [articleId, user_name, user_email || null, content, parent_id || null]);

    // 🔥 Get the newly created comment to return it
    const [newComment] = await db.query(`
      SELECT 
        c.id, c.article_id, c.user_name, c.user_email, c.content,
        c.likes, c.parent_id, c.is_approved, c.created_at
      FROM comments c
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Сэтгэгдэл амжилттай нэмэгдлээ!',
      data: {
        comment: newComment[0]
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

// ============================================
// LIKE COMMENT
// ============================================
router.post('/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;

    await db.query('UPDATE comments SET likes = likes + 1 WHERE id = ?', [commentId]);

    // Get updated like count
    const [result] = await db.query('SELECT likes FROM comments WHERE id = ?', [commentId]);

    res.json({
      success: true,
      message: 'Таалагдлаа!',
      data: {
        likes: result[0]?.likes || 0
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

// ============================================
// ADMIN: GET ALL COMMENTS (INCLUDING UNAPPROVED)
// ============================================
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT 
        c.id, c.article_id, c.user_name, c.user_email, c.content,
        c.likes, c.parent_id, c.is_approved, c.created_at,
        a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      data: {
        comments,
        total: comments.length
      }
    });
  } catch (error) {
    console.error('Get all comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

// ============================================
// ADMIN: APPROVE COMMENT
// ============================================
router.patch('/:commentId/approve', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    await db.query('UPDATE comments SET is_approved = true WHERE id = ?', [commentId]);

    res.json({
      success: true,
      message: 'Сэтгэгдэл баталгаажлаа!'
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

// ============================================
// ADMIN: DELETE COMMENT
// ============================================
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Delete replies first
    await db.query('DELETE FROM comments WHERE parent_id = ?', [commentId]);
    
    // Delete comment
    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({
      success: true,
      message: 'Сэтгэгдэл устгагдлаа!'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
});

module.exports = router;