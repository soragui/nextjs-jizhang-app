# 记账本 (JiZhang App)

一个基于 Next.js 16 的现代化个人记账应用，支持用户认证、收支记录、类别管理和数据可视化。

## ✨ 功能特性

- 🔐 **用户认证** - 注册/登录，基于 NextAuth.js v5
- 💰 **记账功能** - 记录收入和支出
- 📊 **分类管理** - 自定义收支类别
- 📈 **数据统计** - 图表展示收支趋势和分类占比
- 🎨 **美观 UI** - 基于 Tailwind CSS 和 shadcn/ui 组件
- 📱 **响应式设计** - 支持桌面和移动端

## 🛠 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **认证**: NextAuth.js v5 (Credentials Provider)
- **数据库**: SQLite + Prisma ORM 7
- **图表**: Recharts
- **UI**: Tailwind CSS v4 + 自定义组件
- **图标**: Lucide React

## 📦 项目结构

```
jizhang-app/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   ├── seed.ts                # 数据库种子脚本
│   └── dev.db                 # SQLite 数据库文件
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth API
│   │   │   ├── transactions/  # 交易 CRUD API
│   │   │   ├── categories/    # 类别 CRUD API
│   │   │   └── stats/         # 统计数据 API
│   │   ├── (dashboard)/       # 仪表盘页面（需要登录）
│   │   ├── login/             # 登录/注册页面
│   │   ├── transactions/      # 交易管理页面
│   │   ├── categories/        # 类别管理页面
│   │   └── stats/             # 统计图表页面
│   ├── components/
│   │   ├── ui/                # 基础 UI 组件
│   │   └── providers/         # React Providers
│   └── lib/
│       ├── prisma.ts          # Prisma 客户端
│       ├── auth.ts            # 认证配置
│       └── utils.ts           # 工具函数
├── .env                       # 环境变量
├── package.json
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
```

> ⚠️ 生产环境请修改 `AUTH_SECRET` 为随机生成的安全字符串

### 3. 初始化数据库

```bash
# 推送数据库 schema
npx prisma db push

# 生成 Prisma 客户端
npx prisma generate

# 运行种子脚本（创建演示用户和默认类别）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 👤 演示账户

种子脚本会创建一个演示账户：

- **邮箱**: demo@example.com
- **密码**: demo123

## 📱 页面说明

### 登录/注册页 (`/login`)
- 支持邮箱密码登录
- 新用户可直接注册

### 仪表盘 (`/dashboard`)
- 本月总收入/支出/结余
- 每日收支趋势图（折线图）
- 支出分类占比（饼图）

### 交易记录 (`/transactions`)
- 查看所有收支记录
- 按收入/支出筛选
- 编辑/删除交易
- 添加新交易

### 类别管理 (`/categories`)
- 查看支出/收入类别
- 添加自定义类别
- 删除未使用的类别

### 统计图表 (`/stats`)
- 详细的收支趋势分析
- 分类占比可视化
- 每日收支对比（柱状图）

## 🔧 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行 ESLint
npm run lint

# 数据库操作
npm run db:migrate    # 创建并应用迁移
npm run db:seed       # 运行种子脚本
npm run db:studio     # 打开 Prisma Studio
```

## 📊 数据库模型

### User (用户)
- id, email, name, password
- createdAt, updatedAt

### Category (类别)
- id, name, type (INCOME/EXPENSE)
- icon, color, userId
- createdAt, updatedAt

### Transaction (交易)
- id, amount, type (INCOME/EXPENSE)
- categoryId, date, note, userId
- createdAt, updatedAt

## 🔒 安全说明

1. 生产环境务必修改 `AUTH_SECRET`
2. 密码使用 bcrypt 加密存储
3. 所有 API 都需要用户认证
4. 用户只能访问自己的数据

## 📝 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/[...nextauth]` | POST | 认证端点 |
| `/api/transactions` | GET, POST | 交易列表/创建 |
| `/api/transactions/[id]` | GET, PUT, DELETE | 单个交易操作 |
| `/api/categories` | GET, POST | 类别列表/创建 |
| `/api/categories/[id]` | DELETE | 删除类别 |
| `/api/stats` | GET | 统计数据 |

## 🎨 UI 组件

项目包含以下自定义组件：
- Button, Input, Label
- Card, Table, Tabs
- Form 相关组件

所有组件使用 Tailwind CSS 样式，支持暗色模式。

## 📄 License

MIT
