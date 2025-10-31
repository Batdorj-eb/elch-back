# ============================================
# ELCH NEWS - API ТЕСТЛЭХ КОМАНДУУД
# ============================================
# Энэ файлд бүх API endpoint-үүдийг тестлэх
# curl командууд байна

# ============================================
# 1. БҮРТГҮҮЛЭХ (Register)
# ============================================

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editor1",
    "email": "editor1@elch.mn",
    "password": "editor123",
    "full_name": "Эдитор 1"
  }'

# ============================================
# 2. НЭВТРЭХ (Login)
# ============================================

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor1@elch.mn",
    "password": "editor123"
  }'

# Хариулт дахь token-ийг хадгалаад доорх командуудад ашигла:
# TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ============================================
# 3. ХЭРЭГЛЭГЧИЙН МЭДЭЭЛЭЛ (Get Profile)
# ============================================

curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# 4. БҮХ АНГИЛАЛ АВАХ (Get Categories)
# ============================================

curl -X GET http://localhost:5000/api/categories

# ============================================
# 5. БҮХ НИЙТЛЭЛ АВАХ (Get Articles)
# ============================================

# Бүх нийтлэл
curl -X GET http://localhost:5000/api/articles

# Улс төрийн нийтлэл (filter)
curl -X GET "http://localhost:5000/api/articles?category=politics"

# Хайлт
curl -X GET "http://localhost:5000/api/articles?search=монгол"

# Pagination
curl -X GET "http://localhost:5000/api/articles?limit=10&offset=0"

# ============================================
# 6. FEATURED НИЙТЛЭЛҮҮД
# ============================================

curl -X GET http://localhost:5000/api/articles/featured

# ============================================
# 7. НЭГЭН НИЙТЛЭЛ АВАХ (Get Article by Slug)
# ============================================

curl -X GET http://localhost:5000/api/articles/shine-medee

# ============================================
# 8. НИЙТЛЭЛ ҮҮСГЭХ (Create Article - Token шаардлагатай)
# ============================================

curl -X POST http://localhost:5000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Монголын эдийн засаг өсөж байна",
    "slug": "mongol-ediin-zasag-osoj-baina",
    "excerpt": "Монголын эдийн засаг энэ жил 5% өсөлттэй байна.",
    "content": "<p>Монголын эдийн засаг энэ жил 5% өсөлттэй байна. Уул уурхайн салбар...</p><p>Эдийн засгийн сайд мэдэгдлээр...</p>",
    "featured_image": "/images/news/economy-growth.jpg",
    "category_id": 2,
    "status": "published",
    "is_featured": true,
    "is_breaking": false,
    "tags": [1, 2]
  }'

# ============================================
# 9. НИЙТЛЭЛ ЗАСАХ (Update Article)
# ============================================

curl -X PUT http://localhost:5000/api/articles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Засагдсан гарчиг",
    "excerpt": "Засагдсан товч агуулга",
    "is_featured": false
  }'

# ============================================
# 10. НИЙТЛЭЛ УСТГАХ (Delete Article)
# ============================================

curl -X DELETE http://localhost:5000/api/articles/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# 11. СЭТГЭГДЭЛ АВАХ (Get Comments)
# ============================================

curl -X GET http://localhost:5000/api/comments/article/1

# ============================================
# 12. СЭТГЭГДЭЛ НЭМЭХ (Create Comment)
# ============================================

curl -X POST http://localhost:5000/api/comments/article/1 \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Дорж",
    "user_email": "dorj@example.com",
    "content": "Маш сайн нийтлэл байна. Баярлалаа!"
  }'

# Хариулт дээр (reply)
curl -X POST http://localhost:5000/api/comments/article/1 \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Болд",
    "user_email": "bold@example.com",
    "content": "Би ч бас ингэж боддог!",
    "parent_id": 1
  }'

# ============================================
# 13. LIKE ДАРАХ (Like Comment)
# ============================================

curl -X POST http://localhost:5000/api/comments/1/like

# ============================================
# 14. SERVER ШАЛГАХ
# ============================================

curl -X GET http://localhost:5000/

# ============================================
# ТАЙЛБАР
# ============================================

# YOUR_TOKEN_HERE - Login хийсний дараах token
# category_id цифр:
#   1 = Улс төр (politics)
#   2 = Эдийн засаг (economy)
#   3 = Спорт (sports)
#   4 = Нийгэм (society)
#   5 = Дэлхий (world)
#   6 = Технологи (tech)

# status утгууд:
#   - draft (ноорог)
#   - published (нийтлэгдсэн)
#   - archived (архивлагдсан)

# role утгууд:
#   - admin (бүх эрхтэй)
#   - editor (засварлах эрхтэй)
#   - author (зөвхөн бичих)
