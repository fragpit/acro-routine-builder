# Changelog

## Unreleased

- Helicopter forbidden-connection rule narrowed: a Helicopter is
  now only blocked from connecting into combos that *start* with
  Helicopter (Twister, Helicopter to SAT). Combos that merely end
  with Helicopter (Misty to Helicopter, SAT to Helicopter, Cowboy,
  SuperCowboy, Corkscrew, Joker, Mac Twist to Helicopter) are now
  allowed to follow a plain Helicopter.

## v0.8.5

- Stall-to-infinite family one-per-run and the no-side
  once-per-run cap (MacFly / MistyFly / HeliFly / SatFly) are
  now warnings, not errors. Per FAI 6.5.1.2 the extras simply
  do not score - the second SatFly is now struck-through and
  excluded from technicity / bonus, matching how high-coeff
  and tumbling-related caps already worked.
- Repetition violations are now errors, not warnings. They
  carry a real -13% bonus malus per repeated occurrence, so
  the visual weight should match the impact - amber under-sold
  it.

## v0.8.4

- Repetition malus is no longer scaled by Tq. The bonus formula is
  now asymmetric: Tq scales the positive bonus percentage (matching
  AWT § 6.6.1 per-trick technical-mark weighting), but the malus is
  subtracted as a flat percent. At Tq=80% a 13% repetition malus is
  deducted as 13%, not 10.4%. The violations panel labels the
  repetition deduction `bonus` instead of the misleading `choreo`.

## v0.8.3

- AWT import pilot list now shows each pilot's overall competition
  score and offers a Score / Name sort toggle (defaults to Score).

## v0.8.2

- Fixed iOS Safari / PWA auto-zooming the page when tapping into a
  search or text input and never zooming back out.

## v0.8.1

- Programs now have a free-form notes field. Open it from the
  document icon next to the program name in the top header bar on
  desktop or at the right end of the `+ Add trick` bar on mobile.
  Notes round-trip through Save / Load, JSON, share links and
  Markdown export, and AWT imports pre-fill them with the per-run
  judges' notes. Notes are capped at 10 000 characters - the
  editor shows a live counter, the JSON validator rejects oversized
  payloads, and AWT imports truncate noisy upstream content.
- Hardened JSON import against malformed or hostile files:
  preflight rejects payloads above 1 MB before parsing, and the
  validator now caps name length, run/trick id length, tricks per
  run, bonuses per trick, and the defaultBonuses array - each
  with a specific error message. Realistic programs are well
  under every cap; the limits exist to keep a tampered file from
  exhausting localStorage or spiking memory on import.

## v0.8.0

- AWT import now reads from a local snapshot bundled with the app
  instead of calling api.acroworldtour.com at runtime, so the
  feature keeps working when their site is down. Refresh the
  snapshot with `npm run snapshot:awt`.

## v0.7.9

- Internal: split Builder.tsx into `builder/` submodules, extract
  `useProgramDnd` / `useTrickPalette` hooks, and replace dnd-kit
  drag-data `as`-casts with a discriminated union and type guards.
  No behavior change.

## v0.7.8

- Import: stricter JSON validation. Files with duplicate run or
  trick ids, more than `MAX_RUNS` runs, or `repeatAfterRuns` out of
  range now fail with a specific error instead of loading silently.
  Unknown ids in `defaultBonuses` are dropped on import.

## v0.7.7

- Markdown export now uses a numbered flat list per run instead of a
  GFM table, so the raw `.md` reads cleanly in chat clients and plain
  text editors. Side and bonuses appear inline only when set.

## v0.7.6

- Desktop drag-and-drop now mirrors the mobile sortable feel: as
  the cursor moves through a run column, the single closest gap
  between cells opens up to mark the insertion point. No more
  aiming at a thin line - hovering anywhere over a cell lets the
  nearest gap above or below it expand.
- Desktop trick cell layout now matches the mobile one: the
  coefficient sits next to the trick name on the same line, and
  when the trick is ignored the full reason wraps onto a row
  beneath the name instead of being truncated as a chip.

## v0.7.5

- Mobile: collapsed run-stats bar no longer truncates the Bonus
  formula off-screen. The chevron now sits next to the value on the
  right (matching the Score header), and the expanded view shows the
  bonus as a single coefficient-applied percentage instead of the
  long inline formula.

## v0.7.4

- New `Import link` button in the file menu pulls a share URL or
  bare id from your clipboard (or a manual paste field) and loads
  the routine - useful inside the installed PWA on iOS, where chat
  links always open in Safari instead of the app.
- `Import` is renamed to `Import JSON` for clarity now that there
  are two import sources, and `New` no longer renders muted (the
  confirm dialog is the safety net).

## v0.7.1

- Reduce share link TTL from 30 days to 7 days. New `Share link`
  buttons create week-long links; the in-app toast and docs are
  updated. Links created before this change keep their original
  30-day expiry (TTL is set at write time on Cloudflare KV).

## v0.7.0

- Share a routine via a short URL. The new `Share link` button in
  the file menu uploads the compressed program to a Cloudflare
  Worker and copies a `…/builder?s=<id>` link to the clipboard.
  Opening such a link loads the routine into the builder, with a
  confirmation prompt when the current program has tricks. Links
  expire automatically after 30 days. Forks built without a worker
  URL see the button disabled.

## v0.6.40

- Fix desktop drag-and-drop drop animation: the dragged trick no
  longer flies back to the palette after a successful drop into a
  run.

## v0.6.39

- Total program score shows the cumulative change next to it in green
  (gain) or red (loss). The baseline settles automatically after a few
  seconds of inactivity; until then the indicator tracks the running
  difference from where you started.
- Click the score (tap on mobile) to pin the current total as a
  comparison baseline. The indicator stays visible (starting at
  `+0.000`) and never auto-clears, so you can measure the impact of a
  series of edits against an explicit reference point. Click again to
  unpin and return to the auto-baseline behaviour.
- Quality correction (T / C) defaults to 50% (was 60%).
- Score breakdown clarified. Per-run Bonus stat now spells out the
  Tq factor as `X(Y×Tq(N%))%`. The Bonus row in the expanded
  breakdown shows the Tq-adjusted percent directly:
  `(Tech + Choreo) × (Tq-adjusted% - malus%)/100`, instead of the
  raw bonus with a separate `× Tq` factor at the end. The computed
  value is unchanged.

## v0.6.38

- Switch routing from HashRouter to BrowserRouter. URLs are now
  cleaner (`/builder` instead of `/#/builder`), and Cloudflare Web
  Analytics records each route natively without a shim.

## v0.6.37

- Cloudflare Web Analytics now records route-level pageviews
  (`/builder`, `/docs/rules`, etc.) instead of collapsing them all
  to the site root.

## v0.6.36

- Add Cloudflare Web Analytics (privacy-friendly, no cookies); enabled
  only in production builds.

## v0.6.35

- Soften the "more than 2 tumbling/infinity/rhythmic related
  manoeuvres" rule from error to warning (yellow).

## v0.6.34

- Trick rules aligned with the AWT 2025 catalog: added forbidden
  connections (Mactwist to SAT / X-Chopper to SAT cannot be followed by
  SAT; Misty to Tumbling cannot be followed by Infinity Tumbling or
  Anti-Rhythmic SAT) and fixed X-Chopper to Tumbling's forbidden target
  from Infinity Tumbling to Tumbling.
- Corrected bonus mutual-exclusion sets per AWT data on Stall, Misty
  Flip, Helicopter, Mac Twist to Helicopter, Cowboy, SuperCowboy,
  Corkscrew, Joker, Rhythmic SAT, MacFly / MistyFly / HeliFly / SatFly,
  and X-Chopper to Tumbling.

## v0.6.33

- Quality correction (T / C) now adjusts in 5% steps (was 10%).

## v0.6.32

- Mobile trick sheet: redesigned the action row. The full-width red
  Remove button is gone; removal is now a compact square trash icon at
  the start of the row. Move and Copy share the same neutral style.
  The primary button is now labelled **Done** (was Apply) - the sheet
  has no buffered state, so "apply" was misleading.

## v0.6.31

- Mobile drag handle is now borderless and uses the same `⋮⋮` glyph as
  the desktop trick cell, matching the desktop look.

## v0.6.30

- Mobile trick cells now have an explicit drag handle on the right -
  grab it to reorder a trick within its run. The inline ✕ delete
  button is gone; remove a trick from the trick sheet (red Remove
  button at the bottom).

## v0.6.29

- Mobile builder now supports drag-to-reorder tricks within a run:
  long-press a trick and drag it to a new position.

## v0.6.28

- Score distribution default is now 40/40/20 (Technical/Choreo/Landing).
  The reset link next to the Score distribution and Quality correction
  headings is always visible, so the values can be returned to default
  in one tap regardless of the current state.

## v0.6.27

- Pull down from the top to check for app updates. A spinning refresh
  indicator appears, and the app no longer reloads itself mid-session
  when a new version is published.

## v0.6.26

- Remove the AWT import wizard. The acroworldtour.com public API is
  currently down, so the "Import AWT" button and dialog were pulled
  from the mobile file controls. The AWT scoring mode and validators
  remain unchanged.

## v0.6.25

- Mobile trick picker no longer auto-focuses the search input when
  opened, so iOS does not pop the keyboard (and page zoom) on every
  tap of `[+ Add trick]`.

## v0.6.24

- Add a user guide at `/docs/help` describing every feature of the
  builder - routine composition, AWT import wizard, scoring and
  the Tq / Cq quality correction coefficients. Reachable from a new
  Help link in the desktop header and a Help button in the mobile
  drawer nav row.

## v0.6.23

- Mobile menu: navigation buttons (Home, Rules, Tricks, Feedback,
  Theme) moved to the top of the drawer. Version label stays at the
  bottom.

## v0.6.22

- Feedback menu no longer shows account-related subtitles under the
  GitHub Issues and Email options.

## v0.6.21

- The Quality correction reset link now sits next to the section
  heading, matching the Score distribution layout.

## v0.6.20

- Competition import preview shows the pilot's overall score and offers
  an "Apply accuracy" toggle that sets the builder's T/C corrections
  from the pilot's actual judges' marks at that event.

## v0.6.19

- Bonus is now scaled by the Tq (technical quality) correction in both
  AWT and AWQ modes. The score breakdown shows the extra multiplier.
  AWT no longer displays a `min…max` range for the bonus / total - Tq
  replaces the previous T=5…10 scaling.
- Repetition penalty is now applied as a malus on the bonus percentage
  instead of reducing the choreography (C) mark. When the malus
  exceeds the bonus, the bonus turns negative and lowers the run
  total. The per-run stats row is relabeled `Choreo` -> `Malus`, the
  `Bonus` stat is shown as `X(Y)%` (Y raw, X after Tq), and the bonus
  row has been moved below `Slots`.

## v0.6.18

- Fixed choreography mark formula so the Cq quality correction and
  repetition penalty apply only to the subjective base (9). The
  symmetry bonus is now added as a fixed +1 after those corrections,
  matching FAI scoring (it can no longer be scaled down or zeroed out
  by quality/repetition factors).

## v0.6.17

- Tumbling / infinity / rhythmic related manoeuvres beyond the 2-per-run
  cap are now marked "ignored" on the run cell (line-through + reason)
  and excluded from technicity and bonus scoring, matching the existing
  behaviour for the high-coefficient and bonus category limits.

## v0.6.16

- Desktop header title no longer carries the version suffix. The app
  version is now shown as a small footer at the bottom of the Home
  page (and only there - not in the Builder), plus as a footer row
  inside the Feedback popover so it is reachable from every page.

## v0.6.15

- Mobile recent tricks moved from the palette strip into the
  "+ Add trick" picker as a "Recent" section above the full list.
- Mobile "+ Add trick" is now a single compact pill centred above
  the run instead of a full-width strip button. Picking a trick arms
  it and an insert-slot banner replaces the pill with a Cancel
  action; the same banner covers add, move and copy.

## v0.6.14

- Mobile trick cells now have a subtle `✕` remove button on the
  right, matching the desktop cell affordance (slate, red on hover).
- Mobile trick sheet replaces the red "Remove" button with a primary
  "Apply" button that closes the sheet; the sheet no longer carries
  a destructive action since removal is reachable directly from the
  cell.

## v0.6.13

- Header nav now includes a Builder link so you can return to the
  builder from the Rules and Tricks doc pages without going through
  Home.
- Mobile header title is now just "ARB" (without the version suffix)
  so the new nav link fits on one line on narrow screens. The full
  version is still shown in the mobile drawer menu.

## v0.6.12

- Feedback button in the header replaces the GitHub icon and opens a
  menu with GitHub Issues and email (mailto) options.

## v0.6.11

- Orphan bonus ids (e.g. a stale "twisted" left on a trick whose
  catalog entry has no twisted variant) are stripped on import and
  load so they no longer render misleading badges or confuse
  per-run bonus counts.

## v0.6.10

- Desktop palette now shows up to 5 recently used tricks at the top of
  the list under a "Recent" header, separated from the full sorted list
  by a divider. The list is shared with the mobile palette.

## v0.6.9

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
