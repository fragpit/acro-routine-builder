# Acro Program Constructor

Web app for paragliding acro pilots to build competition programs (AWT/AWQ)
under FAI Sporting Code 2025 rules. Drag tricks into runs, get real-time
validation against the rulebook, estimate technicity and bonuses, and
export the program as JSON or a markdown report.

Fully static - no backend, no database. Runs as a single-page app on
GitHub Pages.

## Features

- Trick palette with search, sort and eligibility filtering (ineligible
  tricks are badged with the reason)
- Drag-and-drop program board (`@dnd-kit`) with touch support
- Side selection (L/R) and bonus modifiers per placed trick
  (twisted / reverse / flipped, with mutual exclusions)
- Default bonuses applied automatically on trick insertion
- Live validation of all structural FAI rules (see
  [docs/trick_rules.md](docs/trick_rules.md))
- Technicity and bonus estimation per run (AWT/AWQ formulas)
- AWT mode toggle (enables AWT-specific restrictions)
- Program import/export: JSON roundtrip + human-readable markdown report
- Light/dark theme, persisted in localStorage
- Online documentation: FAI Sporting Code and generated trick reference

## Stack

React 18 + TypeScript, Vite, Tailwind CSS v4, Zustand, `@dnd-kit`,
`react-router-dom` (HashRouter), `react-markdown`. Tests with Vitest.

## Development

```sh
npm install
npm run dev        # dev server
npm test           # unit tests
npm run typecheck
npm run lint
npm run build      # production build into dist/
```

Node 22 (pinned via `.mise.toml`).

## Deployment

Pushes to `main` or `init` trigger
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds
and publishes to GitHub Pages. `vite.config.ts` sets `base` to the repo
name, HashRouter handles client-side routing on Pages.

## Project layout

See [docs/claude_plan.md](docs/claude_plan.md) for the full plan and
implementation status. Short version:

- `src/data/` - trick catalog and competition config
- `src/rules/` - validators (pure TS, one file per rule) + engine
- `src/scoring/` - technicity, bonus formulas, eligibility
- `src/io/` - JSON and markdown import/export
- `src/store/` - Zustand store with localStorage persistence
- `src/components/` - UI (Constructor, palette, cells, docs pages, etc.)
- `test_data/` - ready-to-import `.apc.json` fixtures for manual UI
  testing, one per business rule (see
  [test_data/README.md](test_data/README.md))

## Documentation

- Tricks and coefficients: <https://results.acroworldtour.com/tricks>
- AWT 2025 Results:
  <https://results.acroworldtour.com/competitions/acro-world-tour-superfinal-2025>
- FAI Sporting Code 2025 (converted from PDF):
  [docs/sporting_code_aerobatics_2025.md](docs/sporting_code_aerobatics_2025.md)
- Extracted trick rules and constraints:
  [docs/trick_rules.md](docs/trick_rules.md)
- Trick list: [docs/trick_list.md](docs/trick_list.md)
- Implementation plan: [docs/claude_plan.md](docs/claude_plan.md)
