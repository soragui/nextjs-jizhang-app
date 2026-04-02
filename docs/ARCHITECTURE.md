# Architecture Deep Dive

This document provides a detailed look at the JiZhang application architecture.

## Table of Contents

1. [Application Flow](#1-application-flow)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Data Flow](#3-data-flow)
4. [Component Hierarchy](#4-component-hierarchy)
5. [Security Model](#5-security-model)

---

## 1. Application Flow

### 1.1 Initial Load Sequence

```
1. User visits application
         │
         ▼
2. Next.js loads root layout (src/app/layout.tsx)
         │
         ├── Wraps app in ErrorBoundary
         └── Wraps app in SessionProvider
         │
         ▼
3. Route evaluation
         │
         ├── Public route (/login) → Render login page
         └── Protected route → Check session status
                 │
                 ├── Authenticated → Render page
                 └── Unauthenticated → Redirect to /login
```

### 1.2 File: `src/app/layout.tsx`

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

**Key Points**:
- All pages inherit this layout
- SessionProvider enables `useSession()` hook anywhere
- ErrorBoundary catches React errors

---

## 2. Authentication Architecture

### 2.1 NextAuth Configuration

File: `src/auth.ts`

```typescript
NextAuth({
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // 1. Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        
        if (user) {
          // Login flow: verify password
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
        } else if (name) {
          // Registration flow: create user
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

### 2.2 JWT Token Structure

```
┌─────────────────────────────────────────────────┐
│                  JWT Payload                     │
├─────────────────────────────────────────────────┤
│  iat: Issued timestamp                           │
│  exp: Expiration timestamp                       │
│  sub: Subject (user id)                          │
│  name: User name                                 │
│  email: User email                               │
│  id: User ID (custom claim)                      │
└─────────────────────────────────────────────────┘
```

### 2.3 withAuth Helper

File: `src/lib/with-auth.ts`

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

**Usage Pattern**:
```typescript
export async function GET() {
  const session = await withAuth();
  // session.user.id is guaranteed to exist
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id }
  });
}
```

---

## 3. Data Flow

### 3.1 Client → Server → Database

```
┌─────────────────┐
│   Component     │  User clicks "Add Transaction"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  onSubmit()     │  Collects form data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  fetch()        │  POST /api/transactions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │  POST /api/transactions/route.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  withAuth()     │  Verify authentication
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prisma         │  Create transaction
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │  INSERT INTO transactions...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Response  │  201 Created
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Component     │  Update UI state
└─────────────────┘
```

### 3.2 Example: Fetch Transactions

**Client Component** (`src/components/transactions.tsx`):
```typescript
const fetchTransactions = async () => {
  const res = await fetch("/api/transactions");
  const data = await res.json();
  setTransactions(data);
};
```

**API Route** (`src/app/api/transactions/route.ts`):
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

## 4. Component Hierarchy

### 4.1 Dashboard Layout Tree

```
<App>
  └── SessionProvider
       └── ErrorBoundary
            └── DashboardLayout (SidebarNavigation)
                 ├── Sidebar (navigation)
                 │    ├── Logo
                 │    ├── Nav Links
                 │    └── User Profile
                 ├── Header
                 │    └── "Add Transaction" Button
                 └── Main Content
                      └── DashboardPage
                           ├── Summary Cards
                           │    ├── Total Income
                           │    ├── Total Expense
                           │    ├── Balance
                           │    └── Transaction Count
                           ├── Line Chart (Daily Trends)
                           └── Pie Chart (Category Breakdown)
```

### 4.2 Transaction Page Tree

```
<SidebarNavigation>
  └── TransactionsPage
       ├── Page Header
       ├── Filter Controls
       └── TransactionList
            └── TransactionItem (repeating)
                 ├── Icon (income/expense)
                 ├── Category Name
                 ├── Date
                 ├── Note
                 ├── Amount
                 └── Actions (Edit/Delete)
```

---

## 5. Security Model

### 5.1 Authentication Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                             │
│                                                               │
│  ┌─────────────┐     ┌─────────────────────────────────┐    │
│  │   Public    │     │         Protected                │    │
│  │   Routes    │     │           Routes                 │    │
│  │             │     │                                   │    │
│  │  /login     │     │  /dashboard                      │    │
│  │             │     │  /transactions                   │    │
│  │             │     │  /categories                     │    │
│  │             │     │  /stats                          │    │
│  │             │     │                                   │    │
│  │             │     │  ┌─────────────────────────────┐ │    │
│  │             │     │  │   API Routes (Protected)    │ │    │
│  │             │     │  │                              │ │    │
│  │             │     │  │  /api/transactions          │ │    │
│  │             │     │  │  /api/categories            │ │    │
│  │             │     │  │  /api/stats                 │ │    │
│  │             │     │  │                              │ │    │
│  │             │     │  │  Each route calls withAuth()│ │    │
│  │             │     │  └─────────────────────────────┘ │    │
│  │             │     │                                   │    │
│  └─────────────┘     └─────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Data Isolation

Every database query includes `userId` in the WHERE clause:

```typescript
// GOOD: User can only access their own data
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id }
});

// BAD: Would expose all users' data (never do this)
const transactions = await prisma.transaction.findMany({});
```

### 5.3 Password Security

```typescript
// Registration: Hash password before storing
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { email, password: hashedPassword, name }
});

// Login: Compare hash with stored hash
const isValid = await bcrypt.compare(password, user.password);
```

### 5.4 Cascade Delete Behavior

```
Delete User
    │
    ├── CASCADE → All Categories deleted
    │
    └── CASCADE → All Transactions deleted
```

```
Delete Category
    │
    └── SET NULL → categoryId in Transactions set to null
```

---

## 6. State Management

### 6.1 Client State Pattern

Components use React's `useState` for local state:

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### 6.2 Session State

Global session state via NextAuth:

```typescript
const { data: session, status } = useSession();

// status: "loading" | "authenticated" | "unauthenticated"
// session: { user: { id, email, name } }
```

### 6.3 Server State

No server-side caching - each request fetches fresh data from the database.

---

## 7. Error Handling

### 7.1 API Error Responses

```typescript
try {
  // Database operation
} catch (error) {
  console.error("Error description:", error);
  return NextResponse.json(
    { error: "User-friendly error message" },
    { status: 500 }
  );
}
```

### 7.2 Client Error Handling

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

### 7.3 Error Boundary

File: `src/components/error-boundary.tsx`

Wraps the entire app to catch unhandled React errors.

---

## 8. Performance Considerations

### 8.1 Prisma Singleton

File: `src/lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Why**: Prevents multiple Prisma instances in development hot-reload.

### 8.2 Database Indexes

Current schema relies on Prisma's default indexes:
- Primary key: `id` (auto-indexed)
- Unique: `email` on User
- Unique: `[userId, name]` on Category

For large datasets, consider adding indexes on:
- `Transaction.userId`
- `Transaction.date`
- `Category.userId`

### 8.3 Query Optimization

```typescript
// Efficient: Single query with include
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
  include: { category: true }
});

// Inefficient: N+1 queries
const transactions = await prisma.transaction.findMany({...});
for (const t of transactions) {
  t.category = await prisma.category.findUnique({...}); // Avoid!
}
```
