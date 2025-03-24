#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息函数
print_message() {
    echo -e "${GREEN}==> $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}==> $1${NC}"
}

print_error() {
    echo -e "${RED}==> ERROR: $1${NC}"
}

print_service() {
    echo -e "${BLUE}==> 服务: $1${NC}"
}

# 错误处理
set -e

# 记录开始时间
start_time=$(date +%s)

# 1. 拉取最新代码
print_message "正在拉取最新代码..."
git stash
git pull

# 2. 安装依赖
print_message "正在安装依赖..."
pnpm install

# 3. 执行 Prisma 迁移
print_message "正在执行 Prisma 迁移..."
npx prisma db push

# 4. 构建项目
print_message "正在构建项目..."

print_service "构建网关服务"
pnpm run build gateway

print_service "构建微服务 - main"
pnpm run build main

print_service "构建微服务 - content"
pnpm run build content

print_service "构建单体服务 - admin"
pnpm run build admin

# 5. 重启 PM2 服务
print_message "正在重启服务..."

# 先重启网关
print_service "重启网关服务"
pm2 restart nest-gateway

# 重启微服务组
print_service "重启微服务组"
pm2 restart nest-main nest-content

# 重启单体服务
print_service "重启单体服务"
pm2 restart nest-admin

# 计算执行时间
end_time=$(date +%s)
duration=$((end_time - start_time))

print_message "部署完成! 总耗时: ${duration} 秒"

# 显示 PM2 状态
print_message "当前服务状态:"
pm2 list

# 保存PM2配置
print_message "保存PM2配置..."
pm2 save