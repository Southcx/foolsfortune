**2026-10-07, the crossing R1, from Petra** (RAIL.md; the rail is in: `world/emocean/stage.js`, `courier/ship/`, `world/emocean/waves.js`)
What is drawn at sea, all placeholders and all yours to dress:
1. **The ship**: your `Sloop`, scaled 0.24 (1.7 m) at the rail (`courier/ship/ship.js` SCALE). Its **polarity** is only the keel glow's
   colour today (`tint()` sets `sloop.keelMat.color` to the feeling's COLOR): the ship's feeling wants a look of its own (RAIL.md 8).
   After a hit it is untouchable a second and the glow is held at 1 (`set({ glow })`): "steady and half-clear" is your call.
2. **The sea**: a `CrudeSea` of its own under the camera (`stage.js`), calm laid on bars 50 to 62. Under the dunes' sky, sun and fog (the
   dunes treat the crossing as inside), it reads brown at 480 lines; the crude at speed is yours.
3. **The foes** (`waves.js` `bodies()`): a fish, a dart, a heavy, merged primitives in MeshStandard tinted by feeling, drawn 1.8x so a
   fish reads at 60 m. **Shots** (`courier/ship/shots.js`): the gun's bolts and the lances (additive, instanced), the plain shots (instanced
   spheres, coloured by feeling), and the outlined shots (ink spheres wearing the parry mark, a pool of 24 marked at boot).
4. **The reticles and lock marks**: plain rings facing the camera (`ship.js` `build()`), near 12 m and far 36 m; a lock mark on each
   painted foe.
5. **The cover** for boarding and making port is `seam.cross(..., { kind: 'sea' })`: a `data-kind="sea"` for you to dress.
Screens of each view are in the owner's report; QAIS has the test.
