# Changelog

## Unreleased

- Reversed manoeuvres no longer trigger the cross-run repetition
  warning, matching the rule that a reverse manoeuvre is considered
  a different manoeuvre altogether.

## v0.6.8

- Larger font in the Rules and Tricks doc pages, including the
  table-of-contents sidebar, for easier reading.

## v0.6.7

- AWT import: set Reset gap to 2 when the pilot has 5 runs (superfinal);
  otherwise it still equals the number of imported runs.

## v0.6.6

- Close the burger drawer after loading a saved program (same behavior as
  Import and Import AWT).

## v0.6.5

- Add burger drawer to desktop builder with File, Program settings,
  Default bonuses, Score distribution, and Quality correction - the
  top toolbar now keeps only the program name, score, undo/redo,
  Reset all, and the menu button

## v0.6.4

- Group refresh and close buttons on the right of the AWT import dialog
  header

## v0.6.3

- Add import from acroworldtour.com: pick a solo competition and a pilot,
  pull all their runs into the builder in one step

## v0.6.2

- Fix Final Score going negative when repetition penalty exceeds 100%:
  choreo now clamps to 0

## v0.6.1

- Fix Final Score breakdown formula: show the repetition penalty factor
  (e.g. `× 87%(rep)` for -13%) and read the symmetry bonus from the
  actual value instead of reverse-engineering it from `cMark`, which
  mis-rendered as `0(sym)` once the penalty dragged the number down
- Flip the desktop Final Score chevron to match the panel's expansion
  direction: v when collapsed (breakdown will flow downward), ^ when
  expanded. Mobile stays ^-when-collapsed because the panel visually
  grows upward there

## v0.6.0

- Refactor: code hygiene pass (no user-visible changes)
  - Extract `safeFileName` / `download` into `src/io/download.ts`
    (was duplicated between desktop and mobile file controls)
  - Extract `getBonusCategory` helper in `src/rules/`, used by four
    validators / scoring modules
  - Consolidate bonus category limits and high-coefficient cap in
    `src/data/competition-types.ts` (was duplicated)
  - Centralize localStorage keys in `src/store/storage-keys.ts` and
    drop legacy `apc_*` migration shims
  - Extract `useViolationHighlights` and `useChoreoPenaltyPerRun`
    hooks used by both desktop and mobile builders
  - Remove unused `TrickCell` props, `programTechnicity` dead wrapper
    and `resetIds` test helper
  - Ignore `.vite/` dev-server cache
  - Document follow-up refactorings in `docs/todo.md`

## v0.5.2

- Move Undo/Redo buttons to the mobile header next to the burger menu

## v0.5.1

- Flip chevron arrows: point up when collapsed, down when expanded

## v0.5.0

- Add per-run Final Score calculator with expandable breakdown panel
- Add program total score in desktop toolbar and mobile header
- Add configurable score distribution (Technical/Choreo/Landing weights)
  with linked controls (tech/choreo move together, landing compensates)
- Add quality correction modifiers (T/C) with 10% step, default 60%
- AWT mode shows Final Score as a range (bonus scaled T=5…10)
- Fix bonus slot colors: green at limit, amber over limit
- Fix chevron direction consistency on mobile panels

## v0.4.0

- Rename app from Acro Program Constructor to Acro Routine Builder
  (APC -> ARB)
- Rename `/constructor` route to `/builder`
- Rename component files (Constructor -> Builder)
- Update GitHub URLs to match renamed repository
- Add backward compatibility for importing old `.apc.json` files
- Migrate localStorage keys from `apc_*` to `arb_*` prefix
- Rename test data files from `.apc.json` to `.arb.json`
- Fix deprecated `apple-mobile-web-app-capable` meta tag

## v0.3.26 (2026-04-16)

- Escape `>` and `<` in sporting code source markdown

## v0.3.25 (2026-04-16)

- Fix `>` and `<` rendered as blockquotes/HTML in Rules docs

## v0.3.24 (2026-04-16)

- Show AWT bonus as range (+X…Y%) instead of upper bound
- Add CHANGELOG.md

## v0.3.23 (2026-04-15)

- Remove synchro doc pointer from sporting code reference

## v0.3.22 (2026-04-15)

- Add clickable anchor links to docs headings
- Deduplicate solo manoeuvres list

## v0.3.21 (2026-04-15)

- Close mobile menu after successful program import

## v0.3.20 (2026-04-15)

- Add PWA support via vite-plugin-pwa with autoUpdate

## v0.3.19 (2026-04-15)

- Use 100lvh for iOS PWA app height

## v0.3.18 (2026-04-15)

- Respect iOS safe area in mobile menu drawer

## v0.3.17 (2026-04-15)

- Lighten paraglider color on favicon

## v0.3.16 (2026-04-15)

- Soften paraglider color on favicon

## v0.3.15 (2026-04-15)

- Fix mobile home viewport: safe-area notch padding, no-scroll layout

## v0.3.14 (2026-04-15)

- Add favicon and home-screen app icons

## v0.3.13 (2026-04-15)

- Move top header into burger menu on mobile constructor

## v0.3.12 (2026-04-15)

- Fix mobile fullscreen safe-area clipping

## v0.3.11 (2026-04-15)

- Make mobile run stats panel collapsible

## v0.3.10 (2026-04-15)

- Let mobile page scroll to hide top header

## v0.3.9 (2026-04-14)

- Make mobile run footer 4 columns

## v0.3.8 (2026-04-14)

- Merge mobile run header into dots indicator bar

## v0.3.7 (2026-04-14)

- Treat noSide-only runs as direction-balanced

## v0.3.6 (2026-04-14)

- Count single sided trick as balanced (no symmetry penalty)

## v0.3.5 (2026-04-14)

- Mobile: replace Duplicate with Copy (insert-slot UX)

## v0.3.4 (2026-04-14)

- Prevent iOS viewport zoom on mobile autofocus inputs

## v0.3.3 (2026-04-14)

- Default Reset gap to DEFAULT_RUNS

## v0.3.2 (2026-04-14)

- Replace Runs/Reset gap inputs with stepper buttons

## v0.3.1 (2026-04-14)

- Document task workflow and tag-bumping rules

## v0.3.0 (2026-04-14)

- Add mobile UI layer
- Add live Pages URL to README

## v0.2.7 (2026-04-14)

- Downgrade high-coeff violation from error to warning

## v0.2.6 (2026-04-14)

- Downgrade bonus-limit violations from error to warning

## v0.2.5 (2026-04-14)

- Show "bonus not counted" badge on repetition-allowed tricks

## v0.2.4 (2026-04-14)

- Show per-run bonus slot utilization

## v0.2.3 (2026-04-14)

- Copy trick between runs on Alt+drag

## v0.2.2 (2026-04-14)

- Add undo/redo for program edits

## v0.2.1 (2026-04-14)

- Initial release
- Translate docs, deploy from main only
- Deep-link sections in rules and tricks docs
- Add trick directions balance indicator per run
- Limit SAT forbidden combos to SAT-entry combos
- Forfeit repeated twisted/flipped bonus on exception tricks
- Add manual test fixtures per business rule
- Add semver versioning, switch deploy to tag trigger
