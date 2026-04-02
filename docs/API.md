# API Development Guide

This document provides detailed information about developing and extending the JiZhang API.

## Table of Contents

1. [API Design Principles](#1-api-design-principles)
2. [Creating New Endpoints](#2-creating-new-endpoints)
3. [Request/Response Patterns](#3-requestresponse-patterns)
4. [Error Handling](#4-error-handling)
5. [Authentication](#5-authentication)
6. [Testing APIs](#6-testing-apis)
7. [API Examples](#7-api-examples)

---

## 1. API Design Principles

### 1.1 RESTful Conventions

| HTTP Method | Operation | Example Endpoint |
|-------------|-----------|------------------|
| GET | Read | `/api/transactions` |
| POST | Create | `/api/transactions` |
| PUT | Update | `/api/transactions/[id]` |
| DELETE | Delete | `/api/transactions/[id]` |

### 1.2 Response Format

**Success**:
```json
{
  "id": "txn_123",
  "amount": 100.50,
  // ... other fields
}
```

**Error**:
```json
{
  "error": "Transaction not found"
}
```

### 1.3 Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Missing or invalid session |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## 2. Creating New Endpoints

### 2.1 File Structure

Next.js 16 App Router uses file-based routing:

```
src/app/api/
├── users/
│   └── route.ts          # GET, POST /api/users
└── users/[id]/
    └── route.ts          # GET, PUT, DELETE /api/users/[id]
```

### 2.2 Basic Endpoint Template

```typescript
// src/app/api/your-entity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/with-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth();
    
    // Your logic here
    
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
    
    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      );
    }
    
    // Your logic here
    
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

### 2.3 Dynamic Routes

For parameterized routes like `/api/transactions/[id]`:

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
  
  // Find resource, ensuring it belongs to the user
  const item = await prisma.transaction.findFirst({
    where: {
      id,
      userId: session.user.id, // Critical for security!
    },
  });
  
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  return NextResponse.json(item);
}
```

---

## 3. Request/Response Patterns

### 3.1 Reading Query Parameters

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

### 3.2 Reading Request Body

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

### 3.3 Including Related Data

```typescript
// Include related category
const transaction = await prisma.transaction.findUnique({
  where: { id },
  include: { category: true },
});

// Include count of related items
const category = await prisma.category.findMany({
  include: {
    _count: {
      select: { transactions: true },
    },
  },
});

// Result includes: { ..., _count: { transactions: 5 } }
```

---

## 4. Error Handling

### 4.1 Validation Errors

```typescript
if (!amount || !type || !categoryId || !date) {
  return NextResponse.json(
    { error: "Missing required fields: amount, type, categoryId, date" },
    { status: 400 }
  );
}
```

### 4.2 Not Found Errors

```typescript
const item = await prisma.item.findFirst({
  where: { id, userId: session.user.id },
});

if (!item) {
  return NextResponse.json({ error: "Item not found" }, { status: 404 });
}
```

### 4.3 Conflict Errors

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

### 4.4 Business Logic Errors

```typescript
// Cannot delete category with transactions
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

## 5. Authentication

### 5.1 Protecting Endpoints

Always use `withAuth()` at the start of every endpoint:

```typescript
export async function GET(request: NextRequest) {
  const session = await withAuth(); // ← Always first
  // Now session.user.id is available
}
```

### 5.2 What withAuth() Does

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

### 5.3 User Data Scoping

**Critical Security Pattern**: Every query must filter by `userId`:

```typescript
// SECURE: User can only access their own data
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
});

// INSECURE: Would expose all users' data - NEVER DO THIS
const transactions = await prisma.transaction.findMany({});
```

---

## 6. Testing APIs

### 6.1 Manual Testing with curl

**Test Authentication**:
```bash
# Login (should return session cookie)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

**Test Protected Endpoint**:
```bash
# Without auth (should return 401)
curl http://localhost:3000/api/transactions

# With auth (via browser cookie or token)
curl http://localhost:3000/api/transactions \
  -H "Cookie: next-auth.session-token=..."
```

### 6.2 Testing with Fetch

```typescript
// Test in browser console or Node.js
const response = await fetch("http://localhost:3000/api/transactions", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Include cookies
});

const data = await response.json();
console.log(data);
```

### 6.3 Testing with Postman/Insomnia

1. **Login Request**:
   - POST `http://localhost:3000/api/auth/callback/credentials`
   - Body: `{ "email": "demo@example.com", "password": "demo123" }`
   - Save the session cookie

2. **Protected Request**:
   - GET `http://localhost:3000/api/transactions`
   - Include the saved session cookie

---

## 7. API Examples

### 7.1 Complete Example: Categories API

File: `src/app/api/categories/route.ts`

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

### 7.2 Complete Example: Stats API

File: `src/app/api/stats/route.ts`

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
    
    // Fetch transactions for the period
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
    
    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate category breakdown
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
    
    // Calculate daily data
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

## 8. Best Practices

### 8.1 Always

- Call `withAuth()` at the start of every endpoint
- Include `userId` in every database query
- Return appropriate status codes
- Log errors with descriptive messages
- Validate all input fields

### 8.2 Never

- Trust client-side validation alone
- Query data without user scoping
- Expose sensitive data in error messages
- Forget to handle edge cases

### 8.2 Consistent Naming

```typescript
// Route files
route.ts              // Collection endpoint
[id]/route.ts         // Single item endpoint

// Response keys
{ error: "..." }      // Error responses
{ message: "..." }    // Success messages
{ data: ... }         // Single item
[ ...items ]          // Multiple items
```

---

## 9. Debugging Tips

### 9.1 Enable Prisma Logging

```typescript
// In prisma schema or instantiation
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn'],
});
```

### 9.2 Log Request Details

```typescript
console.log("User ID:", session.user.id);
console.log("Request body:", body);
console.log("Query params:", searchParams.toString());
```

### 9.3 Use Prisma Studio

```bash
npm run db:studio
```

Open http://localhost:5555 to visually inspect database state.
