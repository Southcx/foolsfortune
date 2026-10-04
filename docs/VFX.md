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

## What is built

| Piece | File | |
| --- | --- | --- |
| Shaped GPU particles | `src/vfx/sprites.js` | 16 shapes in one atlas; turn and spin, velocity stretch, colour and alpha over life, pop-in, twinkle; stateless on the GPU |
| The player | `src/vfx/vfx.js` | `play(name, ctx)`, handles for held effects, `hit({ kind, cause, point, dir, power, kill })`, the layer types (now with `decal`) |
| The library | `src/vfx/library.js` | `hit` family (blunt, slash, shot x clay, crystal, jelly, and `.kill`), `poof`, `chest.sigil`, the Lockheart opening (`ult.*`) |
| Effect meshes | `source_assets/vfx/effects.blend` -> `scripts/export_vfx.py` -> `src/assets/vfx/*.glb` | made in **Blender** (docs/LOOK.md); every GLB is picked up by name |
| Decal textures | `src/assets/vfx/tex/*.png` | the spell circles the owner's wife drew (`circle_lotus`, `circle_swirl`), and any picture a decal should wear |
| Combat | `creatures.strike`, `breakables.damage`, `clappers.hit` | every blow plays `hit.<tool>.<material>[.kill]`; the material is a tag on the thing (`clay`, `crystal`, `jelly`, `wood`, `stone`, `metal`: `MATERIALS` in vfx.js), else guessed from its kind |
| **The workbench** | `src/workbench/workbench.js`, chat **`/workbench`** | the game's own studio: CINEMA (the sequences, below), EFFECTS (play, loop, power, tint, speed; edit the data live and Apply: here and in the world, kept in the browser; Copy it back out), MODELS (every GLB, tool, thing and curio on a turntable: wireframe, normals, UV checker, counts, a 1.7 m figure; the Courier plays every clip of the game's pack), TEXTURES (the effect textures, the circles, the sprite atlas) |
| **Swings** | `vfx.swing(name)`, library `swing.*` | a held look for anything that sweeps: `trail` layers (ribbons between the two ends, `span` along them: a wide body, a hot edge at the tip) and `sprites` with `perM` (shed per metre the tip travels). The cutlass, the Dreamvane's pick, the Soul Brush's club and the kick each wear theirs (`swing.cutlass`, `.dreamvane`, `.brush`, `.kick`); a tool says once where its striking part is (`swing(name).follow(fn)`); previewed in the workbench on a slash |
| **Status auras** | `src/vfx/auras.js`, library `aura.*` | every creature's statuses shown round it while they last (`aura.<status>[.<kind>]`): sleep, halt, slow, melt, calm, soft, haste, empower, forget; quiet, sized to the creature, fading as the status runs out |
| **Damage looks** (plan B5) | library `damage.<type>`, `vfx.hit({ type })` | one colour and motif per damage type on the Law–Chaos line, laid over the hit: **Impact** bone and gold, crystal facets, a square flash; **Ego** lapis, a hex lattice that opens and holds; **Influence** rose and warm gold, slow ripples and petals; **Illusion** the labradorite's flash, curls and restless glints; **Delirium** ink and violet-green, smoke, drips, bubbles. Each differs in shape and lightness as well as hue (readable without colour vision) |
| **Temper** (plan B5) | `src/vfx/temper.js`, library `temper.*` | a creature's mental state and EmO shown with its body: gloss from chalk (Stoic) to glass (Prismatic), held looks at the ends (dry flakes and dust; glints and drips of colour), steam when agitated, sparks and red-gold rings at an enrage; `temper.look(c)` offers the body a glow and a tremble |
| **Budgets** | `BUDGETS` in `src/vfx/vfx.js` | what a second of combat may spend: particles, flash, shake, hitstop (token buckets). A busy fight thins out instead of washing white; a cinematic (`ctx.cine`, set by the sequences) is outside them, and the workbench shows effects whole |
| **Sequences** | `src/cine/sequence.js`, `src/cine/sequences.js` | cinematic events as data: camera keys, effects, bars, slow time, mood, sounds and cues on a timeline per segment, played by name (`game.cine.play`) |
| Chat | `/vfx <name> [tint]`, `/vfx`, `/opening`, `/workbench` | |

## Cinematics as data (sequences)

A cinematic event (the Lockheart's opening, a chest's opening: `lockheart.opening`, `chest.open`) is a **sequence** in `src/cine/sequences.js`, played by name:

```js
const seq = game.cine.play('lockheart.opening', { anchors: { courier: () => pos, coffin: () => cof }, yaw });
seq.go('key', { tint, i });   // the game says WHEN a beat comes (how many keys, when the wheel lands)
seq.stop();                    // the data says WHAT happens inside it
```

A sequence is **segments** (one per beat), each a small timeline of **tracks**: `camera` (keys of `{ at: anchor, off: [right, up,
forward] }` for where it stands and what it looks at, `fov`, `roll`, `cut`; `offs` gives one framing per repeat, a cut per key),
`fx` (an effect from the library at an anchor; `until` holds it to a later segment, `follow` keeps it on a moving anchor), `bars`,
`time`, `mood`, `sound`, `cue`. A segment with `len` stretches to the length the game gives the beat (a chest's charge is
longer the higher its tier). Offsets are in the anchors' own frame, so a sequence plays the same wherever it happens; the camera is
kept out of walls (`shotclear.js`).

**Directing one, by eye:** `/workbench` -> CINEMA. Pick a segment: it plays on the stage with its anchors stood in (from `preview`), the
camera's path drawn in blue (cuts in red). VIEW: SHOT looks through the sequence's camera; VIEW: ORBIT walks round it. Scrub to a time,
frame the shot with the orbit camera and KEY THIS VIEW (or REMOVE KEY); edit any track in the JSON. APPLY plays it here and in the
world (kept in this browser), PLAY ALL strings the segments as the game does (`order`), COPY SEQUENCE puts it on the clipboard for
`cine/sequences.js`, REVERT goes back to the file.

Prior art: Unity's Timeline and Unreal's Sequencer (tracks of keys on one clock), Final Fantasy X's and Kingdom Hearts' summons (a
camera per beat, the beats driven by the battle), Source's choreographed scenes (authored relative to the actors).

## Sacred geometry (the owner's direction)

Geometric mandalas, the lotus of life and the rest of sacred geometry are part of the design language: circles of power are drawn
ones (hand-inked, black on white, made alpha), layered at different sizes, turning against each other. New circles go in
`src/assets/vfx/tex/` (any PNG, black ink on white or white on transparent) and are worn by a `decal` layer.

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
   The material is a tag on the thing (built: `vfx.hit` reads the tags `clay`, `crystal`, `jelly`, `wood`, `stone`, `metal`; the things still need tagging: tags.js, Petra's).
2. **What the hit says** (the 70%): the shape language is consistent across the game, so it can be read without thinking:
   - stars and a ring: it landed; streaks: how hard and which way; a puff: it was soft; shards and glints: it was brittle;
   - **gold** sparks: a weak point or a critical; **labradorite**: the Mind (stun, reprogram); **grey dull puff, no star**: it did
     nothing (armoured); a **ward ring**: refused (the existing resist mark);
   - a **kill** adds a pop of the creature's own colour and a few of its own pieces (the dissolve already does this for zandatsu).
3. ~~Trails and swings~~: built (`vfx.swing`, `swing.*`), on every swung tool and the kick.
4. ~~Status auras~~: built (`vfx/auras.js`, `aura.*`).
5. ~~A VFX test bench~~: built into the game as the workbench (`/workbench`).
6. ~~Budgets~~: built (`BUDGETS`, vfx.js).
