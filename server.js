// ============================================
// ELCH NEWS - BACKEND SERVER
// ============================================
// Энэ файл Express server-ийг эхлүүлнэ
process.env.TZ = 'Asia/Ulaanbaatar';
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // .env файл уншина
// server.js-ийн эхэнд
require('./cron/weeklyNewsletter'); 
require('./cron/scheduler'); 
// Express app үүсгэх
const app = express();

// ============================================
// MIDDLEWARE
// ============================================


// CORS тохиргоо
const corsOptions = {
    origin: [
    // Production HTTPS
    'https://elch.mn',
    'https://www.elch.mn',
    'https://admin.elch.mn',
    'https://api.elch.mn',
    // Production HTTP
    'http://elch.mn',
    'http://www.elch.mn',
    'http://elch.mn:3000',
    'http://elch.mn:3001',    // ← Admin port
    'http://elch.mn:5000',
    // IP based
    'http://72.60.195.81',
    'http://72.60.195.81:3000',
    'http://72.60.195.81:3001',  // ← Admin port
    'http://72.60.195.81:5000',
    // Development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));




// JSON body parser (POST/PUT requests-д зориулж)
app.use(express.json({ limit: '10mb' }));

// URL encoded data parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (зургууд)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger (development-д)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
    next();
  });
}

// ============================================
// ROUTES ХОЛБОХ
// ============================================

// Routes import хийх
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionsRoutes = require('./routes/submissions');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Routes ашиглах
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/newsletter', newsletterRoutes);

// ============================================
// TEST ROUTE (Server ажиллаж байгааг шалгах)
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 ELCH NEWS Backend API ажиллаж байна!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      articles: '/api/articles',
      categories: '/api/categories',
      comments: '/api/comments'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 404 ERROR HANDLER (Route олдохгүй бол)
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Энэ API endpoint олдсонгүй.'
  });
});

// ============================================
// GLOBAL ERROR HANDLER (Бүх алдааг барих)
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Серверийн алдаа:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Серверийн алдаа гарлаа.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER ЭХЛҮҮЛЭХ
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🚀 ELCH NEWS Backend Server         ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server ажиллаж байна: http://localhost:${PORT}`);
  console.log(`📝 API Endpoints:`);
  console.log(`   - Auth:       http://localhost:${PORT}/api/auth`);
  console.log(`   - Articles:   http://localhost:${PORT}/api/articles`);
  console.log(`   - Categories: http://localhost:${PORT}/api/categories`);
  console.log(`   - Comments:   http://localhost:${PORT}/api/comments`);
  console.log('');
  console.log(`🌐 CORS Enabled for:`);
  console.log(`   - Frontend:    http://localhost:3000 (Next.js)`);
  console.log(`   - Admin Panel: http://localhost:5173 (Vite)`);
  console.log('');
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Press CTRL+C to stop');
  console.log('');
  console.log('   - Search:     http://localhost:5000/api/search');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received. Closing server...');
  process.exit(0);
});

module.exports = app;