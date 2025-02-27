import faiss
import numpy as np
import sqlite3
import json
import os
from pathlib import Path

# Path to your index file
INDEX_PATH = "data/product_search/index/product_vectors.index"
DB_PATH = "data/product_search/db/products.db"

# Check if the index file exists
print(f"Checking if index file exists at {INDEX_PATH}...")
if not os.path.exists(INDEX_PATH):
    print(f"ERROR: Index file does not exist at {INDEX_PATH}")
    exit(1)

# Check the file size
file_size = os.path.getsize(INDEX_PATH)
print(f"Index file size: {file_size} bytes")

# Load the index
print(f"Loading index from {INDEX_PATH}...")
try:
    index = faiss.read_index(INDEX_PATH)
    print(f"Successfully loaded index")
except Exception as e:
    print(f"ERROR loading index: {str(e)}")
    exit(1)

# Display basic information
print(f"Index type: {type(index).__name__}")
print(f"Number of vectors: {index.ntotal}")
print(f"Vector dimension: {index.d}")

# 显示索引中的向量内容
if index.ntotal > 0:
    print("\n查看索引中的向量内容:")
    
    # 如果是 IndexFlatL2 类型，我们可以获取向量
    if isinstance(index, faiss.IndexFlatL2):
        try:
            # 使用reconstruct方法获取向量
            first_vector = np.zeros((1, index.d), dtype=np.float32)
            for i in range(min(index.ntotal, 5)):
                vector = index.reconstruct(i)
                
                if i == 0:
                    print(f"\n第一个向量 (维度: {index.d}, 显示前20个元素):")
                    print(vector[:20])
                    
                    # 计算向量的一些统计信息
                    print(f"向量范数: {np.linalg.norm(vector)}")
                    print(f"向量均值: {np.mean(vector)}")
                    print(f"向量标准差: {np.std(vector)}")
                    print(f"向量最小值: {np.min(vector)}")
                    print(f"向量最大值: {np.max(vector)}")
                
                first_vector[0] = vector
            
            # 如果有多个向量，计算它们之间的距离
            if index.ntotal > 1:
                print("\n向量之间的欧几里得距离:")
                vectors = []
                for i in range(min(5, index.ntotal)):
                    vectors.append(index.reconstruct(i))
                
                for i in range(len(vectors)):
                    for j in range(i+1, len(vectors)):
                        dist = np.linalg.norm(vectors[i] - vectors[j])
                        print(f"向量 {i} 和向量 {j} 之间的距离: {dist}")
        except Exception as e:
            print(f"获取向量数据时出错: {str(e)}")
            print("尝试使用替代方法...")
            
            # 使用搜索方法间接获取信息
            print("\n使用搜索方法获取向量信息:")
            # 创建一个随机查询向量
            query = np.random.random(index.d).astype('float32').reshape(1, index.d)
            query = query / np.linalg.norm(query)  # 归一化
            
            # 搜索最近的向量
            distances, indices = index.search(query, min(index.ntotal, 5))
            print(f"随机查询向量与索引中向量的距离:")
            for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
                print(f"  第{i+1}近的向量 ID: {idx}, 距离: {dist}")
    else:
        print("当前索引类型不支持直接访问向量内容")

# Connect to the database to get product information
print(f"\nConnecting to database at {DB_PATH}...")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all product image mappings
cursor.execute("""
    SELECT pi.vector_id, p.product_id, p.name, pi.image_path
    FROM product_images pi
    JOIN products p ON pi.product_id = p.product_id
    ORDER BY pi.vector_id
""")
mappings = cursor.fetchall()

print(f"\nFound {len(mappings)} vector-to-product mappings in database:")
for i, mapping in enumerate(mappings[:10]):  # Show first 10 mappings
    vector_id, product_id, name, image_path = mapping
    print(f"{i+1}. Vector ID: {vector_id}, Product: {name} ({product_id}), Image: {image_path}")

if len(mappings) > 10:
    print(f"... and {len(mappings) - 10} more")

# Get all products
cursor.execute("SELECT product_id, name, attributes FROM products")
products = cursor.fetchall()

print(f"\nFound {len(products)} products in database:")
for i, product in enumerate(products[:10]):  # Show first 10 products
    product_id, name, attributes = product
    attributes_dict = json.loads(attributes)
    print(f"{i+1}. {name} ({product_id})")
    print(f"   Attributes: {attributes_dict}")

if len(products) > 10:
    print(f"... and {len(products) - 10} more")

# Check for inconsistency
if index.ntotal != len(mappings):
    print(f"\nWARNING: Inconsistency detected!")
    print(f"Number of vectors in FAISS index: {index.ntotal}")
    print(f"Number of vector mappings in database: {len(mappings)}")
    print("This suggests that the index file is not being properly updated or saved.")
    print("Possible causes:")
    print("1. The index is not being saved after adding new vectors")
    print("2. The index file is being overwritten with an older version")
    print("3. There's an issue with the FAISS index.add() operation")

conn.close()