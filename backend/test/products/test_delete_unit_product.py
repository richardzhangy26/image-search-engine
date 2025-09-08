import unittest
import json
import os
from flask import current_app
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app import create_app
from models import db, Product

class TestProductImageDelete(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # 创建测试产品
        self.product = Product(
            name='测试产品',
            price=100,
            description='测试描述',
            good_img=json.dumps(['test1.jpg', 'test2.jpg']),
            size_img=json.dumps(['size1.jpg']),
            image_url='test1.jpg'
        )
        db.session.add(self.product)
        db.session.commit()
        
        # 创建测试图片文件
        upload_folder = current_app.config['UPLOAD_FOLDER']
        good_images_folder = os.path.join(upload_folder, 'good_images')
        os.makedirs(good_images_folder, exist_ok=True)
        
        test_files = ['test1.jpg', 'test2.jpg', 'size1.jpg']
        for file in test_files:
            path = os.path.join(good_images_folder, file)
            with open(path, 'w') as f:
                f.write('test')

    def tearDown(self):
        # 清理测试图片
        upload_folder = self.app.config['UPLOAD_FOLDER']
        good_images_folder = os.path.join(upload_folder, 'good_images')
        test_files = ['test1.jpg', 'test2.jpg', 'size1.jpg']
        for file in test_files:
            path = os.path.join(good_images_folder, file)
            if os.path.exists(path):
                os.remove(path)
        
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_delete_product_image(self):
        """测试正常删除产品图片"""
        # 测试删除主图片
        response = self.client.delete(f'/products/images/{self.product.id}/test1.jpg')
        self.assertEqual(response.status_code, 200)
        
        # 验证数据库更新
        product = Product.query.get(self.product.id)
        good_images = json.loads(product.good_img)
        self.assertNotIn('test1.jpg', good_images)
        self.assertIsNone(product.image_url)
        
        # 验证文件是否被物理删除
        image_path = os.path.join(
            current_app.config['UPLOAD_FOLDER'], 
            'good_images', 
            'test1.jpg'
        )
        self.assertFalse(os.path.exists(image_path))

    def test_delete_nonexistent_image(self):
        """测试删除不存在的图片"""
        response = self.client.delete(f'/products/images/{self.product.id}/nonexistent.jpg')
        self.assertEqual(response.status_code, 404)

    def test_delete_size_image(self):
        """测试删除尺码图片"""
        response = self.client.delete(f'/products/images/{self.product.id}/size1.jpg')
        self.assertEqual(response.status_code, 200)
        
        # 验证数据库更新
        product = Product.query.get(self.product.id)
        size_images = json.loads(product.size_img)
        self.assertNotIn('size1.jpg', size_images)

    def test_delete_nonexistent_product(self):
        """测试删除不存在产品的图片"""
        response = self.client.delete('/products/images/999/test1.jpg')
        self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()