from flask import Blueprint, request, jsonify, current_app
import os
import oss2
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

oss_bp = Blueprint('oss', __name__, url_prefix='/api/oss')

# 允许的文件类型
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_oss_client():
    """获取OSS客户端"""
    # 从环境变量获取OSS配置
    access_key_id = os.getenv('OSS_ACCESS_KEY_ID')
    access_key_secret = os.getenv('OSS_ACCESS_KEY_SECRET')
    endpoint = os.getenv('OSS_ENDPOINT')
    bucket_name = os.getenv('OSS_BUCKET_NAME')
    
    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        raise ValueError("OSS配置不完整，请检查环境变量")
    
    # 创建Auth对象
    auth = oss2.Auth(access_key_id, access_key_secret)
    
    # 创建Bucket对象
    bucket = oss2.Bucket(auth, endpoint, bucket_name)
    
    return bucket, bucket_name

@oss_bp.route('/upload', methods=['POST'])
def upload_file():
    """上传文件到OSS"""
    try:
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        
        # 检查文件名
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 检查文件类型
        if not allowed_file(file.filename):
            return jsonify({'error': '不支持的文件类型'}), 400
        
        # 生成唯一文件名
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1].lower()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4().hex[:8])
        new_filename = f"{timestamp}_{unique_id}.{file_ext}"
        
        # 设置OSS存储路径
        folder = request.form.get('folder', 'products')  # 默认存储在products文件夹
        oss_path = f"{folder}/{new_filename}"
        
        # 获取OSS客户端
        bucket, bucket_name = get_oss_client()
        
        # 上传文件
        result = bucket.put_object(oss_path, file)
        
        # 生成访问URL
        endpoint = os.getenv('OSS_ENDPOINT')
        # 移除http(s)://前缀
        if endpoint.startswith('http://'):
            endpoint = endpoint[7:]
        elif endpoint.startswith('https://'):
            endpoint = endpoint[8:]
        
        # 构建URL
        url = f"https://{bucket_name}.{endpoint}/{oss_path}"
        
        return jsonify({
            'message': '文件上传成功',
            'url': url,
            'path': oss_path,
            'filename': new_filename
        })
        
    except Exception as e:
        current_app.logger.error(f"上传文件到OSS时出错: {e}")
        return jsonify({'error': f'上传失败: {str(e)}'}), 500

@oss_bp.route('/delete', methods=['POST'])
def delete_file():
    """从OSS删除文件"""
    try:
        data = request.json
        oss_path = data.get('path')
        
        if not oss_path:
            return jsonify({'error': '未提供文件路径'}), 400
        
        # 获取OSS客户端
        bucket, _ = get_oss_client()
        
        # 删除文件
        bucket.delete_object(oss_path)
        
        return jsonify({'message': '文件删除成功'})
        
    except Exception as e:
        current_app.logger.error(f"从OSS删除文件时出错: {e}")
        return jsonify({'error': f'删除失败: {str(e)}'}), 500