from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
import os
from pathlib import Path
import csv
import io
from product_search import VectorProductIndex, ProductInfo

product_search_bp = Blueprint('product_search', __name__)

# 初始化产品搜索索引
product_index = VectorProductIndex()

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def ensure_directories():
    """确保必要的目录存在"""
    Path(current_app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)

@product_search_bp.route('/api/products', methods=['POST'])
def add_product():
    """添加新商品"""
    if 'image' not in request.files:
        return jsonify({'error': '没有上传图片'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '没有选择图片'}), 400
    
    if not file or not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型'}), 400
    
    # 获取商品信息
    name = request.form.get('name')
    price = float(request.form.get('price', 0))
    description = request.form.get('description', '')
    attributes = request.form.get('attributes', '{}')
    
    if not name:
        return jsonify({'error': '商品名称不能为空'}), 400
    
    try:
        # 保存图片
        filename = secure_filename(file.filename)
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(image_path)
        
        # 添加商品到索引
        product = ProductInfo(
            id=None,  # 数据库会自动生成ID
            name=name,
            attributes=json.loads(attributes),
            price=price,
            description=description
        )
        
        product_id = product_index.add_product(
            name=name,
            attributes=json.loads(attributes),
            price=price,
            description=description,
            image_path=image_path,
            vector=None  # vector will be generated inside add_product
        )
        
        return jsonify({
            'message': '商品添加成功',
            'product_id': product_id,
            'image_path': image_path
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'添加商品失败: {str(e)}'}), 500

@product_search_bp.route('/api/products/search', methods=['POST'])
def search_products():
    """搜索相似商品"""
    if 'image' not in request.files:
        return jsonify({'error': '没有上传图片'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '没有选择图片'}), 400
    
    if not file or not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型'}), 400
    
    try:
        # 保存查询图片
        filename = secure_filename(file.filename)
        query_image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'queries', filename)
        os.makedirs(os.path.dirname(query_image_path), exist_ok=True)
        file.save(query_image_path)
        
        # 搜索相似商品
        top_k = int(request.form.get('top_k', 5))
        results = product_index.search(query_image_path, top_k)
        
        return jsonify({
            'message': '搜索成功',
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'搜索失败: {str(e)}'}), 500

@product_search_bp.route('/api/products/batch', methods=['POST'])
def add_products_from_csv():
    """从CSV文件批量添加商品"""
    if 'csv_file' not in request.files:
        return jsonify({'error': '没有上传CSV文件'}), 400
    
    if 'images' not in request.files:
        return jsonify({'error': '没有上传图片文件'}), 400
    
    csv_file = request.files['csv_file']
    images = request.files.getlist('images')
    
    if csv_file.filename == '':
        return jsonify({'error': '没有选择CSV文件'}), 400
    
    if not csv_file.filename.endswith('.csv'):
        return jsonify({'error': '文件必须是CSV格式'}), 400
    
    try:
        # 读取CSV文件
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        # 保存图片文件
        image_files = {}
        for image in images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                image.save(image_path)
                image_files[filename] = image_path
        
        # 处理每一行数据
        products_added = 0
        for row in csv_reader:
            try:
                # 获取该产品对应的图片路径
                product_images = []
                image_filenames = row.get('images', '').split(',')
                for filename in image_filenames:
                    filename = filename.strip()
                    if filename in image_files:
                        product_images.append(image_files[filename])
                
                if not product_images:
                    print(f"警告: 产品 {row.get('name')} 没有找到对应的图片，跳过")
                    continue
                
                # 创建商品对象
                product = ProductInfo(
                    id=None,  # 数据库会自动生成ID
                    name=row.get('name'),
                    attributes=json.loads(row.get('attributes', '{}')),
                    price=float(row.get('price', 0)),
                    description=row.get('description', '')
                )
                
                # 添加商品到索引
                product_id = product_index.add_product(
                    name=product.name,
                    attributes=product.attributes,
                    price=product.price,
                    description=product.description,
                    image_path=product_images[0],  # 使用第一张图片
                    vector=None  # vector will be generated inside add_product
                )
                
                products_added += 1
                
            except Exception as e:
                print(f"处理行 {row.get('name')} 时出错: {str(e)}")
                continue
        
        return jsonify({
            'message': f'成功添加 {products_added} 个商品',
            'products_added': products_added
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'处理CSV文件失败: {str(e)}'}), 500

@product_search_bp.route('/images/<path:filename>')
def serve_image(filename):
    """提供图片访问服务"""
    try:
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        return jsonify({'error': f'获取图片失败: {str(e)}'}), 404
