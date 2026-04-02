# Deployment Guide

This document covers deploying JiZhang to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Environment Variables](#2-environment-variables)
3. [Platform-Specific Guides](#3-platform-specific-guides)
4. [Database in Production](#4-database-in-production)
5. [CI/CD Setup](#5-cicd-setup)
6. [Monitoring](#6-monitoring)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Preparation

- [ ] Run `npm run build` locally and verify it succeeds
- [ ] Run `npm run lint` and fix all issues
- [ ] Test all features with production-like data
- [ ] Update version in `package.json`

### 1.2 Security

- [ ] Generate new `AUTH_SECRET` (never use development secret)
- [ ] Remove any console.log statements with sensitive data
- [ ] Verify all API routes require authentication
- [ ] Check for hardcoded credentials

### 1.3 Database

- [ ] Plan production database strategy (SQLite vs PostgreSQL)
- [ ] Create backup plan
- [ ] Test migrations on staging first

---

## 2. Environment Variables

### 2.1 Required Variables

```env
# Database
DATABASE_URL="file:/path/to/production.db"

# NextAuth
AUTH_SECRET="your-production-secret-minimum-32-characters-random"
AUTH_URL="https://your-domain.com"

# Optional: Node environment
NODE_ENV="production"
```

### 2.2 Generating AUTH_SECRET

```bash
# Using openssl
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2.3 Platform Configuration

**Vercel**:
- Add variables in Settings → Environment Variables
- Mark as "Production" environment

**Render**:
- Add variables in Environment tab
- All variables are available to the service

**Fly.io**:
```bash
fly secrets set AUTH_SECRET="your-secret"
fly secrets set DATABASE_URL="file:/data/production.db"
```

---

## 3. Platform-Specific Guides

### 3.1 Vercel

**Best for**: Simplest deployment, native Next.js support

**Steps**:

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

**v0.1 Configuration**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Persistent Storage**:
Vercel doesn't support persistent SQLite. Options:
- Use Vercel Postgres
- Use external database (PlanetScale, Supabase)
- Use Vercel Blob Storage

---

### 3.2 Render

**Best for**: Full Node.js hosting with persistent disk

**Steps**:

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Build: `npm run build`
   - Start: `npm start`
4. Add environment variables
5. Add persistent disk for database

**render.yaml**:
```yaml
services:
  - type: web
    name: jizhang-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        value: file:/data/production.db
      - key: AUTH_SECRET
        generateValue: true
    disk:
      name: database
      mountPath: /data
      sizeGB: 1
```

---

### 3.3 Fly.io

**Best for**: Edge deployment, global distribution

**Steps**:

```bash
# Install flyctl
curl -L https://fly.io/sh/install.sh | sh

# Login
fly auth login

# Create app
fly launch --name jizhang-app

# Add secrets
fly secrets set AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set DATABASE_URL="file:/data/production.db"

# Add volume for persistence
fly volumes create jizhang_data --size 1

# Deploy
fly deploy
```

**fly.toml**:
```toml
app = "jizhang-app"
primary_region = "sin"

[build]
  [build.args]
    NODE_ENV = "production"

[[mounts]]
  source = "jizhang_data"
  destination = "/data"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    timeout = "2s"
```

---

### 3.4 Railway

**Best for**: Easy setup with managed database

**Steps**:

1. Connect GitHub in Railway dashboard
2. Add SQLite or PostgreSQL service
3. Link database URL to app
4. Deploy

---

### 3.5 Self-Hosted (VPS)

**Best for**: Full control, cost efficiency

**Requirements**:
- Node.js 18+
- PM2 or systemd for process management
- Nginx for reverse proxy

**Steps**:

```bash
# Clone repository
git clone https://github.com/your-org/jizhang-app.git
cd jizhang-app

# Install dependencies
npm install

# Build
npm run build

# Create .env file
cat > .env << EOF
DATABASE_URL="file:/var/www/jizhang-app/data/production.db"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="https://your-domain.com"
EOF

# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "jizhang-app" -- start
pm2 save

# Setup PM2 startup
pm2 startup
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. Database in Production

### 4.1 SQLite Considerations

**When SQLite is appropriate**:
- Low traffic applications
- Single-instance deployments
- Development/staging environments

**When to consider PostgreSQL**:
- High traffic
- Concurrent writes expected
- Need for horizontal scaling

### 4.2 Migrating to PostgreSQL

**Schema changes**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Connection string format**:
```
postgresql://user:password@host:port/database
```

**Migration**:
```bash
# Update schema.prisma
# Update DATABASE_URL

# Generate new client
npx prisma generate

# Push schema to PostgreSQL
npx prisma db push

# Or create migrations
npx prisma migrate dev --name init
```

---

### 4.3 Database Backups

**SQLite**:
```bash
# Copy database file
cp data/production.db backups/production-$(date +%Y%m%d).db

# Compress
tar -czf backups/production-$(date +%Y%m%d).db.gz data/production.db
```

**PostgreSQL**:
```bash
# Dump database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-$(date +%Y%m%d).sql
```

---

## 5. CI/CD Setup

### 5.1 GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test --if-present
      
      - name: Deploy to production
        run: |
          # Add deployment command based on platform
          # e.g., flyctl deploy, rsync, etc.
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

---

### 5.2 Vercel CI/CD

Automatic on push to connected branch:
1. Push to GitHub
2. Vercel detects change
3. Automatic build and deploy
4. Preview URL for PRs

---

## 6. Monitoring

### 6.1 Health Check Endpoint

Add to your API routes:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}
```

---

### 6.2 Uptime Monitoring

**Services**:
- UptimeRobot (free)
- Pingdom
- BetterStack

Configure to check `/api/health` every 5 minutes.

---

### 6.3 Error Tracking

**Options**:
- Sentry
- LogRocket
- Highlight.io

**Sentry Setup**:
```bash
npm install @sentry/nextjs
```

```typescript
// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  // Your config
}, {
  org: "your-org",
  project: "jizhang-app",
});
```

---

## 7. Troubleshooting

### 7.1 Build Fails in Production

**Check**:
1. Node version matches locally and in CI
2. All dependencies are in package.json
3. No local-only paths in code

---

### 7.2 Database Connection Errors

**SQLite**:
- Verify file path is absolute
- Check write permissions
- Ensure disk volume is mounted

**PostgreSQL**:
- Verify connection string format
- Check network access
- Ensure SSL is configured if required

---

### 7.3 Authentication Issues

**Symptoms**: Users can't stay logged in

**Solutions**:
1. Verify `AUTH_URL` matches your domain
2. Check `AUTH_SECRET` is set correctly
3. Ensure cookies aren't blocked (check SameSite settings)

---

### 7.4 500 Errors After Deploy

**Debug steps**:
1. Check application logs
2. Verify all environment variables
3. Test database connection
4. Check API health endpoint

---

## Appendix: Deployment Commands Summary

```bash
# Pre-deployment
npm run lint
npm run build
npm test

# Database
npx prisma generate
npx prisma migrate deploy

# Platform specific
vercel --prod                    # Vercel
git push                         # Trigger CI/CD
fly deploy                       # Fly.io
pm2 restart jizhang-app          # Self-hosted
```
