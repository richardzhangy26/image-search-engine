# 使用 Docker 部署图像搜索引擎

本文档提供了如何使用 Docker 部署图像搜索引擎项目的说明。

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

- 前端: http://localhost
- 后端 API: http://localhost/api

## 容器说明

### 后端容器

- 基于 Python 3.9
- 暴露端口: 5000
- 数据持久化: 通过 Docker 卷将 `./backend/data` 映射到容器内的 `/app/data`

### 前端容器

- 基于 Node.js 和 Nginx
- 暴露端口: 80
- 前端构建后的静态文件由 Nginx 提供服务

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

## 数据持久化

应用数据存储在 `./backend/data` 目录中，该目录通过 Docker 卷映射到容器内，确保数据在容器重启后仍然保留。

## 故障排除

### 无法连接到后端 API

检查 Nginx 配置是否正确，确保前端容器能够正确代理请求到后端容器。

### 镜像构建失败

检查 Dockerfile 中的依赖是否正确安装，可能需要更新依赖版本或添加缺失的系统依赖。
