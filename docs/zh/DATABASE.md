# 数据库指南

本文档涵盖 JiZhang 中的数据库操作、模式设计和数据管理。

## 目录

1. [数据库概览](#1-数据库概览)
2. [模式设计](#2-模式设计)
3. [Prisma 基础](#3-prisma-基础)
4. [常见操作](#4-常见操作)
5. [关系](#5-关系)
6. [迁移](#6-迁移)
7. [种子数据](#7-种子数据)
8. [性能](#8-性能)
9. [故障排除](#9-故障排除)

---

## 1. 数据库概览

### 1.1 技术栈

```
┌─────────────────────────────────────────┐
│           JiZhang 数据库                 │
├─────────────────────────────────────────┤
│  ORM          │ Prisma 6.3.1            │
│  数据库       │ SQLite (libSQL)         │
│  位置         │ prisma/dev.db           │
│  模式         │ prisma/schema.prisma    │
└─────────────────────────────────────────┘
```

### 1.2 为什么选择 SQLite?

**优点**:
- 零配置
- 单文件数据库
- 完美适合本地开发
- 易于备份（复制文件）

**缺点**:
- 不适合高并发生产环境
- 并发写入有限
- 生产环境考虑 PostgreSQL

---

## 2. 模式设计

### 2.1 完整模式

文件：`prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

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
  id          String        @id @default(cuid())
  name        String
  type        String        // "income" 或 "expense"
  icon        String?
  color       String?
  isDefault   Boolean       @default(false)
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([userId, name])
  @@map("categories")
}

model Transaction {
  id         String    @id @default(cuid())
  amount     Float
  type       String    // "income" 或 "expense"
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  date       DateTime  @default(now())
  note       String?
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@map("transactions")
}
```

### 2.2 实体关系图

```
┌──────────────────┐
│      User        │
│──────────────────│
│ id (PK)          │
│ email (unique)   │
│ name             │
│ password (hashed)│
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N (级联删除)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│Category │ │ Transaction  │
│─────────│ │──────────────│
│id (PK)  │ │ id (PK)      │
│name     │ │ amount       │
│type     │ │ type         │
│icon     │ │ categoryId   │──┐
│color    │ │ date         │  │
│userId   │ │ note         │  │
│         │ │ userId       │  │
└─────────┘ └──────────────┘  │
      │                       │
      │ 1:N (设为空)          │
      └───────────────────────┘
```

### 2.3 字段说明

**User**:
| 字段 | 类型 | 描述 |
|------|------|------|
| id | String (cuid) | 唯一标识符 |
| email | String | 唯一邮箱地址 |
| name | String? | 可选显示名称 |
| password | String? | Bcrypt 哈希密码 |

**Category**:
| 字段 | 类型 | 描述 |
|------|------|------|
| id | String (cuid) | 唯一标识符 |
| name | String | 类别名称 |
| type | String | "income" 或 "expense" |
| icon | String? | 图标标识符 |
| color | String? | 颜色代码 (hex) |
| isDefault | Boolean | 系统创建标志 |
| userId | String | User 外键 |

**Transaction**:
| 字段 | 类型 | 描述 |
|------|------|------|
| id | String (cuid) | 唯一标识符 |
| amount | Float | 交易金额 |
| type | String | "income" 或 "expense" |
| categoryId | String? | Category 外键 |
| date | DateTime | 交易日期 |
| note | String? | 可选备注 |
| userId | String | User 外键 |

---

## 3. Prisma 基础

### 3.1 Prisma 客户端设置

文件：`src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**为什么需要全局检查？**: 防止开发环境热重载时创建多个 Prisma 实例。

---

### 3.2 基本 CRUD 操作

```typescript
// 创建
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    password: hashedPassword,
  },
});

// 读取 (单个)
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
});

// 读取 (多个)
const users = await prisma.user.findMany({
  where: { email: { contains: "gmail" } },
});

// 更新
const user = await prisma.user.update({
  where: { id: "user-id" },
  data: { name: "New Name" },
});

// 删除
const user = await prisma.user.delete({
  where: { id: "user-id" },
});
```

---

## 4. 常见操作

### 4.1 用户操作

```typescript
// 按邮箱查找用户
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});

// 使用哈希密码创建用户
const hashedPassword = await bcrypt.hash("password123", 10);
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    password: hashedPassword,
  },
});

// 更新用户
const user = await prisma.user.update({
  where: { id: userId },
  data: { name: "New Name" },
});
```

---

### 4.2 类别操作

```typescript
// 创建类别
const category = await prisma.category.create({
  data: {
    name: "Food",
    type: "expense",
    color: "#ef4444",
    icon: "utensils",
    userId: session.user.id,
  },
  include: {
    _count: {
      select: { transactions: true },
    },
  },
});

// 获取用户的所有类别
const categories = await prisma.category.findMany({
  where: { userId: session.user.id },
  include: {
    _count: {
      select: { transactions: true },
    },
  },
  orderBy: { createdAt: "desc" },
});

// 按类型获取类别
const expenseCategories = await prisma.category.findMany({
  where: {
    userId: session.user.id,
    type: "expense",
  },
});

// 删除类别（如果有关联交易则失败）
await prisma.category.delete({
  where: { id: categoryId },
});
```

---

### 4.3 交易操作

```typescript
// 创建交易
const transaction = await prisma.transaction.create({
  data: {
    amount: 100.50,
    type: "expense",
    categoryId: "category-id",
    date: new Date("2024-01-15"),
    note: "Lunch",
    userId: session.user.id,
  },
  include: { category: true },
});

// 获取用户的所有交易
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
  include: { category: true },
  orderBy: { date: "desc" },
});

// 获取带过滤的交易
const transactions = await prisma.transaction.findMany({
  where: {
    userId: session.user.id,
    type: "expense",
    categoryId: "category-id",
    date: {
      gte: new Date("2024-01-01"),
      lte: new Date("2024-01-31"),
    },
  },
  include: { category: true },
});

// 更新交易
const transaction = await prisma.transaction.update({
  where: { id: transactionId },
  data: {
    amount: 150.00,
    note: "Updated lunch",
  },
  include: { category: true },
});

// 删除交易
await prisma.transaction.delete({
  where: { id: transactionId },
});

// 按类别计数交易
const count = await prisma.transaction.count({
  where: { categoryId: categoryId },
});
```

---

### 4.4 统计查询

```typescript
// 获取期间总收入
const totalIncome = await prisma.transaction.aggregate({
  where: {
    userId: session.user.id,
    type: "income",
    date: { gte: startDate, lte: endDate },
  },
  _sum: { amount: true },
});

// 获取按类别分类的支出
const categoryStats = await prisma.category.findMany({
  where: { userId: session.user.id },
  include: {
    transactions: {
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: startDate, lte: endDate },
      },
    },
  },
});

// 处理获取类别总额
const categoryData = categoryStats.map((cat) => ({
  name: cat.name,
  value: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
  color: cat.color,
}));
```

---

## 5. 关系

### 5.1 理解关系

**User → Categories/Transactions** (一对多):
- 一个用户有多个类别
- 一个用户有多个交易
- 删除用户 → 级联删除所有相关数据

**Category → Transactions** (一对多):
- 一个类别可以有多个交易
- 删除类别 → 在交易中设置 categoryId 为 NULL

---

### 5.2 包含相关数据

```typescript
// 交易包含类别
const transaction = await prisma.transaction.findUnique({
  where: { id: txnId },
  include: { category: true },
});
// 结果：{ ..., category: { id, name, type, color, ... } }

// 类别包含交易计数
const category = await prisma.category.findMany({
  include: {
    _count: {
      select: { transactions: true },
    },
  },
});
// 结果：{ ..., _count: { transactions: 5 } }

// 用户包含所有交易（很少需要）
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    categories: true,
    transactions: true,
  },
});
```

---

### 5.3 按关系过滤

```typescript
// 获取特定类别类型的交易
const transactions = await prisma.transaction.findMany({
  where: {
    userId: session.user.id,
    category: {
      type: "expense",
    },
  },
  include: { category: true },
});
```

---

## 6. 迁移

### 6.1 创建迁移

```bash
# 创建新迁移
npx prisma migrate dev --name add_icon_to_category

# 这将:
# 1. 检测模式更改
# 2. 在 prisma/migrations/ 中创建迁移文件
# 3. 应用迁移到数据库
```

### 6.2 迁移文件结构

```
prisma/migrations/
├── 20240115120000_init/
│   ├── migration.sql
│   └── migration_lock.toml
├── 20240116120000_add_icon_to_category/
│   ├── migration.sql
│   └── migration_lock.toml
└── migration_lock.toml
```

### 6.3 迁移 SQL 示例

```sql
-- AlterTable
ALTER TABLE "categories" ADD COLUMN "icon" TEXT;
```

### 6.4 生产迁移

```bash
# 应用待处理迁移到生产环境
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate
```

---

## 7. 种子数据

### 7.1 种子脚本概览

文件：`prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient();
  
  // 创建演示用户
  const hashedPassword = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "演示用户",
      password: hashedPassword,
    },
  });
  
  // 创建默认类别
  const defaultExpenseCategories = [
    { name: "餐饮", color: "#ef4444" },
    { name: "交通", color: "#f97316" },
    // ... 更多类别
  ];
  
  for (const cat of defaultExpenseCategories) {
    await prisma.category.create({
      data: {
        name: cat.name,
        type: "expense",
        color: cat.color,
        userId: demoUser.id,
        isDefault: true,
      },
    });
  }
  
  // 创建示例交易
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await prisma.transaction.create({
      data: {
        amount: Math.random() * 200 + 20,
        type: "expense",
        categoryId: someCategoryId,
        date,
        note: `示例支出 ${i + 1}`,
        userId: demoUser.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

### 7.2 运行种子

```bash
# 运行种子脚本
npm run db:seed

# 或直接
npx ts-node prisma/seed.ts
```

---

## 8. 性能

### 8.1 查询优化

**使用 select 获取特定字段**:
```typescript
// 仅获取需要的字段
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

**明智使用 include**:
```typescript
// 仅包含需要的关系
const transactions = await prisma.transaction.findMany({
  include: { category: true }, // 仅当你需要类别数据时
});
```

**避免 N+1 查询**:
```typescript
// 好：单次查询带 include
const transactions = await prisma.transaction.findMany({
  include: { category: true },
});

// 坏：N+1 查询
const transactions = await prisma.transaction.findMany();
for (const t of transactions) {
  t.category = await prisma.category.findUnique({ where: { id: t.categoryId } });
}
```

---

### 8.2 索引

当前索引（自动）:
- 所有表上的 `id` (主键)
- User 上的 `email` (唯一约束)
- Category 上的 `[userId, name]` (复合唯一)

对于大数据集，考虑添加索引:
- `Transaction.userId`
- `Transaction.date`
- `Category.userId`

---

## 9. 故障排除

### 9.1 数据库锁定

**错误**: `SQLITE_LOCKED`

**解决方案**:
1. 关闭 Prisma Studio
2. 关闭其他到 dev.db 的连接
3. 重启开发服务器

---

### 9.2 模式不同步

**错误**: `PrismaClientKnownRequestError`

**解决方案**:
```bash
# 重置数据库（警告：删除所有数据）
npx prisma migrate reset

# 或直接推送模式（仅开发）
npx prisma db push
```

---

### 9.3 重新生成 Prisma 客户端

```bash
# 模式更改后
npx prisma generate

# 验证客户端是最新的
npx prisma validate
```

---

### 9.4 使用 Prisma Studio

```bash
# 打开可视化数据库编辑器
npm run db:studio
```

打开 http://localhost:5555 以:
- 查看所有记录
- 创建/编辑/删除数据
- 运行原始查询

---

## 附录：原始 SQL

当 Prisma 不支持查询时:

```typescript
// 原始查询
const result = await prisma.$queryRaw`
  SELECT type, SUM(amount) as total
  FROM transactions
  WHERE userId = ${session.user.id}
  GROUP BY type
`;

// 原始变更
await prisma.$executeRaw`
  DELETE FROM transactions
  WHERE userId = ${session.user.id}
  AND date < ${new Date("2023-01-01")}
`;
```
