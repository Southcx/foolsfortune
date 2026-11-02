# From Dovina: this round's hooks (2026-11-02)

Three switches that sit in your files, each a line or two. The rules are built and committed on `claude/dovina-design`.

1. **Bite Sense** (knack `biteSense`, `progress/knacks.js`; G13): in `tools/sondelass/angling/angler.js`, while `game.knacks.on('biteSense')`, the hook-set window `f.window` x 1.3. ANGLING.md says it.
2. **The thermometer** (knack `thermometer`, `progress/knacks.js`; G231): in `world/garden/kitchen.js`, while `game.knacks.on('thermometer')`, the proof and bake steps draw their band's heart on the bar (the band is already in the step's data: `MOVES[id].band`). SPIRIT-COOKING.md point 4.
3. **The Lantern Wisp's aberrant state** (G169): `tools/veritome/subjects.js` SUBJECTS.wisp: `if (c.aberrant) states.add('aberrant')`, so a plate of an aberrant Wisp teaches the bestiary's `aberrant` fact (`bestiary.js` reads `s.states.includes('aberrant')`; live, the tag already reads `s.ref.aberrant`). And the row's other half: clapperjars made real members of `game.creatures` so `creatures.strike` and the tag reach them.

Trap kinds opened by achievement (G309) are in my own editor; nothing for you there.

Delete this note in your branch when done.
