# Changelog

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
