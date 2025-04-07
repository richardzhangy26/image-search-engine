from . import db
import datetime

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    # Assuming 'sku' or a similar unique identifier is important
    sku = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    # Consider adding inventory/stock count if needed
    # stock = db.Column(db.Integer, default=0)
    image_path = db.Column(db.String(255), nullable=True) # Link to the uploaded image file
    created_at = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    # 供货商存储
    supplier = db.Column(db.String(200), nullable=True)
    # Relationship to OrderItems (if needed, e.g., to easily find all orders for a product)
    order_items = db.relationship('OrderItem', backref='product', lazy=True)

    def __repr__(self):
        return f'<Product {self.name}>'

    def to_dict(self):
        # Map database fields to a dictionary, useful for API responses
        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'supplier': self.supplier,
            'description': self.description,
            'price': self.price,
            'image_path': self.image_path, # Or generate a URL if needed
            'created_at': self.created_at.isoformat()
        }

# Consider how this interacts with your existing VectorProductIndex and ProductInfo.
# Option 1: Store product details (name, price, sku) only in this DB table,
#           and ProductInfo only stores the vector and the DB Product ID.
# Option 2: Duplicate some info, ensuring consistency.
# Option 3: Refactor ProductInfo to be based on this Product model.
#
# For now, this model provides a basic structure for product data in the database.
