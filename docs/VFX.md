# VFX: how the game makes its effects (Calissa's)

The owner: the game's vibe lives in the VFX seen all the time, combat above all ("30% impact, 70% VFX"); the Lockheart's opening is the
gold standard, pushed until almost garish. Directing must stay cheap.

## The rule: names in the code, looks in the data

Code never builds particles, meshes, lights or shakes. It says **what happened**, by name, and where:

```js
game.vfx.play('hit.blunt.clay', { pos, dir, normal, tint, power });   // a one-shot
const h = game.vfx.play('ult.pillar', { pos }); h.k = 0.3; h.stop();    // a held one
```

Every look is data in `src/vfx/library.js`; a direction note is an edit there and nowhere else.
- **Names fall back:** `hit.slash.crystal` → `hit.slash` → `hit`. Nothing ever plays nothing.
- **Families inherit** (`extends`): change the base and the family follows.
- **Layers are small primitives**, each with its own clock (`at`): `sprites`, `mesh`, `decal`, `light`, `flash`, `shake`, `hitstop`,
  `smear`, `glyph`, `sound` (Wanda's, by name), `fx`. A new layer kind is a case in `vfx/vfx.js`, for every effect at once.
- **`power` scales** one effect from a tap to a full blow.

Prior art: Niagara and VFX Graph (emitters played as one system), FFXIV's `.avfx` (named by use, layered), fighting games' hit tables.

## What the hit says (the shape language)

Stars and a ring: it landed. Streaks: how hard and which way. A puff: soft. Shards and glints: brittle. **Gold** sparks: a weak point
or a critical. **Labradorite:** the Mind (stun, reprogram). A **grey puff, no star**: it did nothing. A **ward ring**: refused. A **kill**
adds a pop of the creature's own colour. Every blow plays `hit.<tool>.<material>[.kill]`; the material is a tag on the thing (`clay`,
`crystal`, `jelly`, `wood`, `stone`, `metal`: `MATERIALS` in vfx.js).

## The pieces

| piece | where | contract |
|---|---|---|
| shaped GPU particles | `vfx/sprites.js` | 16 shapes in one atlas, stateless on the GPU |
| the player | `vfx/vfx.js` | `play(name, ctx)`, held handles, `hit({ kind, cause, point, dir, power, kill, type })` |
| swings | `vfx.swing(name)`, `swing.*` | `trail` ribbons and `perM` sprites; a tool says where its striking part is (`.follow(fn)`) |
| status auras | `vfx/auras.js`, `aura.*` | a status shown round a creature while it lasts, sized to it |
| damage looks | `damage.<type>` | one colour and motif per type (ART.md section 2), laid over the hit |
| temper | `vfx/temper.js`, `temper.*` | mental state and EmO on the body: gloss chalk to glass, steam, sparks |
| **budgets** | `BUDGETS` in vfx.js | particles, flash, shake and hitstop per second of combat (token buckets): a busy fight thins out instead of washing white; a cinematic (`ctx.cine`) is outside them |
| effect meshes | `source_assets/vfx/effects.blend` → `src/assets/vfx/*.glb` | picked up by name (ART.md, section 8) |
| decal textures | `src/assets/vfx/tex/*.png` | any picture a decal wears (the circles: `circle_lotus`, `circle_swirl`) |
| sequences | `cine/sequence.js`, `cine/sequences.js` | cinematics as data, below |
| the workbench | `workbench/`, chat `/workbench` | CINEMA, EFFECTS (edit live, Apply, Copy back), MODELS (turntable, counts), TEXTURES |

## Cinematics as data

```js
const seq = game.cine.play('lockheart.opening', { anchors: { courier: () => pos, coffin: () => cof }, yaw });
seq.go('key', { tint, i });   // the game says WHEN a beat comes; the data says WHAT happens in it
seq.stop();
```

A sequence is **segments** (one per beat) of **tracks**: `camera` (keys of `{ at: anchor, off: [right, up, forward] }`, `fov`, `roll`,
`cut`; `offs` one framing per repeat), `fx` (`until`, `follow`), `bars`, `time`, `mood`, `sound`, `cue`. A segment with `len` stretches to
the beat the game gives. Offsets are in the anchors' frame, so it plays the same anywhere; the camera is kept out of walls
(`shotclear.js`). Directed by eye in `/workbench` → CINEMA (scrub, KEY THIS VIEW, APPLY, COPY SEQUENCE back to the file).
Prior art: Unity Timeline and Unreal Sequencer, FFX's and KH's summons, Source's choreographed scenes.
