USE image_search_db;

-- 删除现有表
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    wechat VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    default_address TEXT,
    address_history JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price FLOAT NOT NULL,
    sale_price FLOAT,
    
    -- 产品详细信息
    product_code VARCHAR(50) COMMENT '货号',
    pattern VARCHAR(100) COMMENT '图案',
    skirt_length VARCHAR(50) COMMENT '裙长',
    clothing_length VARCHAR(50) COMMENT '衣长',
    style VARCHAR(50) COMMENT '风格',
    pants_length VARCHAR(50) COMMENT '裤长',
    sleeve_length VARCHAR(50) COMMENT '袖长',
    fashion_elements VARCHAR(100) COMMENT '流行元素',
    craft VARCHAR(100) COMMENT '工艺',
    launch_season VARCHAR(50) COMMENT '上市年份/季节',
    main_material VARCHAR(100) COMMENT '主面料成分',
    color VARCHAR(100) COMMENT '颜色',
    size VARCHAR(100) COMMENT '尺码',
    
    -- 图片信息
    size_img TEXT COMMENT '尺码图片URL列表，JSON格式',
    good_img TEXT COMMENT '商品图片URL列表，JSON格式',
    factory_name VARCHAR(200) COMMENT '工厂名称',
    
    -- OSS相关字段
    image_url VARCHAR(255) COMMENT '主图URL',
    image_path VARCHAR(255) COMMENT '本地图片路径',
    oss_path VARCHAR(255) COMMENT 'OSS路径',
    sales_status VARCHAR(20) NOT NULL DEFAULT 'on_sale' COMMENT '销售状态：sold_out-售罄, on_sale-在售, pre_sale-预售',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    customer_id INT NOT NULL COMMENT '客户ID',
    
    -- 订单基本信息
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending-待处理, processing-处理中, completed-已完成, cancelled-已取消',
    payment_status VARCHAR(50) DEFAULT 'unpaid' COMMENT '支付状态：unpaid-未支付, partial-部分支付, paid-已支付',
    shipping_address TEXT NOT NULL COMMENT '收货地址',
    
    -- 产品信息 (JSON格式存储多个产品)
    products JSON COMMENT '产品信息，格式：[{
        "product_id": 123,
        "quantity": 2,
        "price": 99.99,
        "product_name": "商品名称",
        "product_code": "货号",
        "size": "尺码",
        "color": "颜色"
    }]',
    
    -- 备注信息
    customer_notes TEXT COMMENT '客户备注',
    internal_notes TEXT COMMENT '内部备注',
    
    -- 时间信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    shipped_at TIMESTAMP NULL COMMENT '发货时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    
    -- 外键约束
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    
    -- 索引
    INDEX idx_order_number (order_number),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS product_images (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  vector BLOB NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_image_path (image_path),
  KEY idx_product_id (product_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;