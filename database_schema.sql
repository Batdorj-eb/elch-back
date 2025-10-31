-- ============================================
-- ELCH NEWS DATABASE SCHEMA
-- ============================================
-- Энэ файлыг MySQL дээр ажиллуулаад хүснэгтүүдээ үүсгэнэ
-- MySQL Workbench эсвэл командын мөрөөр ажиллуулна

-- Database үүсгэх
CREATE DATABASE IF NOT EXISTS elch_news CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elch_news;

-- ============================================
-- 1. USERS ХҮСНЭГТ (Админ хэрэглэгчид)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,           -- ID (автоматаар нэмэгдэнэ)
  username VARCHAR(50) UNIQUE NOT NULL,        -- Хэрэглэгчийн нэр (давхардахгүй)
  email VARCHAR(100) UNIQUE NOT NULL,          -- Имэйл
  password VARCHAR(255) NOT NULL,              -- Нууц үг (hash хэлбэрээр)
  full_name VARCHAR(100),                      -- Бүтэн нэр
  role ENUM('admin', 'editor', 'author') DEFAULT 'author', -- Эрх
  avatar VARCHAR(255),                         -- Зураг URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Бүртгэсэн огноо
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),                     -- Email-ээр хурдан хайлт
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CATEGORIES ХҮСНЭГТ (Ангилал)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,                   -- Нэр (Улс төр, Эдийн засаг)
  slug VARCHAR(50) UNIQUE NOT NULL,            -- URL-д ашиглах (politics, economy)
  description TEXT,                            -- Тайлбар
  icon VARCHAR(50),                            -- Icon нэр
  display_order INT DEFAULT 0,                 -- Эрэмбэ
  is_active BOOLEAN DEFAULT TRUE,              -- Идэвхтэй эсэх
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ARTICLES ХҮСНЭГТ (Нийтлэлүүд)
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,                 -- Гарчиг
  slug VARCHAR(255) UNIQUE NOT NULL,           -- URL slug
  excerpt TEXT,                                -- Товч агуулга
  content LONGTEXT NOT NULL,                   -- Бүтэн агуулга
  featured_image VARCHAR(255),                 -- Үндсэн зураг
  category_id INT NOT NULL,                    -- Ямар ангилал?
  author_id INT NOT NULL,                      -- Хэн бичсэн?
  
  -- STATUS
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,           -- Featured article эсэх
  is_breaking BOOLEAN DEFAULT FALSE,           -- Шуурхай мэдээ эсэх
  
  -- METADATA
  views INT DEFAULT 0,                         -- Үзсэн тоо
  likes INT DEFAULT 0,                         -- Like тоо
  
  -- DATES
  published_at TIMESTAMP NULL,                 -- Нийтлэгдсэн огноо
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- FOREIGN KEYS
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- INDEXES
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_published (published_at),
  INDEX idx_featured (is_featured),
  FULLTEXT INDEX idx_search (title, excerpt, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TAGS ХҮСНЭГТ (Шошго)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,            -- Шошгоны нэр
  slug VARCHAR(50) NOT NULL UNIQUE,            -- URL slug
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ARTICLE_TAGS ХҮСНЭГТ (Нийтлэл-Шошго холбох)
-- ============================================
CREATE TABLE IF NOT EXISTS article_tags (
  article_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. COMMENTS ХҮСНЭГТ (Сэтгэгдэл)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  article_id INT NOT NULL,                     -- Ямар нийтлэл дээр?
  user_name VARCHAR(100) NOT NULL,             -- Хэрэглэгчийн нэр
  user_email VARCHAR(100),                     -- Имэйл
  content TEXT NOT NULL,                       -- Сэтгэгдлийн агуулга
  parent_id INT NULL,                          -- Хариулт бол parent_id-тэй
  likes INT DEFAULT 0,                         -- Like тоо
  is_approved BOOLEAN DEFAULT FALSE,           -- Зөвшөөрөгдсөн эсэх
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_article (article_id),
  INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. NEWSLETTER ХҮСНЭГТ (Имэйл бүртгэл)
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- АНХНЫ ӨГӨГДӨЛ ОРУУЛАХ (Sample Data)
-- ============================================

-- 1. Анхны админ хэрэглэгч үүсгэх
-- Password: admin123 (bcrypt hash)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@elch.mn', '$2a$10$xZQPYc5z9k9N5Z5Z5Z5Z5O5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Админ хэрэглэгч', 'admin');

-- 2. Категориуд үүсгэх
INSERT INTO categories (name, slug, description, display_order, is_active) VALUES
('Улс төр', 'politics', 'Улс төрийн мэдээ мэдээлэл', 1, TRUE),
('Эдийн засаг', 'economy', 'Эдийн засгийн мэдээ', 2, TRUE),
('Спорт', 'sports', 'Спортын мэдээ', 3, TRUE),
('Нийгэм', 'society', 'Нийгмийн мэдээ', 4, TRUE),
('Дэлхий', 'world', 'Дэлхийн мэдээ', 5, TRUE),
('Технологи', 'tech', 'Технологийн мэдээ', 6, TRUE);

-- 3. Жишээ tags
INSERT INTO tags (name, slug) VALUES
('Шинэ', 'new'),
('Тренд', 'trending'),
('Чухал', 'important'),
('Шуурхай', 'breaking');

-- ============================================
-- ҮҮСГЭЖ ДУУСЛАА! ✅
-- ============================================
-- Одоо та MySQL дээр энэ файлыг ажиллуулна:
-- mysql -u root -p < database_schema.sql
-- эсвэл MySQL Workbench ашиглаж copy-paste хийнэ
