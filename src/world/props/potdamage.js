// ---------------------------------------------------------------------------------------
// POT DAMAGE: who broke a pot, what a blow does to it, and the cracks that grow. `damage` takes hit points off a pot (the blow's effect,
// the knock, the thunk) and breaks it at none left (potshards.js `shatter`); short of that it `crack`s: at each of three hp fractions
// the cracks spread (potcracks.js) and a hard knock breaks the pot more easily (`FRAGILE`). `instigate` and `instigatorOf` keep whose
// doing a pot's moving is (the Courier's, a clapperjar's or the environment's), and `COURIER_CAUSES` says which causes can only be the
// Courier's.
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
//   POT_DAMAGE: damage(ent, amount, point, dir, power, quiet, who) -> broke   crack(ent, point, quiet)   instigate(ent, who)
//               instigatorOf(ent) -> 'courier' | 'clapperjar' | ... | null
//   COURIER_CAUSES (a Set of causes)   FRAGILE (how much easier a knock breaks a pot at each crack stage)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { crackPaths, setCracks } from './potcracks.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

// (the causes that can only be the Courier's doing: the tools, the moves, the shells)
export const COURIER_CAUSES = new Set(['shot', 'sliced', 'slam', 'bomb', 'charged', 'homing', 'well', 'kick', 'throw', 'stomp', 'cut', 'cleave', 'caster', 'bashed', 'bolt', 'plunged', 'rend', 'death']);
// crack stages: hp fraction thresholds, and how much easier a knock breaks the pot at each stage
const CRACK_AT = [0.8, 0.5, 0.25];
export const FRAGILE = [1, 0.85, 0.7, 0.5];

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const POT_DAMAGE = {
  // ---- who did it -------------------------------------------------------------
  // Every break is someone's: the COURIER's (a shot, a blade, a kick, a throw, a slam: anything the player did, and anything knocked
  // into something by what the player did, for a few seconds after), a CLAPPERJAR's (one walking into a pot, or throwing one), or the
  // ENVIRONMENT's (a pot that fell off a shelf by itself, a mortar's shell, a pot that rolled into another). The log says whose it
  // was, and only the Courier's count toward the Courier's records (tracking.js).
  instigate(ent, who) { if (ent && who) { ent.by = who; ent.byT = this.clock; } },
  /** Who is behind this entity moving now: its last instigator, while that is recent. */
  instigatorOf(ent) {
    if (!ent) return null;
    if (ent.type === 'player') return 'courier';
    if (ent.type === 'clapper') return 'clapperjar';
    return ent.by && this.clock - (ent.byT || 0) < 5 ? ent.by : null;
  },

  damage(ent, amount, point, dir, power = 1, quiet = false, who = 'courier') {
    if (!ent.alive) return false;
    this.instigate(ent, who);
    ent.hp -= amount;
    if (!quiet && point && dir) this.game.vfx?.hit({ ent, kind: ent.kind, cause: ent.lastCause || 'blow', point, dir, power, kill: ent.hp <= 0 }); // (vfx/library.js 'hit.*')
    if (ent.hp <= 0) { this.shatter(ent, point, dir, power, 'shot', who); return true; }
    this.crack(ent, point, quiet);
    if (quiet) return false;
    this.physics.kick(ent.body, _v.copy(dir).multiplyScalar(T.weapon.impulse), point);
    this.fx.impact(point, _v2.copy(dir).negate(), { color: PALETTE.pale, sparks: 3, dust: 8 });
    sfx.thunk(ent.size, this.game.listenerDistance(point));
    return false;
  },

  /** Grow cracks from a hit; crossing a stage threshold spreads them and weakens the pot. */
  crack(ent, point, quiet) {
    const frac = ent.hp / ent.maxHp;
    let stage = 0;
    while (stage < CRACK_AT.length && frac < CRACK_AT[stage]) stage++;
    const local = point ? ent.mesh.worldToLocal(point.clone()) : new THREE.Vector3(0, ent.P.height * simRand(), 0);
    const dark = ent.cracks?.dark || [];
    let grew = false;
    if (stage > ent.crackStage) {
      const n = [0, 2, 3, 4][stage], len = ent.size * [0, 0.3, 0.45, 0.65][stage];
      dark.push(...crackPaths(ent.P, local, n, len));
      ent.crackStage = stage;
      ent.col.setContactForceEventThreshold(ent.body.mass() * 45 * FRAGILE[stage]);
      sfx.creak(stage, this.game.listenerDistance(point || ent.mesh.position));
      if (stage === 3) this.fx.shatterBurst(point || ent.mesh.position, ent.size * 0.4, _v.set(0, -1, 0), { dust: 0.6, chips: 1 });
      grew = true;
    } else if (!quiet && dark.length < 16) {
      dark.push(...crackPaths(ent.P, local, 1, ent.size * 0.14));
      grew = true;
    }
    if (grew) setCracks(ent, { dark });
  },
};
