#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的信息函数
print_message() {
    echo -e "${GREEN}==> $1${NC}"
}

print_error() {
    echo -e "${RED}==> ERROR: $1${NC}"
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
# npx prisma generate
# npx prisma migrate deploy
npx prisma db push
# 4. 构建项目
print_message "正在构建项目..."
pnpm run build main 
pnpm run build admin

# 5. 重启 PM2 服务
print_message "正在重启服务..."
pm2 restart all

# 计算执行时间
end_time=$(date +%s)
duration=$((end_time - start_time))

print_message "部署完成! 总耗时: ${duration} 秒"

# 显示 PM2 状态
print_message "当前服务状态:"
pm2 list