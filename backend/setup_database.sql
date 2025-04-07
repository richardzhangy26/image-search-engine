-- 创建数据库
CREATE DATABASE IF NOT EXISTS image_search_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER IF NOT EXISTS 'image_search_user'@'localhost' IDENTIFIED BY 'zhang7481592630';
GRANT ALL PRIVILEGES ON image_search_db.* TO 'image_search_user'@'localhost';
FLUSH PRIVILEGES;
