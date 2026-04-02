# JiZhang 文档索引

欢迎使用 JiZhang (记账本) 文档。本索引提供所有文档文件的链接。

## 快速开始

初次使用 JiZhang？从这里开始：

1. **[README.md](README.md)** - 概述、功能和快速开始
2. **[快速开始](README.md#3-快速开始)** - 安装和设置指南
3. **[演示账户](README.md#36-演示账户)** - 使用演示数据体验应用

---

## 文档结构

### 核心文档

| 文档 | 描述 |
|------|------|
| [README.md](README.md) | 项目概述、功能、快速开始、API 摘要 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 深入应用架构、数据流、安全性 |
| [API.md](API.md) | 完整 API 参考和开发指南 |
| [COMPONENTS.md](COMPONENTS.md) | 前端组件文档 |
| [DATABASE.md](DATABASE.md) | 数据库模式、Prisma 操作、迁移 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 生产部署指南 |

---

## 按主题分类

### 新用户

1. **[README.md](README.md)** - 了解 JiZhang 的功能
2. **[快速开始](README.md#3-快速开始)** - 本地安装和运行
3. **[页面概览](README.md#33-页面)** - 了解主要功能

---

### 开发者

**理解代码库**:
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - 高层架构
2. **[ARCHITECTURE.md#4-组件层级](ARCHITECTURE.md#4-组件层级)** - 组件树
3. **[ARCHITECTURE.md#3-数据流](ARCHITECTURE.md#3-数据流)** - 数据流动方式

**使用 API**:
1. **[API.md](API.md)** - API 设计和示例
2. **[API.md#6-api-参考](API.md#6-api-参考)** - 端点文档
3. **[API.md#7-api-示例](API.md#7-api-示例)** - 完整代码示例

**使用组件**:
1. **[COMPONENTS.md](COMPONENTS.md)** - 组件架构
2. **[COMPONENTS.md#2-ui-基础组件](COMPONENTS.md#2-ui-基础组件)** - UI 组件
3. **[COMPONENTS.md#7-创建新组件](COMPONENTS.md#7-创建新组件)** - 创建新组件

**使用数据库**:
1. **[DATABASE.md](DATABASE.md)** - 数据库设计
2. **[DATABASE.md#4-常见操作](DATABASE.md#4-常见操作)** - CRUD 操作
3. **[DATABASE.md#6-迁移](DATABASE.md#6-迁移)** - 模式更改

---

### DevOps / 部署

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - 完整部署指南
2. **[DEPLOYMENT.md#3-平台特定指南](DEPLOYMENT.md#3-平台特定指南)** - 平台指南
3. **[DEPLOYMENT.md#5-cicd-设置](DEPLOYMENT.md#5-cicd-设置)** - CI/CD 配置
4. **[DEPLOYMENT.md#6-监控](DEPLOYMENT.md#6-监控)** - 监控设置

---

## 快速参考

### 命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint

# 数据库
npm run db:migrate   # 运行迁移
npm run db:seed      # 填充演示数据
npm run db:studio    # 打开 Prisma Studio
```

---

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/[...nextauth]` | POST | 认证 |
| `/api/transactions` | GET, POST | 交易 CRUD |
| `/api/transactions/[id]` | GET, PUT, DELETE | 单个交易 |
| `/api/categories` | GET, POST | 类别 CRUD |
| `/api/categories/[id]` | DELETE | 删除类别 |
| `/api/stats` | GET | 统计 |

---

### 环境变量

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"
```

---

### 文件位置

```
src/
├── app/api/          # API 路由
├── app/(dashboard)/  # 受保护页面
├── components/       # React 组件
└── lib/              # 工具库
```

---

## 常见任务

### 添加新 API 端点

参见：**[API.md#2-创建新端点](API.md#2-创建新端点)**

### 创建新组件

参见：**[COMPONENTS.md#7-创建新组件](COMPONENTS.md#7-创建新组件)**

### 修改数据库模式

参见：**[DATABASE.md#6-迁移](DATABASE.md#6-迁移)**

### 部署到生产环境

参见：**[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 需要帮助？

1. 查看 **[README.md](README.md)** 了解常见问题
2. 查看 **[ARCHITECTURE.md](ARCHITECTURE.md)** 了解系统理解
3. 查看 **[DATABASE.md#9-故障排除](DATABASE.md#9-故障排除)** 了解数据库问题
4. 查看 **[DEPLOYMENT.md#7-故障排除](DEPLOYMENT.md#7-故障排除)** 了解部署问题

---

## 文档变更日志

| 日期 | 文档 | 变更 |
|------|------|------|
| 2026-04-02 | 全部 | 初始文档创建 |

---

## 贡献

添加新功能时，请：

1. 更新相关文档
2. 在 API.md 中添加 API 文档
3. 在 COMPONENTS.md 中记录新组件
4. 在 DATABASE.md 中更新模式更改
