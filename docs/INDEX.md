# JiZhang Documentation Index

Welcome to the JiZhang (记账本) documentation. This index provides links to all documentation files.

## Quick Start

New to JiZhang? Start here:

1. **[README.md](README.md)** - Overview, features, and getting started
2. **[Getting Started](README.md#3-getting-started)** - Installation and setup guide
3. **[Demo Account](README.md#36-demo-account)** - Try the app with demo data

---

## Documentation Structure

### Core Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview, features, quick start, API summary |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deep dive into application architecture, data flow, security |
| [API.md](API.md) | Complete API reference and development guide |
| [COMPONENTS.md](COMPONENTS.md) | Frontend component documentation |
| [DATABASE.md](DATABASE.md) | Database schema, Prisma operations, migrations |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |

---

## By Topic

### For New Users

1. **[README.md](README.md)** - Understand what JiZhang does
2. **[Getting Started](README.md#3-getting-started)** - Install and run locally
3. **[Pages Overview](README.md#33-pages)** - Learn the main features

---

### For Developers

**Understanding the Codebase**:
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - High-level architecture
2. **[ARCHITECTURE.md#4-component-hierarchy](ARCHITECTURE.md#4-component-hierarchy)** - Component tree
3. **[ARCHITECTURE.md#3-data-flow](ARCHITECTURE.md#3-data-flow)** - How data moves

**Working with APIs**:
1. **[API.md](API.md)** - API design and examples
2. **[API.md#6-api-reference](API.md#6-api-reference)** - Endpoint documentation
3. **[API.md#7-api-examples](API.md#7-api-examples)** - Complete code examples

**Working with Components**:
1. **[COMPONENTS.md](COMPONENTS.md)** - Component architecture
2. **[COMPONENTS.md#2-ui-primitives](COMPONENTS.md#2-ui-primitives)** - UI components
3. **[COMPONENTS.md#7-creating-new-components](COMPONENTS.md#7-creating-new-components)** - Create new components

**Working with Database**:
1. **[DATABASE.md](DATABASE.md)** - Database design
2. **[DATABASE.md#4-common-operations](DATABASE.md#4-common-operations)** - CRUD operations
3. **[DATABASE.md#6-migrations](DATABASE.md#6-migrations)** - Schema changes

---

### For DevOps / Deployment

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
2. **[DEPLOYMENT.md#3-platform-specific-guides](DEPLOYMENT.md#3-platform-specific-guides)** - Platform guides
3. **[DEPLOYMENT.md#5-cicd-setup](DEPLOYMENT.md#5-cicd-setup)** - CI/CD configuration
4. **[DEPLOYMENT.md#6-monitoring](DEPLOYMENT.md#6-monitoring)** - Monitoring setup

---

## Quick Reference

### Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

---

### API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/[...nextauth]` | POST | Authentication |
| `/api/transactions` | GET, POST | Transaction CRUD |
| `/api/transactions/[id]` | GET, PUT, DELETE | Single transaction |
| `/api/categories` | GET, POST | Category CRUD |
| `/api/categories/[id]` | DELETE | Delete category |
| `/api/stats` | GET | Statistics |

---

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"
```

---

### File Locations

```
src/
├── app/api/          # API routes
├── app/(dashboard)/  # Protected pages
├── components/       # React components
└── lib/              # Utilities
```

---

## Common Tasks

### Add a New API Endpoint

See: **[API.md#2-creating-new-endpoints](API.md#2-creating-new-endpoints)**

### Create a New Component

See: **[COMPONENTS.md#7-creating-new-components](COMPONENTS.md#7-creating-new-components)**

### Modify Database Schema

See: **[DATABASE.md#6-migrations](DATABASE.md#6-migrations)**

### Deploy to Production

See: **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## Need Help?

1. Check the **[README.md](README.md)** for common questions
2. Review **[ARCHITECTURE.md](ARCHITECTURE.md)** for system understanding
3. See **[DATABASE.md#9-troubleshooting](DATABASE.md#9-troubleshooting)** for database issues
4. Check **[DEPLOYMENT.md#7-troubleshooting](DEPLOYMENT.md#7-troubleshooting)** for deployment issues

---

## Document Changelog

| Date | Document | Change |
|------|----------|--------|
| 2026-04-02 | All | Initial documentation creation |

---

## Contributing

When adding new features, please:

1. Update relevant documentation
2. Add API documentation in API.md
3. Document new components in COMPONENTS.md
4. Update DATABASE.md for schema changes
