# VFX: how the game makes its effects (the plan, and what is built)

The owner's direction: the game's vibe lives and dies with the VFX you see all the time, combat above all ("30% impact, 70% VFX");
effects are multilayered; the Lockheart's opening is the gold standard for a cinematic event, pushed until it is almost garish. And the
worry: iterative directing should not shoot us in the foot. This is the system meant to make that safe.

## The rule that keeps directing cheap: names in the code, looks in the data

Game code never builds particles, meshes, lights or shakes. It says **what happened**, by name, and where:

```js
game.vfx.play('hit.blunt.clay', { pos, dir, normal, tint, power });   // a one-shot
const h = game.vfx.play('ult.pillar', { pos }); h.k = 0.3; h.stop();    // a held one
```

Every look lives in **one file of data**, `src/vfx/library.js`. Redirecting the look ("hits should be bigger", "crystal should ring
more", "make poofs cuter") is a change to that file and nothing else: no system is rewritten, nothing that asked for the effect
changes. That is the centralisation: one place to direct from. The modularity is underneath it:

- **Names fall back.** `hit.slash.crystal` is looked for, then `hit.slash`, then `hit`. A new tool or material has a look the day it
  exists, and gets its own when someone writes it. Nothing ever plays nothing.
- **Families inherit.** `hit.blunt` `extends: 'hit'`; `hit.blunt.clay` extends `hit.blunt`. Change the base and the family follows;
  change a member and only it changes. This is how a direction note ("all hits a bit more violent") lands in one edit.
- **Layers are small primitives**, each one thing, each with its own clock (`at`): `sprites` (shaped particles: star, streak, ring,
  puff, shard, chip, petal, bubble...), `mesh` (an effect mesh made in Mesh Create), `light`, `flash`, `shake`, `hitstop`, `smear`
  (the PS2 frame feedback), `glyph`, `sound` (Wanda's sfx, by name), `fx` (another effect). A new kind of layer is a new case in
  `vfx/vfx.js`, available to every effect at once.
- **`power` scales**: one effect serves a tap and a full-strength blow (counts and sizes grow with it).

Prior art: Unreal's Niagara and Unity's VFX Graph (an effect is emitters, a module stack each, played as one system), Final Fantasy
XIV's `.avfx` (effects named by use, layered: particles, models, lights, screen), fighting games' hit tables (a move names its hit
effect; the effect is tuned apart from the move).

## What is built (this round)

| Piece | File | |
| --- | --- | --- |
| Shaped GPU particles | `src/vfx/sprites.js` | 16 shapes in one atlas; turn and spin, velocity stretch, colour and alpha over life, pop-in, twinkle; stateless on the GPU |
| The player | `src/vfx/vfx.js` | `play(name, ctx)`, handles for held effects, the layer types above |
| The library | `src/vfx/library.js` | `hit` family (blunt, slash x clay, crystal, jelly), `poof`, the Lockheart opening (`ult.*`) |
| Effect meshes | `src/vfx/meshfx.js`, `source_assets/meshflow/`, `tools/meshflow.mjs` | made in Mesh Create; every baked GLB is picked up by name |
| Directing from the game | chat: `/vfx <name> [tint]`, `/vfx` (the list), `/opening` | play any effect in front of the Courier; play the whole Lockheart opening without keys |

## The Lockheart's opening (the gold standard)

Beats and their effects (`ult.*` in the library): the invocation (a whirl on the ground, motes drawn in from all round, glints rising
off the circle, diamonds spiralling) held; each key (a core flash, stars in its colour, rings, a sphere of streaks, sparkles, petals,
a light, a shake); the ascent (a burst, two shockwave bands, a geyser of streaks, a flash, a light); the pillar, held (two columns of
Lachryma, the great helix, streaks and sparkles flowing up, petals orbiting) and a crown of flame round the coffin, held; while the
wheel turns, the pillar and crown step back so the wheel reads; the landing (a flash, hitstop, shake, smear, two lights, a dome, three
shockwaves, a hundred and forty streaks, stars, petals, a ring of smoke, lingering sparkles).

## Proposed next (combat, where it matters most)

1. **Every blow plays a hit.** `creatures.strike` and the breakables already know the tool, the target and the result: one call
   site plays `hit.<tool>.<material>` with `power` from the blow (and `.crit`, `.parry`, `.block`, `.kill` suffixes when they apply).
   The material is a tag on the thing (`tags.js`: `material: 'clay' | 'crystal' | 'jelly' | 'metal' | 'wood' | 'stone'`).
2. **What the hit says** (the 70%): the shape language is consistent across the game, so it can be read without thinking:
   - stars and a ring: it landed; streaks: how hard and which way; a puff: it was soft; shards and glints: it was brittle;
   - **gold** sparks: a weak point or a critical; **labradorite**: the Mind (stun, reprogram); **grey dull puff, no star**: it did
     nothing (armoured); a **ward ring**: refused (the existing resist mark);
   - a **kill** adds a pop of the creature's own colour and a few of its own pieces (the dissolve already does this for zandatsu).
3. **Trails and swings** (`vfx/trail.js` exists) join the library as a layer type, so a tool's swing and its hit are directed together.
4. **Status auras** (slow, sleep, burn...) as held effects on the creature (`creature.status` events).
5. **A VFX lab page** (`/dev/vfxlab.html`): every effect on a loop, a scrub bar, the library hot-reloaded, so the owner can direct by
   looking.
6. **Budgets**: a cap on live sprites and on screen-weight per second (flash, shake, hitstop) so a busy fight stays legible and within
   the comfort rule (no flicker: a flash is one wash, never repeated fast).
