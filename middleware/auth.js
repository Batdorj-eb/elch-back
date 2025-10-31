// middleware/authMiddleware.js
// JWT Token шалгах middleware
// Энэ нь хэрэглэгч нэвтэрсэн эсэхийг баталгаажуулна

const jwt = require('jsonwebtoken');

// Хэрэглэгч нэвтэрсэн эсэхийг шалгах
const authenticateToken = (req, res, next) => {
  // Header-ээс token авах
  // Format: "Bearer TOKEN_HERE"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer" -ийг тасална

  // Token байхгүй бол
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Нэвтрэх шаардлагатай. Token олдсонгүй.'
    });
  }

  // Token зөв эсэхийг шалгах
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token буруу эсвэл хугацаа дууссан.'
      });
    }

    // Token зөв бол хэрэглэгчийн мэдээллийг request-д хадгална
    req.user = user;
    next(); // Дараагийн function руу үргэлжлүүлэх
  });
};

// Зөвхөн админ эрхтэй хэрэглэгч шалгах
const requireAdmin = (req, res, next) => {
  // Эхлээд нэвтэрсэн эсэхийг шалгах
  authenticateToken(req, res, () => {
    // Админ эрхтэй эсэхийг шалгах
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Зөвхөн админ хэрэглэгч хандах эрхтэй.'
      });
    }
    next(); // Админ бол үргэлжлүүлэх
  });
};

// Редактор эсвэл админ эрхтэй эсэхийг шалгах
const requireEditor = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({
        success: false,
        message: 'Зөвхөн редактор эсвэл админ хандах эрхтэй.'
      });
    }
    next();
  });
};

// ✅ ШИНЭЭР НЭМЭХ - Олон role-ийг дэмжих
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Нэвтэрнэ үү.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Зөвхөн ${roles.join(', ')} хандах эрхтэй.`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEditor,
  authorizeRoles  // ✅ Энийг нэм
};