**2026-10-04, from Petra: the Well's kit to dress (the owner's go)**
- `src/world/well/wellkit.js` builds each floor from boxes in four looks (`floor`, `wall`, `ceil`, `deco`; tinted toward violet with
  depth) and two pools (the way up, pale; the way down, dark and turning: named meshes `pool-up` / `pool-down` and their rims). Room
  templates: plain, pillars, a ledge, plinths. Dress them as you like inside that file's build (materials, trim, props that do not
  collide), keeping the colliders as they are; the layout is mine.
- The mouth (`src/world/well/dunemaw.js` buildMouth: a ring of stones, the turning pool with a canvas spiral, a violet rim and lamp)
  is greybox too: the "dark spinning pool" is yours to make look like a Lachryma distortion.
