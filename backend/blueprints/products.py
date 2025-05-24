from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
import os
import requests
from pathlib import Path
import json
import csv
import io
import time
from product_search import VectorProductIndex# 导入向量搜索和产品信息
from models import db, Product,ProductImage,Order# 导入Product模型
from .oss import get_oss_client  # 导入OSS客户端
import hashlib
import uuid
import ast
from flask_cors import cross_origin
import shutil

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

# Helper function (consider moving to a utils file)
def allowed_file(filename):
    """检查文件扩展名是否允许"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 获取产品列表
@products_bp.route('', methods=['GET'])
@cross_origin()
def get_products():
    try:
        # 使用ORM查询所有产品
        products = Product.query.order_by(Product.created_at.desc()).all()
        
        # 将产品对象转换为字典列表
        product_list = [product.to_dict() for product in products]
        
        return jsonify(product_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加新产品
@products_bp.route('', methods=['POST'])
@cross_origin()
def add_product():
    try:
        # 获取产品数据
        product_data = json.loads(request.form.get('product'))
        # 创建新产品对象
        product = Product.from_dict(product_data)
        
        # 先保存到数据库以获取产品ID
        db.session.add(product)
        db.session.commit()
        
        # 获取产品ID
        product_id = product.id
        
        # 处理尺码图片
        size_images = request.files.getlist('size_images')
        size_img_urls = []
        for image in size_images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                # 生成唯一文件名
                unique_filename = f"{uuid.uuid4()}_{filename}"
                # 创建按产品ID组织的目录
                product_size_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'size_images', str(product_id))
                os.makedirs(product_size_dir, exist_ok=True)
                # 保存文件
                image_path = os.path.join(product_size_dir, unique_filename)
                image.save(image_path)
                # 添加URL到列表
                size_img_urls.append(f"/uploads/size_images/{product_id}/{unique_filename}")
        
        # 处理商品图片
        good_images = request.files.getlist('good_images')
        good_img_urls = []
        for image in good_images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                # 生成唯一文件名
                unique_filename = f"{uuid.uuid4()}_{filename}"
                # 创建按产品ID组织的目录
                product_good_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', str(product_id))
                os.makedirs(product_good_dir, exist_ok=True)
                # 保存文件
                image_path = os.path.join(product_good_dir, unique_filename)
                image.save(image_path)
                # 添加URL到列表
                good_img_urls.append(f"/uploads/good_images/{product_id}/{unique_filename}")
        
        # 更新产品的图片URL
        product.size_img = json.dumps(size_img_urls)
        product.good_img = json.dumps(good_img_urls)
        
        # 更新产品信息
        db.session.commit()
        # 如果配置了向量搜索
        if current_app.config.get('PRODUCT_INDEX'):
            try:

                # 添加到向量索引
                product_index = current_app.config['PRODUCT_INDEX']
                if good_img_urls:  # 使用第一张商品图片作为索引
                    # 更新图片路径，使用新的目录结构
                   for good_img_url in good_img_urls: 
                    image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', str(product_id), os.path.basename(good_img_url.split('/')[-1]))
                    # 创建产品信息对象
                    feature = product_index.extract_feature(image_path)
                    product_image = ProductImage(
                        product_id=product_id,
                        image_path=good_img_url,
                        vector=feature
                    )
                    db.session.add(product_image)
                db.session.commit()
                current_app.logger.info(f"已将产品 {product.id} 添加到向量索引")
            except Exception as e:
                current_app.logger.error(f"添加产品到向量索引时出错: {e}")
        
        return jsonify({
            'message': '产品添加成功',
            'id': product.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 更新产品信息
@products_bp.route('/<product_id>', methods=['PUT'])
@cross_origin()
def update_product(product_id):
    try:
        # 查找产品
        product = Product.query.filter_by(id=product_id).first()
        if not product:
            return jsonify({'error': '产品不存在'}), 404

        # 获取产品数据
        product_data = json.loads(request.form.get('product'))
        
        # 处理尺码图片
        size_images = request.files.getlist('size_images')
        if size_images:
            size_img_urls = []
            for image in size_images:
                if image and allowed_file(image.filename):
                    filename = secure_filename(image.filename)
                    # 生成唯一文件名
                    unique_filename = f"{uuid.uuid4()}_{filename}"
                    # 保存文件
                    image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'size_images', unique_filename)
                    os.makedirs(os.path.dirname(image_path), exist_ok=True)
                    image.save(image_path)
                    # 添加URL到列表
                    size_img_urls.append(f"/uploads/size_images/{unique_filename}")
            # 只有在有新图片上传时才更新
            product.size_img = json.dumps(size_img_urls)
        
        # 处理商品图片
        good_images = request.files.getlist('good_images')
        if good_images:
            good_img_urls = []
            for image in good_images:
                if image and allowed_file(image.filename):
                    filename = secure_filename(image.filename)
                    # 生成唯一文件名
                    unique_filename = f"{uuid.uuid4()}_{filename}"
                    # 保存文件
                    image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', unique_filename)
                    os.makedirs(os.path.dirname(image_path), exist_ok=True)
                    image.save(image_path)
                    # 添加URL到列表
                    good_img_urls.append(f"/uploads/good_images/{unique_filename}")
            # 只有在有新图片上传时才更新
            product.good_img = json.dumps(good_img_urls)

        # 更新其他字段
        for key, value in product_data.items():
            if key not in ['id', 'size_img', 'good_img'] and hasattr(product, key):
                setattr(product, key, value)

        db.session.commit()

        # 如果配置了向量搜索且有新的商品图片
        if current_app.config.get('PRODUCT_INDEX') and good_images:
            try:
                # 创建产品信息对象
                product_info = ProductInfo(
                    id=product.id,
                    name=product.name,
                    attributes={},
                    price=float(product.price),
                    description=product.description or ''
                )
                
                # 更新向量索引
                product_index = current_app.config['PRODUCT_INDEX']
                image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', os.path.basename(good_img_urls[0]))
                product_index.add_product(product_info, image_path)
                
                current_app.logger.info(f"已更新产品 {product.id} 的向量索引")
            except Exception as e:
                current_app.logger.error(f"更新产品向量索引时出错: {e}")

        return jsonify({'message': '产品更新成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 删除产品
@products_bp.route('/<product_id>', methods=['DELETE'])
@cross_origin()
def delete_product(product_id):
    try:
        # 查找产品
        product = Product.query.filter_by(id=product_id).first()
        if not product:
            return jsonify({'error': '产品不存在'}), 404
        
        # 从数据库中删除
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': '产品删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 搜索产品
@products_bp.route('/search', methods=['POST'])
@cross_origin()
def search_products():
    try:
        # 检查是否配置了向量搜索
        if 'PRODUCT_INDEX' not in current_app.config:
            return jsonify({'error': '向量搜索未配置'}), 500
        product_index = current_app.config['PRODUCT_INDEX']
        
        # 处理图片上传
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # 使用向量索引搜索相似产品
                results = product_index.search(filepath, top_k=10)
                
                # 清理上传的文件
                os.remove(filepath)
                
                # 获取产品详细信息
                product_ids = [result.id for result in results]
                products = Product.query.filter(Product.id.in_(product_ids)).all()
                
                # 将产品对象转换为字典
                product_list = []
                for product in products:
                    product_dict = product.to_dict()
                    # 添加相似度分数
                    for result in results:
                        if result.id == product.id:
                            product_dict['similarity'] = result.similarity
                            break
                    product_list.append(product_dict)
                
                # 按相似度排序
                product_list.sort(key=lambda x: x.get('similarity', 0), reverse=True)
                
                return jsonify(product_list)
        
        # 处理文本搜索
        elif 'query' in request.json:
            query = request.json['query']
            
            # 使用向量索引搜索相关产品
            results = product_index.search_by_text(query, top_k=10)
            
            # 获取产品详细信息
            product_ids = [result.id for result in results]
            products = Product.query.filter(Product.id.in_(product_ids)).all()
            
            # 将产品对象转换为字典
            product_list = []
            for product in products:
                product_dict = product.to_dict()
                # 添加相似度分数
                for result in results:
                    if result.id == product.id:
                        product_dict['similarity'] = result.similarity
                        break
                product_list.append(product_dict)
            
            # 按相似度排序
            product_list.sort(key=lambda x: x.get('similarity', 0), reverse=True)
            
            return jsonify(product_list)
        
        return jsonify({'error': '未提供搜索参数'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 获取单个产品
@products_bp.route('/<product_id>', methods=['GET'])
@cross_origin()
def get_product(product_id):
    try:
        # 查询产品
        product = Product.query.filter_by(id=product_id).first()
        
        if not product:
            return jsonify({'error': '产品不存在'}), 404
            
        # 转换为字典并返回
        return jsonify(product.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 上传产品图片到OSS
@products_bp.route('/upload_image', methods=['POST'])
@cross_origin()
def upload_product_image():
    try:
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 生成安全的文件名
            filename = secure_filename(file.filename)
            
            # 生成唯一的文件名
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # 保存到临时目录
            temp_dir = Path(current_app.config['UPLOAD_FOLDER']) / 'temp'
            temp_dir.mkdir(exist_ok=True)
            
            temp_path = temp_dir / unique_filename
            file.save(temp_path)
            
            # 上传到OSS
            try:
                oss_client = get_oss_client()
                
                # 设置OSS路径
                oss_path = f"products/{unique_filename}"
                
                # 上传文件
                oss_client.put_object_from_file(oss_path, str(temp_path))
                
                # 生成OSS URL
                oss_url = f"https://your-bucket-name.oss-cn-region.aliyuncs.com/{oss_path}"
                
                # 清理临时文件
                os.remove(temp_path)
                
                return jsonify({
                    'message': '图片上传成功',
                    'filename': unique_filename,
                    'oss_path': oss_path,
                    'url': oss_url
                })
            except Exception as e:
                # 清理临时文件
                os.remove(temp_path)
                return jsonify({'error': f'上传到OSS时出错: {str(e)}'}), 500
        
        return jsonify({'error': '不允许的文件类型'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 删除产品图片
@products_bp.route('/images/<product_id>/<path:image_filename>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_product_image(product_id, image_filename):
    try:
        # 查找产品
        product = Product.query.get_or_404(product_id)
        
        # 从URL中提取实际的文件路径
        relative_path = image_filename.replace('uploads/', '')
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], relative_path)
        
        # 检查文件是否存在
        if not os.path.exists(image_path):
            return jsonify({'error': '图片不存在'}), 404
            
        # 删除物理文件
        os.remove(image_path)
        
        # 更新商品图片列表
        if product.good_img:
            try:
                good_images = json.loads(product.good_img)
                good_images = [img for img in good_images if image_filename not in img]
                product.good_img = json.dumps(good_images, ensure_ascii=False)
            except json.JSONDecodeError:
                current_app.logger.error(f"商品 {product_id} 的good_img字段JSON格式错误")
        
        # 更新尺码图片列表
        if product.size_img:
            try:
                size_images = json.loads(product.size_img)
                size_images = [img for img in size_images if image_filename not in img]
                product.size_img = json.dumps(size_images, ensure_ascii=False)
            except json.JSONDecodeError:
                current_app.logger.error(f"商品 {product_id} 的size_img字段JSON格式错误")
        
        # 更新主图片
        if product.image_url and image_filename in product.image_url:
            product.image_url = None
            
        # 提交数据库更改
        db.session.commit()
        
        return jsonify({
            'message': '图片删除成功',
            'good_images': json.loads(product.good_img) if product.good_img else [],
            'size_images': json.loads(product.size_img) if product.size_img else []
        })
    except Exception as e:
        current_app.logger.error(f"删除图片时出错: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 上传CSV文件导入商品数据
@products_bp.route('/upload_csv', methods=['POST'])
@cross_origin()
def upload_csv():
    try:
        # 检查是否有文件
        if 'csv_file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['csv_file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'error': '文件必须是CSV格式'}), 400
        
        # 获取图片文件夹路径
        images_folder = request.form.get('images_folder')
        if not images_folder:
            return jsonify({'error': '没有提供图片文件夹路径'}), 400
        
        if not os.path.exists(images_folder):
            return jsonify({'error': '图片文件夹路径不存在'}), 400

        # 读取CSV文件
        csv_content = file.read().decode('utf-8')
        csv_file = io.StringIO(csv_content)
        csv_reader = csv.DictReader(csv_file)
        
        # 导入结果统计
        stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        # 处理每一行
        for row in csv_reader:
            stats['total'] += 1
            
            try:
                # 创建产品对象
                product_data = {}
                for key, value in row.items():
                    if key in ['name', 'description', 'price', 'sale_price', 'product_code', 
                              'pattern', 'skirt_length', 'clothing_length', 'style', 
                              'pants_length', 'sleeve_length', 'fashion_elements', 'craft', 
                              'launch_season', 'main_material', 'color', 'size', 'factory_name']:
                        if key in ['price', 'sale_price'] and value:
                            product_data[key] = float(value)
                        else:
                            product_data[key] = value
                
                # 处理特殊字段
                if '货号' in row:
                    product_data['product_code'] = row['货号']
                if '图案' in row:
                    product_data['pattern'] = row['图案']
                if '裙长' in row:
                    product_data['skirt_length'] = row['裙长']
                if '衣长' in row:
                    product_data['clothing_length'] = row['衣长']
                if '风格' in row:
                    product_data['style'] = row['风格']
                if '裤长' in row:
                    product_data['pants_length'] = row['裤长']
                if '袖长' in row:
                    product_data['sleeve_length'] = row['袖长']
                if '流行元素' in row:
                    product_data['fashion_elements'] = row['流行元素']
                if '工艺' in row:
                    product_data['craft'] = row['工艺']
                if '上市年份/季节' in row:
                    product_data['launch_season'] = row['上市年份/季节']
                if '主面料成分' in row:
                    product_data['main_material'] = row['主面料成分']
                if '颜色' in row:
                    product_data['color'] = row['颜色']
                if '尺码' in row:
                    product_data['size'] = row['尺码']
                
                # 处理size_img和good_img字段
                if 'size_img' in row:
                    product_data['size_img'] = parse_list_field(row['size_img'])
                if 'good_img' in row:
                    product_data['good_img'] = parse_list_field(row['good_img'])
                
                # 创建产品对象并保存到数据库
                product = Product.from_dict(product_data)
                db.session.add(product)
                db.session.commit()
                
                # 获取产品ID
                product_id = product.id
                
                # 处理图片文件夹中的图片
                good_img_urls = []
                product_name = product_data.get('name', '') # 获取产品名称，用于匹配文件夹
                
                if product_name: # 确保产品名称存在
                    product_specific_images_folder = os.path.join(images_folder, product_name)
                    
                    if os.path.isdir(product_specific_images_folder):
                        # 遍历特定产品图片文件夹中的文件
                        for filename in os.listdir(product_specific_images_folder):
                            if allowed_file(filename):
                                # 生成唯一文件名
                                unique_filename = f"{uuid.uuid4()}_{filename}"
                                # 创建按产品ID组织的目录
                                product_good_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', str(product_id))
                                os.makedirs(product_good_dir, exist_ok=True)
                                # 源文件路径
                                image_path = os.path.join(product_specific_images_folder, filename)
                                # 目标文件路径
                                dest_path = os.path.join(product_good_dir, unique_filename)
                                # 复制文件
                                shutil.copy2(image_path, dest_path)
                                # 添加URL到列表
                                good_img_urls.append(f"/uploads/good_images/{product_id}/{unique_filename}")
                    else:
                        current_app.logger.warning(f"产品 '{product_name}' 对应的图片文件夹 '{product_specific_images_folder}' 不存在或不是一个目录")
                else:
                    current_app.logger.warning(f"CSV 行中产品名称为空，无法处理图片")
                
                # 更新产品的图片URL
                if good_img_urls:
                    product.good_img = json.dumps(good_img_urls)
                    product.image_url = good_img_urls[0]  # 使用第一张图片作为主图
                    db.session.commit()
                
                # 如果配置了向量搜索
                if current_app.config.get('PRODUCT_INDEX') and good_img_urls:
                    try:
                        # 添加到向量索引
                        product_index = current_app.config['PRODUCT_INDEX']
                        for good_img_url in good_img_urls:
                            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'good_images', str(product_id), os.path.basename(good_img_url.split('/')[-1]))
                            # 创建产品信息对象
                            feature = product_index.extract_feature(image_path)
                            product_image = ProductImage(
                                product_id=product_id,
                                image_path=good_img_url,
                                vector=feature
                            )
                            db.session.add(product_image)
                        db.session.commit()
                        current_app.logger.info(f"已将产品 {product.id} 添加到向量索引")
                    except Exception as e:
                        current_app.logger.error(f"添加产品到向量索引时出错: {e}")
                
                stats['success'] += 1
            except Exception as e:
                stats['failed'] += 1
                error_msg = f"处理第 {stats['total']} 行时出错: {str(e)}"
                stats['errors'].append(error_msg)
                current_app.logger.error(error_msg)
                db.session.rollback()
        
        return jsonify({
            'message': 'CSV文件导入完成',
            'stats': stats
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 生成唯一的产品ID
def generate_product_id(name, factory_name):
    combined = f"{name}_{factory_name}_{time.time()}"
    return hashlib.md5(combined.encode()).hexdigest()[:16]

# 解析列表字段（如图片URL列表）
def parse_list_field(field):
    try:
        if isinstance(field, str):
            # 尝试解析JSON字符串
            return json.loads(field)
        elif isinstance(field, list):
            return field
        else:
            return []
    except json.JSONDecodeError:
        # 尝试使用ast.literal_eval解析
        try:
            return ast.literal_eval(field)
        except (SyntaxError, ValueError):
            return []
