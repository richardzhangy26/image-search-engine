#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import oss2
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_oss_connection():
    """测试阿里云OSS连接"""
    print("开始测试阿里云OSS连接...")
    
    # 从环境变量获取OSS配置
    access_key_id = os.getenv('OSS_ACCESS_KEY_ID')
    access_key_secret = os.getenv('OSS_ACCESS_KEY_SECRET')
    endpoint = os.getenv('OSS_ENDPOINT')
    bucket_name = os.getenv('OSS_BUCKET_NAME')
    
    if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
        print("错误: 环境变量中缺少OSS配置")
        print(f"OSS_ACCESS_KEY_ID: {'已设置' if access_key_id else '未设置'}")
        print(f"OSS_ACCESS_KEY_SECRET: {'已设置' if access_key_secret else '未设置'}")
        print(f"OSS_ENDPOINT: {'已设置' if endpoint else '未设置'}")
        print(f"OSS_BUCKET_NAME: {'已设置' if bucket_name else '未设置'}")
        return False
    
    try:
        # 创建Auth对象
        auth = oss2.Auth(access_key_id, access_key_secret)
        
        # 创建Bucket对象
        bucket = oss2.Bucket(auth, endpoint, bucket_name)
        
        # 测试连接 - 列出Bucket中的文件
        print("尝试列出Bucket中的文件...")
        
        # 列出最多10个文件
        count = 0
        for obj in oss2.ObjectIterator(bucket, max_keys=10):
            print(f"找到文件: {obj.key}")
            count += 1
        
        if count == 0:
            print("Bucket为空或您没有足够的权限列出文件")
        
        # 测试上传
        test_file_content = "这是一个测试文件，用于验证阿里云OSS连接"
        test_file_key = "test_oss_connection.txt"
        
        print(f"尝试上传测试文件: {test_file_key}...")
        bucket.put_object(test_file_key, test_file_content)
        print("文件上传成功!")
        
        # 测试下载
        print("尝试下载刚刚上传的文件...")
        result = bucket.get_object(test_file_key)
        content = result.read().decode('utf-8')
        print(f"文件内容: {content}")
        
        # 测试删除
        print("尝试删除测试文件...")
        bucket.delete_object(test_file_key)
        print("文件删除成功!")
        
        print("OSS连接测试完成，一切正常!")
        return True
        
    except oss2.exceptions.ServerError as e:
        print(f"服务器错误: {e}")
    except oss2.exceptions.ClientError as e:
        print(f"客户端错误: {e}")
    except Exception as e:
        print(f"发生未知错误: {e}")
    
    return False

if __name__ == "__main__":
    # 确保已安装必要的库
    try:
        import oss2
    except ImportError:
        print("错误: 未安装oss2库，请运行 'pip install oss2' 安装")
        exit(1)
    
    try:
        import dotenv
    except ImportError:
        print("错误: 未安装python-dotenv库，请运行 'pip install python-dotenv' 安装")
        exit(1)
    
    # 运行测试
    test_oss_connection()