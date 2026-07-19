---
name: run
description: Start MARCADOR's Next.js dev server and drive it with Playwright to prove a change works.
---

# Running MARCADOR locally

This is a Next.js App Router app. "Running" it means starting the dev server and
driving a headless browser against it — there is no other entrypoint.

## 1. Start the dev server

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill   # free the port if a stale server is running
(nohup npm run dev > /tmp/marcador-dev.log 2>&1 &)
for i in $(seq 1 40); do curl -sf http://localhost:3000 >/dev/null 2>&1 && echo READY && break; sleep 1; done
```

Don't `sleep N` blindly — poll the port. If it never becomes ready, check
`/tmp/marcador-dev.log` — a Prisma client mismatch or a missing `.env` are the usual
causes.

**Stop it** the same way (`lsof -ti:3000 -sTCP:LISTEN | xargs -r kill`) before
relaunching, or you'll hit `EADDRINUSE`.

If pages 500 with `Cannot read properties of undefined (reading 'modules')`, that's the
Auth.js/Edge-bundle gotcha (see root `CLAUDE.md`) — not a fresh bug, don't re-diagnose
it from scratch.

## 2. Log in

Seed admin credentials (from `.env`, defaults shown):
- Email: `admin@marcador.local`
- Password: `admin123`

If login fails, the DB may not be seeded yet: `npm run db:seed` (or `/db-fresh` for a
full reset+reseed).

## 3. Drive it with Playwright

`chromium-cli` is not installed in this environment — use the `playwright` package
directly (already a devDependency). Node's ESM resolver needs the script to live
*inside* the project (not `/tmp` or the session scratchpad), or `import { chromium }
from "playwright"` fails to resolve. Write throwaway scripts as `_verify.mjs` at the
repo root and delete them when done (they're gitignored via the `_*` pattern — verify
with `git status` before finishing).

Representative smoke flow (adapt the interaction to whatever you're actually
verifying):

```js
import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "admin@marcador.local");
await page.fill('input[name="password"]', "admin123");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await page.waitForSelector("text=Árbitros por faltas");
await page.screenshot({ path: "/absolute/path/dashboard.png", fullPage: true });

console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
```

Run with `node _verify.mjs` from the repo root (not from a scratchpad path).

## Gotchas specific to this app

- **Bar/chart components need `isAnimationActive={false}`** (Recharts) — without it, a
  screenshot taken right after navigation can catch bars frozen at ~0 height due to a
  post-mount layout shift. Don't mistake this for a real data bug — check
  `CLAUDE.md`'s Recharts gotcha first.
- **The dashboard reflects real `Bet` rows**, not seed data — if you (or the user) have
  been clicking around and deleting things, KPI numbers won't match `prisma/seed.ts`.
  Use `/db-fresh` for a clean, predictable baseline before asserting on specific numbers.
- **Locale/theme toggles** are plain buttons with text content (`PT-BR`/`EN`,
  `Claro`/`Escuro`) — `page.click("text=Claro")` etc. works directly, no test-ids needed.
- Selects with translated option text (e.g. the bet-status filter) can collide with
  identical text elsewhere on the page (a table cell showing "Green") when you
  `waitForSelector("text=...")` — prefer a scoped locator (`page.locator("select[name=status]")`)
  over a bare text selector when the string might also appear in a `<option>`.
