# 部署指南

本文档涵盖将 JiZhang 部署到生产环境。

## 目录

1. [部署前检查清单](#1-部署前检查清单)
2. [环境变量](#2-环境变量)
3. [平台特定指南](#3-平台特定指南)
4. [生产环境数据库](#4-生产环境数据库)
5. [CI/CD 设置](#5-cicd-设置)
6. [监控](#6-监控)
7. [故障排除](#7-故障排除)

---

## 1. 部署前检查清单

### 1.1 代码准备

- [ ] 本地运行 `npm run build` 并验证成功
- [ ] 运行 `npm run lint` 并修复所有问题
- [ ] 使用生产类似数据测试所有功能
- [ ] 更新 `package.json` 中的版本

### 1.2 安全

- [ ] 生成新的 `AUTH_SECRET`（永远不要使用开发密钥）
- [ ] 删除包含敏感数据的 console.log 语句
- [ ] 验证所有 API 路由需要认证
- [ ] 检查硬编码凭据

### 1.3 数据库

- [ ] 规划生产数据库策略（SQLite vs PostgreSQL）
- [ ] 创建备份计划
- [ ] 先在暂存环境测试迁移

---

## 2. 环境变量

### 2.1 必需变量

```env
# 数据库
DATABASE_URL="file:/path/to/production.db"

# NextAuth
AUTH_SECRET="your-production-secret-minimum-32-characters-random"
AUTH_URL="https://your-domain.com"

# 可选：Node 环境
NODE_ENV="production"
```

### 2.2 生成 AUTH_SECRET

```bash
# 使用 openssl
openssl rand -base64 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2.3 平台配置

**Vercel**:
- 在 Settings → Environment Variables 中添加变量
- 标记为 "Production" 环境

**Render**:
- 在 Environment 标签页中添加变量
- 所有变量对服务可用

**Fly.io**:
```bash
fly secrets set AUTH_SECRET="your-secret"
fly secrets set DATABASE_URL="file:/data/production.db"
```

---

## 3. 平台特定指南

### 3.1 Vercel

**最适合**: 最简单的部署，原生 Next.js 支持

**步骤**:

1. 推送代码到 GitHub
2. 在 Vercel 仪表板中导入项目
3. 配置环境变量
4. 部署

**vercel.json 配置**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**持久存储**:
Vercel 不支持持久 SQLite。选项:
- 使用 Vercel Postgres
- 使用外部数据库（PlanetScale、Supabase）
- 使用 Vercel Blob Storage

---

### 3.2 Render

**最适合**: 带持久磁盘的完整 Node.js 托管

**步骤**:

1. 创建新 Web Service
2. 连接 GitHub 仓库
3. 配置:
   - 构建：`npm run build`
   - 启动：`npm start`
4. 添加环境变量
5. 为数据库添加持久磁盘

**render.yaml**:
```yaml
services:
  - type: web
    name: jizhang-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        value: file:/data/production.db
      - key: AUTH_SECRET
        generateValue: true
    disk:
      name: database
      mountPath: /data
      sizeGB: 1
```

---

### 3.3 Fly.io

**最适合**: 边缘部署，全球分发

**步骤**:

```bash
# 安装 flyctl
curl -L https://fly.io/sh/install.sh | sh

# 登录
fly auth login

# 创建应用
fly launch --name jizhang-app

# 添加密钥
fly secrets set AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set DATABASE_URL="file:/data/production.db"

# 添加卷用于持久化
fly volumes create jizhang_data --size 1

# 部署
fly deploy
```

**fly.toml**:
```toml
app = "jizhang-app"
primary_region = "sin"

[build]
  [build.args]
    NODE_ENV = "production"

[[mounts]]
  source = "jizhang_data"
  destination = "/data"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    timeout = "2s"
```

---

### 3.4 Railway

**最适合**: 简单的设置和托管数据库

**步骤**:

1. 在 Railway 仪表板中连接 GitHub
2. 添加 SQLite 或 PostgreSQL 服务
3. 将数据库 URL 链接到应用
4. 部署

---

### 3.5 自托管 (VPS)

**最适合**: 完全控制，成本效益

**要求**:
- Node.js 18+
- PM2 或 systemd 用于进程管理
- Nginx 用于反向代理

**步骤**:

```bash
# 克隆仓库
git clone https://github.com/your-org/jizhang-app.git
cd jizhang-app

# 安装依赖
npm install

# 构建
npm run build

# 创建 .env 文件
cat > .env << EOF
DATABASE_URL="file:/var/www/jizhang-app/data/production.db"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="https://your-domain.com"
EOF

# 全局安装 PM2
npm install -g pm2

# 使用 PM2 启动
pm2 start npm --name "jizhang-app" -- start
pm2 save

# 设置 PM2 开机启动
pm2 startup
```

**Nginx 配置**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. 生产环境数据库

### 4.1 SQLite 考虑

**何时适合使用 SQLite**:
- 低流量应用
- 单实例部署
- 开发/暂存环境

**何时考虑 PostgreSQL**:
- 高流量
- 预期并发写入
- 需要水平扩展

### 4.2 迁移到 PostgreSQL

**模式更改**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**连接字符串格式**:
```
postgresql://user:password@host:port/database
```

**迁移**:
```bash
# 更新 schema.prisma
# 更新 DATABASE_URL

# 生成新客户端
npx prisma generate

# 推送模式到 PostgreSQL
npx prisma db push

# 或创建迁移
npx prisma migrate dev --name init
```

---

### 4.3 数据库备份

**SQLite**:
```bash
# 复制数据库文件
cp data/production.db backups/production-$(date +%Y%m%d).db

# 压缩
tar -czf backups/production-$(date +%Y%m%d).db.gz data/production.db
```

**PostgreSQL**:
```bash
# 转储数据库
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 恢复
psql $DATABASE_URL < backup-$(date +%Y%m%d).sql
```

---

## 5. CI/CD 设置

### 5.1 GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test --if-present
      
      - name: Deploy to production
        run: |
          # 根据平台添加部署命令
          # 例如，flyctl deploy, rsync 等
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

---

### 5.2 Vercel CI/CD

推送到连接分支时自动:
1. 推送到 GitHub
2. Vercel 检测更改
3. 自动构建和部署
4. PR 的预览 URL

---

## 6. 监控

### 6.1 健康检查端点

添加到 API 路由:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}
```

---

### 6.2 正常运行时间监控

**服务**:
- UptimeRobot (免费)
- Pingdom
- BetterStack

配置每 5 分钟检查 `/api/health`。

---

### 6.3 错误追踪

**选项**:
- Sentry
- LogRocket
- Highlight.io

**Sentry 设置**:
```bash
npm install @sentry/nextjs
```

```typescript
// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  // 你的配置
}, {
  org: "your-org",
  project: "jizhang-app",
});
```

---

## 7. 故障排除

### 7.1 生产构建失败

**检查**:
1. Node 版本在本地和 CI 中匹配
2. 所有依赖都在 package.json 中
3. 代码中没有本地专用路径

---

### 7.2 数据库连接错误

**SQLite**:
- 验证文件路径是绝对的
- 检查写入权限
- 确保磁盘卷已挂载

**PostgreSQL**:
- 验证连接字符串格式
- 检查网络访问
- 确保配置了 SSL（如需要）

---

### 7.3 认证问题

**症状**: 用户无法保持登录

**解决方案**:
1. 验证 `AUTH_URL` 匹配你的域名
2. 检查 `AUTH_SECRET` 设置正确
3. 确保 cookie 未被阻止（检查 SameSite 设置）

---

### 7.4 部署后 500 错误

**调试步骤**:
1. 检查应用日志
2. 验证所有环境变量
3. 测试数据库连接
4. 检查 API 健康端点

---

## 附录：部署命令摘要

```bash
# 部署前
npm run lint
npm run build
npm test

# 数据库
npx prisma generate
npx prisma migrate deploy

# 平台特定
vercel --prod                    # Vercel
git push                         # 触发 CI/CD
fly deploy                       # Fly.io
pm2 restart jizhang-app          # 自托管
```
