# 组件指南

本文档涵盖 JiZhang 中的前端组件架构。

## 目录

1. [组件类型](#1-组件类型)
2. [UI 基础组件](#2-ui-基础组件)
3. [功能组件](#3-功能组件)
4. [布局组件](#4-布局组件)
5. [会话管理](#5-会话管理)
6. [错误处理](#6-错误处理)
7. [创建新组件](#7-创建新组件)

---

## 1. 组件类型

### 1.1 客户端 vs 服务器组件

**客户端组件** (`"use client"`):
- 带状态的交互式组件
- 使用 hooks (`useState`, `useEffect`, `useSession`)
- 处理用户交互
- 位于 `src/components/`

```typescript
"use client";

export function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Click</button>;
}
```

**服务器组件** (默认):
- 直接获取数据
- 无客户端状态
- 静态内容性能更好
- 位于 `src/app/` 页面

```typescript
export default async function Page() {
  const data = await db.query();
  return <div>{data}</div>;
}
```

### 1.2 组件分类

| 类别 | 位置 | 用途 |
|------|------|------|
| UI 基础组件 | `src/components/ui/` | 可复用的基础组件 |
| 功能组件 | `src/components/*.tsx` | 业务逻辑组件 |
| 布局组件 | `src/app/*/layout.tsx` | 页面结构 |
| 提供者 | `src/components/providers/` | Context 提供者 |

---

## 2. UI 基础组件

所有 UI 基础组件位于 `src/components/ui/`。

### 2.1 Button

文件：`src/components/ui/button.tsx`

```typescript
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="icon"><Icon /></Button>
```

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}
```

---

### 2.2 Input

文件：`src/components/ui/input.tsx`

```typescript
<Input 
  type="email" 
  placeholder="Enter email" 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

---

### 2.3 Label

文件：`src/components/ui/label.tsx`

```typescript
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

### 2.4 Card

文件：`src/components/ui/card.tsx`

```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**组件**:
- `Card`: 容器
- `CardHeader`: 头部区域
- `CardTitle`: 标题文本
- `CardDescription`: 副标题文本
- `CardContent`: 主要内容区域

---

### 2.5 Table

文件：`src/components/ui/table.tsx`

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>$100</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 2.6 Tabs

文件：`src/components/ui/tabs.tsx`

```typescript
<Tabs defaultValue="expense">
  <TabsList>
    <TabsTrigger value="expense">Expense</TabsTrigger>
    <TabsTrigger value="income">Income</TabsTrigger>
  </TabsList>
  <TabsContent value="expense">
    {/* Expense content */}
  </TabsContent>
  <TabsContent value="income">
    {/* Income content */}
  </TabsContent>
</Tabs>
```

---

### 2.7 Skeleton

文件：`src/components/ui/skeleton.tsx`

```typescript
{loading ? (
  <Skeleton className="h-8 w-32" />
) : (
  <span>{data}</span>
)}
```

---

## 3. 功能组件

### 3.1 TransactionForm

文件：`src/components/transactions.tsx`

**用途**: 创建/编辑交易的表单

**Props**:
```typescript
interface TransactionFormProps {
  categories: Category[];      // 用于类别下拉
  onSubmit: (data: TransactionData) => void;
  onCancel: () => void;
  initialData?: Transaction;   // 编辑时
}
```

**用法**:
```typescript
<TransactionForm 
  categories={categories}
  onSubmit={async (data) => {
    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }}
  onCancel={() => router.push("/transactions")}
/>
```

**字段**:
- 类型（收入/支出下拉）
- 金额（数字输入）
- 类别（过滤后的下拉）
- 日期（日期选择器）
- 备注（可选文本）

---

### 3.2 TransactionList

文件：`src/components/transactions.tsx`

**用途**: 显示交易列表

**Props**:
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}
```

**功能**:
- 显示交易图标（收入绿色 +，支出红色 -）
- 显示类别名称和日期
- 编辑和删除按钮
- 空状态消息

---

### 3.3 CategoryForm

文件：`src/components/categories.tsx`

**用途**: 创建/编辑类别的表单

**Props**:
```typescript
interface CategoryFormProps {
  onSubmit: (data: CategoryData) => void;
  onCancel: () => void;
  initialData?: Category;
}
```

**字段**:
- 名称（文本输入）
- 类型（收入/支出下拉）
- 颜色（带预设选项的颜色选择器）
- 图标（可选）

---

### 3.4 CategoryList

文件：`src/components/categories.tsx`

**用途**: 显示类别列表

**Props**:
```typescript
interface CategoryListProps {
  categories: Category[];
  type: "EXPENSE" | "INCOME";
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}
```

**功能**:
- 按类型过滤（支出/收入）
- 显示每个类别的交易计数
- 编辑和删除按钮
- 颜色指示器

---

## 4. 布局组件

### 4.1 根布局

文件：`src/app/layout.tsx`

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

**职责**:
- 设置 HTML 语言
- 应用字体
- 包装 ErrorBoundary
- 包装 SessionProvider

---

### 4.2 仪表盘布局

文件：`src/app/(dashboard)/layout.tsx`

```typescript
"use client";

import { SidebarNavigation } from "@/components/sidebar-navigation";

export default function DashboardLayout({ children }) {
  return <SidebarNavigation>{children}</SidebarNavigation>;
}
```

**职责**:
- 将所有仪表盘页面应用侧边栏导航
- 处理认证检查

---

### 4.3 SidebarNavigation

文件：`src/components/sidebar-navigation.tsx`

**用途**: 主应用导航

**Props**:
```typescript
interface SidebarNavigationProps {
  children: React.ReactNode;
}
```

**功能**:
- 响应式侧边栏（移动端可折叠）
- 导航链接:
  - 仪表盘
  - 交易记录
  - 统计图表
  - 类别管理
- 用户资料显示
- 登出按钮
- 移动端菜单切换

**结构**:
```
┌─────────────────────────────────────┐
│  Logo + 记账本                    X │  ← 头部
├─────────────────────────────────────┤
│  🏠 仪表盘                          │
│  📋 交易记录                        │  ← 导航链接
│  📊 统计图表                        │
│  ⚙️ 类别管理                        │
├─────────────────────────────────────┤
│  👤 用户    [登出]                  │  ← 用户区域
└─────────────────────────────────────┘
```

---

## 5. 会话管理

### 5.1 SessionProvider

文件：`src/components/providers/session-provider.tsx`

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

**用法**:
```typescript
// 在根布局中
<SessionProvider>
  <App />
</SessionProvider>
```

---

### 5.2 useSession Hook

```typescript
"use client";
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <LoadingSpinner />;
  }
  
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }
  
  // session.user 可用
  return <div>Welcome, {session.user.name}</div>;
}
```

**会话结构**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  expires: string;
}
```

---

## 6. 错误处理

### 6.1 ErrorBoundary

文件：`src/components/error-boundary.tsx`

```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded">
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 6.2 组件中的错误状态

```typescript
const [error, setError] = useState<string | null>(null);

// 在表单提交中
try {
  const res = await fetch("/api/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    setError(errorData.error || "Failed to create transaction");
    return;
  }
} catch {
  setError("An unexpected error occurred");
}
```

---

### 6.3 加载状态

```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

---

## 7. 创建新组件

### 7.1 组件模板

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface MyComponentProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function MyComponent({ onSubmit, onCancel, initialData }: MyComponentProps) {
  const [field, setField] = useState(initialData?.field || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ field });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Field Label</label>
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Submit</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### 7.2 最佳实践

**应该**:
- 为交互式组件使用 `"use client"`
- 将可复用 UI 提取到 `src/components/ui/`
- 为 props 使用 TypeScript 接口
- 处理加载和错误状态
- 使用现有 UI 基础组件

**不应该**:
- 不当混合服务器和客户端代码
- 重复 UI 基础组件
- 忘记处理边缘情况
- 忽略无障碍性

---

## 8. 样式指南

### 8.1 Tailwind 类

```typescript
// 间距
className="p-4"       // 内边距：1rem
className="m-4"       // 外边距：1rem
className="gap-2"     // 间距：0.5rem

// 排版
className="text-sm"   // 小文本
className="font-bold" // 粗体文本
className="text-center"

// 颜色
className="bg-white"
className="text-gray-700"
className="border-gray-300"

// 布局
className="flex"
className="items-center"
className="justify-between"
className="grid grid-cols-2"
```

### 8.2 cn() 工具

文件：`src/lib/utils.ts`

```typescript
import { cn } from "@/lib/utils";

// 条件合并类名
className={cn(
  "base-class",
  isActive && "active-class",
  props.className
)}
```

---

## 9. 组件测试

### 9.1 视觉测试

1. 运行开发服务器：`npm run dev`
2. 导航到组件页面
3. 测试所有状态（加载、错误、空、已填充）

### 9.2 手动交互测试

```typescript
// 测试表单提交
1. 填写所有字段
2. 提交表单
3. 验证成功/错误处理
4. 测试取消按钮

// 测试列表组件
1. 测试空状态
2. 测试一个项目
3. 测试多个项目
4. 测试编辑/删除操作
```
