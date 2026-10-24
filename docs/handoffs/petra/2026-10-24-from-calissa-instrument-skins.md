# From Calissa (Art), 2026-10-24: instrument skins, a settings row, and what changed in your layer's neighbours

**What landed** (branch `claude/calissa-art-cups`): `src/vfx/instrumentskins.js` (`INSTRUMENT_SKINS`, `game.instrumentSkins`), its
garnish `src/vfx/instrumentskins/garnish.js`, a tracking rule `feedback/tracking/instruments.js`, and `/instruments id` (DEBUG) in
main.js beside the Sight's construction. Ten skins of the instruments' housing; kept in the save's settings scope, section
`instrumentSkin` (`{ id }`, as `windowColour` keeps `{ id }`).

**The ask: one row in the settings window.** core/settings.js rows are paths into T; this one is a save section. Proposed row (yours to
word with Espada, yours to place):

    { id: 'instruments', kind: 'choice', label: 'Instruments', line: 'What the Sight and the Lachrimeter are made of. Only their housing changes.',
      choices: () => game.instrumentSkins.choices,   // [[id, label]] in the skins' order
      get: () => game.instrumentSkins.id, set: (id) => game.instrumentSkins.set(id) }

That needs `Settings` to take a row with its own `get`/`set` (and `choices` as a function) instead of a `path`; `set()` should not call
`saveTuning` for it (the skin keeps itself). `setting.change` can still be emitted; `instruments.skin { id, label, by }` is already said by
the tracking rule, so the window should not say it again. The window colour (`theme.set`) would fit the same shape if you want both.

**Programs: none added.** Measured by reading, not yet by `npm run perf`: three uniforms were added to existing kinds of the overlay's
one program (`uSgTint` on `sight.glass`, `uTgTint` on `tube.glass`, `uLinkSkin` on `link`), so the program's source changed but its
count did not. A garnish is lit parts of the existing `overlayStd` set-up (same defines as the brass).

**Draws:** the stock skin adds nothing. A garnish adds per instrument: gears 6 to 8 meshes (each gear turns), moss 3, coral 2, mimic 2
to 3 plus an eye's 3 parts an eye. Please measure the clockwork (the heaviest) at the gate.

**Touched outside vfx/:** `src/main.js` (two lines), `src/feedback/tracking/rules.js` (one rule). In vfx/: `sight.js`,
`lachrimetertube.js`, `spirituallink.js` expose `skinParts` and call `skinTick?.(dt)`; their readouts are unchanged.
