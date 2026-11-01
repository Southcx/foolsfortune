// ---------------------------------------------------------------------------------------
// MOVEMENT PROFILES: the Courier's movement numbers as builds to try, each a named set of changes over the original (South, 2026-10-31: "I
// am authorizing you to adjust the base movement parameters of the courier, so long as they are saved as a 'profile' of parameters when
// they're meaningfully different, and our current original is kept safe ... to experiment with a lot of builds emblematic of iconic
// fighters"). The original is never written: it is DEFAULTS.movement (core/config.js) with whatever the tuning panel holds, and a profile
// is laid over it only while you stand in Strawman's Well (a modifier with a source you can see: the wings' rack), taken off whole on
// leaving (CLAUDE.md: base change bad, modifiers good; the core movement the gold standard, restored exactly).
//
// A profile has two halves: `move`, the keys of T.movement it changes (the core reads them live each step), and `fighter`, the platform
// fighter's own attributes the Well's fighter kit reads (weight, terminal and fast-fall speeds, jumpsquat, the short hop: FIGHTER.md),
// which the core movement does not have. The archetypes are built from Super Smash Bros. Melee's character attributes, scaled so its
// balanced fighter (Mario) is our original: every number is the original times that character's ratio to Mario (FIGHTER.md 3 has the table
// and its sources), so the builds differ from each other the way Melee's do, at the Courier's own size.
//
//   PROFILES { id: { label, line, from, move: { key: value }, fighter: { weight, terminal, fastFall, jumpsquat, shortHop, ... } } }
//   FIGHTER_BASE   profileOf(id)   fighterOf(id) -> the original's fighter numbers with the profile's over them
//   const MP = new MovementProfiles(game)   MP.id   MP.wear(id)   MP.next()   MP.apply()   MP.lift()   MP.on   /profile [id]
//   events: profile.wear { id, label, by }
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';
import { SV, secs } from './platformfighter.js';

/** The fighter kit's numbers for the original (FIGHTER.md 3): the Courier as Melee's Mario. Units: weight as Melee's (100 = Mario), speeds
 *  m/s, times real s. `terminal`: the fall's cap; `fastFall`: the speed a fast fall snaps to; `jumpsquat`: the crouch before a jump leaves the
 *  ground (Mario's 4 frames); `shortHop`: a short hop's height as a share of a full hop's; `airJumps`: jumps in the air. */
export const FIGHTER_BASE = { weight: 100, terminal: 1.7 * SV, fastFall: 2.3 * SV, jumpsquat: secs(4), shortHop: 0.33, airJumps: 1, airSpeed: 1 };
// (terminal and fastFall: Mario's 1.7 and 2.3 units a frame in the fighter's own scale (SV: the Courier's jump velocity over Mario's, 6.4 m/s / 2.3), so 4.73 and 6.4 m/s; shortHop:
//  Mario's short hop over his full hop, 9.63 / 29.0 units; airSpeed: a share of the Courier's own air speed, 1 as Mario's)

/** The builds. The original changes nothing; the rest are Melee's characters over Mario (the labels plain, the prior art in `from`). */
export const PROFILES = {
  original: { label: 'Original', line: 'The Courier as built: every number as the game ships it.', from: 'Fool\'s Fortune; Melee\'s Mario for the fighter numbers', move: {}, fighter: {} },
  // Each build: Melee's attributes over Mario's, times the Courier's original (melee-research.md 12; libmelee's characterdata.csv and SmashWiki).
  // move: gravity and the full hop's height (so jumpVelocity) by their ratios; walk, run, air acceleration and traction (groundDecel) likewise.
  fox: { label: 'Fast Faller', line: 'Falls like a stone, jumps high and fast, light. Short hops and fast falls are its whole game.', from: 'Melee\'s Fox',
    move: { gravity: 50.84, jumpVelocity: 10.34, walkSpeed: 6.11, sprintSpeed: 9.97, airAccel: 17.78, groundDecel: 53.33, airJumps: 1, airJumpMult: 1.08 },
    fighter: { weight: 75, terminal: 7.79, fastFall: 9.46, jumpsquat: 3 / 60, shortHop: 0.27, airJumps: 1, airSpeed: 0.97 } },
  falco: { label: 'High Jumper', line: 'The biggest full hop there is, and a fast fall to match. Slower on the ground.', from: 'Melee\'s Falco',
    move: { gravity: 37.58, jumpVelocity: 11.41, walkSpeed: 5.35, sprintSpeed: 6.8, airAccel: 15.56, groundDecel: 53.33, airJumps: 1, airJumpMult: 0.85 },
    fighter: { weight: 80, terminal: 8.63, fastFall: 9.74, jumpsquat: 5 / 60, shortHop: 0.19, airJumps: 1, airSpeed: 0.97 } },
  marth: { label: 'Swordfighter', line: 'Floaty and graceful, quick on its feet, a long reach in the air.', from: 'Melee\'s Marth',
    move: { gravity: 18.79, jumpVelocity: 6.66, walkSpeed: 6.11, sprintSpeed: 8.16, airAccel: 11.11, groundDecel: 40, airJumps: 1, airJumpMult: 0.79 },
    fighter: { weight: 87, terminal: 6.12, fastFall: 6.96, jumpsquat: 4 / 60, shortHop: 0.36, airJumps: 1, airSpeed: 1.05 } },
  sheik: { label: 'Ninja', line: 'A fast start and a tall short hop. Quick everywhere, never heavy.', from: 'Melee\'s Sheik',
    move: { gravity: 26.53, jumpVelocity: 7.8, walkSpeed: 4.58, sprintSpeed: 8.16, airAccel: 13.33, groundDecel: 53.33, airJumps: 1, airJumpMult: 0.99 },
    fighter: { weight: 90, terminal: 5.93, fastFall: 8.35, jumpsquat: 3 / 60, shortHop: 0.53, airJumps: 1, airSpeed: 0.93 } },
  falcon: { label: 'Racer', line: 'The fastest run there is and a heavy body. Commit to everything.', from: 'Melee\'s Captain Falcon',
    move: { gravity: 28.74, jumpVelocity: 8.63, walkSpeed: 3.25, sprintSpeed: 10.43, airAccel: 13.33, groundDecel: 53.33, airJumps: 1, airJumpMult: 0.81 },
    fighter: { weight: 104, terminal: 8.07, fastFall: 9.74, jumpsquat: 4 / 60, shortHop: 0.34, airJumps: 1, airSpeed: 1.3 } },
  peach: { label: 'Floater', line: 'Falls slowly and drifts far. Hangs in the air where others drop.', from: 'Melee\'s Peach',
    move: { gravity: 17.68, jumpVelocity: 6.11, walkSpeed: 3.25, sprintSpeed: 5.89, airAccel: 15.56, groundDecel: 66.67, airJumps: 1, airJumpMult: 0.63 },
    fighter: { weight: 90, terminal: 4.17, fastFall: 5.57, jumpsquat: 5 / 60, shortHop: 0.49, airJumps: 1, airSpeed: 1.28 } },
  puff: { label: 'Balloon', line: 'Five jumps in the air, steers like a kite, light as anything. Slow on its feet.', from: 'Melee\'s Jigglypuff',
    move: { gravity: 14.15, jumpVelocity: 4.45, walkSpeed: 2.67, sprintSpeed: 4.99, airAccel: 62.22, groundDecel: 60, airJumps: 5, airJumpMult: 0.65 },
    fighter: { weight: 60, terminal: 3.62, fastFall: 4.45, jumpsquat: 5 / 60, shortHop: 0.39, airJumps: 5, airSpeed: 1.57 } },
  samus: { label: 'Heavy Floater', line: 'Heavy but floaty: a slow, high arc and a long time in the air.', from: 'Melee\'s Samus',
    move: { gravity: 14.59, jumpVelocity: 5.82, walkSpeed: 3.82, sprintSpeed: 6.35, airAccel: 7.22, groundDecel: 40, airJumps: 1, airJumpMult: 0.81 },
    fighter: { weight: 110, terminal: 3.9, fastFall: 6.4, jumpsquat: 3 / 60, shortHop: 0.61, airJumps: 1, airSpeed: 1.03 } },
  ganon: { label: 'Bruiser', line: 'Slow to start and slow to walk, hard to send flying.', from: 'Melee\'s Ganondorf',
    move: { gravity: 28.74, jumpVelocity: 7.26, walkSpeed: 2.79, sprintSpeed: 6.12, airAccel: 13.33, groundDecel: 46.67, airJumps: 1, airJumpMult: 0.86 },
    fighter: { weight: 109, terminal: 5.57, fastFall: 7.23, jumpsquat: 6 / 60, shortHop: 0.53, airJumps: 1, airSpeed: 0.91 } },
  bowser: { label: 'Heavyweight', line: 'The heaviest there is: the longest crouch before a jump, the hardest to launch.', from: 'Melee\'s Bowser',
    move: { gravity: 28.74, jumpVelocity: 7.81, walkSpeed: 2.48, sprintSpeed: 6.8, airAccel: 11.11, groundDecel: 40, airJumps: 1, airJumpMult: 0.9 },
    fighter: { weight: 117, terminal: 5.29, fastFall: 6.68, jumpsquat: 8 / 60, shortHop: 0.29, airJumps: 1, airSpeed: 0.93 } },
  climbers: { label: 'Light Pair', line: 'A quick crouch and a high jump on slippery feet: it slides on every stop.', from: 'Melee\'s Ice Climbers',
    move: { gravity: 22.11, jumpVelocity: 7.22, walkSpeed: 3.63, sprintSpeed: 6.35, airAccel: 10.44, groundDecel: 23.33, airJumps: 1, airJumpMult: 0.9 },
    fighter: { weight: 88, terminal: 4.45, fastFall: 5.57, jumpsquat: 3 / 60, shortHop: 0.26, airJumps: 1, airSpeed: 0.81 } },
};
export const PROFILE_IDS = () => Object.keys(PROFILES);
export const profileOf = (id) => PROFILES[id] || PROFILES.original;
export const fighterOf = (id) => ({ ...FIGHTER_BASE, ...(profileOf(id).fighter || {}) });

export class MovementProfiles {
  constructor(game) {
    this.game = game; this.s = { id: 'original' }; this.base = null;
    game.save?.section('movementProfile', { scope: 'settings', version: 1,
      dump: () => this.s, load: (d) => { if (d && PROFILES[d.id]) this.s.id = d.id; }, reset: () => { this.lift(); this.s = { id: 'original' }; } });
    game.chat?.add?.('profile', { help: 'the movement profile worn in Strawman\'s Well: /profile, or /profile <id>', run: (arg) => {
      const id = String(arg || '').trim();
      if (id && PROFILES[id]) this.wear(id); else this.game.events?.emit('profile.ask', { id: this.s.id, ids: PROFILE_IDS(), by: 'courier' });
    } });
  }
  get id() { return this.s.id; }
  get on() { return !!this.base; }
  get fighter() { return fighterOf(this.s.id); }
  /** Choose a build: kept as a preference, laid on at once if the Well already has it on. */
  wear(id) {
    if (!PROFILES[id]) return false;
    const was = this.on; this.lift(); this.s.id = id; this.game.save?.dirty?.('movementProfile');
    if (was) this.apply();
    this.game.events?.emit('profile.wear', { id, label: PROFILES[id].label, by: 'courier' });
    return true;
  }
  next() { const ids = PROFILE_IDS(); return this.wear(ids[(ids.indexOf(this.s.id) + 1) % ids.length]); }
  /** Lay the profile over T.movement, remembering exactly what each key held (the Well's frame on). */
  apply() {
    if (this.base) return;
    const M = T.movement, P = profileOf(this.s.id).move || {};
    this.base = {};
    for (const [k, v] of Object.entries(P)) if (k in M) { this.base[k] = M[k]; M[k] = v; }
  }
  /** Take it off: every key put back as it was (the Well left). */
  lift() {
    if (!this.base) return;
    Object.assign(T.movement, this.base); this.base = null;
  }
}
