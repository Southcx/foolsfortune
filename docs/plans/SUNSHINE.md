# Water and paint on the Soul Brush (Petra; built)

The owner, 2026-10-06: ripples and wakes on the water, Super Mario Sunshine's systems on the Soul Brush, Splatoon beside it, in synergy
with what exists. **Built**, all five phases (the liquid is Lachryma, the owner's ruling; Dovina's rules: `docs/plans/SUNSHINE-SYSTEMS.md`):
- the water talks back: `game.water.disturb(x, z, strength, kind)`, Calissa's rings, wakes, crown and drips (`vfx/water.js`);
- the paint map: where Lachryma lies on the ground, read by the ground's shaders and by movement (`world/ground/paintmap.js`);
- the load on the Soul Brush: paint and mop, the saturating hold, the Lachrymato Bottle (`tools/soulbrush/load.js`);
- stains, washed to reveal what they hid (`world/ground/stains.js`);
- the jet arts, hover, rocket and skim, opt-in through `/art` (`courier/moves/jets.js`); the Brush Slide runs on painted ground.

Taken from: Sunshine's pollution layer (doldecomp/sms PollutionLayer) and FLUDD's tank as a leash to the scenery, Splatoon's paint in a
texture over the level, PowerWash's reveal, the ripple tank (Hugo Elias's 2D water).
