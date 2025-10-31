# 🚀 5-МИНУТЫН ЭХЛЭЛ

Backend-ийг **5 минутанд** ажиллуулах товч заавар.

---

## ✅ Шаардлага

- ✅ Node.js (v16+)
- ✅ MySQL (v8+)
- ✅ npm эсвэл yarn

---

## 📦 1. DEPENDENCIES СУУЛГАХ

```bash
cd elch-backend
npm install
```

---

## 🗄 2. DATABASE ТОХИРУУЛАХ

### MySQL нээх
```bash
mysql -u root -p
```

### Database үүсгэх
```sql
source database_schema.sql;
exit;
```

---

## ⚙️ 3. ENVIRONMENT ТОХИРУУЛАХ

`.env` файлыг засах:

```bash
nano .env
```

**Заавал солих:**
```env
DB_PASSWORD=таны_mysql_нууц_үг
JWT_SECRET=аюулгүй_нууц_түлхүүр_өөрчил
```

---

## 🚀 4. SERVER ЭХЛҮҮЛЭХ

```bash
npm run dev
```

**✅ Амжилттай бол:**
```
✅ Server ажиллаж байна: http://localhost:5000
✅ MySQL амжилттай холбогдлоо!
```

---

## 🧪 5. ТЕСТЛЭХ

Browser-ээр:
```
http://localhost:5000
```

Эсвэл curl:
```bash
curl http://localhost:5000
```

**Хариулт:**
```json
{
  "success": true,
  "message": "🎉 ELCH NEWS Backend API ажиллаж байна!"
}
```

---

## 📝 6. ЭХНИЙ ХЭРЭГЛЭГЧ БҮРТГЭХ

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@elch.mn",
    "password": "admin123",
    "full_name": "Админ"
  }'
```

---

## 🎯 7. НЭВТРЭХ

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elch.mn",
    "password": "admin123"
  }'
```

Token-ийг хадгалаарай!

---

## 📚 ДАРААХ АЛХАМ

- 📖 `README.md` бүрэн гарын авлага уншина
- 🧪 `API_TESTING.sh` бүх API endpoints тестлэнэ
- 📝 `sample_data.sql` жишээ өгөгдөл оруулна

---

## 🆘 АЛДАА ГАРВАЛ

### MySQL холбогдохгүй
```bash
sudo systemctl start mysql
```

### Port busy
```bash
# .env дээр PORT=5001 гэж солих
```

### Token алдаа
```bash
# Дахин login хийх
```

---

## 🎉 БЭЛЭН!

Backend ажиллаж эхэллээ! 🚀

Дараа нь Frontend холбоорой:
- Next.js project дээрээ `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
