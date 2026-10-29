// ---------------------------------------------------------------------------------------
// THE HITS: what every blow shows where it lands, by what struck and what was struck (vfx.hit builds the name from them:
// hit.<blunt|slash|shot>.<clay|crystal|jelly|wood|stone|metal>[.kill]; creatures.strike, the pots and the clappers ask). Refreshed in the
// library's three tiers (docs/plans/art/VFX-LIBRARY.md 1 and 5), the old stock's shape language kept whole (docs/VFX.md, "what the hit
// says": stars and a ring, it landed; streaks, how hard and which way; the material speaks):
//   PRIMARY    one shape a hit, at its biggest in the first tenth of a second, white-hot then its colour, eroding through its own
//              pattern as its ramp cools: the bare hit's star (a disc of rays), a blunt blow's ring of rays knocked out (the star and the
//              ring in one), a cut's crescent sweeping round, a shot's ring stood along the shot; under it the 0.1 s white core (one sprite)
//   SECONDARY  streaks thrown along the blow, white cooling to its colour; what the material gives up (chips, shards, bubbles, sparks)
//   TERTIARY   dust lifting and spreading, glints twinkling out, a few motes left hanging
// A KILL adds a second shape, the pop of what it was made of (clay: gold rays thrown wide; jelly: its bubble bursting), with the stars of
// its colour that go up. Cost (the fight's most played effects): at most two shape layers a hit (one, a kill two), none past half a real
// second, and the sprite counts no higher than the old stock's.
//
// Prior art: the hit sparks of fighting games and Monster Hunter (a star, a ring, sparks along the blow, the material's own debris);
// Kevin Leroy's League-style hit (80.lv, 2017: a 0.1 s hit frame, the hot point first, sparks next, motes last); Riot's VFX style guide
// (the primary reads in silhouette, the secondary supports it, the tertiary is ambience: docs/ref/VFX-PRIOR-ART.md 2).
//
//   HIT_EFFECTS   hit, hit.<tool>, hit.<tool>.<material>, hit.<tool>.clay.kill, hit.blunt.jelly.kill (the straw: vfx/blowfeeleffects.js)
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

// ---- what every hit shares
// the 0.1 s white core: Leroy's hit frame, six frames at 60 (one alone does not read at 480 lines)
const CORE = L({ type: 'sprites', count: 1, shape: 'core', size: [0.55, 0.65], sizeEnd: 0.15, life: 0.1, color: 'white', alpha: 1, alphaEnd: 0, rot: 0 });
// SECONDARY: streaks thrown along the blow, white cooling to its colour (how hard, which way)
const STREAKS = L({ type: 'sprites', count: [6, 8], shape: 'streak', dir: 'cone', cone: 55, speed: [5, 11], size: [0.14, 0.22], sizeEnd: 0.03, life: [0.14, 0.26], drag: 7, stretch: 1.6, color: 'white', colorEnd: 'tint' });
// TERTIARY: a few motes of its colour left hanging where it landed, drifting up and going
const MOTES = L({ type: 'sprites', at: 0.06, count: 3, shape: 'soft', spawn: 'sphere', r: 0.22, dir: 'up', speed: [0.2, 0.5], size: [0.05, 0.08], sizeEnd: 0, life: [0.5, 0.8], drag: 1.5, color: 'tint', alpha: 0.8 });

// ---- the primaries (each a shape stood to the eye, its size the blow's power's root, as a sprite's is; a fresh turn each play)
// the bare hit's star: a disc of rays, the caller's colour, its faint rays eroding first
const STAR = L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'tint', main: 'rays', tile: [1, 1], scroll: [0.4, 0], mask: 'noise', maskK: 0.45, maskTile: [2, 1], maskScroll: [0, 0.6],
  dur: 0.2, scale: [[0, 0.18], [0.3, 0.5], [1, 0.6]], powerScale: true, edgeV: [0, 0.55], erode: [[0, 0.2], [0.35, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.5, 0], [1, -0.3]],
  core: 1, coreAt: 0.5, glow: 2.4, turn: 'random' });
// a blunt blow's ring of rays knocked out (the star and the ring in one), gold cooling to amber, breaking up through its rays and a noise
const BLUNT_RING = L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'gold', main: 'rays', tile: [1, 1], scroll: [0.2, 1.2], mask: 'noise', maskK: 0.5, maskTile: [3, 1], maskScroll: [0, 0.8],
  dur: 0.26, scale: [[0, 0.12], [0.25, 0.5], [1, 0.72]], powerScale: true, edgeV: [0.25, 0.45], erode: [[0, 0.2], [0.3, 0.22], [1, 1]], rampShift: [[0, 0.32], [0.38, 0.02], [1, -0.32]],
  core: 0.7, coreAt: 0.75, glow: 2.2, turn: 'random' });
// a cut's crescent: an arc of a ring (its two ends faded to nothing), its noise drawn out along it and swept round the way it turns
const SLASH_ARC = L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'tint', main: 'noise', tile: [2, 1], scroll: [-2.2, 0], mask: 'streaks', maskK: 0.35, maskTile: [6, 1], maskScroll: [0, 1.5],
  dur: 0.22, scale: [[0, 0.42], [0.3, 0.72], [1, 0.84]], powerScale: true, edgeV: [0.42, 0.42], edgeU: [0.3, 0.3], spin: 5, erode: [[0, 0.2], [0.35, 0.22], [1, 1]],
  rampShift: [[0, 0.3], [0.45, 0], [1, -0.3]], core: 0.9, coreAt: 0.62, glow: 2.3, turn: 'random' });
// a shot's ring stood along the shot (its axis the blow's, back toward the shooter), small and quick, ember cooling to red, its rays running out
const SHOT_RING = L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'ember', main: 'rays', tile: [2, 1], scroll: [0.3, 2.5], mask: 'noise', maskK: 0.35, maskTile: [2, 1],
  dur: 0.2, scale: [[0, 0.1], [0.3, 0.36], [1, 0.46]], powerScale: true, edgeV: [0.35, 0.4], erode: [[0, 0.2], [0.3, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.4, 0], [1, -0.3]],
  core: 0.8, coreAt: 0.7, glow: 2.2, turn: 'random' });

// ---- a kill's pops (its second shape) and its stars
// clay's: gold rays thrown wide, a breath after the hit, bigger and longer than any blow's ring
const CLAY_POP = L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'gold', main: 'rays', tile: [1, 1], scroll: [-0.3, 1.5], mask: 'noise', maskK: 0.55, maskTile: [3, 1], maskScroll: [0, 1],
  at: 0.04, dur: 0.42, scale: [[0, 0.3], [0.3, 1.2], [1, 1.5]], powerScale: true, edgeV: [0.3, 0.5], erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.35, 0.05], [1, -0.35]],
  core: 0.8, coreAt: 0.72, glow: 2.6, turn: 'random' });
// jelly's: its bubble bursting, a shell lit at its edge breaking up through its cells, the jelly's blue
const JELLY_POP = L({ type: 'shape', form: 'sphere', ramp: 'tint', tint: 0x8fd0ff, main: 'cells', tile: [3, 2], scroll: [0.1, 0.6], mask: 'noise', maskK: 0.5, maskTile: [2, 1],
  dur: 0.4, scale: [[0, 0.25], [0.35, 0.85], [1, 1.05]], powerScale: true, rim: 0.85, erode: [[0, 0.2], [0.25, 0.22], [1, 1]], rampShift: [[0, 0.25], [1, -0.3]],
  core: 0.5, coreAt: 0.8, glow: 1.9, turn: 'random' });
const KILL_STARS = (n, size) => L({ type: 'sprites', count: n, shape: 'star4', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size, sizeEnd: 0, life: [0.5, 0.8], drag: 2, gravity: 3, color: ['gold', 'white'], twinkle: 18 });

export const HIT_EFFECTS = {
  // what every blow shows, whatever struck what: the 0.1 s white core, a star of rays, sparks thrown along the blow, motes left hanging
  hit: { layers: [CORE, STAR, STREAKS, MOTES] }, // (no hitstop or shake in a hit: the weapons give their own weight; an effect that wants more adds it)
  // a blunt blow: a ring of rays knocked out flat, and dust lifting off
  'hit.blunt': { layers: [CORE, BLUNT_RING, STREAKS, MOTES,
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', dir: 'cone', cone: 80, speed: [0.6, 1.6], size: [0.3, 0.45], sizeEnd: 0.85, life: [0.55, 0.85], drag: 3, gravity: -0.4, color: 0xd9b89a, alpha: 0.5, spin: [-1, 1] }),
  ] },
  // a cutting blow: a crescent swept round the cut, and glints thrown wide either side of it, twinkling out
  'hit.slash': { layers: [CORE, SLASH_ARC, STREAKS,
    L({ type: 'sprites', count: [8, 12], shape: 'glint', dir: 'cone', cone: 85, speed: [2, 5], size: [0.2, 0.35], sizeEnd: 0, life: [0.22, 0.42], drag: 5, color: 'white', twinkle: 30 }),
  ] },
  // a shot: smaller, a ring stood along the shot, sparks back off the surface
  'hit.shot': { layers: [CORE, SHOT_RING, STREAKS, MOTES] },
  'hit.shot.clay': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 50, speed: [2, 5], size: [0.05, 0.09], life: [0.5, 0.8], gravity: 14, color: [0xb4603f, 0xc46a45], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'cone', cone: 40, speed: [0.5, 1.2], size: 0.25, sizeEnd: 0.55, life: 0.5, drag: 3, color: 0xd9b89a, alpha: 0.5 }),
  ] },
  'hit.shot.crystal': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', count: [5, 8], shape: 'shard', dir: 'cone', cone: 60, speed: [3, 6], size: [0.1, 0.16], sizeEnd: 0.04, life: [0.4, 0.6], gravity: 8, color: 'labradorite', spin: [-10, 10] }),
  ] },
  'hit.shot.jelly': { extends: 'hit.blunt.jelly' },
  // a kill: what it was made of bursts in a pop of its colour (a second shape), and a few stars of it go up (a finishing beat on top of its own death)
  'hit.blunt.clay.kill': { extends: 'hit.blunt.clay', layers: [CLAY_POP, KILL_STARS(6, [0.2, 0.3])] },
  'hit.slash.clay.kill': { extends: 'hit.slash.clay', layers: [CLAY_POP, KILL_STARS(6, [0.2, 0.3])] },
  'hit.shot.clay.kill': { extends: 'hit.shot.clay', layers: [CLAY_POP, KILL_STARS(5, [0.18, 0.26])] },
  'hit.blunt.jelly.kill': { extends: 'hit.blunt.jelly', layers: [JELLY_POP,
    L({ type: 'sprites', pool: 'alpha', count: 14, shape: 'bubble', spawn: 'sphere', r: 0.5, dir: 'out', speed: [1, 3], size: [0.12, 0.28], sizeEnd: 0.35, life: [0.7, 1.2], drag: 1.5, gravity: -1, color: 0xbfe8ff, alpha: 0.9 }),
  ] },
  // what clay gives up: chips of it, falling, and a puff of its dust
  'hit.blunt.clay': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'chip', dir: 'cone', cone: 60, speed: [3, 6], size: [0.07, 0.13], life: [0.6, 0.9], gravity: 14, drag: 1, color: [0xb4603f, 0x8c4a33, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
  ] },
  'hit.slash.clay': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'chip', dir: 'cone', cone: 70, speed: [3, 6], size: [0.06, 0.1], life: [0.6, 0.9], gravity: 14, drag: 1, color: [0xb4603f, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
  ] },
  // crystal rings and splinters: shards and glints in the stone's colours
  'hit.blunt.crystal': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 70, speed: [3, 7], size: [0.12, 0.22], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'labradorite', spin: [-10, 10] }),
    L({ type: 'sprites', count: [4, 6], shape: 'sparkle', spawn: 'sphere', r: 0.4, size: [0.2, 0.35], sizeEnd: 0, life: [0.4, 0.7], color: 'labradorite', twinkle: 18, delay: [0, 0.15] }),
  ] },
  'hit.slash.crystal': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 80, speed: [3, 7], size: [0.12, 0.2], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'labradorite', spin: [-10, 10] }),
  ] },
  // jelly: bubbles that float off, drops of its goo that fall
  'hit.blunt.jelly': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'bubble', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.4, 1.2], size: [0.1, 0.22], sizeEnd: 0.28, life: [0.6, 1.1], drag: 1, color: 0xbfe8ff, alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'soft', dir: 'cone', cone: 70, speed: [2, 4], size: [0.1, 0.16], life: [0.5, 0.8], gravity: 12, color: 0x8fd0ff, alpha: 0.9, alphaEnd: 0.6, floor: 'ground' }),
  ] },
  'hit.slash.jelly': { extends: 'hit.blunt.jelly' },
  // wood: splinters and sawdust; stone: grey chips and a dust cloud; metal: a shower of hot sparks and a clang ring
  'hit.blunt.wood': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'shard', dir: 'cone', cone: 60, speed: [2, 5], size: [0.06, 0.12], life: [0.5, 0.8], gravity: 12, color: [0x8a5a34, 0xb07a4a], alphaEnd: 0.8, spin: [-16, 16], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 4, shape: 'puff', dir: 'cone', cone: 70, speed: [0.4, 1], size: 0.22, sizeEnd: 0.5, life: 0.5, drag: 3, color: 0xd9b88a, alpha: 0.45 }),
  ] },
  'hit.slash.wood': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'shard', dir: 'cone', cone: 80, speed: [2, 5], size: [0.05, 0.1], life: [0.5, 0.8], gravity: 12, color: [0xc8955c, 0xe0b880], alphaEnd: 0.8, spin: [-16, 16], floor: 'ground' }),
  ] },
  'hit.shot.wood': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'shard', dir: 'cone', cone: 45, speed: [2, 4], size: [0.04, 0.08], life: [0.4, 0.7], gravity: 12, color: [0x8a5a34, 0xb07a4a], spin: [-16, 16], floor: 'ground' }),
  ] },
  'hit.blunt.stone': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'chip', dir: 'cone', cone: 60, speed: [2, 5], size: [0.04, 0.08], life: [0.5, 0.8], gravity: 14, color: [0x8e8680, 0xb0a89e], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', dir: 'cone', cone: 80, speed: [0.5, 1.4], size: [0.3, 0.4], sizeEnd: 0.9, life: [0.6, 0.9], drag: 3, gravity: -0.3, color: 0xc8beb4, alpha: 0.5, spin: [-1, 1] }),
  ] },
  'hit.slash.stone': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [6, 9], shape: 'streak', dir: 'cone', cone: 70, speed: [4, 8], size: [0.06, 0.1], sizeEnd: 0.01, life: [0.15, 0.3], stretch: 1.5, gravity: 8, color: 'white', colorEnd: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 60, speed: [2, 4], size: [0.03, 0.06], life: [0.5, 0.8], gravity: 14, color: [0x8e8680, 0xb0a89e], spin: [-14, 14], floor: 'ground' }),
  ] },
  'hit.shot.stone': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 45, speed: [2, 4], size: [0.03, 0.06], life: [0.4, 0.7], gravity: 14, color: [0x8e8680, 0xb0a89e], spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'cone', cone: 40, speed: [0.4, 1], size: 0.22, sizeEnd: 0.5, life: 0.5, drag: 3, color: 0xc8beb4, alpha: 0.45 }),
  ] },
  'hit.blunt.metal': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', count: [14, 20], shape: 'streak', dir: 'cone', cone: 70, speed: [4, 10], size: [0.05, 0.09], sizeEnd: 0.01, life: [0.25, 0.5], stretch: 1.8, gravity: 10, drag: 1, color: 'white', colorEnd: 'ember', floor: 'ground' }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.1, life: 0.25, color: 'white', rot: 0 }),
  ] },
  'hit.slash.metal': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [16, 24], shape: 'streak', dir: 'cone', cone: 85, speed: [5, 11], size: [0.05, 0.08], sizeEnd: 0.01, life: [0.25, 0.5], stretch: 2, gravity: 10, drag: 1, color: 'white', colorEnd: 'gold', floor: 'ground' }),
  ] },
  'hit.shot.metal': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'streak', dir: 'cone', cone: 55, speed: [4, 9], size: [0.04, 0.07], sizeEnd: 0.01, life: [0.2, 0.4], stretch: 1.8, gravity: 10, color: 'white', colorEnd: 'ember', floor: 'ground' }),
  ] },
};
