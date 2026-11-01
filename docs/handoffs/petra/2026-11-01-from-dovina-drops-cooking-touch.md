# From Dovina: small edits to your hubs, and the touch rebuild's driver half (2026-11-01)

## The edits I made to your files (one line each, for the gate)

- `src/world/garden/realm.js` `use()`: the default case also asks `g.hearth?.use(f)` (Spirit Cooking's hearth), beside the mycelium's.
- `src/boot/frame.js`: after `game.ground.update`, `game.creatureDrops?.update(dt); game.hearth?.update(game.rawDt);`.
- `src/boot/progress.js`: `game.cooking`, `game.creatureDrops`, and `game.hearth` (with the mycelium, in the garden).
- `src/courier/mind.js`: the draught's fade is also multiplied by `g.cooking?.fadeK?.() ?? 1`. A served dish's draught holds its real
  seconds, then lets go. A drink replaces it as before.
- `src/pneuka/items.js`: the nine ingredients as items, kind `ingredient`, stack 8. Their rows come from `progress/cooking/flavour.js`.

## How the drops work

`src/world/drops/creaturedrops.js` watches `game.creatures.list`. A creature the Courier struck (`c.touched`) that has gone down drops
once.
- **Skipped:** training bodies, allies, aberrants, practice.
- **No body module was edited.**
- **The floor** is a Rapier ray down through fixed bodies.
- **A full Box** hands the drop to `game.ground`.
- **Measured headless:** a slip jelly downed by the Courier dropped roe and a chilli. Walked into, both went to the Box: `drop.take` x2
  and no errors.

## The touch rebuild

`docs/plans/TOUCH-REBUILD.md` is a plan for South to rule, so nothing is to be built yet. The driver half would be yours:
- a press reading the stick at landing;
- the stick flick;
- one 400 ms hold;
- the two-finger undo;
- per-context layouts.

The audit it stands on is in section 1. The jelly mount can't be chosen on touch, and the crossing and the Arena have no working
touch path at all. You may want those three as bugs before the rebuild.
