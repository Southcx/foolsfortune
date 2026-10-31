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

/** The fighter kit's numbers for the original (FIGHTER.md 3): the Courier as Melee's Mario. Units: weight as Melee's (100 = Mario), speeds
 *  m/s, times real s. `terminal`: the fall's cap; `fastFall`: the speed a fast fall snaps to; `jumpsquat`: the crouch before a jump leaves the
 *  ground (Mario's 4 frames); `shortHop`: a short hop's height as a share of a full hop's; `airJumps`: jumps in the air. */
export const FIGHTER_BASE = { weight: 100, terminal: 9.4, fastFall: 12.7, jumpsquat: 4 / 60, shortHop: 0.42, airJumps: 1, traction: 1 };

/** The builds. The original changes nothing. The rest: filled from FIGHTER.md 3's table (Melee's attributes over Mario's). */
export const PROFILES = {
  original: { label: 'Original', line: 'The Courier as built: every number as the game ships it.', from: 'Fool\'s Fortune', move: {}, fighter: {} },
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
