---
description: Reset the local MARCADOR database and re-seed it with the sample dataset.
---

Reset the local dev database to a clean, predictable state and reseed it:

1. Run `npx prisma migrate reset --force --skip-generate` from the project root. This
   drops and recreates all tables per `prisma/schema.prisma` and its migrations, then
   runs `prisma/seed.ts` automatically (configured via the `prisma.seed` field in
   `package.json`) — no separate seed step needed.
2. Confirm it printed the seeded admin line (`Seeded admin user: ...`) and the bet count
   (`Seeded N sample bets.`) with no errors.
3. Report the seed admin credentials back (from `.env`: `SEED_ADMIN_EMAIL`/
   `SEED_ADMIN_PASSWORD`, defaults `admin@marcador.local` / `admin123`) so the user can
   log back in immediately.

This is destructive to whatever is currently in the local database (including any bets
or catalog entries added through manual testing in the browser) — that's the point of
the command, so proceed without asking for extra confirmation. It only ever touches the
local dev Postgres instance pointed to by `DATABASE_URL` in `.env`, never a shared or
production database.
