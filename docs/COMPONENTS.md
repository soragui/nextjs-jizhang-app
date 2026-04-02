# Components Guide

This document covers the frontend component architecture in JiZhang.

## Table of Contents

1. [Component Types](#1-component-types)
2. [UI Primitives](#2-ui-primitives)
3. [Feature Components](#3-feature-components)
4. [Layout Components](#4-layout-components)
5. [Session Management](#5-session-management)
6. [Error Handling](#6-error-handling)
7. [Creating New Components](#7-creating-new-components)

---

## 1. Component Types

### 1.1 Client vs Server Components

**Client Components** (`"use client"`):
- Interactive components with state
- Use hooks (`useState`, `useEffect`, `useSession`)
- Handle user interactions
- Located in `src/components/`

```typescript
"use client";

export function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Click</button>;
}
```

**Server Components** (default):
- Fetch data directly
- No client-side state
- Better performance for static content
- Located in `src/app/` pages

```typescript
export default async function Page() {
  const data = await db.query();
  return <div>{data}</div>;
}
```

### 1.2 Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| UI Primitives | `src/components/ui/` | Reusable base components |
| Feature Components | `src/components/*.tsx` | Business logic components |
| Layout Components | `src/app/*/layout.tsx` | Page structure |
| Providers | `src/components/providers/` | Context providers |

---

## 2. UI Primitives

All UI primitives are located in `src/components/ui/`.

### 2.1 Button

File: `src/components/ui/button.tsx`

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

File: `src/components/ui/input.tsx`

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

File: `src/components/ui/label.tsx`

```typescript
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

### 2.4 Card

File: `src/components/ui/card.tsx`

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

**Components**:
- `Card`: Container
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Subtitle text
- `CardContent`: Main content area

---

### 2.5 Table

File: `src/components/ui/table.tsx`

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

File: `src/components/ui/tabs.tsx`

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

File: `src/components/ui/skeleton.tsx`

```typescript
{loading ? (
  <Skeleton className="h-8 w-32" />
) : (
  <span>{data}</span>
)}
```

---

## 3. Feature Components

### 3.1 TransactionForm

File: `src/components/transactions.tsx`

**Purpose**: Form for creating/editing transactions

**Props**:
```typescript
interface TransactionFormProps {
  categories: Category[];      // For category dropdown
  onSubmit: (data: TransactionData) => void;
  onCancel: () => void;
  initialData?: Transaction;   // If editing
}
```

**Usage**:
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

**Fields**:
- Type (income/expense dropdown)
- Amount (number input)
- Category (filtered dropdown)
- Date (date picker)
- Note (optional text)

---

### 3.2 TransactionList

File: `src/components/transactions.tsx`

**Purpose**: Display list of transactions

**Props**:
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}
```

**Features**:
- Shows transaction icon (green + for income, red - for expense)
- Displays category name and date
- Edit and delete buttons
- Empty state message

---

### 3.3 CategoryForm

File: `src/components/categories.tsx`

**Purpose**: Form for creating/editing categories

**Props**:
```typescript
interface CategoryFormProps {
  onSubmit: (data: CategoryData) => void;
  onCancel: () => void;
  initialData?: Category;
}
```

**Fields**:
- Name (text input)
- Type (income/expense dropdown)
- Color (color picker with preset options)
- Icon (optional)

---

### 3.4 CategoryList

File: `src/components/categories.tsx`

**Purpose**: Display list of categories

**Props**:
```typescript
interface CategoryListProps {
  categories: Category[];
  type: "EXPENSE" | "INCOME";
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}
```

**Features**:
- Filters by type (expense/income)
- Shows transaction count per category
- Edit and delete buttons
- Color indicator

---

## 4. Layout Components

### 4.1 Root Layout

File: `src/app/layout.tsx`

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

**Responsibilities**:
- Set HTML language
- Apply fonts
- Wrap with ErrorBoundary
- Wrap with SessionProvider

---

### 4.2 Dashboard Layout

File: `src/app/(dashboard)/layout.tsx`

```typescript
"use client";

import { SidebarNavigation } from "@/components/sidebar-navigation";

export default function DashboardLayout({ children }) {
  return <SidebarNavigation>{children}</SidebarNavigation>;
}
```

**Responsibilities**:
- Apply sidebar navigation to all dashboard pages
- Handle authentication checks

---

### 4.3 SidebarNavigation

File: `src/components/sidebar-navigation.tsx`

**Purpose**: Main application navigation

**Props**:
```typescript
interface SidebarNavigationProps {
  children: React.ReactNode;
}
```

**Features**:
- Responsive sidebar (collapsible on mobile)
- Navigation links:
  - 仪表盘 (Dashboard)
  - 交易记录 (Transactions)
  - 统计图表 (Stats)
  - 类别管理 (Categories)
- User profile display
- Logout button
- Mobile menu toggle

**Structure**:
```
┌─────────────────────────────────────┐
│  Logo + 记账本                    X │  ← Header
├─────────────────────────────────────┤
│  🏠 仪表盘                          │
│  📋 交易记录                        │  ← Nav Links
│  📊 统计图表                        │
│  ⚙️ 类别管理                        │
├─────────────────────────────────────┤
│  👤 User    [Logout]                │  ← User Section
└─────────────────────────────────────┘
```

---

## 5. Session Management

### 5.1 SessionProvider

File: `src/components/providers/session-provider.tsx`

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

**Usage**:
```typescript
// In root layout
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
  
  // session.user is available
  return <div>Welcome, {session.user.name}</div>;
}
```

**Session Structure**:
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

## 6. Error Handling

### 6.1 ErrorBoundary

File: `src/components/error-boundary.tsx`

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

### 6.2 Error State in Components

```typescript
const [error, setError] = useState<string | null>(null);

// In form submit
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

### 6.3 Loading States

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

## 7. Creating New Components

### 7.1 Component Template

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

### 7.2 Best Practices

**DO**:
- Use `"use client"` for interactive components
- Extract reusable UI to `src/components/ui/`
- Use TypeScript interfaces for props
- Handle loading and error states
- Use existing UI primitives

**DON'T**:
- Mix server and client code improperly
- Duplicate UI primitives
- Forget to handle edge cases
- Ignore accessibility

---

## 8. Styling Guide

### 8.1 Tailwind Classes

```typescript
// Spacing
className="p-4"       // Padding: 1rem
className="m-4"       // Margin: 1rem
className="gap-2"     // Gap: 0.5rem

// Typography
className="text-sm"   // Small text
className="font-bold" // Bold text
className="text-center"

// Colors
className="bg-white"
className="text-gray-700"
className="border-gray-300"

// Layout
className="flex"
className="items-center"
className="justify-between"
className="grid grid-cols-2"
```

### 8.2 cn() Utility

File: `src/lib/utils.ts`

```typescript
import { cn } from "@/lib/utils";

// Merge class names conditionally
className={cn(
  "base-class",
  isActive && "active-class",
  props.className
)}
```

---

## 9. Component Testing

### 9.1 Visual Testing

1. Run dev server: `npm run dev`
2. Navigate to component's page
3. Test all states (loading, error, empty, populated)

### 9.2 Manual Interaction Testing

```typescript
// Test form submission
1. Fill all fields
2. Submit form
3. Verify success/error handling
4. Test cancel button

// Test list components
1. Test empty state
2. Test with one item
3. Test with many items
4. Test edit/delete actions
```
