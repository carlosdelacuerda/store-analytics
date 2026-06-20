# Store Analytics

A production-ready mobile-first analytics dashboard for a retail shop in Diani, Kenya.

## Stack
- Next.js 15 (App Router) · TypeScript · React · Redux Toolkit
- TailwindCSS · Prisma ORM · PostgreSQL · JWT (httpOnly cookies)
- Recharts for charts · Zod validation

## Login
| Username | Password |
|----------|----------|
| admin    | mu_babe  |

## Quick Start (Local)

### 1. Clone & install
```bash
git clone <your-repo>
cd store-analytics
npm install --legacy-peer-deps
```

### 2. Environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/store_analytics"
JWT_SECRET="generate-with-openssl-rand-base64-32"
```

### 3. Create database & run migrations
```bash
createdb store_analytics          # or create via pgAdmin
npx prisma migrate deploy
npx prisma db seed                # creates admin user
```

### 4. Start dev server
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel + Neon (recommended free tier)

### 1. Create a Neon database
- Go to https://neon.tech → New Project
- Copy the **DATABASE_URL** connection string

### 2. Push to GitHub
```bash
git init && git add . && git commit -m "init"
gh repo create store-analytics --public --push
```

### 3. Deploy on Vercel
- Go to https://vercel.com → Add New Project → Import your repo
- Add environment variables:
  - `DATABASE_URL` — your Neon connection string
  - `JWT_SECRET` — run `openssl rand -base64 32` and paste the output
- Click **Deploy**

### 4. Run migrations on production
```bash
npx prisma migrate deploy       # using production DATABASE_URL
npx prisma db seed              # seed admin user
```
Or use Vercel CLI:
```bash
vercel env pull .env.production.local
npx dotenv -e .env.production.local -- prisma migrate deploy
npx dotenv -e .env.production.local -- prisma db seed
```

---

## Features
- **Daily Entry** — touch-friendly counters for passers / visitors / buyers, sale modal with amount + items, weather + day type context, notes & missing products
- **Statistics** — revenue, funnel analysis, best/worst days, weekly analysis, weather & day type breakdowns, line & bar charts
- **Comments** — filter notes by today / 7d / 30d / all time
- **Improvements** — CRUD for store changes with automatic 7d / 30d before-after impact analysis
- **Export** — CSV export for daily records, sales, and improvements
- **Auth** — secure JWT httpOnly cookie sessions, Remember Me (30 days)

## Project Structure
```
src/
  app/
    api/              — API routes (auth, daily-records, sales, improvements, statistics, export)
    (app)/            — Protected app pages (daily, statistics, comments, improvements)
    login/            — Login page
  components/         — Shared UI components
  lib/                — Prisma, auth, statistics, CSV, date helpers
  store/              — Redux Toolkit store + slices
  types/              — Shared TypeScript types
prisma/
  schema.prisma       — Data models
  migrations/         — SQL migrations
  seed.ts             — Admin user seed
```
