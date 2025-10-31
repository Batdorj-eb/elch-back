# 🚀 ELCH NEWS - Backend API

Node.js + Express + MySQL дээр бүтээгдсэн мэдээний вэбсайтын Backend API.

---

## 📋 Агуулга

1. [Технологи](#технологи)
2. [Суулгах заавар](#суулгах-заавар)
3. [Database тохиргоо](#database-тохиргоо)
4. [API Endpoints](#api-endpoints)
5. [Жишээ хүсэлтүүд](#жишээ-хүсэлтүүд)
6. [Алдаа засах](#алдаа-засах)

---

## 🛠 Технологи

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password encryption
- **Multer** - File upload
- **CORS** - Cross-origin requests

---

## 📦 Суулгах заавар

### 1️⃣ Node.js суулгах

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Шалгах
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2️⃣ MySQL суулгах

```bash
# MySQL суулгах
sudo apt-get update
sudo apt-get install mysql-server

# MySQL эхлүүлэх
sudo systemctl start mysql
sudo systemctl enable mysql

# MySQL тохируулах
sudo mysql_secure_installation
```

### 3️⃣ Backend татаж авах

```bash
# Git clone (эсвэл folder-оо copy хийнэ)
git clone <your-repo-url>
cd elch-backend

# Dependencies суулгах
npm install
```

### 4️⃣ Environment variables тохируулах

`.env` файлыг засах:

```bash
nano .env
```

Дараах мэдээллийг оруулах:

```env
PORT=5000

# MySQL холболт
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=таны_mysql_нууц_үг  # ⚠️ Өөрчил!
DB_NAME=elch_news

# JWT Secret (аюулгүй үг дээр солих!)
JWT_SECRET=таны_аюулгүй_нууц_түлхүүр  # ⚠️ Өөрчил!

MAX_FILE_SIZE=5242880
```

---

## 🗄 Database тохиргоо

### 1️⃣ MySQL-д нэвтрэх

```bash
mysql -u root -p
```

### 2️⃣ Database үүсгэх + хүснэгтүүд

```bash
# Файлыг ажиллуулах
mysql -u root -p < database_schema.sql
```

**Эсвэл** MySQL дотроос:

```sql
source /path/to/database_schema.sql;
```

### 3️⃣ Шалгах

```sql
USE elch_news;
SHOW TABLES;

-- Хүснэгтүүд харагдах ёстой:
-- users, categories, articles, tags, comments, etc.
```

---

## 🚀 Server эхлүүлэх

### Development Mode (Nodemon - auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

**✅ Амжилттай бол:**

```
╔════════════════════════════════════════╗
║   🚀 ELCH NEWS Backend Server         ║
╚════════════════════════════════════════╝

✅ Server ажиллаж байна: http://localhost:5000
✅ MySQL амжилттай холбогдлоо!

📝 API Endpoints:
   - Auth:       http://localhost:5000/api/auth
   - Articles:   http://localhost:5000/api/articles
   - Categories: http://localhost:5000/api/categories
   - Comments:   http://localhost:5000/api/comments
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Тайлбар | Token? |
|--------|----------|---------|--------|
| POST | `/api/auth/register` | Шинэ хэрэглэгч бүртгэх | ❌ |
| POST | `/api/auth/login` | Нэвтрэх | ❌ |
| GET | `/api/auth/profile` | Хэрэглэгчийн мэдээлэл | ✅ |

### 📰 Articles (`/api/articles`)

| Method | Endpoint | Тайлбар | Token? |
|--------|----------|---------|--------|
| GET | `/api/articles` | Бүх нийтлэл | ❌ |
| GET | `/api/articles/featured` | Featured нийтлэлүүд | ❌ |
| GET | `/api/articles/:slug` | Нэгэн нийтлэл | ❌ |
| POST | `/api/articles` | Нийтлэл үүсгэх | ✅ Editor |
| PUT | `/api/articles/:id` | Нийтлэл засах | ✅ Editor |
| DELETE | `/api/articles/:id` | Нийтлэл устгах | ✅ Editor |

**Query Parameters (GET /api/articles):**
- `?category=politics` - Ангилалаар шүүх
- `?status=published` - Статусаар шүүх
- `?limit=20` - Хэдэн нийтлэл авах
- `?offset=0` - Pagination
- `?search=keyword` - Хайлт

### 📂 Categories (`/api/categories`)

| Method | Endpoint | Тайлбар | Token? |
|--------|----------|---------|--------|
| GET | `/api/categories` | Бүх ангилал | ❌ |
| GET | `/api/categories/:slug` | Нэгэн ангилал | ❌ |

### 💬 Comments (`/api/comments`)

| Method | Endpoint | Тайлбар | Token? |
|--------|----------|---------|--------|
| GET | `/api/comments/article/:articleId` | Нийтлэлийн сэтгэгдэл | ❌ |
| POST | `/api/comments/article/:articleId` | Сэтгэгдэл нэмэх | ❌ |
| POST | `/api/comments/:id/like` | Like дарах | ❌ |

---

## 📝 Жишээ хүсэлтүүд

### 1️⃣ Бүртгүүлэх (Register)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bataa",
    "email": "bataa@example.com",
    "password": "password123",
    "full_name": "Батаа"
  }'
```

**Хариулт:**
```json
{
  "success": true,
  "message": "Амжилттай бүртгэгдлээ!",
  "data": {
    "id": 1,
    "username": "bataa",
    "email": "bataa@example.com"
  }
}
```

### 2️⃣ Нэвтрэх (Login)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bataa@example.com",
    "password": "password123"
  }'
```

**Хариулт:**
```json
{
  "success": true,
  "message": "Амжилттай нэвтэрлээ!",
  "data": {
    "user": {
      "id": 1,
      "username": "bataa",
      "email": "bataa@example.com",
      "role": "author"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3️⃣ Нийтлэлүүд авах (Get Articles)

```bash
# Бүх нийтлэл
curl http://localhost:5000/api/articles

# Улс төрийн нийтлэлүүд
curl http://localhost:5000/api/articles?category=politics&limit=10

# Хайлт
curl http://localhost:5000/api/articles?search=монгол
```

### 4️⃣ Нийтлэл үүсгэх (Create Article - Token шаардлагатай)

```bash
curl -X POST http://localhost:5000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Шинэ мэдээ",
    "slug": "shine-medee",
    "excerpt": "Товч агуулга",
    "content": "Бүтэн агуулга энд байна...",
    "category_id": 1,
    "status": "published",
    "is_featured": false
  }'
```

### 5️⃣ Сэтгэгдэл нэмэх

```bash
curl -X POST http://localhost:5000/api/comments/article/1 \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Дорж",
    "user_email": "dorj@example.com",
    "content": "Сайн мэдээ байна!"
  }'
```

---

## 🔧 Алдаа засах

### ❌ "MySQL холболт амжилтгүй"

**Шалтгаан:** MySQL server унтарсан эсвэл нууц үг буруу

**Шийдэл:**
```bash
# MySQL ажиллаж байгааг шалгах
sudo systemctl status mysql

# Эхлүүлэх
sudo systemctl start mysql

# .env файлын нууц үг шалгах
nano .env
```

### ❌ "Port 5000 already in use"

**Шалтгаан:** 5000 порт өөр програм ашиглаж байна

**Шийдэл:**
```bash
# Порт сольж .env засах
PORT=5001

# Эсвэл 5000 портыг чөлөөлөх
lsof -ti:5000 | xargs kill -9
```

### ❌ "Token буруу эсвэл хугацаа дууссан"

**Шалтгаан:** JWT token хугацаа дууссан (7 хоног)

**Шийдэл:** Дахин `/api/auth/login` дуудаж шинэ token авах

---

## 📂 Folder бүтэц

```
elch-backend/
├── config/
│   └── database.js          # MySQL холболт
├── controllers/
│   ├── authController.js    # Нэвтрэх логик
│   ├── articleController.js # Нийтлэл логик
│   ├── categoryController.js
│   └── commentController.js
├── middleware/
│   └── auth.js              # JWT шалгалт
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── articleRoutes.js     # Article endpoints
│   ├── categoryRoutes.js
│   └── commentRoutes.js
├── uploads/                 # Зургууд
├── .env                     # Environment variables
├── .gitignore
├── database_schema.sql      # Database хүснэгтүүд
├── package.json
├── server.js                # Main entry point
└── README.md                # Энэ файл
```

---

## 🎯 Дараагийн алхмууд

### Хийх зүйлс:

1. ✅ File upload (зураг оруулах) - Multer
2. ✅ Admin Panel - React эсвэл EJS
3. ✅ Email notification - Nodemailer
4. ✅ Search functionality - Full-text search
5. ✅ Rate limiting - Express-rate-limit
6. ✅ Caching - Redis
7. ✅ Production deploy - PM2, Nginx

---

## 📞 Тусламж

Асуулт байвал:
- Email: support@elch.mn
- GitHub Issues

---

## 📜 License

MIT License

---

**🎉 Амжилт хүсье!** 🚀
