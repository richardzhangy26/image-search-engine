import os
from flask import Flask
from flask_cors import CORS
from pathlib import Path
from models import db
from blueprints.product_search import product_search_bp
from blueprints.customers import customers_bp

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5174"],  # 允许前端开发服务器的域名
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # 允许的HTTP方法
        "allow_headers": ["Content-Type"]  # 允许的请求头
    }
})

# 配置
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'product_search', 'images')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:zhang7481592630@localhost/image_search_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

# 注册蓝图
app.register_blueprint(product_search_bp)
app.register_blueprint(customers_bp)

# 确保目录存在
Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True)
