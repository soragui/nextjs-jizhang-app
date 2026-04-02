# Database Guide

This document covers database operations, schema design, and data management in JiZhang.

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Schema Design](#2-schema-design)
3. [Prisma Basics](#3-prisma-basics)
4. [Common Operations](#4-common-operations)
5. [Relationships](#5-relationships)
6. [Migrations](#6-migrations)
7. [Seeding](#7-seeding)
8. [Performance](#8-performance)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Database Overview

### 1.1 Technology Stack

```
┌─────────────────────────────────────────┐
│           JiZhang Database              │
├─────────────────────────────────────────┤
│  ORM          │ Prisma 6.3.1            │
│  Database     │ SQLite (libSQL)         │
│  Location     │ prisma/dev.db           │
│  Schema       │ prisma/schema.prisma    │
└─────────────────────────────────────────┘
```

### 1.2 Why SQLite?

**Pros**:
- Zero configuration
- Single file database
- Perfect for local development
- Easy backup (copy the file)

**Cons**:
- Not suitable for high-concurrency production
- Limited concurrent writes
- Consider PostgreSQL for production

---

## 2. Schema Design

### 2.1 Full Schema

File: `prisma/schema.prisma`

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
  type        String        // "income" or "expense"
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
  type       String    // "income" or "expense"
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

### 2.2 Entity Relationship Diagram

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
         │ 1:N (Cascade Delete)
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
      │ 1:N (SetNull)         │
      └───────────────────────┘
```

### 2.3 Field Explanations

**User**:
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Unique identifier |
| email | String | Unique email address |
| name | String? | Optional display name |
| password | String? | Bcrypt hashed password |

**Category**:
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Unique identifier |
| name | String | Category name |
| type | String | "income" or "expense" |
| icon | String? | Icon identifier |
| color | String? | Color code (hex) |
| isDefault | Boolean | System-created flag |
| userId | String | Foreign key to User |

**Transaction**:
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Unique identifier |
| amount | Float | Transaction amount |
| type | String | "income" or "expense" |
| categoryId | String? | Foreign key to Category |
| date | DateTime | Transaction date |
| note | String? | Optional note |
| userId | String | Foreign key to User |

---

## 3. Prisma Basics

### 3.1 Prisma Client Setup

File: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Why the global check?**: Prevents multiple Prisma instances during hot-reload in development.

---

### 3.2 Basic CRUD Operations

```typescript
// CREATE
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    password: hashedPassword,
  },
});

// READ (single)
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
});

// READ (multiple)
const users = await prisma.user.findMany({
  where: { email: { contains: "gmail" } },
});

// UPDATE
const user = await prisma.user.update({
  where: { id: "user-id" },
  data: { name: "New Name" },
});

// DELETE
const user = await prisma.user.delete({
  where: { id: "user-id" },
});
```

---

## 4. Common Operations

### 4.1 User Operations

```typescript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});

// Create user with hashed password
const hashedPassword = await bcrypt.hash("password123", 10);
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    password: hashedPassword,
  },
});

// Update user
const user = await prisma.user.update({
  where: { id: userId },
  data: { name: "New Name" },
});
```

---

### 4.2 Category Operations

```typescript
// Create category
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

// Get all categories for user
const categories = await prisma.category.findMany({
  where: { userId: session.user.id },
  include: {
    _count: {
      select: { transactions: true },
    },
  },
  orderBy: { createdAt: "desc" },
});

// Get categories by type
const expenseCategories = await prisma.category.findMany({
  where: {
    userId: session.user.id,
    type: "expense",
  },
});

// Delete category (fails if has transactions)
await prisma.category.delete({
  where: { id: categoryId },
});
```

---

### 4.3 Transaction Operations

```typescript
// Create transaction
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

// Get all transactions for user
const transactions = await prisma.transaction.findMany({
  where: { userId: session.user.id },
  include: { category: true },
  orderBy: { date: "desc" },
});

// Get transactions with filters
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

// Update transaction
const transaction = await prisma.transaction.update({
  where: { id: transactionId },
  data: {
    amount: 150.00,
    note: "Updated lunch",
  },
  include: { category: true },
});

// Delete transaction
await prisma.transaction.delete({
  where: { id: transactionId },
});

// Count transactions by category
const count = await prisma.transaction.count({
  where: { categoryId: categoryId },
});
```

---

### 4.4 Statistics Queries

```typescript
// Get total income for period
const totalIncome = await prisma.transaction.aggregate({
  where: {
    userId: session.user.id,
    type: "income",
    date: { gte: startDate, lte: endDate },
  },
  _sum: { amount: true },
});

// Get expenses by category
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

// Process to get category totals
const categoryData = categoryStats.map((cat) => ({
  name: cat.name,
  value: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
  color: cat.color,
}));
```

---

## 5. Relationships

### 5.1 Understanding Relations

**User → Categories/Transactions** (One-to-Many):
- One user has many categories
- One user has many transactions
- Delete user → Cascade delete all related data

**Category → Transactions** (One-to-Many):
- One category can have many transactions
- Delete category → Set categoryId to NULL in transactions

---

### 5.2 Including Related Data

```typescript
// Include category with transaction
const transaction = await prisma.transaction.findUnique({
  where: { id: txnId },
  include: { category: true },
});
// Result: { ..., category: { id, name, type, color, ... } }

// Include transaction count with category
const category = await prisma.category.findMany({
  include: {
    _count: {
      select: { transactions: true },
    },
  },
});
// Result: { ..., _count: { transactions: 5 } }

// Include all transactions with user (rarely needed)
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    categories: true,
    transactions: true,
  },
});
```

---

### 5.3 Filtering by Relations

```typescript
// Get transactions with specific category type
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

## 6. Migrations

### 6.1 Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_icon_to_category

# This will:
# 1. Detect schema changes
# 2. Create migration file in prisma/migrations/
# 3. Apply migration to database
```

### 6.2 Migration File Structure

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

### 6.3 Example Migration SQL

```sql
-- AlterTable
ALTER TABLE "categories" ADD COLUMN "icon" TEXT;
```

### 6.4 Production Migrations

```bash
# Apply pending migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## 7. Seeding

### 7.1 Seed Script Overview

File: `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient();
  
  // Create demo user
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
  
  // Create default categories
  const defaultExpenseCategories = [
    { name: "餐饮", color: "#ef4444" },
    { name: "交通", color: "#f97316" },
    // ... more categories
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
  
  // Create sample transactions
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

### 7.2 Running Seed

```bash
# Run seed script
npm run db:seed

# Or directly
npx ts-node prisma/seed.ts
```

---

## 8. Performance

### 8.1 Query Optimization

**Use select for specific fields**:
```typescript
// Only fetch needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

**Use include wisely**:
```typescript
// Include only needed relations
const transactions = await prisma.transaction.findMany({
  include: { category: true }, // Only if you need category data
});
```

**Avoid N+1 queries**:
```typescript
// GOOD: Single query with include
const transactions = await prisma.transaction.findMany({
  include: { category: true },
});

// BAD: N+1 queries
const transactions = await prisma.transaction.findMany();
for (const t of transactions) {
  t.category = await prisma.category.findUnique({ where: { id: t.categoryId } });
}
```

---

### 8.2 Indexing

Current indexes (automatic):
- `id` on all tables (primary key)
- `email` on User (unique constraint)
- `[userId, name]` on Category (composite unique)

For large datasets, consider adding indexes on:
- `Transaction.userId`
- `Transaction.date`
- `Category.userId`

---

## 9. Troubleshooting

### 9.1 Database Locked

**Error**: `SQLITE_LOCKED`

**Solutions**:
1. Close Prisma Studio
2. Close any other connections to dev.db
3. Restart the dev server

---

### 9.2 Schema Out of Sync

**Error**: `PrismaClientKnownRequestError`

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema directly (development only)
npx prisma db push
```

---

### 9.3 Regenerate Prisma Client

```bash
# After schema changes
npx prisma generate

# Verify client is up to date
npx prisma validate
```

---

### 9.4 Using Prisma Studio

```bash
# Open visual database editor
npm run db:studio
```

Open http://localhost:5555 to:
- View all records
- Create/edit/delete data
- Run raw queries

---

## Appendix: Raw SQL

When Prisma doesn't support a query:

```typescript
// Raw query
const result = await prisma.$queryRaw`
  SELECT type, SUM(amount) as total
  FROM transactions
  WHERE userId = ${session.user.id}
  GROUP BY type
`;

// Raw mutation
await prisma.$executeRaw`
  DELETE FROM transactions
  WHERE userId = ${session.user.id}
  AND date < ${new Date("2023-01-01")}
`;
```
