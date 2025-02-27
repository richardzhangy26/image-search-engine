# 使用 Docker 在本地部署图像搜索引擎

本文档提供了如何使用 Docker 在本地开发环境中部署图像搜索引擎项目的说明。

## 前提条件

- 安装 [Docker](https://www.docker.com/get-started)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)

## 部署步骤

### 1. 克隆仓库

```bash
git clone <repository-url>
cd image-search-engine
```

### 2. 配置环境变量（可选）

如果需要使用自己的 DashScope API 密钥，可以创建 `.env` 文件：

```bash
echo "DASHSCOPE_API_KEY=your-api-key" > .env
```

### 3. 构建并启动容器

```bash
docker-compose up -d --build
```

这将构建并启动后端和前端服务。

### 4. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:5000

## 本地开发模式说明

本配置针对本地开发进行了优化：

1. **前端容器**:
   - 使用 Vite 开发服务器而不是 Nginx
   - 支持热重载（修改代码后自动刷新）
   - 通过卷映射实现代码变更实时反映

2. **后端容器**:
   - 代码目录通过卷映射到容器
   - 修改后端代码后需要重启容器才能生效

## 常用命令

### 查看日志

```bash
# 查看所有容器的日志
docker-compose logs

# 查看特定容器的日志
docker-compose logs backend
docker-compose logs frontend
```

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 重启单个服务（例如修改后端代码后）

```bash
docker-compose restart backend
```

## 故障排除

### 前端无法连接到后端 API

检查 `VITE_API_BASE_URL` 环境变量是否正确设置，确保前端容器能够正确访问后端 API。

### 容器启动失败

检查端口 5000 和 5173 是否已被其他应用占用。如果是，可以在 `docker-compose.yml` 中修改端口映射。
