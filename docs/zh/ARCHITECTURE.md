# 架构深入解析

本文档详细解析 JiZhang 应用架构。

## 目录

1. [应用流程](#1-应用流程)
2. [认证架构](#2-认证架构)
3. [数据流](#3-数据流)
4. [组件层级](#4-组件层级)
5. [安全模型](#5-安全模型)

---

## 1. 应用流程

### 1.1 初始加载序列

```
1. 用户访问应用
         │
         ▼
2. Next.js 加载根布局 (src/app/layout.tsx)
         │
         ├── 将应用包装在 ErrorBoundary 中
         └── 将应用包装在 SessionProvider 中
         │
         ▼
3. 路由评估
         │
         ├── 公开路由 (/login) → 渲染登录页面
         └── 受保护路由 → 检查会话状态
                 │
                 ├── 已认证 → 渲染页面
                 └── 未认证 → 重定向到 /login
```

### 1.2 文件：`src/app/layout.tsx`

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ErrorBoundary>
          <SessionProvider>{children}</SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**关键点**:
- 所有页面继承此布局
- SessionProvider 使 `useSession()` hook 在任何地方可用
- ErrorBoundary 捕获 React 错误

---

## 2. 认证架构

### 2.1 NextAuth 配置

文件：`src/auth.ts`

```typescript
NextAuth({
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // 1. 检查用户是否存在
        let user = await prisma.user.findUnique({ where: { email } });
        
        if (user) {
          // 登录流程：验证密码
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
        } else if (name) {
          // 注册流程：创建用户
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({ data: { email, password: hashedPassword, name } });
        } else {
          return null;
        }
        
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
```

### 2.2 JWT Token 结构

```
┌─────────────────────────────────────────────────┐
│                  JWT Payload                     │
├─────────────────────────────────────────────────┤
│  iat: 签发时间戳                                 │
│  exp: 过期时间戳                                 │
│  sub: 主题 (用户 id)                             │
│  name: 用户名称                                  │
│  email: 用户邮箱                                 │
│  id: 用户 ID (自定义声明)                        │
└─────────────────────────────────────────────────┘
```

### 2.3 withAuth 辅助函数

文件：`src/lib/with-auth.ts`

```typescript
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

**使用模式**:
```typescript
export async function GET() {
  const session = await withAuth();
  // session.user.id 保证存在
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id }
  });
}
```

---

## 3. 数据流

### 3.1 客户端 → 服务器 → 数据库

```
┌─────────────────┐
│   组件          │  用户点击"添加交易"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  onSubmit()     │  收集表单数据
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  fetch()        │  POST /api/transactions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API 路由       │  POST /api/transactions/route.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  withAuth()     │  验证认证
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prisma         │  创建交易
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   数据库        │  INSERT INTO transactions...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON 响应      │  201 Created
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   组件          │  更新 UI 状态
└─────────────────┘
```

### 3.2 示例：获取交易

**客户端组件** (`src/components/transactions.tsx`):
```typescript
const fetchTransactions = async () => {
  const res = await fetch("/api/transactions");
  const data = await res.json();
  setTransactions(data);
};
```

**API 路由** (`src/app/api/transactions/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  const session = await withAuth();
  
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { date: "desc" },
  });
  
  return NextResponse.json(transactions);
}
```

---

## 4. 组件层级

### 4.1 仪表盘布局树

```
<App>
  └── SessionProvider
       └── ErrorBoundary
            └── DashboardLayout (SidebarNavigation)
                 ├── Sidebar (导航)
                 │    ├── Logo
                 │    ├── 导航链接
                 │    └── 用户资料
                 ├── Header
                 │    └── "记一笔" 按钮
                 └── Main Content
                      └── DashboardPage
                           ├── 摘要卡片
                           │    ├── 总收入
                           │    ├── 总支出
                           │    ├── 结余
                           │    └── 交易笔数
                           ├── 折线图 (每日趋势)
                           └── 饼图 (类别分布)
```

### 4.2 交易页面树

```
<SidebarNavigation>
  └── TransactionsPage
       ├── 页面标题
       ├── 筛选控制
       └── TransactionList
            └── TransactionItem (重复)
                 ├── 图标 (收入/支出)
                 ├── 类别名称
                 ├── 日期
                 ├── 备注
                 ├── 金额
                 └── 操作 (编辑/删除)
```

---

## 5. 安全模型

### 5.1 认证边界

```
┌─────────────────────────────────────────────────────────────┐
│                      应用                                    │
│                                                               │
│  ┌─────────────┐     ┌─────────────────────────────────┐    │
│  │   公开      │     │         受保护                    │    │
│  │   路由      │     │           路由                    │    │
│  │             │     │                                   │    │
│  │  /login     │     │  /dashboard                      │    │
│  │             │     │  /transactions                   │    │
│  │             │     │  /categories                     │    │
│  │             │     │  /stats                          │    │
│  │             │     │                                   │    │
│  │             │     │  ┌─────────────────────────────┐ │    │
│  │             │     │  │   API 路由 (受保护)          │ │    │
│  │             │     │  │                              │ │    │
│  │             │     │  │  /api/transactions          │ │    │
│  │             │     │  │  /api/categories            │ │    │
│  │             │     │  │  /api/stats                 │ │    │
│  │             │     │  │                              │ │    │
│  │             │     │  │  每个路由调用 withAuth()    │ │    │
│  │             │     │  └─────────────────────────────┘ │    │
│  │             │     │                                   │    │
│  └─────────────┘     └─────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 数据隔离

每个数据库查询都包含 `userId` 在 WHERE 子句中:

```typescript
// 正确：用户只能访问自己的数据
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id }
});

// 错误：会暴露所有用户的数据（永远不要这样做）
const transactions = await prisma.transaction.findMany({});
```

### 5.3 密码安全

```typescript
// 注册：存储前哈希密码
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { email, password: hashedPassword, name }
});

// 登录：比较哈希与存储的哈希
const isValid = await bcrypt.compare(password, user.password);
```

### 5.4 级联删除行为

```
删除用户
    │
    ├── CASCADE → 所有类别被删除
    │
    └── CASCADE → 所有交易被删除
```

```
删除类别
    │
    └── SET NULL → 交易中的 categoryId 设置为 null
```

---

## 6. 状态管理

### 6.1 客户端状态模式

组件使用 React 的 `useState` 管理本地状态:

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

---

### 6.2 会话状态

通过 NextAuth 的全局会话状态:

```typescript
const { data: session, status } = useSession();

// status: "loading" | "authenticated" | "unauthenticated"
// session: { user: { id, email, name } }
```

### 6.3 服务器状态

无服务器端缓存 - 每个请求都从数据库获取最新数据。

---

## 7. 错误处理

### 7.1 API 错误响应

```typescript
try {
  // 数据库操作
} catch (error) {
  console.error("Error description:", error);
  return NextResponse.json(
    { error: "用户友好的错误消息" },
    { status: 500 }
  );
}
```

### 7.2 客户端错误处理

```typescript
try {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  setData(data);
} catch (error) {
  setError("Failed to load transactions");
}
```

### 7.3 错误边界

文件：`src/components/error-boundary.tsx`

包装整个应用以捕获未处理的 React 错误。

---

## 8. 性能考虑

### 8.1 Prisma 单例

文件：`src/lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**为什么**: 防止开发环境热重载时创建多个 Prisma 实例。

### 8.2 数据库索引

当前模式依赖 Prisma 的默认索引:
- 主键：`id` (自动索引)
- 唯一：User 上的 `email`
- 唯一：Category 上的 `[userId, name]`

对于大数据集，考虑添加索引:
- `Transaction.userId`
- `Transaction.date`
- `Category.userId`

### 8.3 查询优化

```typescript
// 高效：单次查询带 include
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
  include: { category: true }
});

// 低效：N+1 查询
const transactions = await prisma.transaction.findMany({...});
for (const t of transactions) {
  t.category = await prisma.category.findUnique({...}); // 避免!
}
```
