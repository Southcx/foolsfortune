# From Dovina: three hooks for the last three level-30 rungs (2026-11-01, overnight, for your morning)

Your four hooks from the first note (defer, plate, the strike's type, `mayReprogram`) are in. Those carried seven first relations and
four second ones. The three rungs left at 30 each need one small hook in a file of yours. The rules are mine (`progress/domainarts.js`)
and so is the runtime (`courier/domainarts/run.js`), as before. Each hook is a call that returns nothing or a number, a no-op when the
rung is off.

## 1. Psychokinesis: the catch (a reaction). Hook in `courier/parry.js`
- **In play:** a projectile you parry while the parry key is still held is caught instead of sent back. It hangs before your hand for
  up to 1.5 real s, then is thrown where you aim with its own energy plus yours (x1.5 damage, Impact). Prior art: Half-Life 2's gravity
  gun. Its feat: 10 projectiles returned to whoever threw them.
- **The hook:** in `deflect`, before sending the projectile back:
  `if (game.domainArtsRun?.catch?.(pr)) return pr;`
  When it returns true, the runtime owns the projectile: it holds it with `place(pr)`, then on release calls your send-back with a
  direction and a multiplier.
- **What I need:** your send-back exported as `throwBack(game, pr, dir, mult)`, so a caught projectile leaves by the same path a
  parried one does (its `by` becomes the Courier's).

## 2. Possession: the link (a passive). Hook in the vessel's blow (`courier/vessel/damage.js`)
- **In play:** a creature you have reprogrammed is bound to you for the fight. A crack meant for you is split: half to you, half struck
  on it (an Influence blow, `by: 'courier'`). Prior art: Dishonored 2's Domino.
- **The hook:** where a blow becomes a crack:
  `amount = game.domainArtsRun?.share?.(amount, region, hit) ?? amount;`
  The runtime strikes the bound creature itself through `creatures.strike`. The other direction (a blow on the creature) needs nothing
  from you: I listen to `creature.struck`.

## 3. Alteration: reactions (a passive). Hook in the paint map (`world/ground/paintmap.js`)
- **In play:** where one feeling's paint is laid over another's, the two react:
  - opposites cancel, and the cell is wiped to bare ground (a calm patch);
  - an agate pair (`agateOf`, `progress/weather.js`) leaves the stronger feeling's paint with a glint of the weaker, and counts as a
    reaction for the feat.
  Prior art: Divinity: Original Sin 2's surfaces, Magicka. Its feat: 15 reactions set off.
- **The hook:** in `stamp`, where a cell already holds another aspect:
  `const r = game.domainArtsRun?.react?.(was, aspect);`
  It returns `'cancel'` (clear the cell), an aspect to write instead, or nothing (as now). The map stays yours; the rule only answers.

None of the three changes a base rule while the rung is off (each hook falls through to what you do now). Delete this note in your
branch when they are in.
