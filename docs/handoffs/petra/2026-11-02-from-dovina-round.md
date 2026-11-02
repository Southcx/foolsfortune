# From Dovina: this round's hooks (2026-11-02)

Three switches that sit in your files, each a line or two. The rules are built and committed on `claude/dovina-design`.

1. **Bite Sense** (knack `biteSense`, `progress/knacks.js`; G13): in `tools/sondelass/angling/angler.js`, while `game.knacks.on('biteSense')`, the hook-set window `f.window` x 1.3. ANGLING.md says it.
2. **The thermometer** (knack `thermometer`, `progress/knacks.js`; G231): in `world/garden/kitchen.js`, while `game.knacks.on('thermometer')`, the proof and bake steps draw their band's heart on the bar (the band is already in the step's data: `MOVES[id].band`). SPIRIT-COOKING.md point 4.
3. **The Lantern Wisp's aberrant state** (G169): `tools/veritome/subjects.js` SUBJECTS.wisp: `if (c.aberrant) states.add('aberrant')`, so a plate of an aberrant Wisp teaches the bestiary's `aberrant` fact (`bestiary.js` reads `s.states.includes('aberrant')`; live, the tag already reads `s.ref.aberrant`). And the row's other half: clapperjars made real members of `game.creatures` so `creatures.strike` and the tag reach them.

4. **Spirit Cooking's batch and auto-cook** (G228): my builder put its hooks straight into your `world/garden/kitchen.js` (each marked `// (G228 hook: ...)`: the batch-size buttons, AUTO-COOK, `takeAddins(n)`, `autoCook(grade)`, `startProof`'s n, `serve({ n })`), plus one line in `pneuka/ui.js` (Eat on a `dish`) and `itemOf`'s fallback in `pneuka/items.js`. That was over the line of who edits what; review them as yours, keep or redo. The rules are `progress/cooking/batch.js`; SPIRIT-COOKING.md 15.
5. **Briar visitors** (G119, GARDEN-COZY.md A6): `world/garden/awaken.js` visitors(): `counts.briar = this.game.harmony?.briarCount?.() || 0` before `wantsMet`, so the Lantern Wisp and the blotling (`progress/realm.js` VISITORS, `BRIAR_VISITORS`) can come to an overgrown garden. Their bodies are whatever a visitor kind draws today.

6. **Grain on a live creature** (G292, TEMPERAMENT.md): `drawGrain(kind, seed)` (`progress/combat/temperament.js`) is called nowhere, so `c.grain` is never set and the tag's grain line is always empty. At spawn, `c.grain = drawGrain(c.kind, c.seed ?? c.id)` and `c.traits = traitsOf(c.grain)` where a mind has no traits of its own; `Bound.bind` then keeps `grain` beside `traits`; and `creature.status` carrying `weak: weakTo(c.grain).includes(TYPE_OF_STATUS)` lets me count a mind cracked by its weakness. SPECIES has the slip jelly and the Lantern Wisp (`lanternwisp` there, `wisp` as the kind: I will add `wisp` as the key once you say which you read).

7. **The flat stage** (G102, FIGHTER.md 5.1): my builder moved one number in your `render/zonemap.js` (the Well's zone box, z > -3750 to -3790, lane 19 at z -3760; without it the stage is outside the zone). Also: `tools/lockheart/lockheart.js` `arenaSwing` reads only `stages.arena.kit` (no long chain on the flat stage), and `world/rooms.js`'s blurb still says "six stages".

8. **Gall and Fury in the garden** (G111, GALL-AND-FURY.md 8; rules `progress/gardenweather.js`, re-exported by `progress/realm.js`): `world/garden/plants.js`: a cell whose water `souredBy(mix)` wilts a stage a game hour as on dead ground and grows none (fair water poured, or the mop, washes it); `world/garden/hand.js`: a matter stroke x `strokeK(aspect, rain)` (the rain's feeling is your draught's, `waterworks.rain()`); moss cells keep `scorchStep` hours and turn to ash at its `scorch`; `world/garden/water.js`: Gall's share fades x `fadeK('gall')` if and when the water's shares fade.

Trap kinds opened by achievement (G309) are in my own editor; nothing for you there.

Delete this note in your branch when done.
