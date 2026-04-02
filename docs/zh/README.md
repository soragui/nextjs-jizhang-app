# JiZhang App (记账本) - 文档

> **注意**: 这不是你熟悉的 Next.js。此版本存在破坏性更改 — API、约定和文件结构都可能与标准 Next.js 文档不同。请始终参考 `node_modules/next/dist/docs/` 以获取所用版本的具体信息。

## 目录

1. [概述](#1-概述)
2. [架构](#2-架构)
3. [快速开始](#3-快速开始)
4. [数据库指南](#4-数据库指南)
5. [身份验证](#5-身份验证)
6. [API 参考](#6-api-参考)
7. [前端组件](#7-前端组件)
8. [页面路由](#8-页面路由)
9. [部署](#9-部署)

---

## 1. 概述

### 1.1 什么是 JiZhang?

JiZhang（记账本）是一款现代化的个人财务管理应用，旨在帮助个人跟踪收入和支出。它提供直观的数据可视化、类别管理和交易跟踪功能。

### 1.2 主要功能

| 功能 | 描述 |
|------|------|
| 用户认证 | 使用 NextAuth.js v5 通过邮箱和密码注册/登录 |
| 交易记录 | 记录带有类别、日期和备注的收入和支出 |
| 类别管理 | 创建和管理自定义收入/支出类别 |
| 数据可视化 | 交互式图表显示趋势和类别分布 |
| 响应式设计 | 支持桌面和移动设备 |
| 多用户支持 | 每个用户的数据隔离且安全 |

### 1.3 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                        JiZhang 技术栈                        │
├─────────────────────────────────────────────────────────────┤
│  框架          │ Next.js 16.2.1 (App Router)                │
│  语言          │ TypeScript 5                               │
│  数据库        │ SQLite via Prisma 6.3.1 + @libsql/client   │
│  认证          │ NextAuth 5.0.0-beta.30 (Credentials)       │
│  UI 库         │ Tailwind CSS 4 + shadcn/ui 组件            │
│  图表          │ Recharts                                   │
│  图标          │ Lucide React                               │
│  密码哈希      │ bcryptjs                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 架构

### 2.1 高层架构

```
┌────────────────────────────────────────────────────────────────────┐
│                            客户端 (浏览器)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  登录页面    │  │  仪表盘       │  │  交易记录/类别管理        │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│         └─────────────────┴────────────────────────┘                │
│                              │                                       │
│                    SessionProvider (NextAuth)                        │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API 路由          │
                    │  (Next.js 服务器)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   withAuth()        │
                    │   (认证中间件)       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Prisma ORM        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SQLite 数据库     │
                    │   (dev.db)          │
                    └─────────────────────┘
```

### 2.2 目录结构

```
jizhang-app/
├── prisma/
│   ├── schema.prisma          # 数据库模式定义
│   ├── seed.ts                # 数据库种子脚本
│   └── dev.db                 # SQLite 数据库文件
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API 路由 (REST 风格)
│   │   │   ├── auth/           # NextAuth 端点
│   │   │   ├── transactions/   # 交易 CRUD
│   │   │   ├── categories/     # 类别 CRUD
│   │   │   └── stats/          # 仪表盘统计
│   │   ├── (dashboard)/        # 受保护的路由
│   │   │   ├── page.tsx        # 仪表盘主页
│   │   │   ├── layout.tsx      # 侧边栏导航
│   │   │   ├── transactions/   # 交易页面
│   │   │   ├── categories/     # 类别页面
│   │   │   └── stats/          # 统计页面
│   │   ├── login/              # 登录/注册页面
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 根页面
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── providers/          # Context 提供者
│   │   ├── auth-forms.tsx      # 登录/注册表单
│   │   ├── dashboard.tsx       # 仪表盘组件
│   │   ├── transactions.tsx    # 交易 UI
│   │   ├── categories.tsx      # 类别 UI
│   │   └── sidebar-navigation.tsx
│   ├── lib/
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── prisma.ts           # Prisma 单例
│   │   ├── with-auth.ts        # 认证辅助函数
│   │   └── utils.ts            # 工具函数
│   └── auth.ts                 # 认证导出
├── .env                        # 环境变量
├── package.json
└── CLAUDE.md                   # AI 助手指南
```

### 2.3 请求流程

```
用户操作 → 客户端组件 → fetch() → API 路由 → withAuth() → Prisma → 数据库
                │                                              │
                │◄───────────── JSON 响应 ──────────────────────│
                │
          UI 更新
```

---

## 3. 快速开始

### 3.1 前置要求

- Node.js 18+
- npm 或 pnpm

### 3.2 安装

```bash
# 克隆并进入项目
cd jizhang-app

# 安装依赖
npm install
```

### 3.3 环境配置

在项目根目录创建或编辑 `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
```

> **安全提示**: 在生产环境中，生成安全的 `AUTH_SECRET`:
> ```bash
> openssl rand -base64 32
> ```

### 3.4 数据库设置

```bash
# 推送模式到数据库（创建表）
npx prisma db push

# 生成 Prisma 客户端
npx prisma generate

# 用演示数据填充数据库
npm run db:seed
```

### 3.5 开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3.6 演示账户

运行 `npm run db:seed` 后:

- **邮箱**: demo@example.com
- **密码**: demo123

---

## 4. 数据库指南

### 4.1 模式概览

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  categories    Category[]
  transactions  Transaction[]
}

model Category {
  id        String   @id @default(cuid())
  name      String
  type      String        // "income" 或 "expense"
  icon      String?
  color     String?
  isDefault Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  transactions Transaction[]

  @@unique([userId, name])  // 用户不能有重复的类别名
}

model Transaction {
  id         String   @id @default(cuid())
  amount     Float
  type       String        // "income" 或 "expense"
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  date       DateTime @default(now())
  note       String?
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 4.2 关系

```
User (1) ──────< Category (N)
  │
  │
  └────────────< Transaction (N)
                       │
                       │
              Category (1) ──────< Transaction (N)
```

- **User → Category**: 一对多，CASCADE 删除
- **User → Transaction**: 一对多，CASCADE 删除
- **Category → Transaction**: 一对多，SET NULL 删除

### 4.3 数据库命令

```bash
# 运行迁移
npm run db:migrate

# 打开 Prisma Studio（可视化数据库编辑器）
npm run db:studio

# 填充数据库
npm run db:seed
```

---

## 5. 身份验证

### 5.1 概述

JiZhang 使用 NextAuth.js v5 与 Credentials 提供者和 JWT 会话。

### 5.2 配置 (`src/auth.ts`)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // 登录：验证密码
        // 注册：创建新用户
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    jwt({ token, user }) { /* 添加 user.id 到 token */ },
    session({ session, token }) { /* 添加 token.id 到 session */ },
  },
});
```

### 5.3 认证流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   客户端    │     │  NextAuth   │     │   数据库    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ POST /api/auth    │                   │
       │ credentials──────►│                   │
       │                   │                   │
       │                   │ 查询用户          │
       │                   │──────────────────►│
       │                   │                   │
       │                   │ 用户数据          │
       │                   │◄──────────────────│
       │                   │                   │
       │                   │ 验证密码          │
       │                   │ (bcrypt)          │
       │                   │                   │
       │                   │ 创建 JWT          │
       │◄──────────────────│                   │
       │ 会话 cookie       │                   │
       │                   │                   │
       │ 后续              │                   │
       │ 请求─────────────►│ 验证 JWT          │
       │ 带 cookie         │                   │
```

### 5.4 保护路由

**服务器端 (API 路由)**:
```typescript
import { withAuth } from "@/lib/with-auth";

export async function GET() {
  const session = await withAuth(); // 如果未认证则抛出 401
  // session.user.id 可用
}
```

**客户端 (组件)**:
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") return <RedirectToLogin />;
  
  // session.user 可用
}
```

---

## 6. API 参考

所有 API 端点都需要认证。未认证的请求返回 `401 Unauthorized`。

### 6.1 认证

#### `POST /api/auth/[...nextauth]`

NextAuth 通过此端点处理所有认证。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Optional Name" // 仅注册时需要
}
```

**响应**:
```json
{ "user": { "id": "...", "email": "...", "name": "..." } }
```

---

### 6.2 交易

#### `GET /api/transactions`

获取认证用户的所有交易。

**查询参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| type | string | 按 "income" 或 "expense" 过滤 |
| categoryId | string | 按类别过滤 |
| startDate | string | 按日期过滤 (ISO 8601) |
| endDate | string | 按日期过滤 (ISO 8601) |

**响应**:
```json
[
  {
    "id": "txn_123",
    "amount": 100.50,
    "type": "expense",
    "categoryId": "cat_456",
    "date": "2024-01-15T10:00:00Z",
    "note": "午餐",
    "userId": "usr_789",
    "category": {
      "id": "cat_456",
      "name": "餐饮",
      "type": "expense",
      "color": "#ef4444"
    }
  }
]
```

---

#### `POST /api/transactions`

创建新交易。

**请求体**:
```json
{
  "amount": 100.50,
  "type": "expense",
  "categoryId": "cat_456",
  "date": "2024-01-15",
  "note": "可选备注"
}
```

**响应**: `201 Created` 带创建的交易

---

#### `GET /api/transactions/[id]`

按 ID 获取单个交易。

**响应**: `200 OK` 带交易或 `404 Not Found`

---

#### `PUT /api/transactions/[id]`

更新交易。

**请求体**: 与 POST 相同

**响应**: `200 OK` 带更新后的交易

---

#### `DELETE /api/transactions/[id]`

删除交易。

**响应**: `200 OK` 带成功消息

---

### 6.3 类别

#### `GET /api/categories`

获取认证用户的所有类别。

**查询参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| type | string | 按 "income" 或 "expense" 过滤 |

**响应**:
```json
[
  {
    "id": "cat_123",
    "name": "餐饮",
    "type": "expense",
    "color": "#ef4444",
    "icon": null,
    "isDefault": true,
    "_count": { "transactions": 15 }
  }
]
```

---

#### `POST /api/categories`

创建新类别。

**请求体**:
```json
{
  "name": "Transportation",
  "type": "expense",
  "icon": "car",
  "color": "#f97316"
}
```

**响应**: `201 Created` 带创建的类别

---

#### `DELETE /api/categories/[id]`

删除类别。

**约束**:
- 不能删除有关联交易的类别
- 如果类别有关联交易则返回 `400 Bad Request`

**响应**: `200 OK` 或 `400 Bad Request`

---

### 6.4 统计

#### `GET /api/stats`

获取仪表盘统计数据。

**查询参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| startDate | string | 开始日期 (ISO 8601) |
| endDate | string | 结束日期 (ISO 8601) |

**响应**:
```json
{
  "totalIncome": 5000.00,
  "totalExpense": 3000.00,
  "balance": 2000.00,
  "categoryData": [
    { "name": "餐饮", "value": 500, "color": "#ef4444" }
  ],
  "dailyData": [
    { "date": "2024-01-01", "income": 100, "expense": 50 }
  ],
  "transactionCount": 25
}
```

---

## 7. 前端组件

### 7.1 核心组件

#### SessionProvider
位置：`src/components/providers/session-provider.tsx`

NextAuth 会话上下文的包装器。

```tsx
<SessionProvider>
  <App />
</SessionProvider>
```

---

#### SidebarNavigation
位置：`src/components/sidebar-navigation.tsx`

带侧边栏的主导航布局。

**功能**:
- 响应式侧边栏（移动端可折叠）
- 导航链接到所有主页面
- 用户资料显示
- 登出功能

**Props**:
```typescript
interface SidebarNavigationProps {
  children: React.ReactNode;
}
```

---

### 7.2 功能组件

#### TransactionForm & TransactionList
位置：`src/components/transactions.tsx`

**TransactionForm Props**:
```typescript
interface TransactionFormProps {
  categories: Category[];
  onSubmit: (data: TransactionData) => void;
  onCancel: () => void;
  initialData?: Transaction; // 编辑时
}
```

**TransactionList Props**:
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}
```

---

#### CategoryForm & CategoryList
位置：`src/components/categories.tsx`

**CategoryForm Props**:
```typescript
interface CategoryFormProps {
  onSubmit: (data: CategoryData) => void;
  onCancel: () => void;
  initialData?: Category;
}
```

**CategoryList Props**:
```typescript
interface CategoryListProps {
  categories: Category[];
  type: "EXPENSE" | "INCOME";
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}
```

---

### 7.3 UI 基础组件

位于 `src/components/ui/`:

| 组件 | 文件 | 描述 |
|------|------|------|
| Button | button.tsx | 带变体的样式按钮 |
| Input | input.tsx | 表单输入字段 |
| Label | label.tsx | 表单标签 |
| Card | card.tsx | 卡片容器 |
| Table | table.tsx | 数据表格 |
| Tabs | tabs.tsx | 标签导航 |
| Form | form.tsx | 表单字段组件 |
| Skeleton | skeleton.tsx | 加载占位符 |

---

## 8. 页面路由

### 8.1 公开路由

| 路由 | 组件 | 描述 |
|------|------|------|
| `/login` | `src/app/login/page.tsx` | 登录/注册页面 |

---

### 8.2 受保护路由

`(dashboard)/` 下的所有路由都需要认证。

| 路由 | 组件 | 描述 |
|------|------|------|
| `/dashboard` | `src/app/(dashboard)/page.tsx` | 带图表的仪表盘主页 |
| `/transactions` | `src/app/(dashboard)/transactions/page.tsx` | 交易列表 |
| `/transactions/new` | `src/app/(dashboard)/transactions/new/page.tsx` | 新建交易表单 |
| `/transactions/edit/[id]` | `src/app/(dashboard)/transactions/edit/[id]/page.tsx` | 编辑交易 |
| `/categories` | `src/app/(dashboard)/categories/page.tsx` | 类别管理 |
| `/stats` | `src/app/(dashboard)/stats/page.tsx` | 统计图表 |

---

### 8.3 认证守卫实现

```tsx
// src/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  if (status === "loading") return <LoadingSpinner />;
  
  return <SidebarNavigation>{children}</SidebarNavigation>;
}
```

---

## 9. 部署

### 9.1 构建命令

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start

# Lint
npm run lint
```

### 9.2 环境变量（生产）

```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="secure-random-string"
AUTH_URL="https://your-domain.com"
```

### 9.3 数据库迁移

```bash
# 应用迁移到生产数据库
npx prisma db push

# 生成客户端
npx prisma generate
```

### 9.4 推荐平台

- **Vercel**: 原生 Next.js 支持
- **Render**: 带 SQLite 的 Node.js 托管
- **Fly.io**: 边缘部署
- **Railway**: 简单的数据库设置

---

## 附录 A: 开发提示

### A.1 调试

```bash
# 查看数据库内容
npm run db:studio

# 检查 ESLint 问题
npm run lint -- --fix
```

### A.2 常见问题

**问题**: `withAuth` 期望 0 个参数但得到 1 个
**解决方案**: 调用 `await withAuth()` 时不要传递请求对象

**问题**: Session 是 null
**解决方案**: 确保页面包装在 `SessionProvider` 中并有 `"use client"` 指令

**问题**: 数据库锁定
**解决方案**: 关闭 Prisma Studio 并确保没有其他进程使用 dev.db

---

## 附录 B: API 错误响应

| 状态码 | 描述 |
|--------|-------|
| 401 | Unauthorized - 缺少或无效的会话 |
| 404 | Not Found - 资源不存在 |
| 400 | Bad Request - 无效的输入数据 |
| 500 | Server Error - 内部错误 |

---

## 附录 C: 文件命名约定

- **组件**: PascalCase (例如 `TransactionForm.tsx`)
- **工具**: kebab-case (例如 `with-auth.ts`)
- **API 路由**: `route.ts` 在以端点命名的目录中
- **页面**: `page.tsx` 在以路由命名的目录中

---

## 附录 D: 可用的 npm 脚本

```json
{
  "dev": "启动开发服务器",
  "build": "创建生产构建",
  "start": "启动生产服务器",
  "lint": "运行 ESLint",
  "db:migrate": "运行 Prisma 迁移",
  "db:seed": "用演示数据填充数据库",
  "db:studio": "打开 Prisma Studio"
}
```
