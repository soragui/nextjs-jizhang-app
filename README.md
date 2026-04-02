# JiZhang App (记账本)

> [中文版本](README.zh.md)

A modern personal finance management application built with Next.js 16, featuring user authentication, transaction tracking, category management, and data visualization.

## ✨ Features

- 🔐 **User Authentication** - Register/Login with NextAuth.js v5
- 💰 **Transaction Tracking** - Record income and expenses
- 📊 **Category Management** - Custom income/expense categories
- 📈 **Data Visualization** - Charts showing trends and category breakdowns
- 🎨 **Modern UI** - Tailwind CSS and shadcn/ui components
- 📱 **Responsive Design** - Desktop and mobile support

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth**: NextAuth.js v5 (Credentials Provider)
- **Database**: SQLite + Prisma ORM 7
- **Charts**: Recharts
- **UI**: Tailwind CSS v4 + Custom Components
- **Icons**: Lucide React

## 📦 Project Structure

```
jizhang-app/
├── prisma/
│   ├── schema.prisma          # Database schema definitions
│   ├── seed.ts                # Database seeding script
│   └── dev.db                 # SQLite database file
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth API
│   │   │   ├── transactions/  # Transaction CRUD API
│   │   │   ├── categories/    # Category CRUD API
│   │   │   └── stats/         # Statistics API
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── login/             # Login/Register page
│   │   ├── transactions/      # Transaction management
│   │   ├── categories/        # Category management
│   │   └── stats/             # Statistics charts
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   └── providers/         # React Context providers
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       ├── auth.ts            # Auth configuration
│       └── utils.ts           # Utility functions
├── .env                       # Environment variables
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
```

> ⚠️ In production, change `AUTH_SECRET` to a secure random string

### 3. Initialize Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with demo user and default categories
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 👤 Demo Account

The seed script creates a demo account:

- **Email**: demo@example.com
- **Password**: demo123

## 📱 Pages

### Login/Register (`/login`)
- Email/password login
- New users can register

### Dashboard (`/dashboard`)
- Monthly income/expenses/balance
- Daily transaction trends (line chart)
- Expense category breakdown (pie chart)

### Transactions (`/transactions`)
- View all transactions
- Filter by income/expense
- Edit/delete transactions
- Add new transactions

### Categories (`/categories`)
- View income/expense categories
- Add custom categories
- Delete unused categories

### Statistics (`/stats`)
- Detailed income/expense analysis
- Category breakdown visualization
- Daily comparison (bar chart)

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Database commands
npm run db:migrate    # Create and apply migrations
npm run db:seed       # Run seed script
npm run db:studio     # Open Prisma Studio
```

## 📊 Database Schema

### User
- id, email, name, password
- createdAt, updatedAt

### Category
- id, name, type (INCOME/EXPENSE)
- icon, color, userId
- createdAt, updatedAt

### Transaction
- id, amount, type (INCOME/EXPENSE)
- categoryId, date, note, userId
- createdAt, updatedAt

## 🔒 Security Notes

1. Change `AUTH_SECRET` in production
2. Passwords are hashed with bcrypt
3. All APIs require authentication
4. Users can only access their own data

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | POST | Authentication |
| `/api/transactions` | GET, POST | List/Create transactions |
| `/api/transactions/[id]` | GET, PUT, DELETE | Single transaction operations |
| `/api/categories` | GET, POST | List/Create categories |
| `/api/categories/[id]` | DELETE | Delete category |
| `/api/stats` | GET | Statistics |

## 🎨 UI Components

Custom components included:
- Button, Input, Label
- Card, Table, Tabs
- Form components

All components use Tailwind CSS and support dark mode.

## 📄 License

MIT
