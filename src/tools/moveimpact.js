// ---------------------------------------------------------------------------------------
// A MOVE'S IMPACT (plain names: a struck creature's hitlag, the attacker's pose hold, the earned stop; docs/plans/SONDELASS-FEEL.md
// 3E, South's ruling 2026-11-16): what a combo engine's blow does to the world the frame it lands, by its weight class (vfx/blowfeel.js
// blowWeight), kept as one table so the tuning is one place. Two ways, the moveset's spec choosing (`S.impact`):
//   the pulse (the default, every tool but the cutlass for now: casebook 210)  every blow slows the whole world to 0.07 for a beat
//     grown with its damage (STOP_BY_WEIGHT), then eases back: the engine as it was
//   'held' (the cutlass)  the world runs on. The STRUCK THING carries the hit: its own motion held a few 60 Hz frames of game time and
//     its drawn body shaken along the cut (creatures.hitlag, the registry's, built once for every kind; its flinch and flash are
//     vfx/hitflinch.js). The ATTACKER's weight is a pose hold on heavy things only (character.hold: the drawn pose, never the capsule,
//     never the input, never the move's clock: its strike window runs on, so a hold can neither skip a strike nor strike twice). And
//     ONE TRUE STOP, earned: a finisher that downs the last hurtable creature within EARNED.reach m slows the world once
//   (the sound, the shake and the slash line are the same either way; the camera's kick and the smear are looks: blowfeel.js BLOW_WEIGHT)
//
// Prior art: Melee's hitlag (SmashWiki "Hitlag"; docs/ref/combat/MELEE.md 2): floor(d / 3 + 3) frames, on the attacker and the
// victim both, capped at 20; taken here scaled down for a crowd and capped at 8, the victim's always and the attacker's only on a
// heavy blow. Sakurai on hit stop (the stop is the weight; too much of it on everything is mush), and Itsuno's "stress impact with
// hit-stop even if the attack is only a few frames" (DEVIL-MAY-CRY.md 4), kept for the one moment it means most.
//
//   moveImpact(M, dmg, c, h)          (Moveset.impact: a blow's frame of contact, once a sweep that struck)
//   heldStrike(M, ent, dir, h, c)     (Moveset.blow, after a creature is struck, `S.impact === 'held'` only: its hitlag)
//   hitlagFrames(power, weight) -> 60 Hz frames   IMPACT[weight]   HITLAG   EARNED   STOP_BY_WEIGHT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { blowWeight } from '../vfx/blowfeel.js';
import { typeOf } from '../progress/combat/types.js';
import { hasTag } from '../core/tags.js';

/** The pulse's length by the weight class (the old way; Calissa's ask, 2026-10-25): a light blow stops shorter, a finisher longest. */
export const STOP_BY_WEIGHT = { light: 0.8, heavy: 1.2, launcher: 1.15, finisher: 1.6 };

/** The held way, by weight class. `pulse`: the world slowed (false never; 'earned' only when the blow downs the last creature in
 *  reach). `hold`: the attacker's drawn pose held (60 Hz frames), `shake` its shake (m, decaying). `lag`: the victim's share of
 *  Melee's frames (hitlagFrames). */
export const IMPACT = {
  light: { pulse: false, hold: 0, shake: 0, lag: 0.6 },
  heavy: { pulse: false, hold: 2, shake: 0.012, lag: 0.75 },
  launcher: { pulse: false, hold: 2, shake: 0.012, lag: 0.7 },
  finisher: { pulse: 'earned', hold: 4, shake: 0.02, lag: 1 },
};

/** The victim's frames: d = the blow's worth to a creature (moves.js power) x `unit` (a damage in Melee's percent: combo1 1.2 is 6%),
 *  floor(d / 3 + 3) x the weight's `lag`, rounded, clamped to [min, cap]. */
export const HITLAG = { unit: 5, min: 2, cap: 8 };

/** The earned stop: within `reach` m no hurtable creature left standing; the world at `scale` for `real` real s, eased back. */
export const EARNED = { reach: 8, scale: 0.07, real: 0.12, release: 0.16 };

export const hitlagFrames = (power, weight) => {
  const d = Math.max(0, power) * HITLAG.unit, f = Math.floor(d / 3 + 3) * (IMPACT[weight]?.lag ?? 1);
  return Math.min(HITLAG.cap, Math.max(HITLAG.min, Math.round(f)));
};

/** The frame of contact (Moveset.impact). */
export function moveImpact(M, dmg, c, h) {
  const g = M.game, P = M.P, w = blowWeight(c, h);
  sfx.cutHit?.(dmg);
  P.shake = Math.max(P.shake, 0.12 * dmg);
  if (M.S.segment) { M.S.segment(_a, _b); g.fx?.slash?.(_a.clone(), _b.clone(), _up); }
  if (M.S.impact !== 'held') { g.time.pulse('hit', 0.07, (STOP_BY_WEIGHT[w] ?? 1) * (0.035 + 0.03 * dmg * (c?.def.stop ?? 1)), { release: 0.12 }); return; }
  const I = IMPACT[w] || IMPACT.light, part = c?.part ?? 0, downed = M.downed; M.downed = 0;
  if (I.hold > 0 && (M.heldFor !== c || M.heldPart !== part)) { // (once a blow's part: two things struck a frame apart never restart it)
    M.heldFor = c; M.heldPart = part;
    g.character?.hold?.(I.hold, I.shake ? { shake: [I.shake, I.shake], air: !P.grounded } : {});
  }
  if (I.pulse === 'earned' && downed && lastInReach(g, P.pos)) g.time.pulse('hit', EARNED.scale, EARNED.real, { release: EARNED.release });
}

/** A creature struck on the held way: its hitlag (creatures.hitlag), and a down kept for the earned stop. */
export function heldStrike(M, ent, dir, h, c) {
  const w = blowWeight(c, h);
  M.game.creatures?.hitlag?.(ent, hitlagFrames(M.worth(h, c), w), { dir, type: typeOf(h?.cause || M.S.cause || 'sliced'), weight: w, by: 'courier' });
  if (!ent.alive) M.downed = (M.downed || 0) + 1;
}

/** Nothing hurtable left standing within EARNED.reach of `at` (a training body, an ally never counts). */
function lastInReach(g, at) {
  for (const x of g.creatures?.list || []) {
    if (!x.alive || x.ally || x.training || !hasTag(x, 'hurtable')) continue;
    if (Math.hypot(x.pos.x - at.x, x.pos.z - at.z) <= EARNED.reach && Math.abs(x.pos.y - at.y) <= EARNED.reach) return false;
  }
  return true;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
