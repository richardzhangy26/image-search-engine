"""
数据库迁移脚本 - 从SQLite迁移到PostgreSQL
"""
import sqlite3
import psycopg2
import psycopg2.extras
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'dbname': os.getenv('DB_NAME', 'product_search'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

# SQLite数据库路径
SQLITE_DB_PATH = "data/product_search/db/products.db"

def migrate_data():
    """从SQLite迁移数据到PostgreSQL"""
    # 检查SQLite数据库是否存在
    if not Path(SQLITE_DB_PATH).exists():
        print(f"SQLite数据库不存在: {SQLITE_DB_PATH}")
        return False
    
    try:
        # 连接SQLite数据库
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        
        # 连接PostgreSQL数据库
        pg_conn = psycopg2.connect(**DB_CONFIG)
        
        # 迁移products表
        print("开始迁移products表...")
        migrate_products(sqlite_conn, pg_conn)
        
        # 迁移product_images表
        print("开始迁移product_images表...")
        migrate_product_images(sqlite_conn, pg_conn)
        
        print("数据迁移完成！")
        return True
        
    except Exception as e:
        print(f"迁移过程中发生错误: {e}")
        return False
    finally:
        # 关闭连接
        if 'sqlite_conn' in locals():
            sqlite_conn.close()
        if 'pg_conn' in locals():
            pg_conn.close()

def migrate_products(sqlite_conn, pg_conn):
    """迁移products表数据"""
    try:
        # 获取SQLite中的所有产品
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM products")
        products = sqlite_cursor.fetchall()
        
        if not products:
            print("没有找到产品数据")
            return
        
        # 插入到PostgreSQL
        pg_cursor = pg_conn.cursor()
        for product in products:
            pg_cursor.execute(
                "INSERT INTO products (product_id, name, attributes, price, description) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (product_id) DO NOTHING",
                (product['product_id'], product['name'], product['attributes'], product['price'], product['description'])
            )
        
        pg_conn.commit()
        print(f"成功迁移 {len(products)} 个产品")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"迁移products表时发生错误: {e}")
        raise

def migrate_product_images(sqlite_conn, pg_conn):
    """迁移product_images表数据"""
    try:
        # 获取SQLite中的所有产品图片
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM product_images")
        images = sqlite_cursor.fetchall()
        
        if not images:
            print("没有找到产品图片数据")
            return
        
        # 插入到PostgreSQL
        pg_cursor = pg_conn.cursor()
        for image in images:
            pg_cursor.execute(
                "INSERT INTO product_images (product_id, image_path, vector_id) VALUES (%s, %s, %s) ON CONFLICT (image_path) DO NOTHING",
                (image['product_id'], image['image_path'], image['vector_id'])
            )
        
        pg_conn.commit()
        print(f"成功迁移 {len(images)} 个产品图片")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"迁移product_images表时发生错误: {e}")
        raise

if __name__ == "__main__":
    print("开始数据库迁移过程...")
    success = migrate_data()
    if success:
        print("迁移完成！您现在可以使用PostgreSQL数据库了。")
    else:
        print("迁移失败，请检查错误信息。")
