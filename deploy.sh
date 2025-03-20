#!/bin/bash

# 微服务系统部署脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印彩色消息
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
  print_error "Docker 未安装，请先安装 Docker"
  exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
  print_error "Docker Compose 未安装，请先安装 Docker Compose"
  exit 1
fi

# 创建目录
mkdir -p logs

print_message "开始构建并部署微服务系统..."

# 检查环境变量配置文件
if [ ! -f .env ]; then
  print_warning "未找到 .env 文件，创建默认环境变量配置..."
  cat << EOF > .env
# 生产环境配置
NODE_ENV=production

# Redis 配置
REDIS_URL=redis://redis:6379

# ChromaDB 配置
CHROMA_DB_URL=http://chroma:8000

# MinIO 配置
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# ETCD 配置
ETCD_ENDPOINTS=http://etcd:2379
EOF
  print_message "创建 .env 文件成功"
fi

# 停止并清理现有容器
print_message "停止并清理现有容器..."
docker-compose down

# 构建镜像
print_message "构建微服务镜像..."
docker-compose build

# 启动所有服务
print_message "启动所有微服务..."
docker-compose up -d

# 检查服务状态
print_message "检查服务状态..."
docker-compose ps

print_message "部署完成! 网关服务运行在 http://localhost:3000"
print_message "MinIO 控制台: http://localhost:9001"

exit 0 