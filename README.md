# Acro Routine Builder

> This app is 100% vibe-coded: no human-written commits have been applied.

Web app for paragliding acro pilots to build competition programs (AWT/AWQ)
under FAI Sporting Code 2025 rules. Drag tricks into runs, get real-time
validation against the rulebook, estimate technicity and bonuses, and
export the program as JSON or a markdown report.

Fully static - no backend, no database. Runs as a single-page app on
GitHub Pages.

Live app: <https://fragpit.github.io/acro-routine-builder/>

## Features

- Trick palette with search, sort and eligibility filtering (ineligible
  tricks are badged with the reason)
- Drag-and-drop program board (`@dnd-kit`) with mouse, touch and stylus support
- One-shot copy mode for touch-capable devices using the desktop layout
- Collapsible desktop trick palette with browser-persisted state
- Full-screen control with an iPad standalone-PWA fallback
- Board-wide aligned name rows when any desktop trick name is severely truncated
- Side selection (L/R) and bonus modifiers per placed trick
  (twisted / reverse / flipped, with mutual exclusions; flipped bonuses disable
  all other bonuses on that trick)
- Trick-type technical mark overrides saved with the program and reflected
  in the displayed average T and trick cards while the Tq default stays fixed
- Default bonuses applied automatically on trick insertion
- Duplicate a complete run into another run, with confirmation before
  overwriting non-empty targets
- Live validation of all structural FAI rules (see
  [docs/trick_rules.md](docs/trick_rules.md))
- Bonus-limit warnings highlight only the extra twisted, reversed or flipped
  tricks that are not scored
- Repetition penalties distinguish regular and reverse variants while
  still flagging repeated reverse variants
- Technicity and bonus estimation per run (AWT/AWQ formulas)
- Manually editable technical and choreography quality corrections
- Program total with average T and a cumulative change indicator next to
  it; click the total to pin a comparison baseline. Mobile shows mode/runs
  above a desktop-style Score and Avg T row.
- AWT mode toggle (enables AWT-specific restrictions)
- Program import/export: JSON roundtrip + human-readable markdown report
- Free-form program notes editor (right-side panel on desktop, bottom-sheet
  on mobile); imports from acroworldtour.com pre-fill it with the per-run
  judges' notes
- Import a pilot's routine from a past acroworldtour.com competition
  (bundled snapshot, refreshed via `npm run snapshot:awt`)
- Share a routine via a short URL backed by a Cloudflare Worker
  (links expire after 7 days). `Import link` accepts the URL or
  bare id from clipboard / manual paste - useful inside the
  installed PWA on iOS, where chat-app links always open in Safari.
- Light/dark theme, persisted in localStorage
- Installed PWA update prompts when a newer tagged release is published
- Online documentation: FAI Sporting Code, downloadable official PDF and
  generated trick reference
- Curated News page for user-facing updates, with an unread indicator
  for returning users
- **Mobile UI**: on viewports below 1024px the builder switches to a
  touch-first layout - swipe between runs, tap-to-insert palette with
  a full-screen trick picker, compact per-row insert controls, recent
  tricks, handle-based reorder with edge auto-scroll, a viewport-fitted
  trick stack, reliable full-height rendering in installed iOS PWAs,
  bottom-sheet for trick details, and a right-side drawer menu
  for Save/Load/Export/settings
  (shares the same Zustand store as the desktop view, so state is
  identical across layouts)

## Stack

React 18 + TypeScript, Vite, Tailwind CSS v4, Zustand, `@dnd-kit`,
`react-router-dom` (BrowserRouter), `react-markdown`. Tests with Vitest.

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

Releases are tag-driven. Push a semver tag (`vX.Y.Z`) and
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and
publishes to GitHub Pages:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The tag name is injected into the bundle as the app version, shown in
the UI and written to `app-version.json` so installed PWAs can show a
low-key update notice beside the Home page version. `vite.config.ts`
sets `base` to the repo subpath in production builds; BrowserRouter
handles client-side routing, and a `404.html` (a build-time copy of
`index.html`) lets Pages resolve deep-link refreshes back into the SPA.

Dev previews can be published through Cloudflare Pages without changing the
GitHub Pages release flow. Connect the repository in Cloudflare Pages and use:

- Install command: `npm ci`
- Build command: `npm run build:cloudflare`
- Build output directory: `dist`
- Production branch: `main`
- Preview deployments: enabled for pull requests

`npm run build:cloudflare` sets `VITE_BASE_PATH=/` so the same Vite app works
from a Cloudflare Pages root URL. GitHub Pages builds keep the default
`/acro-routine-builder/` base path. `public/_redirects` routes direct deep-link
requests back to `index.html` for the SPA on Cloudflare Pages.
Preview deployment cleanup runs from
[.github/workflows/cleanup-cloudflare-pages.yml](.github/workflows/cleanup-cloudflare-pages.yml)
when a branch is deleted or a pull request is closed, deleting matching preview
deployments from the `acro-routine-builder-dev` project. It can also be run
manually with a branch name. Cleanup uses Cloudflare's Pages deployment delete
API with forced deletion enabled for aliased preview deployments. To enable it,
set repository variable `CF_PAGES_CLEANUP_ENABLED=true`, keep `CF_ACCOUNT_ID`
configured, and add `CF_PAGES_API_TOKEN` with Cloudflare Pages Edit access. If
cleanup is not enabled, the workflow job is skipped before calling Cloudflare.
Overlapping cleanup events for the same branch are serialized, and a deployment
that was already deleted by another cleanup run is treated as complete.

## Privacy

The deployed site uses [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/):
anonymous pageview, country and device-class counters, no cookies, no
personal data, no GDPR consent banner. Forks and local dev builds do
not load the beacon - it activates only when a `CF_ANALYTICS_TOKEN`
repo secret is set and threaded through the deploy workflow.

When you click `Share link`, the compressed program (no email, no
account, no metadata beyond what is in the routine itself) is
uploaded to a Cloudflare Worker and stored under a random 8-char id
for **7 days**, then automatically deleted. The `worker/` directory
contains the source. Forks without a deployed worker get a disabled
share button.

## Project layout

See [docs/claude_plan.md](docs/claude_plan.md) for the full plan and
implementation status. Short version:

- `src/data/` - trick catalog and competition config
- `src/rules/` - validators (pure TS, one file per rule) + engine
- `src/scoring/` - technicity, bonus formulas, eligibility
- `src/io/` - JSON and markdown import/export
- `src/store/` - Zustand store with localStorage persistence
- `src/components/` - UI (Builder, palette, cells, docs pages, etc.)
- `src/components/mobile/` - adaptive mobile layer rendered below the
  `lg:` breakpoint (reuses store, validators and scoring unchanged)
- `src/hooks/useIsMobile.ts` - media-query hook driving the
  desktop/mobile split
- `test_data/` - ready-to-import `.arb.json` fixtures for manual UI
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
