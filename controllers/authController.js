// Хэрэглэгч нэвтрэх, бүртгүүлэх controller
// Энд бүх нэвтрэх логик байна

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ============================================
// БҮРТГҮҮЛЭХ (Register)
// ============================================
const register = async (req, res) => {
  try {
    // Request body-оос мэдээлэл авах
    const { username, email, password, full_name } = req.body;

    // Validation - бүх талбар бөглөгдсөн эсэхийг шалгах
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Хэрэглэгчийн нэр, имэйл, нууц үг заавал бөглөнө үү.'
      });
    }

    // Email давхцаж байгаа эсэхийг шалгах
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ имэйл эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна.'
      });
    }

    // Нууц үгийг hash хийх (аюулгүй болгох)
    const salt = await bcrypt.genSalt(10); // Salt үүсгэх
    const hashedPassword = await bcrypt.hash(password, salt); // Hash хийх

    // Database-д хадгалах
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name || username, 'admin']
    );

    // Амжилттай
    res.status(201).json({
      success: true,
      message: 'Амжилттай бүртгэгдлээ!',
      data: {
        id: result.insertId,
        username,
        email
      }
    });

  } catch (error) {
    console.error('Register алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// НЭВТРЭХ (Login)
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Имэйл болон нууц үг оруулна уу.'
      });
    }

    // Хэрэглэгч байгаа эсэхийг шалгах
    const [users] = await db.query(
      'SELECT id, username, email, password, full_name, role, avatar FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Имэйл эсвэл нууц үг буруу байна.'
      });
    }

    const user = users[0];

    // Нууц үг зөв эсэхийг шалгах
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Имэйл эсвэл нууц үг буруу байна.'
      });
    }

    // JWT Token үүсгэх
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 хоног хүчинтэй
    );

    // Нууц үгийг устгаад илгээх
    delete user.password;

    // Амжилттай
    res.json({
      success: true,
      message: 'Амжилттай нэвтэрлээ!',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// ============================================
// ХЭРЭГЛЭГЧИЙН МЭДЭЭЛЭЛ АВАХ (Get Profile)
// ============================================
const getProfile = async (req, res) => {
  try {
    // req.user нь authenticateToken middleware-с ирнэ
    const userId = req.user.id;

    // Database-с хэрэглэгчийн мэдээлэл авах
    const [users] = await db.query(
      'SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй.'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get profile алдаа:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа.'
    });
  }
};

// Export хийх
module.exports = {
  register,
  login,
  getProfile
};
