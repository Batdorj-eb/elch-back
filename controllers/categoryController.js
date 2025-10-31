// Ангилалтай ажиллах controller

const db = require('../config/database');

// ============================================
// БҮХ АНГИЛАЛ АВАХ
// ============================================
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        c.*,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get all categories алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НЭГЭН АНГИЛАЛ АВАХ
// ============================================
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [categories] = await db.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = true',
      [slug]
    );

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
    console.error('Get category by slug алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// Export
module.exports = {
  getAllCategories,
  getCategoryBySlug
};
