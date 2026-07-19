---
name: verify
description: Verification checklist for MARCADOR — static checks plus an end-to-end smoke test via the run skill.
---

# Verifying a MARCADOR change

Run these in order. Stop and fix at the first failure rather than piling up changes on
top of a broken step.

## 1. Static checks (fast, always run these)

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

All four must pass clean. `npm run build` also catches Server/Client Component
boundary mistakes that `tsc` alone won't (e.g. passing a non-server-action function as
a prop across the boundary).

## 2. End-to-end smoke test (run when the change touches UI or a user-facing flow)

Skip this only for changes confined to tests, docs, or non-runtime config. Follow
`.claude/skills/run/SKILL.md` to start the server and drive it with Playwright.
Minimum path to touch: login → dashboard renders with real KPI numbers → the specific
screen you changed. For anything touching Bet creation, exercise at least one bet per
affected `Market.type` (TEAM/PLAYER/REFEREE/GENERAL) — the conditional-field logic is
the single most fragile part of this app.

For catalog CRUD changes (League/Team/Player/Referee/Bookmaker/Market), also check the
**archive path**, not just create/edit: delete a row that has real references and
confirm it archives (badge + "Reativar") instead of blocking, and confirm the archived
row disappears from the *new*-bet dropdowns but still appears correctly in historical
dashboard/bets-list data (see decision #5 in `CLAUDE.md`).

## 3. Look at what you screenshot

The validator/typechecker checks types, not layout. Actually open the screenshot
(`Read` tool on the PNG) before calling a UI change done — a blank chart, a collapsed
bar, or a truncated table only shows up visually, never in `tsc`/`lint` output. This
bit the profit-evolution chart once already (see CLAUDE.md's Recharts gotcha) — it
typechecked and built fine while rendering completely broken.

## Known-flaky test-script patterns (not app bugs)

- `waitForSelector("text=Green")` can match a hidden `<option>` inside a filter
  `<select>` before it matches the visible status pill — resolve by using a scoped
  locator or just reading the screenshot instead of trusting the wait.
- Full page reload after a Server Action mutation should always be followed by a
  fresh `waitForSelector` on content specific to the *new* state — don't assume the
  previous screenshot's selectors still apply.
