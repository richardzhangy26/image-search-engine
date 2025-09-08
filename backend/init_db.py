from app import create_app
from models import db

def init_database():
    app = create_app()
    with app.app_context():
        # 创建所有表
        db.create_all()
        print("数据库表创建成功！")

if __name__ == '__main__':
    init_database()
