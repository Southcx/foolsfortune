// ---------------------------------------------------------------------------------------
// A BLOW'S FEEL'S EFFECTS: the library's entries (vfx/library.js spreads them in) for a melee blow's weight class, played by
// vfx/blowfeel.js on the shared particle pools (no program of its own), and Strawman's straw (`hit.<tool>.straw`, played by vfx.hit
// for its kind: vfx.js materialOf). Data only: the numbers are the look.
//   hit.<blunt|slash|shot>.straw    what Strawman's sack gives up at any blow: stalks of straw and burlap dust, never clay chips
//   blow.<light|heavy|launcher|finisher>[.<clay|straw>]    a blow's weight over its hit
//   blow.guardbreak[.<clay|straw>]  a guard break (hit.guardBreak): the guard's pieces thrown out
// Prior art: below, at the weights.
// ---------------------------------------------------------------------------------------
export const BLOW_FEEL_EFFECTS = {
  // straw: Strawman's sack (its kind's look, vfx.js materialOf): stalks of straw thrown and drifting down, a breath of burlap dust; never
  // clay chips off a dummy of straw (its own puffs of straw at the seams are its body's: vfx/strawman.js)
  'hit.blunt.straw': { extends: 'hit.blunt', layers: [
    { type: 'sprites', pool: 'alpha', count: [7, 10], shape: 'streak', dir: 'cone', cone: 70, speed: [2, 5], size: [0.1, 0.16], sizeEnd: 0.08, life: [0.6, 1], gravity: 5, drag: 2.5, color: [0xe0c070, 0xcdb48c, 0xb8973f], alpha: 1, alphaEnd: 0.7, spin: [-9, 9], floor: 'ground' },
  ] },
  'hit.slash.straw': { extends: 'hit.slash', layers: [
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'streak', dir: 'cone', cone: 80, speed: [2, 5], size: [0.1, 0.16], sizeEnd: 0.08, life: [0.6, 1], gravity: 5, drag: 2.5, color: [0xe0c070, 0xcdb48c, 0xb8973f], alpha: 1, alphaEnd: 0.7, spin: [-9, 9], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: 2, shape: 'puff', dir: 'cone', cone: 60, speed: [0.3, 0.8], size: 0.22, sizeEnd: 0.5, life: 0.5, drag: 3, color: 0xcdb48c, alpha: 0.35 },
  ] },
  'hit.shot.straw': { extends: 'hit.shot', layers: [
    { type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'streak', dir: 'cone', cone: 50, speed: [2, 4], size: [0.08, 0.12], sizeEnd: 0.06, life: [0.5, 0.8], gravity: 5, drag: 2.5, color: [0xe0c070, 0xcdb48c], alphaEnd: 0.7, spin: [-9, 9], floor: 'ground' },
  ] },

  // =============================================================================================== A BLOW'S WEIGHT (vfx/blowfeel.js)
  // laid over the hit (hit.slash.<material>, damage.<type>, which creatures.strike already plays) when a melee blow lands, by its weight
  // class: light, heavy, launcher, finisher (blowWeight), then `.<material>` where a weight has more to give up. The context: `pos` the
  // contact, `dir` the blade's travel there (not reversed: the sparks run on along the cut), `from`/`to` a short line along the cut
  // through the contact, `tint` the damage type's colour (DAMAGE_TINT). Prior art: Monster Hunter's hit sparks drawn along the weapon's
  // path and bigger on a part's break; Devil May Cry's and Bayonetta's slash sparks; Street Fighter's light, medium and heavy hit sparks
  // (a weight a size); the clay chips are the library's own (hit.slash.clay). No hitstop or shake layers: the combo engine's stop is
  // the blow's (tools/moveset.js impact), and the camera's kick is blowfeel.js's, along the blade.
  //   LIGHT     a spark arc thrown on along the blade, a thin ring of the type's colour
  'blow.light': { layers: [
    { type: 'sprites', count: [5, 7], shape: 'streak', spawn: 'line', dir: 'cone', cone: 16, speed: [7, 12], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.08, 0.15], drag: 6, stretch: 2.4, color: 'white', colorEnd: 'gold', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.15, sizeEnd: 0.75, life: 0.14, color: 'tint', alphaEnd: 0, rot: 0, powerSize: false },
  ] },
  //   HEAVY     the arc doubled and longer, a thick ring of the type's colour opening behind it, a hot core
  'blow.heavy': { extends: 'blow.light', layers: [
    { type: 'sprites', count: [6, 8], shape: 'streak', spawn: 'line', dir: 'cone', cone: 26, speed: [9, 15], size: [0.16, 0.26], sizeEnd: 0.02, life: [0.12, 0.2], drag: 5, stretch: 2.8, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.25, sizeEnd: 1.3, life: 0.2, color: 'tint', alphaEnd: 0, rot: 0, powerSize: false },
    { type: 'sprites', count: 1, shape: 'core', size: 0.7, sizeEnd: 0.1, life: 0.1, color: 'white', powerSize: false },
  ] },
  //   LAUNCHER  the arc thrown up with what it lifts, a ring, glints rising after
  'blow.launcher': { extends: 'blow.light', layers: [
    { type: 'sprites', count: [6, 8], shape: 'streak', dir: 'cone', axis: 'up', cone: 22, speed: [8, 13], size: [0.14, 0.22], sizeEnd: 0.02, life: [0.12, 0.2], drag: 5, stretch: 2.6, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.25, sizeEnd: 1.1, life: 0.2, color: 'tint', alphaEnd: 0, rot: 0, powerSize: false },
    { type: 'sprites', count: [4, 6], shape: 'glint', spawn: 'sphere', r: 0.25, dir: 'up', speed: [1.5, 3], size: [0.14, 0.22], sizeEnd: 0, life: [0.3, 0.45], drag: 3, color: ['white', 'gold'], twinkle: 24, powerCount: false },
  ] },
  //   FINISHER  the string's last blow (and a plunge, a charge let go, a heat-1 blow): the heavy's look and a star, a second ring after
  //             the first, a wash of the vfx's own lamp, and more of what it is made of
  'blow.finisher': { extends: 'blow.heavy', layers: [
    { type: 'sprites', count: 1, shape: 'star4', size: 1.5, sizeEnd: 0.2, life: 0.18, color: 'white', colorEnd: 'tint', rot: 0.3, powerSize: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 2.0, life: 0.26, delay: 0.04, color: 'tint', alphaEnd: 0, rot: 0, powerSize: false },
    { type: 'sprites', count: [8, 11], shape: 'glint', dir: 'cone', cone: 70, speed: [3, 6], size: [0.18, 0.3], sizeEnd: 0, life: [0.25, 0.4], drag: 5, color: ['white', 'gold'], twinkle: 30, powerCount: false },
    { type: 'light', color: 'tint', k: 14, range: 5, dur: 0.18, up: 0 },
  ] },
  'blow.finisher.clay': { extends: 'blow.finisher', layers: [
    { type: 'sprites', pool: 'alpha', count: [8, 11], shape: 'chip', dir: 'cone', cone: 75, speed: [3, 7], size: [0.08, 0.15], life: [0.6, 1], gravity: 14, drag: 1, color: [0xb4603f, 0x8c4a33, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground', powerCount: false },
    { type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'puff', dir: 'cone', cone: 70, speed: [0.5, 1.4], size: [0.3, 0.4], sizeEnd: 0.8, life: [0.5, 0.7], drag: 3, color: 0xd9b89a, alpha: 0.45, powerCount: false },
  ] },
  'blow.finisher.straw': { extends: 'blow.finisher', layers: [
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'streak', dir: 'cone', cone: 85, speed: [3, 6], size: [0.12, 0.2], sizeEnd: 0.1, life: [0.7, 1.1], gravity: 5, drag: 2.5, color: [0xe0c070, 0xcdb48c, 0xb8973f], alpha: 1, alphaEnd: 0.7, spin: [-9, 9], floor: 'ground', powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'cone', cone: 70, speed: [0.4, 1], size: [0.3, 0.4], sizeEnd: 0.8, life: [0.6, 0.8], drag: 3, color: 0xcdb48c, alpha: 0.4, powerCount: false },
  ] },
  //   A GUARD BREAK (hit.guardBreak): the guard's own pieces, diamonds of white light burst out in a ring, a gold ring thrown wide
  'blow.guardbreak': { layers: [
    { type: 'sprites', count: 8, shape: 'diamond', spawn: 'ring', r: 0.2, dir: 'out', lift: 0.2, speed: [3, 5], size: [0.14, 0.2], sizeEnd: 0.03, life: [0.25, 0.35], drag: 5, color: 'white', colorEnd: 'gold', spin: [-6, 6], powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.8, life: 0.24, color: 'gold', alphaEnd: 0, rot: 0, powerSize: false },
    { type: 'sprites', count: [6, 8], shape: 'shard', dir: 'cone', cone: 80, speed: [3, 6], size: [0.12, 0.2], sizeEnd: 0.04, life: [0.35, 0.55], gravity: 8, drag: 2, color: ['white', 0xf2e6c8], spin: [-10, 10], powerCount: false },
  ] },
  'blow.guardbreak.clay': { extends: 'blow.guardbreak', layers: [
    { type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'chip', dir: 'cone', cone: 70, speed: [3, 6], size: [0.08, 0.13], life: [0.6, 0.9], gravity: 14, drag: 1, color: [0xb4603f, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground', powerCount: false },
  ] },
  'blow.guardbreak.straw': { extends: 'blow.guardbreak', layers: [
    { type: 'sprites', pool: 'alpha', count: [8, 11], shape: 'streak', dir: 'cone', cone: 85, speed: [3, 6], size: [0.12, 0.2], sizeEnd: 0.1, life: [0.7, 1.1], gravity: 5, drag: 2.5, color: [0xe0c070, 0xcdb48c], alpha: 1, alphaEnd: 0.7, spin: [-9, 9], floor: 'ground', powerCount: false },
  ] },
};
