# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

⚠️ Супер важное правило! Всегда пиши в чат сообщение, что прочитал этот файл. "Прочитал локальный CLAUDE.md"

## Scope rules

- Синхро (synchro) is out of scope. Ignore `docs/sporting_code_aerobatics_2025_synchro.md` and do not add synchro-related features.
- **Never edit** `docs/sporting_code_aerobatics_2025.md` unless explicitly asked. It is the reference doc converted from the FAI PDF and must stay verbatim.
- The source of truth for trick restrictions is [docs/trick_rules.md](docs/trick_rules.md). When changing or adding a validator, cross-check with that file.
- Manual UI test fixtures live in [test_data/](test_data/), one `.apc.json` per business rule. **Whenever you add or change a validator / business rule, re-check the matching fixture (or add a new one) so the fixture set stays aligned with the code.** See [test_data/README.md](test_data/README.md) for the file-to-rule mapping.

## Commands

- `npm run dev` - Vite dev server
- `npm run build` - typecheck (`tsc -b`) then production build into `dist/`
- `npm run typecheck` - `tsc -b --noEmit`
- `npm run lint` - ESLint flat config (`eslint.config.js`)
- `npm test` - run Vitest once
- `npm run test:watch` - Vitest in watch mode
- Run a single test file: `npx vitest run src/rules/validators/__tests__/high-coeff.test.ts`
- Run tests matching a name: `npx vitest run -t "forbidden connection"`

Node 22 is pinned via `.mise.toml`.

## Architecture

Single-page React app, fully static, deployed to GitHub Pages. No backend, no persistence beyond `localStorage`. Three orthogonal layers:

### 1. Data (`src/data/`)

Static catalog. `manoeuvres.ts` holds all 38 solo tricks with a single schema that powers everything downstream: validators, scoring, the constructor UI and the generated trick reference. Each manoeuvre carries structured fields (`coefficient`, `groups`, `forbiddenConnectionTo`, `availableBonuses`, `mutualExclusions`, `awtExcluded`, etc.) plus a `description` array of bullet points lifted from the sporting code. Keep this one source of truth - do not fork trick data into UI components.

### 2. Business logic (`src/rules/`, `src/scoring/`, `src/io/`) - pure TS, no React

- `rules/engine.ts` exposes `validateProgram(program) => Violation[]`. It fans out to one validator per file under `rules/validators/` and flattens the results. Validators are pure functions `(program, manoeuvres) => Violation[]`. Adding a rule = new file + registration in `engine.ts` + test in `rules/validators/__tests__/`.
- `scoring/` computes per-run technicity, AWT vs AWQ bonus formulas, and `eligibility.ts` (used by the palette to mark tricks as ignored with a reason when structural rules would forbid them).
- `io/` handles program import/export: `program-json.ts` (JSON roundtrip) and `program-markdown.ts` (human-readable report).

Validation runs synchronously on every state change - the dataset is small enough that this is effectively instant.

### 3. UI (`src/components/`, `src/store/`, `src/hooks/`)

- Flat component layout (no nested folders). Routing is HashRouter so Pages works without redirects. Main routes: `/` (Home), `/constructor` (Constructor), `/docs/rules`, `/docs/tricks`.
- `store/program-store.ts` is a Zustand store with localStorage persistence. It is the only place that mutates the `Program`. Components read selectors; validators receive a snapshot.
- `@dnd-kit` drives drag-and-drop between palette and run cells. Touch sensors are included from the start.
- `TrickInfoCard` is a side panel (not a popover) opened on cell click; it shows the trick description and the bonus checkboxes with mutual-exclusion disabling.
- Light/dark theme toggle lives in `hooks/useTheme.ts` and persists to localStorage.
- Decorative background (paraglider SVG pattern + mountain range) is in `index.css` and wired in via fixed layers in `App.tsx` with `z-index: -1`; the App root has `position: relative; z-index: 10` so those fixed layers stay behind content.

### Data flow

1. User drags a trick → Zustand action mutates `Program`.
2. `Constructor` re-renders, calls `validateProgram(program)`.
3. `ViolationsPanel` lists issues; `TrickCell` highlights affected cells via `affectedCells: { runIndex, trickIndex }[]`.

### AWT vs AWQ

A single boolean `awtMode` on the Program. Structural differences are minimal (Misty-to-Misty ban in AWT, section 4.4). The bonus formula differs - that's handled in `scoring/bonus.ts`, not by forking the program model.

## Deploy

`.github/workflows/deploy.yml` publishes to GitHub Pages on push to `main` or `init`. `vite.config.ts` sets `base` to the repo name. `ci.yml` runs typecheck / lint / tests on PRs.

## Coding conventions

- Keep validators independent. Each validator should work without knowing about the others.
- Do not add comments that restate what the code does. Export-level JSDoc is fine when the contract is non-obvious (see `engine.ts`).
- UI strings are in English; Russian is only in docs and this file.
- After editing `.md` files run `markdownlint-cli2 --config ~/.markdownlint-cli2.yaml <file>` (from the user's global rules).

## Key documents

- [docs/claude_plan.md](docs/claude_plan.md) - current implementation plan and phase status.
- [docs/trick_rules.md](docs/trick_rules.md) - extracted per-trick restrictions (source of truth for validators).
- [docs/sporting_code_aerobatics_2025.md](docs/sporting_code_aerobatics_2025.md) - full FAI code (read-only reference).
- [docs/plan.md](docs/plan.md) - original user requirements.
