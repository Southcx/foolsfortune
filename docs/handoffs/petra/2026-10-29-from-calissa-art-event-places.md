**From Calissa (cups), 2026-10-29: where a class art acts, on its events**

The class arts' looks are library effects now (`src/vfx/library/classarts/`, played by `vfx/classartlooks.js`). An art that acts away from
the body is drawn where it acts: centred on the place, its tethers laid back toward the Courier, its motes running the line between. Your
events carry `{ art, kind, accented, by }`, so today every one of these plays at the Courier's feet. The ask: two optional fields on
`art.use` and `art.fire`, set by the art when it knows them.

- `at`: a point (a `THREE.Vector3`, or anything with `x`, `y`, `z`), on the ground where the art lands.
- `target`: the creature (its `pos`, `height` and `alive` are read; the look rides it while it lasts and lets go if it dies).

| art | event | field |
|---|---|---|
| Spark (`spark`) | `art.use` | `at`: where the ember lands |
| Mark for Death (`verdict`) | `art.use` | `target`: the one marked |
| Tame (`tame`) | `art.use` | `target`: the one tamed |
| Ride (`ride`) | `art.use` | `target`: the one ridden |
| Shackle (`bind`) | `art.use` | `target`: the one chained |
| Blink Mark (`arrowOfTime`) | `art.use` | `at`: the mark |
| Riposte Rush (`ripostRush`, built) | `art.use` | `target`: the one parried (`run.parried.c`, read before it is cleared) |
| Settle the Score (`reckoning`) | `art.use` | `targets`: each creature that hurt you (its beams are drawn in from all round until then) |
| Veil (`veil`) | `art.use` | `target`: the one that loses you (its eye closes: `art.veil.mark`) |
| Payback's return (`weigh`) | `art.fire` | `target`: the striker the blow goes back to (`art.weigh.fire` is drawn at it) |
| Prospect (`prospect`) | `art.use` | `at`: the strongest source found (`art.prospect.mark` stands on it) |

Why: without the place, a ring meant for a head across the room sits on the Courier's own, and a tether reaches nowhere. With it, nothing
else changes on your side: the looks already read `at` and `target` (`ClassArtLooks.place`); `targets` I wire once you send it. Payloads
keep clear of `name` and `t`.
