# Plan: Acro Program Constructor

## Context

A web service for paragliding acro pilots to build a program (a set
of tricks) for AWT/AWQ competitions. The pilot picks the competition
type, sees a table of runs, drags tricks from a catalog into the runs,
and the system checks the program against FAI Sporting Code 2025
rules in real time.

The service must be as simple as possible: no backend, no database,
just a static frontend on GitHub Pages. It must work well on mobile
devices in portrait orientation.

Synchro is out of scope for now (see CLAUDE.md).

## Application pages

The app has several pages (routing via HashRouter, which works on
GitHub Pages without extra setup):

1. **Home** (`/`) - short description, an "Open" button and
   links to documentation:
   - Competition rules (FAI Sporting Code)
   - Trick reference with restrictions
2. **Constructor** (`/constructor`) - main screen. AWT/AWQ is toggled via an
   "AWT mode" checkbox right in the constructor header (off by default =
   AWQ). The structural difference between AWT and AWQ is minimal -
   only the Misty-to-Misty ban in AWT (section 4.4). The bonus
   formula differs for scoring (phase 3), but that does not change
   program structure.
3. **Rules documentation** (`/docs/rules`) - online version of
   [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md)
   with navigation.
4. **Trick reference** (`/docs/tricks`) - a page with tricks, their
   coefficients, modifiers and restrictions (a synthesis of
   [trick_rules.md](trick_rules.md) and the data in `manoeuvres.ts`).

This is wired in at the routing level from phase 1, but the actual
content of the documentation pages is filled in during the final
phase.

**UI is in English** - we don't use Russian strings in the interface.

## Constructor screen layout

Three main sections:

1. **Trick list** - sorted by coefficient, drag source.
2. **Dynamic settings**:
   - Number of runs (default from competition type).
   - After how many runs tricks may repeat (by default no repetition
     allowed at all).
3. **Violations panel** - a list of triggered business rules with
   highlighting of the related cells.

## Trick and modifier operations

- Drag a trick from the palette into a run cell.
- Clicking a cell with a trick opens a popover with the modifiers
  available for that trick (checkboxes). The list depends on the
  specific trick and respects mutual exclusions (e.g. Twisted /
  Devil Twist / Full Twisted are mutually exclusive).
- Modifiers are shown on the cell as small badges.
- Removing a trick from a cell removes all of its modifiers.
- Modifiers affect the trick's value calculation.

## Answers to open questions from plan.md

### Who evaluates the rules? JS?

Yes, all business logic lives in the browser in TypeScript. The data
is static (~38 tricks, ~15 rules), calculations are instant.
No backend needed.

### Can it be hosted on GitHub Pages?

Yes. Vite produces a static build; deploy via GitHub Actions.
We use `HashRouter`, which works on Pages out of the box with no
server-side setup.

### Where does the business logic live?

In a separate module `src/rules/` - pure TypeScript functions with
no React imports. Each rule is its own validator file. Unit-testable
independently of the UI.

## Tech stack

| Area           | Choice               | Why                                                |
|----------------|----------------------|----------------------------------------------------|
| Framework      | React 18 + TS        | Mature DnD ecosystem, wide support                 |
| Build          | Vite                 | Fast, native TS, easy Pages deploy                 |
| Styling        | Tailwind CSS v4      | Fast iteration, modern look                        |
| Drag & Drop    | @dnd-kit             | Actively maintained, touch-friendly, accessible    |
| State          | Zustand              | Lightweight, selective subscriptions               |
| Tests          | Vitest               | Native Vite integration                            |
| Dev env        | mise (.mise.toml)    | Isolated Node.js without a global install          |
| Deploy         | GitHub Actions+Pages | Static, free                                       |

## Dev environment (mise)

`.mise.toml` at the project root:

```toml
[tools]
node = "22"
```

When you enter the directory, mise activates the right Node version
automatically. `node_modules/` stays local to the project (same idea
as `.venv` in Python). Add `node_modules/` to `.gitignore`.

## Project layout (current)

```text
src/
├── data/
│   ├── manoeuvres.ts          # 38 solo tricks with metadata and bonuses
│   └── competition-types.ts   # AWT/AWQ configuration
│
├── rules/                     # business logic (pure TS, no React)
│   ├── types.ts
│   ├── engine.ts              # validateProgram()
│   └── validators/
│       ├── awt-misty-to-misty.ts
│       ├── bonus-limits.ts
│       ├── forbidden-connections.ts
│       ├── high-coeff.ts
│       ├── incompatible.ts
│       ├── last-two.ts
│       ├── must-be-first.ts
│       ├── one-per-run.ts
│       ├── repetition.ts
│       └── tumbling-inf-rhythmic.ts
│
├── scoring/
│   ├── technicity.ts
│   ├── bonus.ts               # AWT/AWQ bonus formulas
│   └── eligibility.ts         # filters available tricks by rules
│
├── io/                        # program import/export
│   ├── program-json.ts        # JSON roundtrip
│   └── program-markdown.ts    # markdown report generation
│
├── store/
│   └── program-store.ts       # Zustand + localStorage persistence
│
├── components/                # flat structure, no nested folders
│   ├── App.tsx                # root layout + routing + paraglider/mountain background
│   ├── Home.tsx
│   ├── Constructor.tsx        # constructor with runs and palette
│   ├── ProgramControls.tsx    # runs/repeat-gap/AWT/import/export
│   ├── TrickCell.tsx
│   ├── TrickInfoCard.tsx      # side panel with description and bonuses
│   ├── ViolationsPanel.tsx
│   ├── RulesDocs.tsx
│   ├── TricksDocs.tsx
│   └── ThemeToggle.tsx
│
├── hooks/
│   └── useTheme.ts
│
├── main.tsx
└── index.css                  # tailwind v4 + SVG background (paragliders + mountains)
```

## Validation business rules

**Source of truth**: [trick_rules.md](trick_rules.md).
When implementing each validator you must cross-check with that file.
If FAI updates the rules, only that file and the relevant validators
change.

Validator-to-section mapping (trick_rules.md):

| Validator                  | Section                                  |
|----------------------------|------------------------------------------|
| `must-be-first`            | 1.1 Must be first                        |
| `last-two`                 | 1.2 Cannot be last two (+flipped)        |
| `forbidden-connections`    | 2. Forbidden connections                 |
| `high-coeff`               | 3.1 High coefficient limit (max 2)       |
| `one-per-run-stall-inf`    | 3.2 Stall-to-infinite family             |
| `tumbling-inf-rhythmic`    | 3.3 Max 2 tumbling/inf/rhythmic          |
| `incompatible`             | 3.4 X-Chopper/Misty vs stall-to-inf      |
| `bonus-limits`             | 3.5 Bonus limits (5/3/2)                 |
| `no-side-once`             | 3.6 MacFly/MistyFly/HeliFly/SatFly       |
| `repetition`               | 4.1-4.3 Per-competition repetition       |
| `awt-misty-to-misty`       | 4.4 AWT-specific                         |

Sections 4.2 (13% penalty) and 5 (big ear announcement) belong to
the scoring phase / warnings, not to program-structure validators.

## Trick info for the user

When the user clicks a trick in the palette (or a cell with a trick
in a run), they must see detailed information in the same format as
in [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md):

```markdown
#### 1.1.1 Tail Slide - coeff: 1.15

- Stabilised backward flying with open glider
- Minimum: 5 seconds
- Criteria: maintenance of the shape, stability, perceptible
  backwards flight, control of direction, duration,
  exit or connection
- Twisted Tail Slide: twisted all the way from entry to exit
- Free connection
- Repetition allowed (see 3.3.4)
- Bonuses: Twisted 6%, Twisted Exit 4.5%
```

**Data model implication**: `manoeuvres.ts` stores, alongside the
structured fields (coefficient, groups, forbiddenConnectionTo etc.),
a `description` field - an array of strings (bullet points) from
the original documentation. That way a single data source powers
validators, the user-facing display and the generated trick
reference page.

UI: popover card on hover, or a dedicated details panel on click.
On mobile - a bottom sheet.

## Key domain types

```typescript
interface Manoeuvre {
  id: string;
  name: string;
  coefficient: number;
  sectionNumber: string;       // "1.1.1" for linking to the FAI code
  description: string[];       // bullet points from sporting_code
  forbiddenConnectionTo: string[];
  cannotBeLastTwo: boolean;
  mustBeFirst: boolean;
  repetitionAllowed: boolean;
  noSide: boolean;
  availableBonuses: BonusDefinition[];
  mutualExclusions: string[][];
  groups: string[];            // 'stall_to_infinite', 'tumbling_related'
  awtExcluded?: boolean;       // forbidden when AWT mode is on
}

interface PlacedTrick {
  id: string;
  manoeuvreId: string;
  side: 'L' | 'R' | null;
  selectedBonuses: string[];
}

interface Run {
  id: string;
  tricks: PlacedTrick[];
}

interface Program {
  awtMode: boolean;            // boolean flag instead of competitionType
  runs: Run[];
  repeatAfterRuns: number;
}

interface Violation {
  ruleId: string;
  description: string;
  severity: 'error' | 'warning';
  affectedCells: { runIndex: number; trickIndex: number; }[];
}
```

## Rules engine

Pure function: `validateProgram(program) => Violation[]`.
Each validator is its own pure function. The engine calls all
validators and merges their results.

```typescript
const validators: Validator[] = [
  validateHighCoeff, validateForbiddenConnections,
  validateLastTwo, validateMustBeFirst, ...
];

function validateProgram(program: Program): Violation[] {
  return validators.flatMap(v => v(program, manoeuvreMap));
}
```

Validation runs synchronously on every state change (tiny data -
instantaneous).

## Responsiveness (mobile-first)

The UI must work correctly in portrait orientation on phones. Plan:

- Desktop - two columns (trick palette / run table), settings panel
  on top, violations panel at the bottom.
- Mobile (portrait) - the palette collapses into a drawer /
  bottom-sheet, the run table is the main view with horizontal
  scrolling across runs, settings live in a dropdown menu.
- Drag-and-drop must work via touch (@dnd-kit supports this out of
  the box through PointerSensor / TouchSensor).
- Tailwind responsive prefixes (sm:, md:, lg:) for layout switching.

## UI sketch

VIOLATIONS - under the run table (not full width of the screen).
TRICK PALETTE - side column spanning the full screen height.

```text
┌──────────────────────────────────────────────────┐
│  Acro Program Constructor     Rules Tricks  ☀/🌙  │
├───────────┬──────────────────────────────────────┤
│           │ Runs: [3]  [x] AWT mode              │
├───────────┼──────────────────────────────────────┤
│ TRICK     │  RUN 1      │  RUN 2     │  RUN 3   │
│ PALETTE   │ ┌─────────┐ │ ┌────────┐ │          │
│           │ │Cowboy   │ │ │SAT     │ │  Drop    │
│ ┌───────┐ │ │1.90 L ⚡│ │ │1.25 R  │ │  here    │
│ │Stall  │ │ ├─────────┤ │ ├────────┤ │          │
│ │1.60   │ │ │Infinity │ │ │Misty   │ │          │
│ ├───────┤ │ │1.85 R   │ │ │1.65 L  │ │          │
│ │Misty  │ │ ├─────────┤ │ └────────┘ │          │
│ │1.65   │ │ │Tumbling │ │            │          │
│ ├───────┤ │ │1.80 L ⚠ │ │            │          │
│ │...    │ │ └─────────┘ │            │          │
│ │       │ │ TC: 1.85    │ TC: 1.45   │          │
│ │       │ ├─────────────┴────────────┴──────────┤
│ │       │ │ VIOLATIONS                          │
│ │       │ │ ⚠ Run 1: Tumbling not in last 2     │
│ │       │ │ ⚠ Run 1: >2 tricks with coeff ≥1.95 │
│ │       │ └─────────────────────────────────────┤
│ search  │                                       │
└─────────┴───────────────────────────────────────┘
```

## Implementation phases

### Phase 1 - MVP (local run)

1. Dev environment: `.mise.toml` (node 22), `.gitignore`.
2. Scaffolding: Vite + React + TS + Tailwind + dnd-kit + Zustand + Vitest.
3. Routing (HashRouter): home, constructor (`/constructor` without parameters).
4. Data: all 38 solo tricks in `manoeuvres.ts` including `description`
   (bullet points from the sporting code) and `sectionNumber`.
5. "AWT mode" checkbox in the constructor header (off by default = AWQ).
6. Trick palette (sort by coefficient with direction toggle, search).
7. Trick details card (click / hover on a trick in the palette or
   a cell in a run) in the sporting_code format.
8. Run table with drag-and-drop.
9. Side (L/R) selection for a trick.
10. Core validators (high-coeff, forbidden-connections, last-two,
    must-be-first, one-per-run, incompatible, awt-misty-to-misty).
11. **Unit tests for each validator** (Vitest).
12. Violations panel + cell highlighting.
13. ESLint flat config.
14. Light/dark theme with a header toggle, persisted in localStorage.

**Status: phase 1 complete.**

By the end of the phase: `npm run dev` runs locally, `npm test`
passes, the app works in the browser. No deploy yet.

### Phase 2 - full rules + modifiers

1. Modifier selection UI (twisted / reverse / flip + mutual
   exclusions). Instead of a popover, a side panel `TrickInfoCard`
   to the right of the runs: opens on cell click, shows the
   description plus bonus checkboxes, disables mutually exclusive
   ones.
2. `bonus-limits` validator - per-run bonus limits (5 twisted /
   3 reversed / 2 flipped).
3. `repetition` validator - per-competition repetitions.
   Identity = (manoeuvreId, side, isReverse). Twisted/flipped -
   same trick, reverse - different. Honours `repeatAfterRuns` as
   the minimum gap between runA and runB (default 999 = never).
4. AWT-specific rules (from phase 1).
5. No-side fly tricks (MacFly / MistyFly / HeliFly / SatFly) are
   covered by `repetition`: identity for noSide ignores side, plus
   `repetitionAllowed=false`.
6. Per-run technicity calculation - basic average of coefficients,
   shown at the bottom of the run column. Full formula with limits -
   in phase 3.
7. UI: "Repeat gap" control in the constructor header.
8. localStorage persistence (phase 1).
9. Unit tests for bonus-limits, repetition, technicity.

**Status: phase 2 complete.**

### Phase 3 - scoring + mobile adaptation

1. Per-run technicity and bonus calculation (AWT/AWQ formulas) -
   `scoring/`.
2. Eligibility filter: tricks in the palette are marked as ignored
   with a reason (`scoring/eligibility.ts` + TrickCell / palette UI).
3. Default bonuses: when a trick is added, "default" bonuses are
   applied automatically.
4. Import/export: JSON roundtrip + markdown report
   (`src/io/program-json.ts`, `src/io/program-markdown.ts`,
   controls in `ProgramControls.tsx`).
5. Mobile-first responsive layout - not done yet (deferred from
   the current iteration).

**Status: phase 3 complete except mobile adaptation.**

### Phase 4 - online documentation

1. `/docs/rules` page - renders `sporting_code_aerobatics_2025.md`
   via `react-markdown` + `remark-gfm`.
2. `/docs/tricks` page - reference generated from `manoeuvres.ts`.
3. Links from the home page.
4. Documentation search - not implemented.

**Status: phase 4 complete.**

### Phase 5 - deploy

1. GitHub Actions workflow `.github/workflows/deploy.yml` builds and
   publishes to Pages (trigger: push to `main`).
2. `.github/workflows/ci.yml` - typecheck / lint / test on PRs.
3. HashRouter - works on Pages without extra setup.
4. `vite.config.ts` with `base` set to the repository name.

**Status: phase 5 complete.**

### Extras (beyond the original plan)

- Decorative background: SVG paraglider pattern over the body and
  a mountain range at the bottom (3 layers with a gradient) in
  `index.css`, wired in through fixed layers in `App.tsx`.

## Testing

Unit tests for business rules are a required part of every phase.
Each validator is tested independently via Vitest.

```text
src/rules/validators/__tests__/
├── high-coeff.test.ts
├── forbidden-connections.test.ts
├── last-two.test.ts
├── must-be-first.test.ts
├── one-per-run.test.ts
├── incompatible.test.ts
├── bonus-limits.test.ts
├── repetition.test.ts
└── awt-specific.test.ts
```

Approach: build a Program with a deliberate violation, assert that
the validator returns the correct Violation with the right
affectedCells. Also assert that a valid program produces no errors.
Table tests (multiple cases in one function).

## Verification

- `npm run dev` - start the dev server, check the UI in the browser.
- `npm test` - unit tests for every validator.
- Manual test: build a program with deliberate violations, make sure
  they all get flagged.
- `npm run build` - make sure the build passes.
- Deploy to Pages, verify the public URL works.

## Key files

- [trick_rules.md](trick_rules.md) - **source of truth for
  validators** (extracted trick restrictions).
- [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md) -
  full FAI code (trick coefficients, scoring formulas, manoeuvre
  descriptions).
- [plan.md](plan.md) - user requirements.
