from . import db
import datetime
import json

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, comment='订单编号')
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, comment='客户ID')
    
    # 订单基本信息
    total_amount = db.Column(db.DECIMAL(10, 2), nullable=False, comment='订单总金额')
    status = db.Column(db.String(50), nullable=False, default='unpaid', 
                      comment='订单状态：unpaid-未付款, paid-已付款, unpurchased-未采购, purchased-已采购, unshipped-未发货, shipped-已发货')
    payment_status = db.Column(db.String(50), default='unpaid',
                             comment='支付状态：unpaid-未支付, partial-部分支付, paid-已支付')
    shipping_address = db.Column(db.Text, nullable=False, comment='收货地址')
    
    # 产品信息
    products = db.Column(db.JSON, comment='产品信息，JSON格式')
    
    # 备注信息
    customer_notes = db.Column(db.Text, comment='客户备注')
    internal_notes = db.Column(db.Text, comment='内部备注')
    
    # 时间信息
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow,
                          onupdate=datetime.datetime.utcnow, comment='更新时间')
    paid_at = db.Column(db.DateTime, nullable=True, comment='支付时间')
    shipped_at = db.Column(db.DateTime, nullable=True, comment='发货时间')
    completed_at = db.Column(db.DateTime, nullable=True, comment='完成时间')

    def __repr__(self):
        return f'<Order {self.order_number}>'

    def to_dict(self):
        products = json.loads(self.products) if isinstance(self.products, str) else self.products
        
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'total_amount': float(self.total_amount),
            'status': self.status,
            'payment_status': self.payment_status,
            'shipping_address': self.shipping_address,
            'products': products,
            'customer_notes': self.customer_notes,
            'internal_notes': self.internal_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
