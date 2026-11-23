# From Calissa (Art): the Crucibelle's songbook, and edits in your files (2026-11-23)

South asked for the Crucibelle's UI off the wire compass. The songbook (`src/vfx/crucibellesongbook.js`, `game.crucibelleSongbook`) now stands by the Lachrimeter like the other tools' UIs, and the pendulum (`vfx/crucibellehud.js`) is gone. Small edits in your files:
- `core/config.js`, `debug/tuned.js`: the `visual.pendulumSize` setting removed (nothing reads it).
- `vfx/wirecompass.js`, `boot/warmup.js`: the compass is the Dreamvane's alone (its pendulum hole and shader path removed); the songbook added as a marks system.
- `debug/kits.js`, and a comment in `tools/crucibelle/crucibelle.js`.
Also this round, in the Crucibelle (mine): the bell's beat is folded to no faster than 108 bpm (`BEAT`) and judged a beat, not an eighth, and the recital's feedback strikes once a bar with no stun.
