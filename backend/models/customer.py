from datetime import datetime
from . import db

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    wechat = db.Column(db.String(100), unique=True, nullable=False)  # 改为微信号
    phone = db.Column(db.String(20))
    default_address = db.Column(db.Text)  # 默认收货地址
    address_history = db.Column(db.JSON)  # 历史收货地址
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to Orders
    orders = db.relationship('Order', backref='customer', lazy=True)

    def __repr__(self):
        return f'<Customer {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'wechat': self.wechat,
            'phone': self.phone,
            'default_address': self.default_address,
            'address_history': self.address_history or [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
