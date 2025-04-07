from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .customer import Customer
from .order import Order
from .product import Product

__all__ = ['db', 'Customer', 'Order', 'Product']
