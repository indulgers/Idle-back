<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">基于 NestJS 的微服务架构系统</p>
<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

## 项目简介

这是一个基于 NestJS 框架构建的现代化微服务系统，采用分布式架构设计，支持高并发、高可用的业务场景。

## 系统架构

### 微服务组件

- **Gateway (网关服务)** - 端口 3000
  - API 网关和路由转发
  - 统一的接口入口
  - 负载均衡和请求分发

- **Main Service (主服务)** - TCP: 3001, HTTP: 3011
  - 核心业务逻辑处理
  - 用户管理和认证
  - 积分系统管理

- **Content Service (内容服务)** - TCP: 3004, HTTP: 3014
  - 内容管理和存储
  - 文件上传和处理
  - 媒体资源管理

- **Admin Service (管理服务)** - 端口 3002
  - 后台管理功能
  - 数据统计和监控
  - 系统配置管理

### 基础设施

- **Redis** - 缓存和会话存储
- **ChromaDB** - 向量数据库
- **MinIO** - 对象存储服务
- **Prisma** - 数据库 ORM

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Docker & Docker Compose
- PM2 (生产环境)

### 本地开发

```bash
# 安装依赖
$ pnpm install

# 启动开发环境
$ pnpm run start:all

# 或者单独启动服务
$ pnpm run start:gateway    # 网关服务
$ pnpm run start:main       # 主服务
$ pnpm run start:content    # 内容服务
$ pnpm run start:admin      # 管理服务
```

### Docker 部署

```bash
# 开发环境
$ docker-compose up -d

# 生产环境
$ docker-compose -f docker-compose.yml up -d

# 快速部署脚本
$ ./deploy.sh
```

### PM2 生产部署

```bash
# 构建项目
$ pnpm run build

# 启动所有服务
$ pnpm run pm2:start

# 重启服务
$ pnpm run pm2:restart

# 查看日志
$ pnpm run pm2:logs
```

## 可用脚本

### 开发命令

```bash
# 启动所有微服务
$ pnpm run start:all

# 单独启动服务
$ pnpm run start:gateway
$ pnpm run start:main
$ pnpm run start:content
$ pnpm run start:admin

# 代码格式化
$ pnpm run format

# 代码检查
$ pnpm run lint
```

### 构建命令

```bash
# 构建所有服务
$ pnpm run build

# 单独构建
$ pnpm run build gateway
$ pnpm run build main
$ pnpm run build content
$ pnpm run build admin
```

### 测试命令

```bash
# 单元测试
$ pnpm run test

# 监听模式测试
$ pnpm run test:watch

# 测试覆盖率
$ pnpm run test:cov

# E2E 测试
$ pnpm run test:e2e
```

### PM2 管理

```bash
# 启动所有服务
$ pnpm run pm2:start

# 重启所有服务
$ pnpm run pm2:restart

# 停止所有服务
$ pnpm run pm2:stop

# 删除所有服务
$ pnpm run pm2:delete

# 查看日志
$ pnpm run pm2:logs

# 重启网关
$ pnpm run pm2:gateway

# 重启微服务
$ pnpm run pm2:microservices

# 重启管理服务
$ pnpm run pm2:admin
```

## 服务端口

| 服务 | TCP端口 | HTTP端口 | 描述 |
|------|---------|----------|------|
| Gateway | - | 3000 | API网关 |
| Main | 3001 | 3011 | 主服务 |
| Content | 3004 | 3014 | 内容服务 |
| Admin | - | 3002 | 管理服务 |
| Redis | - | 6379 | 缓存服务 |
| MinIO | - | 9000/9001 | 对象存储 |
| ChromaDB | - | 8000 | 向量数据库 |

## API 文档

启动服务后，可以访问以下 Swagger 文档：

- Gateway API: http://localhost:3000/api/doc
- Main Service: http://localhost:3011/api/main/doc
- Content Service: http://localhost:3014/api/content/doc
- Admin Service: http://localhost:3002/api/admin/doc

## 部署指南

### 自动化部署

使用提供的部署脚本进行一键部署：

```bash
# 拉取代码并部署
$ ./scripts/pull.sh

# 完整部署
$ ./deploy.sh
```

### 手动部署

1. 克隆代码并安装依赖
2. 配置环境变量
3. 执行数据库迁移
4. 构建项目
5. 启动服务

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
NODE_ENV=production
REDIS_URL=redis://localhost:6379
CHROMA_DB_URL=http://localhost:8000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

## 监控和日志

- 日志文件位置: `./logs/`
- PM2 监控: `pm2 monit`
- 健康检查: 各服务提供 `/health` 端点

## 技术栈

- **框架**: NestJS
- **语言**: TypeScript
- **数据库**: Prisma ORM
- **缓存**: Redis
- **消息队列**: TCP 微服务通信
- **文件存储**: MinIO
- **向量数据库**: ChromaDB
- **容器化**: Docker
- **进程管理**: PM2

## 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 NestJS 最佳实践
- 微服务间通过 TCP 通信
- 统一的错误处理和日志记录
- API 文档自动生成

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 UNLICENSED 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件
- 加入讨论群
