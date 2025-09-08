import requests
import base64
from config import Config

class ParseService:
    BASE_URL = 'https://parseapi.back4app.com'
    HEADERS = {
        'X-Parse-Application-Id': Config.PARSE_APPLICATION_ID,
        'X-Parse-REST-API-Key': Config.PARSE_REST_API_KEY,
        'Content-Type': 'application/json'
    }
    
    @classmethod
    def _encode_file(cls, file):
        """将文件编码为base64格式"""
        return base64.b64encode(file.read()).decode('utf-8')

    @classmethod
    def create_customer(cls, data):
        payload = {
            'name': data['name'],
            'wechat': data.get('wechat'),
            'phone': data['phone'],
            'defaultAddress': data.get('default_address'),
            'addressHistory': [data.get('default_address')] if data.get('default_address') else []
        }
        response = requests.post(
            f'{cls.BASE_URL}/classes/Customer',
            headers=cls.HEADERS,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    @classmethod
    def get_customer(cls, customer_id):
        response = requests.get(
            f'{cls.BASE_URL}/classes/Customer/{customer_id}',
            headers=cls.HEADERS
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    @classmethod
    def create_product(cls, product_info, images):
        # 准备图片文件数据
        image_files = []
        for image in images:
            image_files.append({
                'base64': cls._encode_file(image),
                'type': image.content_type,
                'name': image.filename
            })
        
        # 调用云函数创建产品和上传图片
        payload = {
            'productInfo': {
                'name': product_info['name'],
                'description': product_info.get('description'),
                'price': float(product_info['price']),
                'salePrice': float(product_info.get('sale_price', 0)),
                'productCode': product_info.get('product_code'),
                'pattern': product_info.get('pattern'),
                'skirtLength': product_info.get('skirt_length'),
                'clothingLength': product_info.get('clothing_length'),
                'style': product_info.get('style'),
                'pantsLength': product_info.get('pants_length'),
                'sleeveLength': product_info.get('sleeve_length'),
                'fashionElements': product_info.get('fashion_elements'),
                'craft': product_info.get('craft'),
                'launchSeason': product_info.get('launch_season'),
                'mainMaterial': product_info.get('main_material'),
                'color': product_info.get('color'),
                'size': product_info.get('size')
            },
            'imageFiles': image_files
        }
        
        response = requests.post(
            f'{cls.BASE_URL}/functions/createProductWithImages',
            headers=cls.HEADERS,
            json=payload
        )
        response.raise_for_status()
        return response.json()['result']

    @classmethod
    def create_order(cls, data):
        payload = {
            'orderNumber': data['order_number'],
            'customer': {
                '__type': 'Pointer',
                'className': 'Customer',
                'objectId': data['customer_id']
            },
            'totalAmount': float(data['total_amount']),
            'status': 'pending',
            'paymentStatus': 'unpaid',
            'shippingAddress': data['shipping_address'],
            'products': data['products'],
            'customerNotes': data.get('customer_notes'),
            'internalNotes': data.get('internal_notes')
        }
        response = requests.post(
            f'{cls.BASE_URL}/classes/Order',
            headers=cls.HEADERS,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    @classmethod
    def create_product_image(cls, data):
        payload = {
            'product': {
                '__type': 'Pointer',
                'className': 'Product',
                'objectId': data['product_id']
            },
            'imagePath': data['image_path'],
            'vector': data['vector']
        }
        response = requests.post(
            f'{cls.BASE_URL}/classes/ProductImage',
            headers=cls.HEADERS,
            json=payload
        )
        response.raise_for_status()
        return response.json()
