import sqlite3
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import json
import dashscope
from http import HTTPStatus
import base64
from PIL import Image
import io
import time
import random
from dotenv import load_dotenv
load_dotenv()
# 设置DashScope API密钥
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
if not dashscope.api_key:
    raise ValueError("请设置DASHSCOPE_API_KEY环境变量")

@dataclass
class ProductInfo:
    """商品信息数据类"""
    product_id: str
    name: str
    attributes: Dict[str, str]  # 存储颜色、尺寸等属性
    price: float
    description: str

class VectorProductIndex:
    def __init__(self, db_path: str, vector_dim: int = 1024):  # DashScope embedding维度为1024
        """
        初始化向量索引系统
        Args:
            db_path: SQLite数据库路径
            vector_dim: 特征向量维度
        """
        self.db_path = db_path
        self.vector_dim = vector_dim
        
        # 初始化FAISS索引
        self.index = faiss.IndexFlatL2(vector_dim)  # L2距离的平面索引
        
        # 创建数据库表
        self._init_database()
        
    def _init_database(self):
        """初始化SQLite数据库表"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    product_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    attributes TEXT NOT NULL,  -- JSON格式存储属性
                    price REAL NOT NULL,
                    description TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS product_images (
                    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT NOT NULL,
                    image_path TEXT NOT NULL,
                    vector_id INTEGER NOT NULL,  -- 对应FAISS中的向量ID
                    FOREIGN KEY (product_id) REFERENCES products (product_id),
                    UNIQUE (image_path)
                )
            """)
            conn.commit()
    
    def _image_to_base64(self, image_path: str) -> str:
        """将图片转换为base64格式"""
        # 读取图片并转换为jpg格式（如果不是jpg）
        image = Image.open(image_path)
        if image.format != 'JPEG':
            image = image.convert('RGB')
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG')
            img_byte_arr = img_byte_arr.getvalue()
        else:
            with open(image_path, "rb") as image_file:
                img_byte_arr = image_file.read()
                
        base64_image = base64.b64encode(img_byte_arr).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_image}"
    
    def extract_feature(self, image_path: str) -> np.ndarray:
        """使用DashScope API提取图片特征向量"""
        # 添加延迟以避免触发API速率限制
        # 使用随机延迟，在1-3秒之间，避免固定间隔可能导致的问题
        delay = 1 + random.random() * 2
        print(f"API调用前等待 {delay:.2f} 秒以避免速率限制...")
        time.sleep(delay)
        
        # 将图片转换为base64格式
        print(f"正在处理图片: {image_path}")
        image_data = self._image_to_base64(image_path)
        
        # 调用DashScope API
        inputs = [{'image': image_data}]
        print("正在调用DashScope API...")
        
        # 添加重试机制
        max_retries = 3
        retry_delay = 5  # 初始重试延迟（秒）
        
        for retry in range(max_retries):
            try:
                resp = dashscope.MultiModalEmbedding.call(
                    model="multimodal-embedding-v1",
                    input=inputs
                )
                
                if resp.status_code != HTTPStatus.OK:
                    if "rate limit exceeded" in resp.message.lower():
                        if retry < max_retries - 1:  # 如果不是最后一次重试
                            print(f"API速率限制错误，等待 {retry_delay} 秒后重试 ({retry+1}/{max_retries})...")
                            time.sleep(retry_delay)
                            retry_delay *= 2  # 指数退避策略
                            continue
                    raise Exception(f"API调用失败: {resp.message}")
                
                # 获取特征向量
                print("API调用成功，正在处理返回结果...")
                feature = np.array(resp.output['embeddings'][0]['embedding'], dtype=np.float32)
                
                # 归一化特征向量
                norm = np.linalg.norm(feature)
                print(f"原始向量范数: {norm}")
                feature = feature / norm
                print(f"归一化后范数: {np.linalg.norm(feature)}")
                return feature
                
            except Exception as e:
                if retry < max_retries - 1 and "rate limit exceeded" in str(e).lower():
                    print(f"API速率限制错误，等待 {retry_delay} 秒后重试 ({retry+1}/{max_retries})...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # 指数退避策略
                else:
                    raise  # 如果是其他错误或已达到最大重试次数，则抛出异常
    
    def add_product(self, product: ProductInfo, image_paths: List[str]):
        """
        添加商品及其图片到索引
        Args:
            product: 商品信息
            image_paths: 商品图片路径列表
        """
        with sqlite3.connect(self.db_path) as conn:
            # 存储商品信息
            conn.execute(
                "INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?)",
                (
                    product.product_id,
                    product.name,
                    json.dumps(product.attributes),
                    product.price,
                    product.description
                )
            )
            
            # 提取并存储图片特征
            features = []
            for image_path in image_paths:
                feature = self.extract_feature(image_path)
                features.append(feature)
            
            # 批量添加到FAISS索引
            features_array = np.array(features).astype('float32')
            vector_ids = np.arange(
                self.index.ntotal,
                self.index.ntotal + len(features)
            )
            self.index.add(features_array)
            
            # 存储图片信息和向量ID的映射
            for image_path, vector_id in zip(image_paths, vector_ids):
                conn.execute(
                    "INSERT OR REPLACE INTO product_images (product_id, image_path, vector_id) VALUES (?, ?, ?)",
                    (product.product_id, image_path, int(vector_id))
                )
            
            conn.commit()
    
    def search(self, query_image_path: str, top_k: int = 5) -> List[Tuple[ProductInfo, float, str]]:
        """
        搜索相似商品
        Args:
            query_image_path: 查询图片路径
            top_k: 返回结果数量
        Returns:
            List[Tuple[商品信息, 相似度得分, 匹配图片路径]]
        """
        # 提取查询图片特征
        print(f"正在提取查询图片特征: {query_image_path}")
        query_feature = self.extract_feature(query_image_path)
        query_feature = query_feature.reshape(1, -1).astype('float32')
        print(f"查询向量范数: {np.linalg.norm(query_feature)}")
        
        # FAISS搜索
        print(f"开始FAISS搜索，索引中共有{self.index.ntotal}个向量")
        distances, indices = self.index.search(query_feature, top_k)
        print(f"搜索结果 - distances: {distances}, indices: {indices}")
        
        results = []
        with sqlite3.connect(self.db_path) as conn:
            for i, (distance, vector_id) in enumerate(zip(distances[0], indices[0])):
                if vector_id == -1:  # 没有找到匹配的向量
                    continue
                    
                # 查询匹配图片的商品信息
                cursor = conn.execute("""
                    SELECT p.*, pi.image_path
                    FROM products p
                    JOIN product_images pi ON p.product_id = pi.product_id
                    WHERE pi.vector_id = ?
                """, (int(vector_id),))
                
                row = cursor.fetchone()
                if row:
                    product = ProductInfo(
                        product_id=row[0],
                        name=row[1],
                        attributes=json.loads(row[2]),
                        price=row[3],
                        description=row[4]
                    )
                    # 计算相似度得分（将L2距离转换为相似度）
                    similarity = float(1 / (1 + distance))  # 确保转换为原生 float
                    results.append((product, similarity, row[5]))
        
        return results
    
    def save_index(self, index_path: str):
        """保存FAISS索引到文件"""
        faiss.write_index(self.index, index_path)
    
    def load_index(self, index_path: str):
        """从文件加载FAISS索引"""
        self.index = faiss.read_index(index_path)
