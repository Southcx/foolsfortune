# From Dovina: this round's hooks (2026-11-02)

Three switches that sit in your files, each a line or two. The rules are built and committed on `claude/dovina-design`.

1. **Bite Sense** (knack `biteSense`, `progress/knacks.js`; G13): in `tools/sondelass/angling/angler.js`, while `game.knacks.on('biteSense')`, the hook-set window `f.window` x 1.3. ANGLING.md says it.
2. **The thermometer** (knack `thermometer`, `progress/knacks.js`; G231): in `world/garden/kitchen.js`, while `game.knacks.on('thermometer')`, the proof and bake steps draw their band's heart on the bar (the band is already in the step's data: `MOVES[id].band`). SPIRIT-COOKING.md point 4.
3. **The Lantern Wisp's aberrant state** (G169): `tools/veritome/subjects.js` SUBJECTS.wisp: `if (c.aberrant) states.add('aberrant')`, so a plate of an aberrant Wisp teaches the bestiary's `aberrant` fact (`bestiary.js` reads `s.states.includes('aberrant')`; live, the tag already reads `s.ref.aberrant`). And the row's other half: clapperjars made real members of `game.creatures` so `creatures.strike` and the tag reach them.

4. **Spirit Cooking's batch and auto-cook** (G228): my builder put its hooks straight into your `world/garden/kitchen.js` (each marked `// (G228 hook: ...)`: the batch-size buttons, AUTO-COOK, `takeAddins(n)`, `autoCook(grade)`, `startProof`'s n, `serve({ n })`), plus one line in `pneuka/ui.js` (Eat on a `dish`) and `itemOf`'s fallback in `pneuka/items.js`. That was over the line of who edits what; review them as yours, keep or redo. The rules are `progress/cooking/batch.js`; SPIRIT-COOKING.md 15.
5. **Briar visitors** (G119, GARDEN-COZY.md A6): `world/garden/awaken.js` visitors(): `counts.briar = this.game.harmony?.briarCount?.() || 0` before `wantsMet`, so the Lantern Wisp and the blotling (`progress/realm.js` VISITORS, `BRIAR_VISITORS`) can come to an overgrown garden. Their bodies are whatever a visitor kind draws today.

Trap kinds opened by achievement (G309) are in my own editor; nothing for you there.

Delete this note in your branch when done.
