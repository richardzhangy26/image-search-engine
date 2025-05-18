from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from models import db, Customer
from pypinyin import lazy_pinyin
import re
import os
import json
# Please install OpenAI SDK first: `pip3 install openai`
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv('DEEPSEEK_API_KEY'), base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content)
customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

def parse_address(text):
    """使用 DeepSeek API 解析地址文本，提取姓名、电话和地址信息"""
    try:
        client = OpenAI(
            api_key=os.getenv('DEEPSEEK_API_KEY'),
            base_url="https://api.deepseek.com"
        )

        system_prompt = """你是一个专业的地址解析助手。你需要从用户输入的文本中提取姓名、电话号码和地址信息，并以JSON格式返回。
        规则：
        1. 只返回JSON数据，不要有其他说明文字，不要用markdown格式
        2. JSON格式必须包含三个字段：name, phone, default_address
        3. 电话号码应该是11位数字
        4. 如果某个字段无法提取，将其值设为空字符串
        5. 地址要尽可能完整，包括省市区街道等信息"""

        user_prompt = f"请解析以下文本：\n{text}"

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            stream=False
        )

        # 获取响应内容
        content = response.choices[0].message.content
        
        # 清理响应内容，移除可能的markdown格式
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]  # 移除开头的 ```json
        if content.startswith('```'):
            content = content[3:]  # 移除开头的 ```
        if content.endswith('```'):
            content = content[:-3]  # 移除结尾的 ```
        content = content.strip()

        # 解析JSON字符串
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"Error parsing address: {str(e)}")
        return {
            "name": "",
            "phone": "",
            "default_address": ""
        }

def get_pinyin(text):
    """获取文本的拼音"""
    return ''.join(lazy_pinyin(text)).lower()

@customers_bp.route('', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_customer():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('phone') or not data.get('default_address'):
        return jsonify({'error': 'Missing required fields: name, phone, and default_address'}), 400
    if Customer.query.filter_by(phone=data['phone']).first():
        return jsonify({'error': 'Phone number already exists'}), 409
    new_customer = Customer(
        name=data['name'],
        phone=data.get('phone'),
        default_address=data.get('default_address'),
        address_history=data.get('address_history', []),
        wechat=data.get('wechat', '')
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
    name_query = request.args.get('name', '').lower()
    phone_query = request.args.get('phone', '')
    sort_by = request.args.get('sort', 'pinyin')  # 默认按拼音排序
    sort_order = request.args.get('order', 'asc')
    
    # 获取所有客户
    customers = Customer.query.order_by(Customer.id.desc()).all()
    
    # 转换为字典列表并添加拼音
    customer_list = []
    for customer in customers:
        customer_dict = customer.to_dict()
        customer_dict['pinyin'] = get_pinyin(customer.name)
        customer_list.append(customer_dict)
    
    # 如果有名字搜索
    if name_query:
        customer_list = [c for c in customer_list if c['pinyin'].startswith(name_query)]
    
    # 如果有电话号码搜索
    if phone_query:
        customer_list = [c for c in customer_list if c['phone'] and c['phone'].startswith(phone_query)]
    
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
    customer.default_address = address_info['default_address']
    
    # 添加到历史地址
    if not customer.address_history:
        customer.address_history = []
    if address_info['default_address'] not in customer.address_history:
        customer.address_history.append(address_info['default_address'])
    
    db.session.commit()
    return jsonify(customer.to_dict()), 200
