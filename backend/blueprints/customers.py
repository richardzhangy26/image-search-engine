from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from models import db, Customer
from pypinyin import lazy_pinyin
import re

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

def parse_address(text):
    """智能解析收货地址文本"""
    # 简单的地址解析逻辑
    import pdb;pdb.set_trace()
    parts = re.split(r'[,\s\n]+', text)
    address_info = {
        'name': '',
        'wechat': '',
        'phone': '',
        'default_address': '',
    }
    
    if len(parts) == len(address_info):
        for key, part in zip(address_info.keys(), parts):
            address_info[key] = part
    else:
        return None
    
    return address_info

def get_pinyin(text):
    """获取文本的拼音"""
    return ''.join(lazy_pinyin(text)).lower()

@customers_bp.route('', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_customer():
    import pdb;pdb.set_trace()
    data = request.get_json()
    if not data or not data.get('name') or not data.get('wechat'):
        return jsonify({'error': 'Missing required fields: name and wechat'}), 400

    if Customer.query.filter_by(wechat=data['wechat']).first():
        return jsonify({'error': 'WeChat ID already exists'}), 409

    new_customer = Customer(
        name=data['name'],
        wechat=data['wechat'],
        phone=data.get('phone'),
        default_address=data.get('default_address'),
        address_history=data.get('address_history', [])
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify(new_customer.to_dict()), 201

@customers_bp.route('/parse-address', methods=['POST', 'OPTIONS'])
@cross_origin()
def parse_address_text():
    """解析收货地址文本"""
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify({'error': 'Missing address text'}), 400
    address_info = parse_address(data['text'])
    return jsonify(address_info), 200

@customers_bp.route('', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_customers():
    """获取客户列表"""
    # 获取查询参数
    import pdb;pdb.set_trace()
    name_query = request.args.get('name', '').lower()
    sort_by = request.args.get('sort', 'pinyin')  # 默认按拼音排序
    sort_order = request.args.get('order', 'asc')
    
    # 获取所有客户
    customers = Customer.query.all()
    
    # 转换为字典列表并添加拼音
    customer_list = []
    for customer in customers:
        customer_dict = customer.to_dict()
        customer_dict['pinyin'] = get_pinyin(customer.name)
        customer_list.append(customer_dict)
    
    # 如果有拼音搜索
    if name_query:
        customer_list = [c for c in customer_list if c['pinyin'].startswith(name_query)]
    
    # 排序
    if sort_by == 'pinyin':
        customer_list.sort(
            key=lambda x: x['pinyin'],
            reverse=(sort_order == 'desc')
        )
    
    return jsonify(customer_list), 200

@customers_bp.route('/<int:customer_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer.to_dict()), 200

@customers_bp.route('/<int:customer_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_customer(customer_id):
    """删除客户"""
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return '', 204

@customers_bp.route('/<int:customer_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_customer(customer_id):
    """更新客户信息"""
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # 更新客户信息
    customer.name = data.get('name', customer.name)
    customer.wechat = data.get('wechat', customer.wechat)
    customer.phone = data.get('phone', customer.phone)
    customer.default_address = data.get('default_address', customer.default_address)
    
    db.session.commit()
    return jsonify(customer.to_dict()), 200

@customers_bp.route('/<int:customer_id>/address', methods=['POST', 'OPTIONS'])
@cross_origin()
def add_customer_address(customer_id):
    """添加或更新客户地址"""
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()
    
    if not data or not data.get('address'):
        return jsonify({'error': 'Missing address'}), 400
        
    # 如果是文本格式，先解析
    if isinstance(data['address'], str):
        address_info = parse_address(data['address'])
    else:
        address_info = data['address']
    
    # 更新默认地址
    customer.default_address = address_info['address']
    
    # 添加到历史地址
    if not customer.address_history:
        customer.address_history = []
    if address_info['address'] not in customer.address_history:
        customer.address_history.append(address_info['address'])
    
    db.session.commit()
    return jsonify(customer.to_dict()), 200
