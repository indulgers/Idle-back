#!/bin/bash

# 部署配置
SERVER_USER="ubuntu"
SERVER_HOST="106.53.179.23"
SERVER_PORT=22
PROJECT_DIR="/home/ubuntu/server/Idle-back"
REPO_URL="git@github.com:indulgers/Idle-back.git"
REPO_NAME="Idle-back"
BRANCH="main"
NODE_ENV="production"
PM2_APP_NAME="nestjs-app"

echo "开始部署 NestJS 微服务项目到服务器..."

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
  echo "连接到服务器成功..."

  # 安装 Node.js
  if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
  fi

  # 设置 npm 镜像源
  echo "设置 npm 镜像源..."
  npm config set registry https://registry.npmmirror.com

  # 检查 pnpm 是否安装
  if ! command -v pnpm &> /dev/null; then
    echo "pnpm 未安装，正在安装..."
    npm install -g pnpm
  fi

  # 检查项目目录
  if [ ! -d "$PROJECT_DIR" ]; then
    echo "项目目录不存在，正在创建..."
    mkdir -p $PROJECT_DIR
  fi


  # Git 仓库操作
  if [ ! -d ".git" ]; then
    echo "初始化 Git 仓库..."
    git clone $REPO_URL .
  else
    echo "Git 仓库已存在，拉取最新代码..."
    git reset --hard
    git pull origin $BRANCH
  fi

  echo "切换到分支: $BRANCH"
  git checkout $BRANCH

  cd  $PROJECT_DIR/apps/micro-system
  # 使用 pnpm 安装依赖
  echo "安装依赖..."
  pnpm install

  # 构建项目
  echo "构建项目..."
  pnpm run build user

  # PM2 操作
  if ! command -v pm2 &> /dev/null; then
    echo "PM2 未安装，正在安装..."
    npm install -g pm2
  fi

  echo "启动/重启服务..."
  pm2 start dist/apps/user/main.js --name "$PM2_APP_NAME" --env $NODE_ENV || pm2 restart $PM2_APP_NAME

  pm2 save

  echo "部署完成！服务正在运行中..."
EOF