# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> [!IMPORTANT]
> Always announce in chat that you have read this file: "Read local CLAUDE.md".

## Scope rules

- Синхро (synchro) is out of scope. Ignore `docs/sporting_code_aerobatics_2025_synchro.md` and do not add synchro-related features.
- **Never edit** `docs/sporting_code_aerobatics_2025.md` unless explicitly asked. It is the reference doc converted from the FAI PDF and must stay verbatim.
- The source of truth for trick restrictions is [docs/trick_rules.md](docs/trick_rules.md). When changing or adding a validator, cross-check with that file.
- Manual UI test fixtures live in [test_data/](test_data/), one `.arb.json` per business rule. **Whenever you add or change a validator / business rule, re-check the matching fixture (or add a new one) so the fixture set stays aligned with the code.** See [test_data/README.md](test_data/README.md) for the file-to-rule mapping.

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

Static catalog. `manoeuvres.ts` holds all 38 solo tricks with a single schema that powers everything downstream: validators, scoring, the builder UI and the generated trick reference. Each manoeuvre carries structured fields (`coefficient`, `groups`, `forbiddenConnectionTo`, `availableBonuses`, `mutualExclusions`, `awtExcluded`, etc.) plus a `description` array of bullet points lifted from the sporting code. Keep this one source of truth - do not fork trick data into UI components.

`competition-types.ts` holds shared FAI numeric constants: `DEFAULT_RUNS`, `MAX_RUNS`, `BONUS_LIMITS` (per-run twisted/reversed/flipped caps), `HIGH_COEFF_LIMIT` / `HIGH_COEFF_THRESHOLD`. Import from here instead of re-declaring - duplication of these constants has bitten us before.

### 2. Business logic (`src/rules/`, `src/scoring/`, `src/io/`) - pure TS, no React

- `rules/engine.ts` exposes `validateProgram(program) => Violation[]`. It fans out to one validator per file under `rules/validators/` and flattens the results. Validators are pure functions `(program, manoeuvres) => Violation[]`. Adding a rule = new file + registration in `engine.ts` + test in `rules/validators/__tests__/`.
- `rules/bonus-category.ts` exports `getBonusCategory(m, bonusId)` - the canonical way to classify a selected bonus as `twisted` / `reversed` / `flipped`. Use it in validators and scoring instead of re-inlining `availableBonuses.find(...)`.
- `scoring/` computes per-run technicity, AWT vs AWQ bonus formulas, and `eligibility.ts` (used by the palette to mark tricks as ignored with a reason when structural rules would forbid them).
- `io/` handles program import/export: `program-json.ts` (JSON roundtrip) and `program-markdown.ts` (human-readable report). `io/download.ts` exposes `safeFileName` / `download` helpers reused by desktop and mobile file controls.

Validation runs synchronously on every state change - the dataset is small enough that this is effectively instant.

### 3. UI (`src/components/`, `src/store/`, `src/hooks/`)

- Flat component layout except for `src/components/mobile/`, which is the adaptive mobile layer. Routing is HashRouter so Pages works without redirects. Main routes: `/` (Home), `/builder` (Builder), `/docs/rules`, `/docs/tricks`.
- `store/program-store.ts` is a Zustand store with localStorage persistence. It is the only place that mutates the `Program`. Components read selectors; validators receive a snapshot. `store/storage-keys.ts` is the single source of truth for localStorage keys (contract with every user's browser - do not change values without a migration).
- `hooks/useScoringDerived.ts` exports `useViolationHighlights` (map of cell key -> severity) and `useChoreoPenaltyPerRun` (sum of `choreoPenaltyByRun` across violations) - shared by desktop and mobile builders so both stay in sync on derived state.
- `@dnd-kit` drives drag-and-drop between palette and run cells on desktop. Touch sensors are included, but the mobile layer uses a tap-to-arm / tap-to-insert pattern instead of real DnD (easier to hit on a phone).
- `TrickInfoCard` is a side panel (not a popover) opened on cell click; it shows the trick description and the bonus checkboxes with mutual-exclusion disabling.
- Light/dark theme toggle lives in `hooks/useTheme.ts` and persists to localStorage.
- Decorative background (paraglider SVG pattern + mountain range) is in `index.css` and wired in via fixed layers in `App.tsx` with `z-index: -1`; the App root has `position: relative; z-index: 10` so those fixed layers stay behind content.

### Mobile layer (`src/components/mobile/`)

Activated via `useIsMobile()` (matchMedia `(max-width: 1023px)`) inside `Builder.tsx`. Reuses the store, validators, scoring and data unchanged - only the presentation differs. Docs pages (`RulesDocs`, `TricksDocs`) also adapt on narrow viewports via an off-canvas drawer sidebar; that logic is inline in those components, not in `mobile/`.

- `BuilderMobile.tsx` - root; owns `armedManoeuvreId` (palette arm) and `armedMoveTrickId` (move arm), which are mutually exclusive. Routes tap-on-slot to `addTrick` or `moveTrick`.
- `PaletteStrip.tsx` - `[+ Add trick]` button opening `TrickPicker`, plus up to 5 recently-used tricks kept in `localStorage` under `arb.recent-tricks`. No top-level search - search lives inside the picker.
- `TrickPicker.tsx` - full-screen bottom-sheet with all 38 tricks sorted by coefficient and an autofocus search input.
- `TrickCellMobile.tsx` - cell is a `<div role="button">` (not `<button>`) so the inner L/R side toggles can be real `<button>` elements without HTML nesting violations.
- `TrickSheet.tsx` - bottom-sheet with trick info and Move/Duplicate/Remove actions. Move re-arms the cell so it can be placed via any insert-slot (including a different run). Duplicate and Remove close the sheet.
- `RunSwiper.tsx` - scroll-snap horizontal pager. A `programmaticRef` flag suppresses `onScroll`-driven index updates during smooth scroll triggered by external navigation (e.g. violation jump), otherwise mid-scroll events would land on the wrong page.
- `RunMobile.tsx` - per-run view. Footer has two 3-column chip grids: technicity / bonus / symmetry and twisted / reversed / flipped utilization (over-limit slot counts in red).
- `ViolationsBar.tsx` - collapsed bar with violation count; tap expands; violation entries jump to the affected run.
- `MobileMenu.tsx` - right-side drawer with `MobileFileControls` (Save / Load / Export / Import as a 2-column grid), undo/redo, program settings and danger zone.
- Shared icons (undo/redo/file actions etc.) live in `src/components/icons.tsx` as inline Lucide-style SVGs and are used from both desktop and mobile code.

### Data flow

1. User drags a trick → Zustand action mutates `Program`.
2. `Builder` re-renders, calls `validateProgram(program)`.
3. `ViolationsPanel` lists issues; `TrickCell` highlights affected cells via `affectedCells: { runIndex, trickIndex }[]`.

### AWT vs AWQ

A single boolean `awtMode` on the Program. Structural differences are minimal (Misty-to-Misty ban in AWT, section 4.4). The bonus formula differs - that's handled in `scoring/bonus.ts`, not by forking the program model.

## Deploy

`.github/workflows/deploy.yml` publishes to GitHub Pages on semver tags (`v*.*.*`) - push a tag to cut a release, do not rely on main pushes. `vite.config.ts` sets `base` to the repo name. `ci.yml` runs typecheck / lint / tests on PRs.

## Coding conventions

- Keep validators independent. Each validator should work without knowing about the others.
- Do not add comments that restate what the code does. Export-level JSDoc is fine when the contract is non-obvious (see `engine.ts`).
- UI strings are in English; Russian is only in docs and this file.
- After editing `.md` files run `markdownlint-cli2 --config ~/.markdownlint-cli2.yaml <file>` (from the user's global rules).

## Workflow conventions

### "Do the task"

1. Create a new branch from `main`.
2. Make the changes.
3. Commit and push the branch.
4. Open a PR via GitHub MCP (never `gh` CLI - see user memory).
5. Add changes to CHANGELOG.md. Keep entries short - one bullet, a
   single line if possible, describing the user-visible effect. Put
   root-cause analysis and implementation detail in the PR body, not
   in CHANGELOG.

Stop there. Do **not** merge, tag, or delete the branch until explicitly asked.

### "Do the task and merge"

Do everything above, then **finalize**:

1. Merge the PR (squash).
2. Switch to the default branch (`main`) and pull.
3. Bump the release tag. The user must specify `patch`, `minor` or `major`; if they didn't, ask. Bumping rules below.
4. Delete the dev branch locally and on the remote.

### Tag bumping rules

- Tags drive deploys (`.github/workflows/deploy.yml` triggers on `v*.*.*`), so the tag IS the release. `package.json` `version` is informational only - the built bundle takes the version from the tag via `__APP_VERSION__` in `vite.config.ts`.
- Before bumping, **always** run `git tag -l --sort=-v:refname | head -5` to see the current latest tag. Do not trust `package.json` as the source of truth - it has drifted from tags before.
- Compute the next tag from the latest existing tag (not from `package.json`): `patch` → `vX.Y.Z+1`, `minor` → `vX.Y+1.0`, `major` → `vX+1.0.0`.
- Also bump `package.json` `version` to match, commit as `Bump version to X.Y.Z`, push to `main`.
- In the same `Bump version` commit, rename the `## Unreleased` heading in `CHANGELOG.md` to `## vX.Y.Z`. Do **not** add a fresh empty `## Unreleased` placeholder - when the next change lands, the PR that introduces it is responsible for re-adding the heading. The tag IS the release, so the changelog must move in lockstep - otherwise entries linger under `Unreleased` long after they shipped (this has happened and required a retroactive fixup).
- Create the tag annotated (`git tag -a vX.Y.Z -m "..."`) - lightweight tags fail here because of a forced-annotated git config. Push with `git push origin vX.Y.Z`.
- The tag push may report "Cannot create ref due to creations being restricted" - that's a protected-ref ruleset being bypassed (admin action). The tag still gets created; no action needed.

## Key documents

- [docs/claude_plan.md](docs/claude_plan.md) - current implementation plan and phase status.
- [docs/trick_rules.md](docs/trick_rules.md) - extracted per-trick restrictions (source of truth for validators).
- [docs/sporting_code_aerobatics_2025.md](docs/sporting_code_aerobatics_2025.md) - full FAI code (read-only reference).
- [docs/plan.md](docs/plan.md) - original user requirements.
