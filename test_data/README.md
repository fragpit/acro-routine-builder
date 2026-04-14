# Manual test fixtures

Ready-to-import `.apc.json` programs for manual UI testing. Each file
targets one business rule from
[../docs/trick_rules.md](../docs/trick_rules.md) and is named after it.

Import via the Constructor: **Load from file** → pick a file below.

## Files

| File | Rule |
| --- | --- |
| [1.1-must-be-first.apc.json](1.1-must-be-first.apc.json) | Flat Stall to Infinity not in the first position |
| [1.2-cannot-be-last-two.apc.json](1.2-cannot-be-last-two.apc.json) | Tumbling / Esfera in the last two positions |
| [1.2-flipped-last-two.apc.json](1.2-flipped-last-two.apc.json) | Flipped manoeuvre in the last two positions |
| [2-forbidden-connections.apc.json](2-forbidden-connections.apc.json) | SAT -> SAT-based combo, Helicopter -> Helicopter-combo |
| [3.1-high-coefficient-limit.apc.json](3.1-high-coefficient-limit.apc.json) | More than 2 manoeuvres with coefficient >= 1.95 |
| [3.2-one-per-run-stall-inf.apc.json](3.2-one-per-run-stall-inf.apc.json) | Two stall-to-infinite family manoeuvres in a run |
| [3.3-tumbling-inf-rhythmic-limit.apc.json](3.3-tumbling-inf-rhythmic-limit.apc.json) | More than 2 tumbling / infinity / rhythmic manoeuvres |
| [3.4-incompatible-tumbling-stallinf.apc.json](3.4-incompatible-tumbling-stallinf.apc.json) | X-Chopper / Misty to Tumbling + stall-to-infinite in the same run |
| [3.5-bonus-limits.apc.json](3.5-bonus-limits.apc.json) | Per-run limits: 6 twisted / 4 reversed / 3 flipped |
| [3.6-no-side-once-per-run.apc.json](3.6-no-side-once-per-run.apc.json) | MacFly / MistyFly / HeliFly / SatFly twice in a run |
| [4.1-repetition.apc.json](4.1-repetition.apc.json) | Same manoeuvre, same direction repeated across runs |
| [4.3-repetition-allowed.apc.json](4.3-repetition-allowed.apc.json) | Exception: Tail Slide / Wingover / Full Stall can repeat |
| [4.3-repeated-bonus-same-run.apc.json](4.3-repeated-bonus-same-run.apc.json) | Twisted / flipped bonus rewarded only once per run |
| [4.4-awt-misty-to-misty.apc.json](4.4-awt-misty-to-misty.apc.json) | Misty to Misty used with AWT mode on |
| [choreo-symmetry-unbalanced.apc.json](choreo-symmetry-unbalanced.apc.json) | L / R trick direction imbalance > 1 |
| [no-violations.apc.json](no-violations.apc.json) | Clean program, no violations |

Some files incidentally trigger neighbouring rules because tricks belong
to several groups (e.g. a 3.3 fixture can also hit 3.1 or 1.2). The
filename points at the rule the fixture is meant to demonstrate.

## Maintenance

**When adding or changing a validator / business rule, re-check the
corresponding fixture in this folder and update it (or add a new one)
so the manual test set stays aligned with the code.** Verify the file
still imports and the expected violations still fire.
