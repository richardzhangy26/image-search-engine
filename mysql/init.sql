-- 创建数据库
CREATE DATABASE IF NOT EXISTS product_crm;
USE product_crm;

-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    wechat VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    default_address TEXT,
    address_history JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price FLOAT NOT NULL,
    sale_price FLOAT,
    product_code VARCHAR(50),
    pattern VARCHAR(100),
    skirt_length VARCHAR(50),
    clothing_length VARCHAR(50),
    style VARCHAR(50),
    pants_length VARCHAR(50),
    sleeve_length VARCHAR(50),
    fashion_elements VARCHAR(100),
    craft VARCHAR(100),
    launch_season VARCHAR(50),
    main_material VARCHAR(100),
    color VARCHAR(100),
    size VARCHAR(100),
    size_img TEXT,
    good_img TEXT,
    factory_name VARCHAR(200),
    image_url VARCHAR(255),
    image_path VARCHAR(255),
    oss_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    shipping_address TEXT NOT NULL,
    products JSON,
    customer_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 创建产品图片表
CREATE TABLE IF NOT EXISTS product_images (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    vector BLOB NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_image_path (image_path),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
