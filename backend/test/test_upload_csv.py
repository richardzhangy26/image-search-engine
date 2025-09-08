#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试脚本：模拟前端上传CSV文件并导入商品数据
使用方法：
    python test_upload_csv.py <csv_file_path>
"""

import os
import sys
import requests
from pathlib import Path

def upload_csv_file(csv_file_path, api_url="http://localhost:5000/api/products/upload_csv"):
    """
    模拟前端上传CSV文件
    
    Args:
        csv_file_path: CSV文件路径
        api_url: API端点URL
    
    Returns:
        响应对象
    """
    if not os.path.exists(csv_file_path):
        print(f"错误: CSV文件不存在: {csv_file_path}")
        return None
    
    # 准备文件
    files = {
        'file': (os.path.basename(csv_file_path), open(csv_file_path, 'rb'), 'text/csv')
    }
    
    # 发送请求
    print(f"正在上传CSV文件: {csv_file_path}")
    try:
        response = requests.post(api_url, files=files)
        return response
    except Exception as e:
        print(f"上传CSV文件时出错: {e}")
        return None

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python test_upload_csv.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    response = upload_csv_file(csv_file_path)
    
    if response:
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            print("CSV文件上传成功!")
        else:
            print("CSV文件上传失败!")
    else:
        print("请求失败!")

if __name__ == "__main__":
    main()
