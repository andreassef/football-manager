@AGENTS.md

# MARCADOR — Sports Betting Management System

## What this is

A personal tool to log sports bets and track profit/ROI/rankings by player, team,
league, market, and referee. Single-user today, but the data model is multi-tenant-ready
(see decisions below). UI is bilingual (pt-BR default, English switchable); currency is
always BRL regardless of UI language. Full original spec: `~/Downloads/prompt-sistema-apostas.md`
(not part of this repo).

## Stack

TypeScript, Next.js App Router, Prisma + PostgreSQL, Auth.js (Credentials + bcrypt, JWT),
next-intl, next-themes, Zod, Recharts, Vitest. Hand-rolled Tailwind UI primitives in
`src/components/ui/` (not shadcn/ui — see Deviations below).

## Directory map

- `prisma/schema.prisma` — data model; `prisma/seed.ts` — seed script
- `src/schemas/` — Zod schemas, shared by Server Actions and client forms
- `src/actions/` — Server Actions, one file per domain (bets, countries, leagues, teams, players, referees, bookmakers, markets)
- `src/lib/` — `prisma.ts` (client singleton), `auth.ts`/`auth.config.ts` (see gotcha below), `stats.ts` (dashboard aggregation), `calculations.ts` (profit/roi, unit-tested), `refereed-match.ts` (bet-creation helper)
- `src/components/` — `ui/` primitives, `catalog/` (generic `simple-catalog.tsx` used by every catalog level + `breadcrumb.tsx` + `league-teams.tsx` for the league↔team association UI), `bets/`, `dashboard/`, `layout/`
- `src/messages/{pt-BR,en}.json` — i18n strings
- `src/app/(app)/` — authenticated routes (dashboard, bets, catalog, bankroll); `src/app/login/`, `src/middleware.ts` — auth gate
- `src/app/(app)/catalog/countries/[countryId]/leagues/[leagueId]/teams/[teamId]/` — the
  País → Liga → Time → Jogador drill-down (see decision below); `catalog/teams/` and
  `catalog/bookmakers|markets/` remain flat, unnested pages

## Confirmed architecture decisions

1. **Shared vs owned data**: Country/League/Team/Player/Referee/Bookmaker/Market/RefereedMatch
   are shared/global (no `userId`), forever — even in a future multi-user version. Only `Bet`
   is owned per user.
2. **RefereedMatch dedup key** includes `totalFouls`: `@@unique([refereeId, homeTeamId, awayTeamId, eventDate, totalFouls])`.
   A different fouls count for the "same" match is a *different* match record, not a
   conflict to resolve — confirmed product decision, not an oversight.
3. **No player-team history is kept.** `Player.currentTeamId` is the only affiliation —
   updating it (via the Players catalog edit form) just repoints the FK, overwriting the
   old value. There is deliberately no spell/history table and no per-bet snapshot of
   "which team the player was on at the time" — a past reversal of an earlier design
   (see git history if curious); the product decision is that this tool never needs to
   report a player's historical team as of a past bet's date.
4. **Market.type is locked** once any Bet references that market (enforced in
   `updateMarket`, `src/actions/markets.ts`) — prevents old bets' populated target fields
   from becoming inconsistent with the market's current type.
5. **Archive, never hard-delete, a referenced catalog row.** All 7 catalogs
   (Country/League/Team/Player/Referee/Bookmaker/Market) have an `active` boolean. Deleting
   a catalog entry that's still referenced sets `active: false` instead of blocking or
   cascading — it disappears from "new bet" pickers but every existing Bet/dashboard figure
   that references it is untouched (dashboard and bet history queries never filter by
   `active`; only the *new-selection* dropdowns in `src/app/(app)/bets/new` and
   `.../bets/[id]/edit` do, and the edit page always re-includes the bet's own
   already-selected values even if archived). Reactivating just flips the flag back.
6. **Team↔League is many-to-many, not a single "home league".** A club plays its national
   league and a continental cup at once (e.g. Vasco da Gama: Brasileirão Série A *and*
   Sul-Americana), so `Team.leagues`/`League.teams` is an implicit Prisma m2m — opening any
   one of a team's leagues in the catalog (`src/components/catalog/league-teams.tsx`, at
   `catalog/countries/[countryId]/leagues/[leagueId]`) shows that team. There is no
   "primary league" concept and no exclusivity constraint.
7. **Country groups League and Referee only** (`League.countryId`, `Referee.countryId`),
   not Team or Player — a team's/player's country is only ever implied transitively through
   their league/team, never stored directly. A Referee's country is their *primary* region
   only — `RefereedMatch.league` (not the referee's country) is what carries the real venue,
   so a referee can still officiate matches outside their home region without any conflict.
8. **Bankroll/unit-staking lives on `User`** (`initialBankroll`, `initialUnits`,
   `defaultStakeUnits`), edited at `src/app/(app)/bankroll`. `unitValue = initialBankroll /
   initialUnits`. The dashboard's "Banca atual"/"Unidades atuais" always reflect **all-time**
   profit (`src/lib/stats.ts`'s `getDashboardStats`, computed from the unscoped `allBets`,
   not the overall/year/month-scoped list) — bankroll is a running total, not a period
   figure. New bets default `Stake` to `defaultStakeUnits × unitValue`
   (`src/app/(app)/bets/new`); editing an existing bet keeps its own stake and only shows
   the unit-equivalent hint.
9. **Catalog navigation is a real drill-down, not flat tabs**: País → Liga → Time →
   Jogador (`catalog/countries/[countryId]/leagues/[leagueId]/teams/[teamId]`), breadcrumb
   at each level. A "Sem país" pseudo-bucket (`countryId` route segment literally `none`,
   queried as `countryId: null`) keeps orphaned Leagues/Referees reachable. `Times` stays
   as its own flat top-level tab on purpose — a Team can belong to zero/one/many Leagues
   (decision 6), so a brand-new or not-yet-assigned team needs a home outside the
   hierarchy; Countries/Referees/Players have no such gap and were folded entirely into
   the drill-down (no more flat `/catalog/leagues`, `/catalog/players`, `/catalog/referees`
   routes). Every level reuses the *exact same* Server Actions as before
   (`src/actions/{leagues,referees,players}.ts`) — this was a pure routing/presentation
   restructuring, no backend changes.

## Conscious deviations from the original spec

- **Prisma pinned to v6** (`prisma@6`, `@prisma/client@6`), not v7 — v7 requires a driver
  adapter (`prisma.config.ts` + `@prisma/adapter-*`) instead of a plain `url` in
  `schema.prisma`. Revisit only if there's a real reason to upgrade.
- **No locale-prefixed routing** (`/pt-BR/...`, `/en/...`). Locale is a cookie
  (`MARCADOR_LOCALE`), read in `src/i18n/request.ts` — simpler for a single-user
  authenticated tool where shareable per-locale URLs don't matter.
- **Aggregations computed in application code** (`src/lib/stats.ts`), not raw SQL —
  fetch the user's bets with relations, reduce in JS. Fine at personal-tool scale;
  revisit with raw SQL/materialized views only if data volume ever makes it slow.
- **Hand-rolled Tailwind UI components**, not the shadcn/ui CLI — faster to build
  consistently for this project's specific visual language (see the design mockup
  artifact from the original planning session for the intended look).

## Gotchas already hit (don't rediscover these)

- **You cannot pass a plain function as a prop from a Server Component into a Client
  Component** — only Server Actions or serializable data cross that boundary. Hit this
  building `SimpleCatalogClient`'s row-links: a `detailHref={(item) => \`...${item.id}\`}`
  prop passed from a page's Server Component crashes at render with "Functions cannot be
  passed directly to Client Components". Fix: pass a plain string
  (`detailHrefBase="/catalog/countries"`) and have the Client Component build the URL
  itself (`${detailHrefBase}/${item.id}`) — never a callback.
- **NextAuth + Edge middleware**: `middleware.ts` must import `auth` from
  `src/lib/auth-edge.ts` (uses `authConfig` from `auth.config.ts`, no providers), never
  from `src/lib/auth.ts` (has the Credentials provider + `bcrypt`, a native Node addon).
  Importing bcrypt into the Edge bundle crashes every request with a cryptic
  `Cannot read properties of undefined (reading 'modules')` error.
- **Recharts `YAxis`**: the `hide` prop breaks domain computation in the installed
  version (bars collapse to ~0 height while the axis itself still looks fine if visible).
  Use a real `tick`/`axisLine` styled to blend in instead of `hide`. Separately, `<Bar>`
  needs `isAnimationActive={false}` — without it, a layout shift shortly after mount
  (other client components hydrating) can freeze the enter animation near its start
  frame, so bars render at ~0 height even with a correct domain. Both fixes are already
  in `src/components/dashboard/profit-chart.tsx`.
- **`<input type="number">` min/step mismatch**: `min="0.01" step="1"` rejects a value
  like `100` (browser-native validation, not a bug in our code) because 100 isn't
  `min + n*step`. Match `step` to the field's actual precision (money fields use
  `step="0.01"`).
- **Currency formatting is independent of UI language.** `formatCurrency()` in
  `src/lib/currency.ts` always formats BRL/pt-BR-style regardless of the active UI
  locale — don't thread the UI `locale` into it (that was a real bug: KPI cards
  reformatted to US-style grouping when the language toggle switched to English).
- **`prisma migrate dev` refuses to run at all** (even with `--create-only`, even piping
  `yes`) whenever it detects data loss (dropping a non-empty column/table), because the
  CLI is non-interactive in this environment. Work around it by hand: generate the SQL
  with `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel
  prisma/schema.prisma --script`, hand-edit it (e.g. to insert a backfill step before a
  column drop), save it as `prisma/migrations/<timestamp>_<name>/migration.sql`, then
  apply with `prisma migrate deploy` (which doesn't prompt).
- **`prisma/seed.ts`'s bet loop uses `upsert` on a stable `seed-bet-<index>` id**, not
  `create` — re-running the seed used to append 16 duplicate bets every time (bit us once
  for real: a migration test run silently doubled a live local dataset). If you add new
  seed bets, keep them behind a stable id the same way.

## Local dev environment

- Postgres runs in a Docker container (not managed by this repo's `docker-compose.yaml`
  unless you choose to use it) — connection details are in `.env` (gitignored).
- Seed admin login: `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `.env`
  (`admin@marcador.local` / `admin123` by default).
- `npm run db:seed` re-runs the seed script (upserts catalogs, does *not* touch bets
  beyond what's in `prisma/seed.ts`). Use `/db-fresh` to fully reset+reseed.
- See `.claude/skills/run/SKILL.md` for how to start the dev server and smoke-test it,
  and `.claude/skills/verify/SKILL.md` for the full verification checklist.
