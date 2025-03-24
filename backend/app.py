from turtle import pd
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import csv
import io
from pathlib import Path
from product_search import VectorProductIndex, ProductInfo
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)  # 启用CORS支持跨域请求

# 配置文件上传
UPLOAD_FOLDER = 'data/product_search/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB

# 初始化商品索引系统
INDEX_PATH = "data/product_search/index/product_vectors.index"
product_index = VectorProductIndex()

# 如果索引文件存在，加载它
if os.path.exists(INDEX_PATH):
    product_index.load_index(INDEX_PATH)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_directories():
    """确保必要的目录存在"""
    Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
    Path(os.path.dirname(INDEX_PATH)).mkdir(parents=True, exist_ok=True)

@app.before_first_request
def initialize():
    """在首次请求前初始化必要的目录"""
    ensure_directories()

@app.route('/api/products', methods=['POST'])
def add_product():
    """添加新商品"""
    try:
        # 检查是否有文件被上传
        if 'images' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
            
        files = request.files.getlist('images')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': '没有选择图片'}), 400
            
        # 获取商品信息
        product_data = request.form.get('product')
        if not product_data:
            return jsonify({'error': '没有提供商品信息'}), 400
            
        try:
            product_data = eval(product_data)  # 将字符串转换为字典
        except:
            return jsonify({'error': '商品信息格式无效'}), 400
            
        # 创建ProductInfo对象
        product = ProductInfo(
            product_id=product_data.get('product_id'),
            name=product_data.get('name'),
            attributes=product_data.get('attributes', {}),
            price=float(product_data.get('price', 0)),
            description=product_data.get('description', '')
        )
        
        # 保存上传的图片
        image_paths = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                image_paths.append(filepath)
        
        if not image_paths:
            return jsonify({'error': '没有有效的图片文件'}), 400
            
        # 添加商品到索引
        product_index.add_product(product, image_paths)
        
        # 保存索引
        product_index.save_index(INDEX_PATH)
        
        return jsonify({
            'message': '商品添加成功',
            'product_id': product.product_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search_products():
    """搜索相似商品"""
    try:
        # 检查是否有文件被上传
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': '没有选择图片'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': '不支持的文件类型'}), 400
            
        # 保存查询图片
        filename = secure_filename(file.filename)
        query_path = os.path.join(app.config['UPLOAD_FOLDER'], 'query_' + filename)
        file.save(query_path)
        
        # 获取top_k参数
        top_k = int(request.form.get('top_k', 5))
        
        # 搜索相似商品
        results = product_index.search(query_path, top_k)
        
        # 删除查询图片
        os.remove(query_path)
    
        # 格式化返回结果
        formatted_results = []
        for product, similarity, image_path in results:
            try:
                # 处理图片路径
                if os.path.isabs(image_path):
                    # 如果是绝对路径，提取文件名
                    image_filename = os.path.basename(image_path)
                    # 构建图片URL
                    image_url = f"/images/{image_filename}"
                else:
                    # 如果是相对路径
                    image_filename = image_path
                    
                    # 检查是否是商品图路径
                    if '商品信息/商品图/' in image_filename or '../商品信息/商品图/' in image_filename:
                        # 提取商品图文件夹之后的部分
                        if '../商品信息/商品图/' in image_filename:
                            product_image_path = image_filename.split('../商品信息/商品图/', 1)[1]
                        else:
                            product_image_path = image_filename.split('商品信息/商品图/', 1)[1]
                            
                        # 构建直接访问商品图的URL
                        image_url = f"/商品信息/商品图/{product_image_path}"
                    else:
                        # 移除开头的 '../' 如果存在
                        if image_filename.startswith('../'):
                            image_filename = image_filename[3:]
                            
                        # 构建普通图片URL
                        image_url = f"/images/{image_filename}"
                
                # 检查文件是否存在
                parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                full_path = os.path.join(parent_dir, image_filename)
                
                if not os.path.exists(full_path):
                    print(f"警告: 找不到图片文件: {full_path}")
                else:
                    print(f"图片文件存在: {full_path}")
                
                # 对路径进行编码，去除引号等特殊字符
                import urllib.parse
                
                # 根据之前设置的image_url进行编码
                if '商品信息/商品图/' in image_url:
                    # 对商品图路径特殊处理
                    parts = image_url.split('/', 3)  # 分割成 ["", "商品信息", "商品图", "剩余路径"]
                    if len(parts) >= 4:
                        encoded_path = f"/{parts[1]}/{parts[2]}/{urllib.parse.quote(parts[3])}"
                        image_url = encoded_path
                else:
                    # 普通图片路径
                    image_url = image_url.replace('/images/', '/images/')  # 保持不变，已经处理过了
                
                formatted_results.append({
                    'product_id': product.product_id,
                    'name': product.name,
                    'attributes': product.attributes,
                    'price': float(product.price),  # 确保是原生 float 类型
                    'description': product.description,
                    'similarity': float(similarity),  # 将 numpy.float32 转换为原生 float
                    'image_path': image_url,  # 使用URL而不是本地路径
                    'original_path': image_filename  # 添加原始路径用于调试
                })
            except Exception as e:
                print(f"处理搜索结果时出错: {e}")
                # 继续处理下一个结果
        
        return jsonify({
            'results': formatted_results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/csv', methods=['POST'])
def add_products_from_csv():
    """从CSV文件批量添加商品"""
    try:

        # 检查是否有CSV文件被上传
        if 'csv_file' not in request.files:
            return jsonify({'error': '没有上传CSV文件'}), 400
            
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({'error': '没有选择CSV文件'}), 400
        
        # 获取图片文件夹路径
        images_folder = request.form.get('images_folder')
        if not images_folder:
            return jsonify({'error': '没有提供图片文件夹路径'}), 400
        
        # 检查图片文件夹是否存在
        if not os.path.exists(images_folder) or not os.path.isdir(images_folder):
            return jsonify({'error': f'图片文件夹不存在: {images_folder}'}), 400
        
        # 读取CSV文件
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        # 检查CSV文件是否包含必要的列
        required_columns = ['名称', '货号', '图案', '尺寸', '颜色']
        first_row = next(csv_reader, None)
        if not first_row:
            return jsonify({'error': 'CSV文件为空'}), 400
        
        missing_columns = [col for col in required_columns if col not in first_row]
        if missing_columns:
            return jsonify({'error': f'CSV文件缺少必要的列: {", ".join(missing_columns)}'}), 400
        
        # 重置CSV读取器
        csv_file.seek(0)
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        # 处理每一行数据
        products_added = 0
        batch_size = 10  # 设置批处理大小
        api_calls_per_batch = 7 # 每批次最多处理的图片数量，以控制API调用频率
        
        # 收集所有要处理的产品
        products_to_process = []
        
        for row in csv_reader:
            product_name = row['名称'].strip()
            product_id = row['货号'].strip()
            pattern = row['图案'].strip()
            size = row['尺寸'].strip()
            color = row['颜色'].strip()
            
            # 查找对应的图片
            image_files = []
            
            # 检查是否存在以产品名称命名的文件夹
            product_folder = os.path.join(images_folder, product_name)
            if os.path.exists(product_folder) and os.path.isdir(product_folder):
                # 获取文件夹中所有图片文件
                for filename in os.listdir(product_folder):
                    file_ext = filename.split('.')[-1].lower() if '.' in filename else ''
                    if file_ext in ALLOWED_EXTENSIONS:
                        image_files.append(os.path.join(product_folder, filename))
            
            if not image_files:
                continue  # 如果没有找到对应的图片，跳过这个商品
            
            # 创建ProductInfo对象
            product = ProductInfo(
                product_id=product_id,
                name=product_name,
                attributes={
                    '图案': pattern,
                    '尺寸': size,
                    '颜色': color
                },
                price=0.0,  # CSV中没有价格信息，设为0
                description=f"{product_name} - {pattern} - {size} - {color}"
            )
            
            # 收集产品和图片信息
            products_to_process.append((product, image_files))
        
        # 批量处理产品
        total_products = len(products_to_process)
        print(f"共找到 {total_products} 个有效产品，开始批量处理...")
        
        for batch_idx in range(0, total_products, batch_size):
            batch_end = min(batch_idx + batch_size, total_products)
            current_batch = products_to_process[batch_idx:batch_end]
            
            print(f"处理批次 {batch_idx//batch_size + 1}/{(total_products + batch_size - 1)//batch_size}，包含 {len(current_batch)} 个产品")
            
            # 处理当前批次的产品
            for product, image_files in current_batch:
                print(f"处理产品: {product.name} (ID: {product.product_id})")
                
                # 限制每个产品处理的图片数量，以控制API调用频率
                if len(image_files) > api_calls_per_batch:
                    print(f"产品 {product.name} 有 {len(image_files)} 张图片，限制为前 {api_calls_per_batch} 张")
                    limited_image_files = image_files[:api_calls_per_batch]
                else:
                    limited_image_files = image_files
                
                # 添加商品到索引
                try:
                    product_index.add_product(product, limited_image_files)
                    products_added += 1
                    print(f"成功添加产品: {product.name}")
                except Exception as e:
                    print(f"添加产品 {product.name} 时出错: {str(e)}")
            
            # 每处理完一个批次就保存索引
            if products_added > 0:
                print(f"批次 {batch_idx//batch_size + 1} 处理完成，保存索引到 {INDEX_PATH}...")
                product_index.save_index(INDEX_PATH)
                print(f"索引保存成功，当前已处理 {products_added}/{total_products} 个产品")
        
        return jsonify({
            'message': f'成功添加{products_added}个商品',
            'count': products_added
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 直接提供商品图片访问
@app.route('/商品信息/<path:subpath>')
def serve_product_image_cn(subpath):
    try:
        # 构建完整路径
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(parent_dir, '商品信息', subpath)
        
        print(f"尝试访问中文路径图片: {full_path}")
        
        if os.path.exists(full_path):
            # 使用send_file而不是send_from_directory，更好地处理特殊字符
            return send_file(full_path)
        
        # 如果找不到，返回404
        print(f"找不到中文路径图片: {full_path}")
        return "Image not found", 404
        
    except Exception as e:
        print(f"提供中文路径图片时出错: {e}")
        return str(e), 500

# 提供静态图片访问
@app.route('/images/<path:filename>')
def serve_image(filename):
    try:
        # URL解码
        import urllib.parse
        filename = urllib.parse.unquote(filename)
        
        print(f"请求图片: {filename}")
        
        # 尝试在项目根目录查找
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(parent_dir, filename)
        
        print(f"尝试查找图片: {full_path}")
        
        if os.path.exists(full_path):
            directory = os.path.dirname(full_path)
            base_filename = os.path.basename(full_path)
            return send_from_directory(directory, base_filename)
        
        # 尝试在上传文件夹中查找
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print(f"尝试在上传文件夹中查找: {upload_path}")
        
        if os.path.exists(upload_path):
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        
        # 如果都找不到，返回404
        print(f"找不到图片: {filename}")
        return "Image not found", 404
        
    except Exception as e:
        print(f"提供图片时出错: {e}")
        return str(e), 500

# 添加一个通用的静态文件服务路由
@app.route('/<path:filepath>')
def serve_any_static_file(filepath):
    try:
        # URL解码
        import urllib.parse
        filepath = urllib.parse.unquote(filepath)
        
        print(f"尝试访问通用路径: {filepath}")
        
        # 构建完整路径
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(parent_dir, filepath)
        
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return send_file(full_path)
        
        # 如果找不到或不是文件，返回404
        return "File not found", 404
        
    except Exception as e:
        print(f"提供通用文件时出错: {e}")
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
