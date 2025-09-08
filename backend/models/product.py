from . import db
from datetime import datetime
import json

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    sale_price = db.Column(db.Float, nullable=True)
    
    # 产品详细信息
    product_code = db.Column(db.String(50), nullable=True)  # 货号
    pattern = db.Column(db.String(100), nullable=True)  # 图案
    skirt_length = db.Column(db.String(50), nullable=True)  # 裙长
    clothing_length = db.Column(db.String(50), nullable=True)  # 衣长
    style = db.Column(db.String(50), nullable=True)  # 风格
    pants_length = db.Column(db.String(50), nullable=True)  # 裤长
    sleeve_length = db.Column(db.String(50), nullable=True)  # 袖长
    fashion_elements = db.Column(db.String(100), nullable=True)  # 流行元素
    craft = db.Column(db.String(100), nullable=True)  # 工艺
    launch_season = db.Column(db.String(50), nullable=True)  # 上市年份/季节
    main_material = db.Column(db.String(100), nullable=True)  # 主面料成分
    color = db.Column(db.String(100), nullable=True)  # 颜色
    size = db.Column(db.String(100), nullable=True)  # 尺码
    
    # 图片信息
    size_img = db.Column(db.Text, nullable=True)  # 尺码图片URL列表，JSON格式
    good_img = db.Column(db.Text, nullable=True)  # 商品图片URL列表，JSON格式
    factory_name = db.Column(db.String(200), nullable=True)  # 工厂名称
    
    # OSS相关字段
    image_url = db.Column(db.String(255), nullable=True)  # 主图URL
    image_path = db.Column(db.String(255), nullable=True)  # 本地图片路径
    oss_path = db.Column(db.String(255), nullable=True)  # OSS路径
    
    # 销售状态
    sales_status = db.Column(db.String(20), nullable=False, default='on_sale')  # 销售状态：sold_out-售罄, on_sale-在售, pre_sale-预售
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f'<Product {self.name}>'

    def to_dict(self):
        """将产品信息转换为字典，用于API响应"""
        # 解析JSON字段
        size_img_list = []
        good_img_list = []
        
        if self.size_img:
            try:
                size_img_list = json.loads(self.size_img)
            except:
                pass
                
        if self.good_img:
            try:
                good_img_list = json.loads(self.good_img)
            except:
                pass
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'sale_price': self.sale_price,
            'product_code': self.product_code,
            'pattern': self.pattern,
            'skirt_length': self.skirt_length,
            'clothing_length': self.clothing_length,
            'style': self.style,
            'pants_length': self.pants_length,
            'sleeve_length': self.sleeve_length,
            'fashion_elements': self.fashion_elements,
            'craft': self.craft,
            'launch_season': self.launch_season,
            'main_material': self.main_material,
            'color': self.color,
            'size': self.size,
            'size_img': size_img_list,
            'good_img': good_img_list,
            'factory_name': self.factory_name,
            'image_url': self.image_url,
            'image_path': self.image_path,
            'oss_path': self.oss_path,
            'sales_status': self.sales_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
    @staticmethod
    def from_dict(data):
        """从字典创建产品对象"""
        product = Product()
        
        for key, value in data.items():
            # 允许设置自定义整形主键 id
            if key == 'id':
                # 仅当提供有效的整型值时才设置
                try:
                    if value is not None and str(value).strip() != '':
                        product.id = int(value)
                except (TypeError, ValueError):
                    # 非法 id 将在上层校验报错，这里忽略设置
                    pass
                continue
                
            if key in ['size_img', 'good_img'] and value:
                # 将列表转换为JSON字符串
                if isinstance(value, list):
                    setattr(product, key, json.dumps(value, ensure_ascii=False))
                elif isinstance(value, str):
                    # 如果已经是字符串，尝试解析确认是否是有效的JSON
                    try:
                        json.loads(value)
                        setattr(product, key, value)
                    except:
                        # 如果解析失败，假设它是普通字符串，转换为JSON
                        setattr(product, key, json.dumps([value], ensure_ascii=False))
            else:
                if hasattr(product, key):
                    setattr(product, key, value)
                    
        return product

class ProductImage(db.Model):
    """
    产品图片模型，存储产品图片路径和向量表示
    """
    __tablename__ = 'product_images'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False, unique=True)
    vector = db.Column(db.LargeBinary, nullable=False)  # BLOB类型用于存储向量
    
    # 建立与Product的关系
    product = db.relationship('Product', backref=db.backref('images', lazy=True, cascade='all, delete-orphan'))
    
    def __repr__(self):
        return f'<ProductImage {self.id} for Product {self.product_id}>'
    
    def to_dict(self):
        """将图片信息转换为字典，用于API响应"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'image_path': self.image_path
        }
    
    @staticmethod
    def from_dict(data):
        """从字典创建图片对象"""
        image = ProductImage()
        
        for key, value in data.items():
            if key == 'id':
                continue  # 跳过id字段，让数据库自动生成
                
            if hasattr(image, key):
                setattr(image, key, value)
                    
        return image