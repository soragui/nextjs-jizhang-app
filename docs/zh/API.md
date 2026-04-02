# API 开发指南

本文档提供有关开发和扩展 JiZhang API 的详细信息。

## 目录

1. [API 设计原则](#1-api-设计原则)
2. [创建新端点](#2-创建新端点)
3. [请求/响应模式](#3-请求响应模式)
4. [错误处理](#4-错误处理)
5. [认证](#5-认证)
6. [测试 API](#6-测试-api)
7. [API 示例](#7-api-示例)

---

## 1. API 设计原则

### 1.1 RESTful 约定

| HTTP 方法 | 操作 | 示例端点 |
|----------|------|----------|
| GET | 读取 | `/api/transactions` |
| POST | 创建 | `/api/transactions` |
| PUT | 更新 | `/api/transactions/[id]` |
| DELETE | 删除 | `/api/transactions/[id]` |

### 1.2 响应格式

**成功**:
```json
{
  "id": "txn_123",
  "amount": 100.50,
  // ... 其他字段
}
```

**错误**:
```json
{
  "error": "Transaction not found"
}
```

### 1.3 状态码

| 代码 | 含义 | 何时使用 |
|------|------|----------|
| 200 | OK | 成功的 GET, PUT |
| 201 | Created | 成功的 POST (资源已创建) |
| 400 | Bad Request | 无效输入，缺少字段 |
| 401 | Unauthorized | 缺少或无效的会话 |
| 404 | Not Found | 资源不存在 |
| 500 | Server Error | 意外错误 |

---

## 2. 创建新端点

### 2.1 文件结构

Next.js 16 App Router 使用基于文件的路由：

```
src/app/api/
├── users/
│   └── route.ts          # GET, POST /api/users
└── users/[id]/
    └── route.ts          # GET, PUT, DELETE /api/users/[id]
```

### 2.2 基本端点模板

```typescript
// src/app/api/your-entity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/with-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth();
    
    // 你的逻辑
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error description:", error);
    return NextResponse.json(
      { error: "Failed to do something" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth();
    const body = await request.json();
    
    // 验证输入
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      );
    }
    
    // 你的逻辑
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error description:", error);
    return NextResponse.json(
      { error: "Failed to do something" },
      { status: 500 }
    );
  }
}
```

### 2.3 动态路由

对于参数化路由如 `/api/transactions/[id]`:

```typescript
// src/app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/with-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await withAuth();
  
  // 查找资源，确保它属于用户
  const item = await prisma.transaction.findFirst({
    where: {
      id,
      userId: session.user.id, // 安全关键!
    },
  });
  
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  return NextResponse.json(item);
}
```

---

## 3. 请求/响应模式

### 3.1 读取查询参数

```typescript
export async function GET(request: NextRequest) {
  const session = await withAuth();
  
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  
  const where: any = { userId: session.user.id };
  
  if (type) where.type = type;
  if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
  if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
  
  const items = await prisma.transaction.findMany({ where });
  
  return NextResponse.json(items);
}
```

### 3.2 读取请求体

```typescript
export async function POST(request: NextRequest) {
  const session = await withAuth();
  const body = await request.json();
  
  const { amount, type, categoryId, date, note } = body;
  
  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      categoryId,
      date: new Date(date),
      note,
      userId: session.user.id,
    },
    include: { category: true },
  });
  
  return NextResponse.json(transaction, { status: 201 });
}
```

### 3.3 包含相关数据

```typescript
// 包含相关类别
const transaction = await prisma.transaction.findUnique({
  where: { id },
  include: { category: true },
});

// 包含相关项目计数
const category = await prisma.category.findMany({
  include: {
    _count: {
      select: { transactions: true },
    },
  },
});

// 结果包含：{ ..., _count: { transactions: 5 } }
```

---

## 4. 错误处理

### 4.1 验证错误

```typescript
if (!amount || !type || !categoryId || !date) {
  return NextResponse.json(
    { error: "Missing required fields: amount, type, categoryId, date" },
    { status: 400 }
  );
}
```

### 4.2 未找到错误

```typescript
const item = await prisma.item.findFirst({
  where: { id, userId: session.user.id },
});

if (!item) {
  return NextResponse.json({ error: "Item not found" }, { status: 404 });
}
```

### 4.3 冲突错误

```typescript
const existing = await prisma.category.findFirst({
  where: { name, userId: session.user.id },
});

if (existing) {
  return NextResponse.json(
    { error: "Category with this name already exists" },
    { status: 409 }
  );
}
```

### 4.4 业务逻辑错误

```typescript
// 不能删除有关联交易的类别
const transactionCount = await prisma.transaction.count({
  where: { categoryId: id },
});

if (transactionCount > 0) {
  return NextResponse.json(
    { error: "无法删除有关联交易的类别" },
    { status: 400 }
  );
}
```

---

## 5. 认证

### 5.1 保护端点

始终在每个端点开始时使用 `withAuth()`:

```typescript
export async function GET(request: NextRequest) {
  const session = await withAuth(); // ← 始终放在第一位
  // 现在 session.user.id 可用
}
```

### 5.2 withAuth() 的作用

```typescript
// src/lib/with-auth.ts
export async function withAuth(): Promise<Session & { user: { id: string } }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session as Session & { user: { id: string } };
}
```

### 5.3 用户数据范围

**关键安全模式**: 每个查询必须按 `userId` 过滤:

```typescript
// 安全：用户只能访问自己的数据
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
});

// 不安全：会暴露所有用户的数据 - 永远不要这样做
const transactions = await prisma.transaction.findMany({});
```

---

## 6. 测试 API

### 6.1 使用 curl 手动测试

**测试认证**:
```bash
# 登录 (应返回会话 cookie)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

**测试受保护端点**:
```bash
# 无认证 (应返回 401)
curl http://localhost:3000/api/transactions

# 有认证 (通过浏览器 cookie 或 token)
curl http://localhost:3000/api/transactions \
  -H "Cookie: next-auth.session-token=..."
```

### 6.2 使用 Fetch 测试

```typescript
// 在浏览器控制台或 Node.js 中测试
const response = await fetch("http://localhost:3000/api/transactions", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // 包含 cookie
});

const data = await response.json();
console.log(data);
```

### 6.3 使用 Postman/Insomnia 测试

1. **登录请求**:
   - POST `http://localhost:3000/api/auth/callback/credentials`
   - Body: `{ "email": "demo@example.com", "password": "demo123" }`
   - 保存会话 cookie

2. **受保护请求**:
   - GET `http://localhost:3000/api/transactions`
   - 包含保存的会话 cookie

---

## 7. API 示例

### 7.1 完整示例：类别 API

文件：`src/app/api/categories/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/with-auth";

// GET /api/categories
export async function GET(request: NextRequest) {
  try {
    const session = await withAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    
    const where: { userId: string; type?: string } = {
      userId: session.user.id,
    };
    
    if (type) {
      where.type = type;
    }
    
    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth();
    
    const body = await request.json();
    const { name, type, icon, color } = body;
    
    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        type,
        icon,
        color,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
```

### 7.2 完整示例：统计 API

文件：`src/app/api/stats/route.ts`

```typescript
import { withAuth } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

// GET /api/stats
export async function GET(req: Request) {
  try {
    const session = await withAuth();
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // 获取期间交易
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: { category: true },
    });
    
    // 计算总额
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // 计算类别分布
    const categoryStats = await prisma.category.findMany({
      where: { userId: session.user.id },
      include: {
        transactions: {
          where: {
            userId: session.user.id,
            date: { gte: start, lte: end },
            type: "expense",
          },
        },
      },
    });
    
    const categoryData = categoryStats
      .map((cat) => ({
        name: cat.name,
        value: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
        color: cat.color,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
    
    // 计算每日数据
    const dailyStats: Record<string, { income: number; expense: number }> = {};
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      dailyStats[dateStr] = { income: 0, expense: 0 };
    }
    
    transactions.forEach((t) => {
      const dateStr = t.date.toISOString().split("T")[0];
      if (dailyStats[dateStr]) {
        if (t.type === "income") {
          dailyStats[dateStr].income += t.amount;
        } else {
          dailyStats[dateStr].expense += t.amount;
        }
      }
    });
    
    const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));
    
    return new Response(
      JSON.stringify({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        categoryData,
        dailyData,
        transactionCount: transactions.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new Response(JSON.stringify({ error: "获取统计失败" }), { status: 500 });
  }
}
```

---

## 8. 最佳实践

### 8.1 始终

- 在每个端点开始时调用 `withAuth()`
- 在每个数据库查询中包含 `userId`
- 返回适当的状态码
- 记录带描述性消息的错误
- 验证所有输入字段

### 8.2 永远不要

- 仅信任客户端验证
- 查询数据时不进行用户范围限定
- 在错误消息中暴露敏感数据
- 忘记处理边缘情况

### 8.3 一致的命名

```typescript
// 路由文件
route.ts              // 集合端点
[id]/route.ts         // 单个项目端点

// 响应键
{ error: "..." }      // 错误响应
{ message: "..." }    // 成功消息
{ data: ... }         // 单个项目
[ ...items ]          // 多个项目
```

---

## 9. 调试提示

### 9.1 启用 Prisma 日志

```typescript
// 在 prisma 模式或实例化中
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn'],
});
```

### 9.2 记录请求详情

```typescript
console.log("User ID:", session.user.id);
console.log("Request body:", body);
console.log("Query params:", searchParams.toString());
```

### 9.3 使用 Prisma Studio

```bash
npm run db:studio
```

打开 http://localhost:5555 可视化检查数据库状态。
