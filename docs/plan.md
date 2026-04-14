# Service development plan

## Description

A service for building competition programs for AWT/AWQ events.

On the home page the user picks the competition type they want to
build a run for.

After that the user lands on the constructor screen. The constructor screen
consists of:

- a trick list
- dynamic settings
- a panel displaying active restrictions

Dynamic settings:

- number of runs
- after how many runs tricks may be repeated (by default repetition
  is not allowed)

The user must be able to build N runs. Runs are laid out as a table
where rows are tricks and columns are run numbers. The initial number
of runs is derived from the selected competition type.

The user sees a list of tricks sorted by coefficient and can drag them
into a cell belonging to a specific run.

The user can remove a trick from a cell; removing a trick must also
remove all of its modifiers in that cell.

While the user builds the program, the run table continuously reacts
to state changes and checks the current program against the list of
business rules. Business rules are constraints on tricks: order,
sequence, repetition and so on. When a restriction fires, the rule
must be shown under the run list and the cell(s) that triggered it
must be highlighted.

There are various trick modifiers: reversed, twisted, devil twist etc.
After dragging a trick into a cell the user can click on it and pick
a modifier from a popover. The modifier then affects the trick's
value. The UI must show that a modifier has been applied to a cell.

run - one stage of the competition, typically held on a separate day.
acro - a paragliding discipline where athletes perform various tricks
on a paraglider.

## Technical notes

The service should be as simple as possible. Add complexity only when
strictly necessary. The service most likely does not need to store
any data in a DB - static reference data (tricks, rules and so on)
is enough.

The service obviously needs some business logic to apply the rules
to the program being built.

The service needs a UI frontend, and possibly that is all it needs
(worth thinking about). Who will evaluate the rules - JS? Is that
still frontend?

The UI should not be over-engineered, but modern and stylish.

The UI must work and look good on mobile devices in portrait
orientation.

The service will need hosting. Can it be hosted on GitHub Pages?

## Future work

AI should not take this into account. This is a later stage.

In the future we would like to plug in an AI-based program efficiency
analyzer and real-time hints while the program is being built.
