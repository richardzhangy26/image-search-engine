from flask import Blueprint, request, jsonify, current_app
from models import db, Order, Product, Customer
import uuid # For generating unique order numbers
from datetime import datetime
import json
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import pandas as pd
import os

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def generate_order_number():
    """生成订单编号：ORD + 年月日 + 4位随机数"""
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = str(uuid.uuid4().int)[:4]
    return f'ORD{date_str}{random_str}'

@orders_bp.route('', methods=['POST'])
@cross_origin()
def create_order():
    """
    创建新订单
    期望的 JSON 格式:
    {
        "customer_id": 1,
        "shipping_address": "收货地址",
        "products": [
            {
                "product_id": 101,
                "quantity": 2,
                "price": 99.99,
                "size": "L",
                "color": "红色"
            }
        ],
        "total_amount": 199.98,
        "customer_notes": "备注信息",
        "internal_notes": "内部备注"
    }
    """
    try:
        data = request.get_json()
        
        # 验证必要字段
        required_fields = ['customer_id', 'shipping_address', 'products']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必要字段: {field}'}), 400
        
        # 验证客户是否存在
        customer = Customer.query.get(data['customer_id'])
        if not customer:
            return jsonify({'error': '客户不存在'}), 404
            
        # 验证产品列表
        products = data['products']
        if not isinstance(products, list) or not products:
            return jsonify({'error': '产品列表不能为空'}), 400
            
        # 验证每个产品
        for product in products:
            if not all(k in product for k in ['product_id', 'quantity', 'price']):
                return jsonify({'error': '产品信息不完整'}), 400
            
            # 检查产品是否存在
            db_product = Product.query.get(product['product_id'])
            if not db_product:
                return jsonify({'error': f'产品不存在: {product["product_id"]}'}), 404
                
            # 补充产品信息
            product['product_name'] = db_product.name
            product['product_code'] = db_product.product_code
            
        # 创建订单
        order = Order(
            order_number=generate_order_number(),
            customer_id=data['customer_id'],
            shipping_address=data['shipping_address'],
            total_amount=data['total_amount'],
            status='unpaid',
            payment_status='unpaid',
            products=json.dumps(products, ensure_ascii=False),
            customer_notes=data.get('customer_notes', ''),
            internal_notes=data.get('internal_notes', '')
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'message': '订单创建成功',
            'order_id': order.id,
            'order_number': order.order_number
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"创建订单时出错: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@orders_bp.route('', methods=['GET'])
@cross_origin()
def list_orders():
    """获取订单列表
    
    Query Parameters:
        page (int): 页码，默认1
        per_page (int): 每页数量，默认10
        customer_id (int): 客户ID，可选
        status (str): 订单状态，可选
        start_date (str): 开始日期，格式：YYYY-MM-DD，可选
        end_date (str): 结束日期，格式：YYYY-MM-DD，可选
        sort (str): 排序字段，可选，默认按创建时间倒序
        order (str): 排序方向，可选，asc或desc，默认desc
    """
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        customer_id = request.args.get('customer_id', type=int)
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        sort_field = request.args.get('sort', 'created_at')
        sort_order = request.args.get('order', 'desc')

        # 构建查询
        query = Order.query.join(Customer, Order.customer_id == Customer.id)

        # 应用过滤条件
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        if status:
            query = query.filter(Order.status == status)
        
        # 应用日期范围筛选
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Order.created_at >= start_datetime)
            except ValueError:
                return jsonify({'error': '开始日期格式错误，请使用YYYY-MM-DD格式'}), 400
                
        if end_date:
            try:
                # 将结束日期设置为当天的23:59:59
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                query = query.filter(Order.created_at <= end_datetime)
            except ValueError:
                return jsonify({'error': '结束日期格式错误，请使用YYYY-MM-DD格式'}), 400

        # 应用排序
        sort_column = getattr(Order, sort_field, Order.created_at)
        if sort_order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # 执行分页查询
        paginated_orders = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # 准备响应数据
        orders_data = []
        for order in paginated_orders.items:
            order_dict = order.to_dict()
            customer = Customer.query.get(order.customer_id)
            if customer:
                order_dict.update({
                    'customer_name': customer.name,
                    'customer_phone': customer.phone,
                })
            orders_data.append(order_dict)

        return jsonify({
            'orders': orders_data,
            'total': paginated_orders.total,
            'pages': paginated_orders.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        current_app.logger.error(f"获取订单列表失败: {str(e)}")
        return jsonify({'error': '获取订单列表失败', 'message': str(e)}), 500

@orders_bp.route('/<order_id>', methods=['GET'])
@cross_origin()
def get_order(order_id):
    try:
        order = Order.query.get_or_404(order_id)
        return jsonify(order.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/<order_id>/status', methods=['PUT'])
@cross_origin()
def update_order_status(order_id):
    """更新订单状态"""
    try:

        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': '缺少状态字段'}), 400
            
        new_status = data['status']
        allowed_statuses = ['unpaid', 'paid', 'unpurchased', 'purchased', 'unshipped', 'shipped', 'returned', 'exchanged']
        
        if new_status not in allowed_statuses:
            return jsonify({'error': f'无效的状态值。必须是: {", ".join(allowed_statuses)}'}), 400
            
        # 更新状态
        order.status = new_status
        order.updated_at = datetime.now()
            
        db.session.commit()
        return jsonify(order.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/<order_id>', methods=['DELETE'])
@cross_origin()
def delete_order(order_id):
    """删除订单"""
    try:
        # 删除订单
        order = Order.query.filter_by(id=order_id).first()
        if not order:
            return jsonify({'error': '订单不存在'}), 404
        # 删除订单
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': '订单删除成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/import', methods=['POST'])
@cross_origin()
def import_orders():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件上传', 'detail': '请选择要上传的Excel文件'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件', 'detail': '请选择要上传的Excel文件'}), 400
        
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': '文件格式错误', 'detail': '请上传.xlsx格式的Excel文件'}), 400

    try:
        df = pd.read_excel(file)
        required_columns = ['订单编号', '快递公司', '运单号', '我打备注']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'error': '文件格式错误',
                'detail': f'Excel文件缺少以下必要列：{", ".join(missing_columns)}'
            }), 400

        # 更新订单信息
        success_count = 0
        error_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                # 检查订单编号是否为空
                if pd.isna(row['订单编号']):
                    error_count += 1
                    errors.append(f"第 {index + 2} 行：订单编号为空")
                    continue

                # 查找订单
                order = Order.query.filter_by(id=str(row['我打备注']).strip()).first()
                if order:
                    # 更新快递信息和备注
                    order.customer_notes= str(row['快递公司']) if not pd.isna(row['快递公司']) else None
                    order.internal_notes= str(row['运单号']) if not pd.isna(row['运单号']) else None
                    db.session.commit()
                    success_count += 1
                else:
                    error_count += 1
                    errors.append(f"第 {index + 2} 行：订单号 {row['订单编号']} 不存在")
            except Exception as e:
                error_count += 1
                errors.append(f"第 {index + 2} 行处理失败：{str(e)}")
                db.session.rollback()

        return jsonify({
            'message': '导入完成',
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'detail': f'成功导入 {success_count} 条记录，失败 {error_count} 条记录'
        })

    except Exception as e:
        return jsonify({
            'error': '处理文件失败',
            'detail': str(e)
        }), 500

@orders_bp.route('/<order_id>/notes', methods=['PUT'])
@cross_origin()
def update_order_notes(order_id):
    """更新订单备注信息（客户备注和内部备注）"""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json() or {}

        # 允许部分更新
        if 'customer_notes' in data:
            order.customer_notes = data['customer_notes']
        if 'internal_notes' in data:
            order.internal_notes = data['internal_notes']

        order.updated_at = datetime.now()
        db.session.commit()
        return jsonify(order.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
