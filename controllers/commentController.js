// Сэтгэгдэлтэй ажиллах controller

const db = require('../config/database');

// ============================================
// НИЙТЛЭЛИЙН СЭТГЭГДЭЛ АВАХ
// ============================================
const getCommentsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    // Зөвшөөрөгдсөн сэтгэгдлүүдийг авах
    const [comments] = await db.query(`
      SELECT 
        c.id,
        c.user_name,
        c.content,
        c.likes,
        c.parent_id,
        c.created_at
      FROM comments c
      WHERE c.article_id = ? AND c.is_approved = true
      ORDER BY c.created_at DESC
    `, [articleId]);

    // Хариултуудыг эцэг сэтгэгдэлд холбох (nested structure)
    const commentMap = {};
    const rootComments = [];

    // Эхлээд бүх сэтгэгдлийг map дээр хадгална
    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });

    // Хариултуудыг эцэг сэтгэгдэлд холбох
    comments.forEach(comment => {
      if (comment.parent_id) {
        // Хариулт бол parent-д нэмэх
        if (commentMap[comment.parent_id]) {
          commentMap[comment.parent_id].replies.push(comment);
        }
      } else {
        // Root сэтгэгдэл бол жагсаалтад нэмэх
        rootComments.push(comment);
      }
    });

    res.json({
      success: true,
      data: {
        comments: rootComments,
        total: comments.length
      }
    });

  } catch (error) {
    console.error('Get comments алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// СЭТГЭГДЭЛ НЭМЭХ
// ============================================
const createComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const user_name = req.user ? req.user.full_name || req.user.username : req.body.user_name;
    const user_email = req.user ? req.user.email : req.body.user_email;
    const { content, parent_id } = req.body;

    // Validation
    if (!user_name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Нэр болон сэтгэгдэл заавал бөглөнө үү.'
      });
    }

    // Нийтлэл байгаа эсэхийг шалгах
    const [articles] = await db.query(
      'SELECT id FROM articles WHERE id = ? AND status = "published"',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Нийтлэл олдсонгүй.'
      });
    }

    // Сэтгэгдэл хадгалах (автоматаар зөвшөөрөгдөнө, эсвэл админ шалгана гэж болно)
    const [result] = await db.query(`
      INSERT INTO comments (article_id, user_name, user_email, content, parent_id, is_approved)
      VALUES (?, ?, ?, ?, ?, true)
    `, [articleId, user_name, user_email, content, parent_id || null]);

    res.status(201).json({
      success: true,
      message: 'Сэтгэгдэл амжилттай нэмэгдлээ!',
      data: {
        id: result.insertId
      }
    });

  } catch (error) {
    console.error('Create comment алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// СЭТГЭГДЭЛД LIKE ДАРАХ
// ============================================
const likeComment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('UPDATE comments SET likes = likes + 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Like амжилттай!'
    });

  } catch (error) {
    console.error('Like comment алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// Export
module.exports = {
  getCommentsByArticle,
  createComment,
  likeComment
};
