import os
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from pathlib import Path
from models import db
from blueprints.customers import customers_bp
from blueprints.products import products_bp
from blueprints.orders import orders_bp
from product_search import VectorProductIndex

def create_app(config_name='development'):
    app = Flask(__name__)
    
    # 根据配置类型设置配置
    if config_name == 'testing':
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    else:
        # 从环境变量获取数据库配置
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '3306')
        db_name = os.getenv('DB_NAME', 'product_crm')
        db_user = os.getenv('DB_USER', 'root')
        db_password = os.getenv('DB_PASSWORD', '')
        
        app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    
    # 配置CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://192.168.0.200:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "expose_headers": ["Content-Range", "X-Content-Range"],
            "supports_credentials": True,
            "max_age": 3600
        }
    }, supports_credentials=True)
    
    # 基础配置
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 确保上传目录存在
    if not app.config['TESTING']:
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'size_images'), exist_ok=True)
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'good_images'), exist_ok=True)
    
    # 向量索引配置
    app.config['INDEX_PATH'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                          'data', 'product_search', 'product_index.bin')
    
    # 初始化扩展
    db.init_app(app)

    # 初始化向量索引
    if not app.config['TESTING']:
        product_index = VectorProductIndex()
        # 如果索引文件存在，加载它
        if os.path.exists(app.config['INDEX_PATH']):
            try:
                product_index.load_index(app.config['INDEX_PATH'])
                app.logger.info(f"已加载向量索引: {app.config['INDEX_PATH']}")
            except Exception as e:
                app.logger.error(f"加载向量索引时出错: {e}")
        app.config['PRODUCT_INDEX'] = product_index
        
        # 确保向量索引目录存在
        Path(os.path.dirname(app.config['INDEX_PATH'])).mkdir(parents=True, exist_ok=True)
    
    # 注册蓝图
    app.register_blueprint(customers_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    
    # 添加静态文件路由
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000,debug=True)
