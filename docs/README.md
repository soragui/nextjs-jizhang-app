# JiZhang App (记账本) - Documentation

> **Note**: This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from standard Next.js documentation. Always refer to `node_modules/next/dist/docs/` for the specific version in use.

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Getting Started](#3-getting-started)
4. [Database Guide](#4-database-guide)
5. [Authentication](#5-authentication)
6. [API Reference](#6-api-reference)
7. [Frontend Components](#7-frontend-components)
8. [Page Routes](#8-page-routes)
9. [Deployment](#9-deployment)

---

## 1. Overview

### 1.1 What is JiZhang?

JiZhang (记账本，meaning "account book" in Chinese) is a modern personal finance management application designed for individuals to track their income and expenses. It provides intuitive data visualization, category management, and transaction tracking capabilities.

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| User Authentication | Register/login with email and password using NextAuth.js v5 |
| Transaction Tracking | Record income and expenses with categories, dates, and notes |
| Category Management | Create and manage custom income/expense categories |
| Data Visualization | Interactive charts showing trends and category breakdowns |
| Responsive Design | Works on desktop and mobile devices |
| Multi-user Support | Each user's data is isolated and secure |

### 1.3 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        JiZhang Stack                        │
├─────────────────────────────────────────────────────────────┤
│  Framework     │ Next.js 16.2.1 (App Router)                │
│  Language      │ TypeScript 5                               │
│  Database      │ SQLite via Prisma 6.3.1 + @libsql/client   │
│  Auth          │ NextAuth 5.0.0-beta.30 (Credentials)       │
│  UI Library    │ Tailwind CSS 4 + shadcn/ui components      │
│  Charts        │ Recharts                                   │
│  Icons         │ Lucide React                               │
│  Password Hash │ bcryptjs                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                            Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Login Page  │  │  Dashboard   │  │  Transactions/Categories │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│         └─────────────────┴────────────────────────┘                │
│                              │                                       │
│                    SessionProvider (NextAuth)                        │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Routes        │
                    │  (Next.js Server)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   withAuth()        │
                    │   (Auth Middleware) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Prisma ORM        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SQLite Database   │
                    │   (dev.db)          │
                    └─────────────────────┘
```

### 2.2 Directory Structure

```
jizhang-app/
├── prisma/
│   ├── schema.prisma          # Database schema definitions
│   ├── seed.ts                # Database seeding script
│   └── dev.db                 # SQLite database file
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (REST-style)
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── transactions/   # Transaction CRUD
│   │   │   ├── categories/     # Category CRUD
│   │   │   └── stats/          # Dashboard statistics
│   │   ├── (dashboard)/        # Protected routes with layout
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── layout.tsx      # Sidebar navigation
│   │   │   ├── transactions/   # Transaction pages
│   │   │   ├── categories/     # Category pages
│   │   │   └── stats/          # Statistics pages
│   │   ├── login/              # Login/Register page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── providers/          # Context providers
│   │   ├── auth-forms.tsx      # Login/register forms
│   │   ├── dashboard.tsx       # Dashboard components
│   │   ├── transactions.tsx    # Transaction UI
│   │   ├── categories.tsx      # Category UI
│   │   └── sidebar-navigation.tsx
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── prisma.ts           # Prisma singleton
│   │   ├── with-auth.ts        # Auth helper
│   │   └── utils.ts            # Utility functions
│   └── auth.ts                 # Auth exports
├── .env                        # Environment variables
├── package.json
└── CLAUDE.md                   # AI assistant guidance
```

### 2.3 Request Flow

```
User Action → Client Component → fetch() → API Route → withAuth() → Prisma → Database
                │                                              │
                │◄───────────── JSON Response ──────────────────│
                │
          UI Update
```

---

## 3. Getting Started

### 3.1 Prerequisites

- Node.js 18+ 
- npm or pnpm

### 3.2 Installation

```bash
# Clone and navigate to project
cd jizhang-app

# Install dependencies
npm install
```

### 3.3 Environment Configuration

Create or edit `.env` in the project root:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
```

> **Security Note**: In production, generate a secure `AUTH_SECRET`:
> ```bash
> openssl rand -base64 32
> ```

### 3.4 Database Setup

```bash
# Push schema to database (creates tables)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with demo data
npm run db:seed
```

### 3.5 Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 3.6 Demo Account

After running `npm run db:seed`:

- **Email**: demo@example.com
- **Password**: demo123

---

## 4. Database Guide

### 4.1 Schema Overview

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
  type      String        // "income" or "expense"
  icon      String?
  color     String?
  isDefault Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  transactions Transaction[]

  @@unique([userId, name])  // Users can't have duplicate category names
}

model Transaction {
  id         String   @id @default(cuid())
  amount     Float
  type       String        // "income" or "expense"
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

### 4.2 Relationships

```
User (1) ──────< Category (N)
  │
  │
  └────────────< Transaction (N)
                       │
                       │
              Category (1) ──────< Transaction (N)
```

- **User → Category**: One-to-many with CASCADE delete
- **User → Transaction**: One-to-many with CASCADE delete
- **Category → Transaction**: One-to-many with SET NULL on delete

### 4.3 Database Commands

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio (visual database editor)
npm run db:studio

# Seed database
npm run db:seed
```

---

## 5. Authentication

### 5.1 Overview

JiZhang uses NextAuth.js v5 with the Credentials provider and JWT sessions.

### 5.2 Configuration (`src/auth.ts`)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // Login: verify password
        // Register: create new user
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    jwt({ token, user }) { /* Add user.id to token */ },
    session({ session, token }) { /* Add token.id to session */ },
  },
});
```

### 5.3 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │  NextAuth   │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ POST /api/auth    │                   │
       │ credentials──────►│                   │
       │                   │                   │
       │                   │ Query user        │
       │                   │──────────────────►│
       │                   │                   │
       │                   │ User data         │
       │                   │◄──────────────────│
       │                   │                   │
       │                   │ Verify password   │
       │                   │ (bcrypt)          │
       │                   │                   │
       │                   │ Create JWT        │
       │◄──────────────────│                   │
       │ Session cookie    │                   │
       │                   │                   │
       │ Subsequent        │                   │
       │ requests─────────►│ Verify JWT        │
       │ with cookie       │                   │
```

### 5.4 Protecting Routes

**Server-side (API Routes)**:
```typescript
import { withAuth } from "@/lib/with-auth";

export async function GET() {
  const session = await withAuth(); // Throws 401 if unauthenticated
  // session.user.id is available
}
```

**Client-side (Components)**:
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") return <RedirectToLogin />;
  
  // session.user is available
}
```

---

## 6. API Reference

All API endpoints require authentication. Unauthenticated requests return `401 Unauthorized`.

### 6.1 Authentication

#### `POST /api/auth/[...nextauth]`

NextAuth handles all authentication through this endpoint.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Optional Name" // Only for registration
}
```

**Response**:
```json
{ "user": { "id": "...", "email": "...", "name": "..." } }
```

---

### 6.2 Transactions

#### `GET /api/transactions`

Fetch all transactions for the authenticated user.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by "income" or "expense" |
| categoryId | string | Filter by category |
| startDate | string | Filter by date (ISO 8601) |
| endDate | string | Filter by date (ISO 8601) |

**Response**:
```json
[
  {
    "id": "txn_123",
    "amount": 100.50,
    "type": "expense",
    "categoryId": "cat_456",
    "date": "2024-01-15T10:00:00Z",
    "note": "Lunch",
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

Create a new transaction.

**Request Body**:
```json
{
  "amount": 100.50,
  "type": "expense",
  "categoryId": "cat_456",
  "date": "2024-01-15",
  "note": "Optional note"
}
```

**Response**: `201 Created` with created transaction

---

#### `GET /api/transactions/[id]`

Fetch a single transaction by ID.

**Response**: `200 OK` with transaction or `404 Not Found`

---

#### `PUT /api/transactions/[id]`

Update a transaction.

**Request Body**: Same as POST

**Response**: `200 OK` with updated transaction

---

#### `DELETE /api/transactions/[id]`

Delete a transaction.

**Response**: `200 OK` with success message

---

### 6.3 Categories

#### `GET /api/categories`

Fetch all categories for the authenticated user.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by "income" or "expense" |

**Response**:
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

Create a new category.

**Request Body**:
```json
{
  "name": "Transportation",
  "type": "expense",
  "icon": "car",
  "color": "#f97316"
}
```

**Response**: `201 Created` with created category

---

#### `DELETE /api/categories/[id]`

Delete a category.

**Constraints**:
- Cannot delete categories with associated transactions
- Returns `400 Bad Request` if category has transactions

**Response**: `200 OK` or `400 Bad Request`

---

### 6.4 Statistics

#### `GET /api/stats`

Fetch dashboard statistics.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO 8601) |
| endDate | string | End date (ISO 8601) |

**Response**:
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

## 7. Frontend Components

### 7.1 Core Components

#### SessionProvider
Location: `src/components/providers/session-provider.tsx`

Wrapper for NextAuth session context.

```tsx
<SessionProvider>
  <App />
</SessionProvider>
```

---

#### SidebarNavigation
Location: `src/components/sidebar-navigation.tsx`

Main navigation layout with sidebar.

**Features**:
- Responsive sidebar (collapsible on mobile)
- Navigation links to all main pages
- User profile display
- Logout functionality

**Props**:
```typescript
interface SidebarNavigationProps {
  children: React.ReactNode;
}
```

---

### 7.2 Feature Components

#### TransactionForm & TransactionList
Location: `src/components/transactions.tsx`

**TransactionForm Props**:
```typescript
interface TransactionFormProps {
  categories: Category[];
  onSubmit: (data: TransactionData) => void;
  onCancel: () => void;
  initialData?: Transaction; // For editing
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
Location: `src/components/categories.tsx`

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

### 7.3 UI Primitives

Located in `src/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| Button | button.tsx | Styled button with variants |
| Input | input.tsx | Form input field |
| Label | label.tsx | Form label |
| Card | card.tsx | Card container |
| Table | table.tsx | Data table |
| Tabs | tabs.tsx | Tab navigation |
| Form | form.tsx | Form field components |
| Skeleton | skeleton.tsx | Loading placeholder |

---

## 8. Page Routes

### 8.1 Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `src/app/login/page.tsx` | Login/Register page |

---

### 8.2 Protected Routes

All routes under `(dashboard)/` require authentication.

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `src/app/(dashboard)/page.tsx` | Dashboard home with charts |
| `/transactions` | `src/app/(dashboard)/transactions/page.tsx` | Transaction list |
| `/transactions/new` | `src/app/(dashboard)/transactions/new/page.tsx` | New transaction form |
| `/transactions/edit/[id]` | `src/app/(dashboard)/transactions/edit/[id]/page.tsx` | Edit transaction |
| `/categories` | `src/app/(dashboard)/categories/page.tsx` | Category management |
| `/stats` | `src/app/(dashboard)/stats/page.tsx` | Statistics charts |

---

### 8.3 Auth Guard Implementation

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

## 9. Deployment

### 9.1 Build Commands

```bash
# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### 9.2 Environment Variables (Production)

```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="secure-random-string"
AUTH_URL="https://your-domain.com"
```

### 9.3 Database Migration

```bash
# Apply migrations to production database
npx prisma db push

# Generate client
npx prisma generate
```

### 9.4 Recommended Platforms

- **Vercel**: Native Next.js support
- **Render**: Node.js hosting with SQLite
- **Fly.io**: Edge deployment
- **Railway**: Easy database setup

---

## Appendix A: Development Tips

### A.1 Debugging

```bash
# View database contents
npm run db:studio

# Check ESLint issues
npm run lint -- --fix
```

### A.2 Common Issues

**Issue**: `withAuth` expects 0 arguments but got 1
**Solution**: Call `await withAuth()` without passing the request object

**Issue**: Session is null
**Solution**: Ensure the page is wrapped in `SessionProvider` and has `"use client"` directive

**Issue**: Database locked
**Solution**: Close Prisma Studio and ensure no other process is using dev.db

---

## Appendix B: API Error Responses

| Status Code | Description |
|-------------|-------------|
| 401 | Unauthorized - Missing or invalid session |
| 404 | Not Found - Resource doesn't exist |
| 400 | Bad Request - Invalid input data |
| 500 | Server Error - Internal error |

---

## Appendix C: File Naming Conventions

- **Components**: PascalCase (e.g., `TransactionForm.tsx`)
- **Utils**: kebab-case (e.g., `with-auth.ts`)
- **API Routes**: `route.ts` in directory named after endpoint
- **Pages**: `page.tsx` in directory named after route

---

## Appendix D: Available npm Scripts

```json
{
  "dev": "Start development server",
  "build": "Create production build",
  "start": "Start production server",
  "lint": "Run ESLint",
  "db:migrate": "Run Prisma migrations",
  "db:seed": "Seed database with demo data",
  "db:studio": "Open Prisma Studio"
}
```
