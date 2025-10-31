-- ============================================
-- SAMPLE DATA - Тестлэхэд зориулсан өгөгдөл
-- ============================================

USE elch_news;

-- ============================================
-- 1. ШИНЭ ХЭРЭГЛЭГЧИД НЭМЭХ
-- ============================================
-- Password бүгд: password123

INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@elch.mn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Админ', 'admin'),
('editor1', 'editor1@elch.mn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Дорж', 'editor');

-- ============================================
-- 2. ЖИШЭЭ НИЙТЛЭЛҮҮД
-- ============================================

INSERT INTO articles (title, slug, excerpt, content, category_id, author_id, status, is_featured, published_at) VALUES 
('Монгол Улсын эдийн засаг өсөж байна', 'mongol-ediin-zasag-osoj-baina', 'Эдийн засгийн өсөлт 5%', '<p>Эдийн засгийн мэдээ...</p>', 2, 2, 'published', TRUE, NOW());
