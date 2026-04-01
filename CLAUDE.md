# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Notice

**This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project Overview

记账本 (Jizhang) - A personal finance management application built with Next.js 16, React 19, and SQLite.

### Tech Stack
- **Framework**: Next.js 16.2.1 (App Router)
- **Database**: SQLite via Prisma 6.3.1 with @libsql/client
- **Auth**: NextAuth 5.0.0-beta.30 (Credentials provider with JWT sessions)
- **UI**: Tailwind CSS 4, shadcn/ui components, Lucide icons, Recharts
- **Language**: TypeScript 5

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with demo data (demo@example.com / demo123)
npm run db:studio    # Open Prisma Studio
```

## Architecture

### Authentication Flow
- Credentials-based auth with bcrypt password hashing
- JWT session strategy (not database sessions)
- Sign-in page at `/login`, redirects to `/dashboard`
- Protected routes check session via `useSession()` hook
- Session provider wraps app in `src/app/layout.tsx`

### Database Schema (Prisma)
- **User**: Email/password auth, owns all data
- **Category**: Expense/income categories with type, color, icon; user-scoped with cascade delete
- **Transaction**: Amount, type (expense/income), category, date, note; user-scoped with cascade delete

### Directory Structure
```
src/
  app/                    # Next.js App Router
    api/                  # API routes (REST-style with NextResponse)
      auth/[...nextauth]/ # NextAuth endpoints
      transactions/       # Transaction CRUD
      categories/         # Category CRUD
      stats/              # Dashboard statistics
    (dashboard)/          # Auth-protected routes with shared layout
      page.tsx            # Dashboard home with charts
      layout.tsx          # Sidebar navigation, auth guard
    transactions/         # Transaction list/new/edit pages
    categories/           # Category management
    stats/                # Statistics charts
    login/                # Login page
  components/
    ui/                   # shadcn/ui primitives (button, input, form, etc.)
    providers/            # Context providers (SessionProvider)
    auth-forms.tsx        # Login/register form components
    dashboard.tsx         # Dashboard chart components
    transactions.tsx      # Transaction list UI
    categories.tsx        # Category list UI
  lib/
    auth.ts               # NextAuth configuration
    prisma.ts             # Prisma singleton instance
    utils.ts              # cn() utility for className merging
```

### Key Patterns
- **API Routes**: Use `auth()` from `@/auth` for session verification, return `NextResponse.json()`
- **Client Components**: All interactive components use `"use client"` directive
- **Protected Routes**: Dashboard layout redirects unauthenticated users to `/login`
- **Path Aliases**: `@/*` maps to `./src/*`

### Environment
- `DATABASE_URL`: SQLite database path (e.g., `file:./dev.db`)
- `AUTH_SECRET`: Required for NextAuth JWT sessions

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
