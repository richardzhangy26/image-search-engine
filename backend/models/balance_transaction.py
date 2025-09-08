from datetime import datetime
from . import db

class BalanceTransaction(db.Model):
    """记录客户余额的充值与消费明细"""
    __tablename__ = 'balance_transactions'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False, comment='客户ID')
    amount = db.Column(db.DECIMAL(10, 2), nullable=False, comment='交易金额，正数为充值，负数为消费')
    note = db.Column(db.Text, nullable=True, comment='备注')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, comment='创建时间')

    customer = db.relationship('Customer', backref=db.backref('balance_transactions', lazy=True, cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<BalanceTransaction {self.id} - {self.amount}>'

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'amount': float(self.amount),
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        } 