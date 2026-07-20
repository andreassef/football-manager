# MARCADOR — Sports Betting Management System

Personal tool for logging sports bets and tracking profit/ROI/rankings by
player, team, league, market, and referee. Built with Next.js (App Router),
Prisma, PostgreSQL, Auth.js, and next-intl (pt-BR default, English switchable).

## Requirements

- Node.js 22+
- A PostgreSQL 15 instance (local Docker or otherwise)

## Setup

1. Start Postgres. A `docker-compose.yaml` is included for a fresh instance:

   ```bash
   docker compose up -d
   ```

   If you already have Postgres running elsewhere, just point `.env` at it.

2. Copy `.env.example` to `.env` and fill in `POSTGRES_PRISMA_URL`/`DATABASE_URL_UNPOOLED`
   (these names match what Vercel's Neon integration auto-generates in production),
   `AUTH_SECRET` (generate with `npx auth secret`), and the seed admin credentials.

3. Install dependencies and set up the database:

   ```bash
   npm install
   npx prisma migrate dev
   npm run db:seed
   ```

   This creates the admin user (from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`)
   plus a handful of sample leagues/teams/players/referees/markets/bets so the
   dashboard has real data to show.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with the seed admin credentials.

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build/run
- `npm run lint` — ESLint
- `npm test` — Vitest unit tests
- `npm run db:seed` — re-run the seed script

## Notes on this build

- Single-user only for now — no public sign-up route (by design; see the
  product spec). The data model already carries `userId` on `Bet` so
  multi-user support won't require a schema migration later.
- Reference catalogs (leagues, teams, players, referees, bookmakers, markets)
  are shared/global data, never owned per user.
- UI language (pt-BR/English) and account currency (BRL) are independent —
  switching the language toggle never changes how money is formatted.
