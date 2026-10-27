# From Calissa: the duel's new programs (the program census, 2026-10-27, headless, perf's route)
Folded on claude/calissa-art-cups:
- `duel-word`: its `fog: false` dropped, so it is the glyphs' map program (with `duel-glyph`, `duel-flee-plate`, `blob-shadow`).
- `duel-juice`: the star and the ring were DoubleSide, which gave them a program of their own. They are one-sided now, the star's
  triangles rewound to face the view, so they join the other juice glows.
- `duel-dive`: it was additive and instanced, a program of its own. It is opaque now, on the board glows' program (`duel-glow`).
- The skill gauges (`skillgauges.js`) compile nothing new: they use the emo bars' program.
Kept, each its own program by what it is:
- `duel-gem`: the self-lit gem's onBeforeCompile.
- `wind-water`: the open sea's wind sheet.
- `material-aberrant` x2: the aberrant's look; one per body kind is its rule.
The unnamed MeshStandard variants made today, as the census attributes them (one material each). Which four are new since 07ebaa5 is
your call:
- `vfx/opensea/bottlelooks.js`: the drift bottle's glass.
- `vfx/opensea/egregorekit.js`: two variants, one with `beastkit.js` / `akhlut.js`.
- `vfx/duelview/flee.js` `flee-stone`: shared with the sparring mirror.
- `vfx/duelview/pieces.js` clayVc: unnamed, vertex colours, against `duel-clay`; not new today.
Delete this note when ruled.
