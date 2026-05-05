# User guide

Acro Routine Builder (ARB) is a static web app that helps you
compose a competitive acro program under the FAI Sporting Code 2025
(Section 7F). It validates tricks and computes per-run scores. This
page is the hands-on manual. For the raw rulebook see the
[Rules reference](/docs/rules) and [Tricks reference](/docs/tricks).

## What you can do

- Build up to eight runs, each containing any number of solo tricks.
- Drag tricks from a palette and arrange them between runs.
- Attach twisted / reversed / flipped / SAT / misty bonuses per trick
  (only those allowed by the trick's catalog entry).
- Switch between AWQ (World Series) and AWT (World Tour) rule sets.
- See live validation against every FAI restriction: forbidden
  connections, repetition windows, bonus-slot limits, high-coefficient
  cap, AWT-only rules.
- Watch a per-run Final Score update as you edit (Technical,
  Choreography, Landing marks combined with Bonus and corrections).
- Save programs to your browser, export to JSON or a human-readable
  Markdown report, and re-import either.

Everything runs in your browser. There is no backend, no account
and no upload - programs stay in `localStorage` until you export
them.

## Building a program

### Runs and the palette

A program is a set of runs; each run is an ordered list of tricks.
Use the **Program settings** section of the drawer menu to set the
number of runs (1-8). On desktop the runs sit side-by-side; on
mobile they become a swipe-through pager.

The **Palette** (left sidebar on desktop, `+ Add trick` button on
mobile) lists all 38 solo tricks sorted by coefficient. Recently
used tricks appear at the top under a `Recent` heading.

### Adding, moving and copying tricks (desktop)

- **Add**: drag a trick from the palette into any run column. As
  the cursor moves through the column, the nearest gap between two
  cells opens up to mark where the trick will land - hover over a
  cell and the gap above or below it (whichever is closer) becomes
  the insertion point. Drop anywhere outside a column to cancel.
- **Move**: drag an existing trick cell to a new slot (same or
  different run).
- **Copy**: hold `Alt` while dragging an existing cell - the overlay
  turns green and the trick is duplicated instead of moved.
- **Remove**: click the small `✕` on the top-right of a trick cell.
- **Reset run**: click `reset` in a run header to clear only that
  run. `Reset all` in the toolbar clears every run.

### Adding and moving on mobile

Mobile uses tap-to-arm instead of drag-and-drop.

1. Tap `+ Add trick` - a bottom-sheet with a search box opens.
2. Tap a trick to arm it; the app shows `Tap a slot to insert`.
3. Tap any insert slot in any run to place it.

To move, tap an existing trick cell, tap **Move** in the action
sheet, then tap a destination slot. **Duplicate** and **Remove** are
also in that sheet. **L / R** buttons on the cell toggle the side
for two-sided tricks.

### Selecting a trick

Clicking a trick cell opens an info panel (desktop: right sidebar,
mobile: bottom sheet). It shows the full description from the
Sporting Code plus checkboxes for the bonuses allowed on that
trick. Bonuses that are mutually exclusive (for example `SAT` vs
`Misty`) disable each other automatically.

### Undo and redo

Every edit is tracked in an undo stack. Use the `↶` / `↷` buttons
in the toolbar or the keyboard shortcuts:

- `Cmd/Ctrl + Z` - undo
- `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` - redo

### Per-run stats

Each run column shows, under the tricks:

- **TC** - technicity: average of the three highest-coefficient
  tricks in the run (with at most two above 1.95).
- **Slots T / R / F** - bonus slots used vs the limit per run
  (5 twisted, 3 reversed, 2 flipped). Extras are not scored.
- **Bonus** - shown as `X(Y×Tq(N%))%`. `Y` is the raw sum of the
  selected bonus percents, `N` is the current Tq correction, and `X`
  is `Y × N/100` - the bonus actually applied after the
  technical-quality correction.
- **Malus** - deduction from the bonus percent for repetition
  violations (FAI 3.3.3).
- **Choreo(sym)** - `+1` if the trick sides are balanced across the
  run, `+0` otherwise. Single-sided tricks and `noSide` tricks are
  counted as balanced.
- **Final Score** - per-run total with an expandable breakdown.

### Violations

Validation runs on every change.

- **Errors** (red) - hard rule breaks (forbidden connections,
  repetition window, AWT-specific bans, must-be-first / cannot-be-last
  placement). The run is still flyable, but under FAI these incur
  significant score penalties. The cell gets a red background.
- **Warnings** (amber) - caps that scoring will handle silently
  (high-coefficient above 6 tricks, bonus slots over the limit).
  The run is still flyable; the extras just do not count.

The **Violations** panel (desktop: bottom; mobile: collapsible bar)
lists every issue. Tapping an item jumps the viewport to the
offending run and cell.

### Forbidden connections and ignored tricks

When a placed trick cannot be scored for structural reasons (for
example a fourth high-coefficient trick in a run, or a tumbling
trick past the 2-per-run cap), the cell renders with a
strike-through and a reason label. The trick still sits in the run
(so you can see your plan) but it contributes neither technicity
nor bonus.

## Program settings

Open the drawer menu (`≡` icon on mobile, `≡` button in the builder
toolbar on desktop). The `Program settings` section has:

- **Runs** - number of runs (1-8).
- **Reset gap** - how often the repetition tracker resets. Default
  is the number of runs, which means any trick can only be flown
  once across the whole program. Set `MAX` for no reset; set a
  smaller value (e.g. 2 for a superfinal block of 2 runs) if you
  want repetition allowed outside that window.
- **AWT mode** - switch between AWQ (default) and AWT. AWT enforces
  extra restrictions - such as the Misty-to-Misty ban (section 4.4)
  - and excludes some tricks from the palette entirely. The bonus
  formula and scoring pipeline also differ slightly.

### Default bonuses

Under `Default bonuses` you can pre-select bonuses that get applied
automatically to every newly added trick that supports them. Useful
if every Helicopter in your program is twisted - set it once and
stop toggling it manually. The count after `edit` shows how many
are currently set.

### Danger zone

`Reset all runs` clears every run. You will be asked to confirm.

## Scoring

The per-run Final Score follows the FAI formula, rounded up to three
decimals at every step (FAI convention).

```text
techFinal   = T × TC × (distribution.technical / 100)
choreoFinal = C × (distribution.choreo / 100)
landingFinal = L × (distribution.landing / 100)
bonusFinal  = (techFinal + choreoFinal)
            × ((bonusPercent - malus) / 100)
            × (Tq / 100)
total       = techFinal + choreoFinal + landingFinal + bonusFinal
```

Where:

- **T** - technical mark, 0-10. Defaults to 10 (perfect execution -
  we cannot predict it from the program structure alone).
- **C** - choreography mark, 0-10. Defaults to `9 × Cq/100 + 1` if
  the run is side-balanced, or `9 × Cq/100` otherwise. The `9` is
  the objective ceiling minus the parts (diversity, chaining) a
  static plan cannot pre-score; the `+1` is the symmetry bonus. The
  `Cq` correction applies only to the 9 base; symmetry is added
  after the correction.
- **L** - landing mark. Defaults to 0 - not predictable.
- **TC** - technicity computed from the run's tricks.
- **bonusPercent** - sum of selected bonuses on every trick in the
  run.
- **malus** - repetition penalty (FAI 3.3.3), applied to the bonus
  percentage.

### Program total and the change indicator

The header shows the **program total** (sum of all per-run Final
Scores). Next to it is a small change indicator in green or red
showing the difference from a comparison baseline:

- **Auto mode** (default). The baseline trails behind your edits:
  when you stop editing for a few seconds it catches up to the
  current total, and the indicator disappears. While you are
  actively editing, the indicator shows the running total of all
  changes since the baseline.
- **Pinned mode**. Click (tap on mobile) the score to pin the
  current total as a baseline. The indicator immediately appears as
  `(+0.000)` and stays put - it never auto-clears, no matter how
  many edits you make. Click the score again to unpin and return to
  the auto mode. Useful for measuring the impact of a planned
  series of edits against a fixed reference point.

Imports, loads and resets are not treated specially: in auto mode
the indicator briefly shows the jump and then settles to zero a few
seconds later; in pinned mode the comparison against the pinned
point is preserved.

### Score distribution

The menu has three sliders (Technical / Choreo / Landing) totalling
100%. Defaults are `50 / 50 / 0`. Technical and Choreo are linked -
moving one moves the other in the opposite direction. Landing can
be set manually and compensates.

### Quality correction coefficients

**Tq (Technical quality correction)** and **Cq (Choreography
quality correction)** model judge marks you cannot predict from the
program structure. Defaults are both **50%**. They apply like this:

- `T mark = 10 × Tq/100` - the execution component of the technical
  mark. At `Tq = 50%` the builder shows `T = 5.0`.
- `C mark base = 9 × Cq/100` - the subjective part of the
  choreography mark. Symmetry adds `+1` after this correction and
  is not scaled.
- `bonusFinal` is also scaled by `Tq/100` - a pilot who does not
  execute cleanly loses part of the bonus payout even if every
  trick is technically valid. This matches how judges deduct on
  execution.

Use the `+ / -` buttons in `Quality correction` to step in 5%
increments. Leave the defaults (50 / 50) for a conservative estimate
that assumes average judge marks; raise them if you have specific
marks from a real performance you want to model.

The `reset` link next to the heading restores both to 50%.

### AWT vs AWQ

Structural differences are small (Misty-to-Misty ban under AWT,
section 4.4 of the Sporting Code). The main scoring difference is
in the bonus formula - handled internally by `scoring/bonus.ts`,
not exposed as a separate toggle.

## Program notes

Each program has a free-form notes field. Use it to jot down what
you wanted out of a routine, what the judges flagged, or anything
else you want to keep alongside the tricks.

- **Desktop:** click the document icon next to the program name in
  the top header bar. A panel opens on the right with a textarea
  (newlines preserved) and a `Done` button. The icon turns blue
  when notes are present.
- **Mobile:** tap the document icon at the right end of the
  `+ Add trick` bar. A bottom-sheet slides up with the same
  textarea and `Done` button.

Notes are saved with the program: they round-trip through Save /
Load, JSON export and import, share links, and they appear under a
`## Notes` heading in the Markdown export.

When you import a routine from acroworldtour.com, the per-run
judges' notes from the original results (malus assignments, ignored
tricks, etc.) are pulled in and prefixed by run, e.g.
`Run 1: trick #4 has malus`.

## Import and export

All file actions live under `File` in the drawer menu. On mobile
you also get undo/redo in the menu header.

### Save and Load (browser)

- **Save** - name the current program; it is stored in this
  browser's `localStorage`. Existing names can be overwritten.
- **Load** - reopen any previously saved program. The number next
  to `Load` shows how many slots are used.
- **New** - start an empty program. Any unsaved changes are
  discarded (with confirmation).

This storage is per-browser, per-device. Clearing site data wipes
it. To move a program between devices, use **Export JSON** below.

> **Browser storage is not a reliable backup.** `localStorage` can
> be wiped at any time - by clearing browsing data, by the browser
> evicting it under storage pressure, by switching browsers or
> devices, or by using private / incognito mode. If you need a
> 100% guarantee that a program will survive, **export it to JSON**
> and keep the file somewhere safe (cloud drive, git, email). Treat
> the in-browser Save / Load as a convenience cache, not as the
> source of truth.

### Export JSON

`Export JSON` downloads a portable `.arb.json` file. It contains
the runs, bonuses, program settings and the program name. Send it
to a teammate or commit it into [test_data/](test_data/) as a
fixture.

### Export Markdown

`Export MD` downloads a human-readable report: run-by-run trick
lists with coefficients, bonuses, per-run stats, the Final Score
breakdown and any violations. Useful for briefing a coach or
sharing a plan by email.

### Import JSON

`Import JSON` opens a file picker for `.arb.json` files (the old
`.apc.json` extension still works). If the current program has
tricks you will be asked whether to overwrite.

### Share link

`Share link` copies a short URL to your clipboard. Paste it into
a chat, email or notes app, and whoever opens it loads the routine
directly into their builder.

The link looks like `…/builder?s=Ab12Cd34`. Behind the scenes the
program is uploaded to a small Cloudflare Worker and stored under
that 8-character id for **7 days**, then automatically deleted.
After 7 days the link returns "expired or not found".

When the recipient opens the link, the builder asks before
overwriting an existing program with content. The query parameter
is stripped from the address bar after import, so reloading the
page does not re-import again.

### Import link

If you have the share link in your clipboard but want to load it
into the PWA you already have open (handy on iOS, where tapping a
link in a chat always opens the browser instead of the installed
app), use `Import link`. It tries to read the link from your
clipboard, falls back to a paste field, and accepts either a full
URL (`…/builder?s=Ab12Cd34`) or just the 8-character id. The same
overwrite confirmation as for shared links applies.

### Import AWT

`Import AWT` (mobile menu) loads a pilot's program from a past
acroworldtour.com competition. Pick a competition, then a pilot,
then preview the run-by-run breakdown before confirming.

The competition and result data is bundled with the app from a
local snapshot, not fetched from acroworldtour.com at runtime.
The snapshot is refreshed manually on releases, so very recent
events may take a few weeks to appear. The picker shows the
snapshot date at the top so you can tell how stale the data is.

## Mobile vs desktop

The layout auto-switches based on viewport width
(`max-width: 1023px` is the mobile cutoff). Business logic, data
and validation are identical - only the presentation differs. In
particular:

- Mobile uses a horizontal swiper for runs and tap-to-arm for
  placement.
- The Rules and Tricks doc sidebars become off-canvas drawers below
  1024px, opened by the `≡ Contents` bar at the top.
- Mobile trick cells have `L / R` side toggles and an inline `✕`
  for remove.

The address bar is shared: URLs like
`/docs/tricks?trick=sat-to-misty` or `/docs/rules?s=3-3-1` deep
link into a specific section, on either layout.

## Feedback and links

The speech-bubble button in the nav opens a small menu with:

- **GitHub Issues** - report bugs or request features.
- **Email** - write to the maintainer.

The version number is shown at the bottom of the Home page and at
the bottom of the drawer menu on mobile.
