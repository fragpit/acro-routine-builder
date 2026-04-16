# Manual test fixtures

Ready-to-import `.arb.json` programs for manual UI testing. Each file
targets one business rule from
[../docs/trick_rules.md](../docs/trick_rules.md) and is named after it.

Import via the Constructor: **Load from file** → pick a file below.

## Files

| File | Rule |
| --- | --- |
| [1.1-must-be-first.arb.json](1.1-must-be-first.arb.json) | Flat Stall to Infinity not in the first position |
| [1.2-cannot-be-last-two.arb.json](1.2-cannot-be-last-two.arb.json) | Tumbling / Esfera in the last two positions |
| [1.2-flipped-last-two.arb.json](1.2-flipped-last-two.arb.json) | Flipped manoeuvre in the last two positions |
| [2-forbidden-connections.arb.json](2-forbidden-connections.arb.json) | SAT -> SAT-based combo, Helicopter -> Helicopter-combo |
| [3.1-high-coefficient-limit.arb.json](3.1-high-coefficient-limit.arb.json) | More than 2 manoeuvres with coefficient >= 1.95 |
| [3.2-one-per-run-stall-inf.arb.json](3.2-one-per-run-stall-inf.arb.json) | Two stall-to-infinite family manoeuvres in a run |
| [3.3-tumbling-inf-rhythmic-limit.arb.json](3.3-tumbling-inf-rhythmic-limit.arb.json) | More than 2 tumbling / infinity / rhythmic manoeuvres |
| [3.4-incompatible-tumbling-stallinf.arb.json](3.4-incompatible-tumbling-stallinf.arb.json) | X-Chopper / Misty to Tumbling + stall-to-infinite in the same run |
| [3.5-bonus-limits.arb.json](3.5-bonus-limits.arb.json) | Per-run limits: 6 twisted / 4 reversed / 3 flipped |
| [3.6-no-side-once-per-run.arb.json](3.6-no-side-once-per-run.arb.json) | MacFly / MistyFly / HeliFly / SatFly twice in a run |
| [4.1-repetition.arb.json](4.1-repetition.arb.json) | Same manoeuvre, same direction repeated across runs |
| [4.3-repetition-allowed.arb.json](4.3-repetition-allowed.arb.json) | Exception: Tail Slide / Wingover / Full Stall can repeat |
| [4.3-repeated-bonus-same-run.arb.json](4.3-repeated-bonus-same-run.arb.json) | Twisted / flipped bonus rewarded only once per run |
| [4.4-awt-misty-to-misty.arb.json](4.4-awt-misty-to-misty.arb.json) | Misty to Misty used with AWT mode on |
| [choreo-symmetry-unbalanced.arb.json](choreo-symmetry-unbalanced.arb.json) | L / R trick direction imbalance > 1 |
| [no-violations.arb.json](no-violations.arb.json) | Clean program, no violations |

Some files incidentally trigger neighbouring rules because tricks belong
to several groups (e.g. a 3.3 fixture can also hit 3.1 or 1.2). The
filename points at the rule the fixture is meant to demonstrate.

## Maintenance

**When adding or changing a validator / business rule, re-check the
corresponding fixture in this folder and update it (or add a new one)
so the manual test set stays aligned with the code.** Verify the file
still imports and the expected violations still fire.
