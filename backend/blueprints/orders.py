from flask import Blueprint, request, jsonify, current_app
from ..models import db, Order, OrderItem, Product, Customer
import uuid # For generating unique order numbers

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@orders_bp.route('', methods=['POST'])
def create_order():
    """
    Creates a new order.
    Expects JSON body like:
    {
        "customer_id": 1,
        "items": [
            {"product_id": 101, "quantity": 2},
            {"product_id": 102, "quantity": 1}
        ]
    }
    """
    data = request.get_json()
    if not data or not data.get('customer_id') or not data.get('items'):
        return jsonify({'error': 'Missing required fields: customer_id and items'}), 400

    customer_id = data['customer_id']
    items_data = data['items']

    # Validate customer exists
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': f'Customer with ID {customer_id} not found'}), 404

    if not isinstance(items_data, list) or not items_data:
        return jsonify({'error': 'Items must be a non-empty list'}), 400

    total_amount = 0
    order_items_to_create = []

    try:
        # Start a transaction
        with db.session.begin_nested(): # Use nested transaction for atomicity within the request
            product_ids = [item.get('product_id') for item in items_data if item.get('product_id')]
            if not product_ids:
                 raise ValueError("No valid product IDs provided in items")
            # Fetch all needed products in one query for efficiency
            products = Product.query.filter(Product.id.in_(product_ids)).all()
            products_dict = {p.id: p for p in products}

            for item_data in items_data:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity')

                if not product_id or not quantity or not isinstance(quantity, int) or quantity <= 0:
                    raise ValueError("Invalid product_id or quantity in items list")

                product = products_dict.get(product_id)
                if not product:
                    raise LookupError(f"Product with ID {product_id} not found")

                # TODO: Implement stock check if necessary
                # if product.stock < quantity:
                #     raise ValueError(f"Insufficient stock for product {product.name} (ID: {product_id})")

                price_per_unit = product.price # Use current product price
                total_amount += price_per_unit * quantity

                order_item = OrderItem(
                    product_id=product_id,
                    quantity=quantity,
                    price_per_unit=price_per_unit
                    # order_id will be set later when associated with the Order
                )
                order_items_to_create.append(order_item)

                # TODO: Decrement stock if necessary
                # product.stock -= quantity

            # Create the Order
            new_order = Order(
                order_number=str(uuid.uuid4().hex), # Generate a unique hex order number
                customer_id=customer_id,
                total_amount=round(total_amount, 2),
                status='Pending' # Initial status
            )

            # Associate OrderItems with the Order
            new_order.items.extend(order_items_to_create)

            db.session.add(new_order)

        # Commit the transaction if all nested operations succeed
        db.session.commit()
        return jsonify(new_order.to_dict()), 201

    except (ValueError, LookupError) as e:
        db.session.rollback() # Rollback on validation or lookup errors
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback() # Rollback on any other errors
        current_app.logger.error(f"Error creating order: {e}")
        return jsonify({'error': 'Internal server error creating order'}), 500


@orders_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    # Use joinedload to efficiently load related items and customer if needed frequently
    # from sqlalchemy.orm import joinedload
    # order = Order.query.options(joinedload(Order.items), joinedload(Order.customer)).get_or_404(order_id)
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict()), 200

@orders_bp.route('', methods=['GET'])
def list_orders():
    # Add filtering/pagination as needed
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    customer_id = request.args.get('customer_id', type=int)
    status = request.args.get('status')

    query = Order.query

    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if status:
        query = query.filter(Order.status == status)

    query = query.order_by(Order.created_at.desc())

    paginated_orders = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'orders': [order.to_dict() for order in paginated_orders.items],
        'total': paginated_orders.total,
        'pages': paginated_orders.pages,
        'current_page': page
    }), 200

@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """
    Updates the status of an order.
    Expects JSON body like: {"status": "Processing"}
    """
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    new_status = data.get('status')

    # TODO: Add validation for allowed status transitions if needed
    allowed_statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    if not new_status or new_status not in allowed_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(allowed_statuses)}'}), 400

    # Prevent updating status if order is already Cancelled or Delivered (optional)
    # if order.status in ['Delivered', 'Cancelled']:
    #     return jsonify({'error': f'Cannot update status of a {order.status} order'}), 400

    order.status = new_status
    # Optionally update the updated_at timestamp explicitly if needed beyond onupdate
    # order.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify(order.to_dict()), 200

# Consider adding endpoints for deleting/cancelling orders if business logic allows
# Example: DELETE /api/orders/<order_id>
# Example: PUT /api/orders/<order_id>/cancel
