const db = require('../config/database');

// Шинэ санал үүсгэх (иргэдээс)
exports.createSubmission = async (req, res) => {
  try {
    const { name, email, phone, title, content } = req.body;

    // Validation
    if (!name || !title || !content) {
      return res.status(400).json({ 
        error: 'Нэр, гарчиг, санал заавал бөглөнө үү' 
      });
    }

    // Email эсвэл утас нэг нь байх ёстой
    if (!email && !phone) {
      return res.status(400).json({ 
        error: 'Email эсвэл утасны дугаар заавал бөглөнө үү' 
      });
    }

    const [result] = await db.execute(
      `INSERT INTO submissions (category_id, name, email, phone, title, content, status) 
       VALUES (7, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, phone, title, content]
    );

    res.status(201).json({
      message: 'Таны санал амжилттай илгээгдлээ',
      submissionId: result.insertId
    });

  } catch (error) {
    console.error('Submission create error:', error);
    res.status(500).json({ error: 'Санал илгээхэд алдаа гарлаа' });
  }
};

// Бүх саналуудыг авах (админд)
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, c.name as category_name 
      FROM submissions s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.category_id = 7
    `;
    
    const params = [];

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

  // Build full query with safe integer values
    const safeLimit = parseInt(limit);
    const safeOffset = parseInt(offset);

    let finalQuery = query + ` ORDER BY s.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [submissions] = await db.query(finalQuery, params);

    // Нийт тоо
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM submissions WHERE category_id = 7' + 
      (status ? ' AND status = ?' : ''),
      status ? [status] : []
    );

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Саналуудыг унших алдаа гарлаа' });
  }
};

// Саналын төлөв өөрчлөх (админ)
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Буруу төлөв' });
    }

    await db.execute(
      'UPDATE submissions SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Төлөв амжилттай шинэчлэгдлээ' });

  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({ error: 'Төлөв өөрчлөхөд алдаа гарлаа' });
  }
};

// Нэг саналыг дэлгэрэнгүй авах
exports.getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [submissions] = await db.execute(
      `SELECT s.*, c.name as category_name 
       FROM submissions s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Санал олдсонгүй' });
    }

    res.json(submissions[0]);

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Санал унших алдаа гарлаа' });
  }
};

// Батлагдсан саналуудыг авах (PUBLIC - web-д харуулах)
exports.getApprovedSubmissions = async (req, res) => {
  try {
    // Limit утгыг зөв parse хийх
    let limit = 10; // Default
    if (req.query.limit) {
      const parsed = parseInt(req.query.limit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100); // Max 100
      }
    }

    const [submissions] = await db.query(
        `SELECT s.id, s.name, s.title, s.content, s.created_at
        FROM submissions s
        WHERE s.category_id = 7 AND s.status = 'approved'
        ORDER BY s.created_at DESC
        LIMIT ${parseInt(limit)}`
    );

    res.json(submissions);
  } catch (error) {
    console.error('Get approved submissions error:', error);
    res.status(500).json({ error: 'Саналуудыг унших алдаа гарлаа' });
  }
};

// Санал устгах (админ)
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    // Эхлээд санал байгаа эсэхийг шалгах
    const [submissions] = await db.execute(
      'SELECT id FROM submissions WHERE id = ?',
      [id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Санал олдсонгүй' });
    }

    // Устгах
    await db.execute('DELETE FROM submissions WHERE id = ?', [id]);

    res.json({ message: 'Санал амжилттай устгагдлаа' });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Санал устгахад алдаа гарлаа' });
  }
};