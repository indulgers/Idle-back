#!/bin/bash

# 服务器部署配置
SERVER_USER="ubuntu"
SERVER_HOST="106.53.179.23"
SERVER_PORT=22
PROJECT_DIR="/home/ubuntu/server/micro-system"
REPO_URL="git@github.com:indulgers/micro-system.git"
BRANCH="main"

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

# 读取部署模式参数
DEPLOY_MODE="local" # 默认为本地部署
DEPLOY_SERVICE="all" # 默认部署所有服务

# 解析命令行参数
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -m|--mode) DEPLOY_MODE="$2"; shift ;;
    -s|--service) DEPLOY_SERVICE="$2"; shift ;;
    -h|--help) 
      echo "用法: $0 [-m|--mode <local|server>] [-s|--service <gateway|main|admin|content|all>]"
      echo "  -m, --mode      指定部署模式: local (本地Docker) 或 server (远程服务器)"
      echo "  -s, --service   指定部署的服务: gateway, main, admin, content 或 all"
      echo "  -h, --help      显示帮助信息"
      exit 0
      ;;
    *) print_error "未知参数: $1"; exit 1 ;;
  esac
  shift
done

# 记录开始时间
start_time=$(date +%s)

# 本地 Docker 部署
deploy_local() {
  print_message "开始本地 Docker 部署..."

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

  # 检查环境变量配置文件
  if [ ! -f .env ]; then
    print_warning "未找到 .env 文件，使用 .env.example 创建..."
    if [ -f .env.example ]; then
      cp .env.example .env
      print_message "创建 .env 文件成功"
    else
      print_warning "未找到 .env.example 文件，创建默认环境变量配置..."
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
  fi

  # 只部署指定服务
  if [ "$DEPLOY_SERVICE" != "all" ]; then
    print_message "只部署 $DEPLOY_SERVICE 服务..."
    docker-compose up -d --build $DEPLOY_SERVICE
  else
    # 停止并清理现有容器
    print_message "停止并清理现有容器..."
    docker-compose down

    # 构建镜像并启动所有服务
    print_message "构建微服务镜像并启动所有服务..."
    docker-compose up -d --build
  fi

  # 检查服务状态
  print_message "检查服务状态..."
  docker-compose ps

  print_message "部署完成! 网关服务运行在 http://localhost:3000"
  print_message "MinIO 控制台: http://localhost:9001"
}

# 远程服务器部署
deploy_server() {
  print_message "开始远程服务器部署..."

  # 上传 Docker 配置文件到服务器
  print_message "上传 Docker 配置文件到服务器..."
  scp -P $SERVER_PORT docker-compose.yml Dockerfile $SERVER_USER@$SERVER_HOST:$PROJECT_DIR/

  # 远程执行部署命令
  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
    echo "连接到服务器成功..."
    cd $PROJECT_DIR

    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
      echo "Docker 未安装，正在安装..."
      curl -fsSL https://get.docker.com | sh
    fi

    # 检查 Docker Compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
      echo "Docker Compose 未安装，正在安装..."
      curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      chmod +x /usr/local/bin/docker-compose
    fi

    # Git 仓库操作
    if [ ! -d "$PROJECT_DIR/.git" ]; then
      echo "初始化 Git 仓库..."
      git clone $REPO_URL .
    else
      echo "Git 仓库已存在，拉取最新代码..."
      git reset --hard
      git pull origin $BRANCH
    fi

    echo "切换到分支: $BRANCH"
    git checkout $BRANCH

    # 创建日志目录
    mkdir -p logs

    # 只部署指定服务
    if [ "$DEPLOY_SERVICE" != "all" ]; then
      echo "只部署 $DEPLOY_SERVICE 服务..."
      docker-compose up -d --build $DEPLOY_SERVICE
    else
      # 停止并清理现有容器
      echo "停止并清理现有容器..."
      docker-compose down

      # 构建镜像并启动所有服务
      echo "构建微服务镜像并启动所有服务..."
      docker-compose up -d --build
    fi

    # 检查服务状态
    echo "检查服务状态..."
    docker-compose ps
EOF

  print_message "远程部署完成! 网关服务运行在 http://$SERVER_HOST:3000"
}

# 根据部署模式执行不同的部署流程
case $DEPLOY_MODE in
  "local")
    deploy_local
    ;;
  "server")
    deploy_server
    ;;
  *)
    print_error "未知的部署模式: $DEPLOY_MODE"
    exit 1
    ;;
esac

# 计算执行时间
end_time=$(date +%s)
duration=$((end_time - start_time))

print_message "部署完成! 总耗时: ${duration} 秒"

exit 0 