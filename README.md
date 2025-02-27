# 商品图像搜索系统

基于 DashScope API 和 FAISS 的商品图像搜索系统。

## 技术栈

### 后端
- Python
- Flask
- SQLite
- FAISS
- DashScope API

### 前端
- React
- TypeScript
- Tailwind CSS
- Vite

## 开发环境设置

### 后端设置
1. 安装依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 启动开发服务器：
```bash
python app.py
```

### 前端设置
1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

## 生产环境部署指南

### 后端部署

1. 安装生产环境依赖：
```bash
pip install gunicorn
```

2. 创建环境变量文件 (.env)：
```bash
FLASK_ENV=production
DASHSCOPE_API_KEY=your_api_key
```

3. 使用 gunicorn 启动服务：
```bash
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 --timeout 120 app:app
```

推荐使用 systemd 服务管理。创建 `/etc/systemd/system/image-search.service`：

```ini
[Unit]
Description=Image Search API Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
Environment=FLASK_ENV=production
Environment=DASHSCOPE_API_KEY=your_api_key
Environment=SERVER_NAME=yourdomain.com
ExecStart=/usr/local/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### 前端部署

1. 构建生产版本：
```bash
cd frontend
npm run build
```

2. Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 图片文件代理
    location /backend {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 数据目录权限设置

确保数据目录具有正确的权限：

```bash
# 创建必要的目录
mkdir -p /path/to/backend/data/product_search/{db,images,index}

# 设置权限
chown -R www-data:www-data /path/to/backend/data
chmod -R 755 /path/to/backend/data
```

### 监控和日志

1. 使用 logrotate 管理日志：
```bash
# /etc/logrotate.d/image-search
/path/to/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload image-search
    endscript
}
```

2. 推荐使用 Prometheus + Grafana 进行监控。

### 安全注意事项

1. 确保设置了适当的防火墙规则
2. 定期更新系统和依赖包
3. 使用 HTTPS
4. 设置适当的文件权限
5. 配置 rate limiting
6. 定期备份数据

### 性能优化

1. 启用 Nginx 缓存
2. 使用 CDN 分发静态资源
3. 优化图片存储和传输
4. 配置适当的 FAISS 索引参数
5. 使用连接池管理数据库连接