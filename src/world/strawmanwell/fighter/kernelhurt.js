// ---------------------------------------------------------------------------------------
// THE FIGHTER STRUCK (docs/plans/FIGHTER.md 4; platformfighter.js): what a blow does to a fighter (fighter/kernel.js), in Melee's order.
//   a hit on the body    its damage (staled and charged by the striker, fighter/hits.js) on the percent, the knockback (Melee's formula,
//                        crouching 2/3: the crouch cancel), the angle (the Sakurai angle, turned to the striker's facing), and hitlag on
//                        both bodies; the launch waits for hitlag's last frame, where DI turns it and ASDI nudges the body
//   hitlag               both held; the victim's each fresh push of the stick an SDI nudge (none on a hitlag under 2 frames)
//   a hit on the shield  0.7 of its damage off the shield's health, shieldstun and pushback after hitlag; a press within 4 frames
//                        before it (2 for a shot) a powershield: no damage, the stun halved, a shot sent back; the shield at 0 broken
//   hitstun and tumble   the launch decaying along itself with gravity under it (kernel.js hitstunS); tumble from 80 knockback
//   the floor, tumbling  a shield press up to 20 frames before it, a tech (in place, or a roll the stick's way, intangible a while);
//                        missed, a knockdown: a bounce, then a getup (stand, roll, attack) or standing anyway
//   a broken shield      launched up, then dizzy on landing for (400 - %) + 90 frames
//
// Prior art: Melee's decomp (ftCommon_ApplyHit's order: damage, knockback, hitlag; the launch on hitlag's end; ftCo_DownBound and the tech
// windows), SmashWiki's Hitlag, DI, SDI, Shield, Tech and Knockdown pages; Super Smash Bros. Ultimate's training mode's readouts.
//
//   takeHit(V, A, hit) -> 'miss' | 'hit' | 'shield' | 'power'   (hit: { move, damage, angle, base, growth, set?, throw?, shot? })
//   hurtStep(V, I)   techOrDown(V)   techStep   downStep   getupStep   fallLanding(V)   breakShield(V)
// ---------------------------------------------------------------------------------------
import { knockback, sakurai, hitlag, diAngle, SDI, SHIELD, shieldstun, shieldDamage, launchSpeed, hitstun, tumbles, TECH } from '../../../progress/platformfighter.js';
import { KIT, BODY } from './moves.js';
import { go, traction } from './fighterstate.js';

const DEG = Math.PI / 180;

/** A blow lands on V from A (null: the stage). The striker's own hitlag is set here too. */
export function takeHit(V, A, hit) {
  if (!V.hittable) return 'miss';
  const d = hit.damage;
  // the shield: everything but a grab and a throw meets it
  if (V.shielding && !hit.throw) {
    const power = V.st === 'shield' && V.now - V.shieldAt <= (hit.shot ? SHIELD.powershieldShot : SHIELD.powershield);
    const lag = hitlag(d);
    V.hl = V.hlFull = lag; if (A && !hit.shot) A.hl = A.hlFull = lag; // (a shot freezes only what it strikes)
    const n = shieldstun(d), away = A ? Math.sign(V.x - A.x) || -V.face : -V.face;
    V.lastBy = A; V.lastAt = V.now;
    if (power) { go(V, 'shieldstun'); V.stunN = Math.max(1, n >> 1); V.pushV = 0; V.env.verb(V, 'powerShield'); return 'power'; }
    V.shield -= shieldDamage(d);
    if (V.shield <= 0) { breakShield(V); return 'shield'; }
    go(V, 'shieldstun'); V.stunN = n; V.pushV = away * (KIT.pushback[0] + KIT.pushback[1] * d);
    return 'shield';
  }
  // the body: let go of anything held, and be let go of
  if (V.victim) { const H = V.victim; V.victim = null; if (H.holder === V) { H.holder = null; go(H, H.grounded ? 'idle' : 'air'); } }
  if (V.holder && !hit.throw) { const G = V.holder; V.holder = null; if (G.victim === V) { G.victim = null; go(G, 'idle'); } }
  if (V.ledge) { V.ledge.by = null; V.ledge = null; }
  V.percent = Math.min(999, V.percent + d);
  const crouch = V.crouch && V.grounded && V.st === 'idle';
  const kb = knockback({ percent: V.percent, damage: d, weight: V.stats.weight, growth: hit.growth, base: hit.base, set: hit.set ?? null, crouch, throwBlind: !!hit.throw });
  if (crouch && !tumbles(kb)) V.env.verb(V, 'crouchCancel');
  let a = hit.angle === 361 ? sakurai(kb, V.grounded) : hit.angle;
  const face = A ? A.face : 1;
  a = face > 0 ? a : 180 - a; // (the angle is toward the striker's facing)
  V.launch = { kb, a };
  V.lastBy = A; V.lastAt = V.now;
  V.inCombo = V.st === 'hitstun' || V.tumble || V.st === 'down'; // (struck again before it could act: a true combo's next hit)
  V.fastfall = false; V.tumble = false; V.reflecting = false;
  go(V, 'hitstun'); V.stun = 0; V.kvx = 0; V.kvy = 0;
  if (hit.throw) { V.hl = 0; launch(V, { x: 0, y: 0 }); return 'hit'; } // (a throw lets go at once: no hitlag, no DI)
  const lag = hitlag(d, { crouch });
  V.hl = V.hlFull = lag; if (A && !hit.shot) A.hl = A.hlFull = hitlag(d);
  V.sdiDir = null;
  return 'hit';
}

/** Hitlag's frame: held still. The victim reads SDI (each new push of the stick) and, on the last frame, DI and ASDI, and is launched. */
export function hurtStep(V, I) {
  V.hl--;
  V.mo.mode = 'hold';
  if (!V.launch) { if (V.hl <= 0 && V.st === 'shieldstun') V.f = 0; return; } // (a striker, or a shield's holder: only held)
  const dir = I.dirP;
  if (dir && V.hlFull >= SDI.minHitlag && (dir[0] || dir[1])) { // (SDI: a nudge the stick's way, moved with collision)
    const l = Math.hypot(dir[0], dir[1]) || 1;
    V.mo.mode = 'vel'; V.mo.vx = (dir[0] / l) * SDI.push * 60; V.mo.vy = V.grounded ? 0 : (dir[1] / l) * SDI.push * 60;
  }
  if (V.hl > 0) return;
  launch(V, I);
}

/** The launch on hitlag's end: DI turns the angle by the stick held across it, ASDI nudges the body 3 units the stick's way. */
function launch(V, I) {
  const { kb } = V.launch; let a = V.launch.a; V.launch = null;
  const sx = I.x || 0, sy = I.y || 0;
  if (Math.hypot(sx, sy) > KIT.stick) {
    const turned = diAngle(a, [sx, sy]);
    if (V.who === 'courier' && tumbles(kb) && Math.abs(turned - a) > 6) V.env.verb(V, 'di');
    a = turned;
    V.asdi = { x: sx * SDI.asdi * 60, y: V.grounded ? 0 : sy * SDI.asdi * 60 };
  }
  const v = launchSpeed(kb);
  V.kvx = Math.cos(a * DEG) * v; V.kvy = Math.sin(a * DEG) * v;
  V.tumble = tumbles(kb);
  if (V.grounded && V.kvy < 0) V.kvy = V.tumble ? -V.kvy * 0.8 : 0; // (driven into the floor: a tumble bounces off it, a light hit slides)
  if (V.kvy > 0.2) V.grounded = false;
  V.vx = 0; V.vy = 0; V.stun = hitstun(kb); V.f = 0;
  const a2 = V.asdi || { x: 0, y: 0 }; V.asdi = null; // (the launch's first frame, the ASDI nudge in it)
  V.mo.mode = 'vel'; V.mo.vx = V.kvx + a2.x; V.mo.vy = V.kvy + a2.y; V.mo.takeoff = !V.grounded;
}

/** Landed tumbling: a tech if the shield was pressed in time (in place, or a roll the stick's way), else a knockdown. */
export function techOrDown(V) {
  const I = V.lastIntent || { x: 0 };
  V.tumble = false; V.kvx = 0; V.kvy = 0; V.vy = 0; V.vx *= 0.3;
  if (V.now - V.techAt <= TECH.window) {
    go(V, 'tech'); V.techDir = Math.abs(I.x) > KIT.stick ? Math.sign(I.x) : 0; V.intan = KIT.techIntan; V.env.verb(V, 'tech');
    return;
  }
  go(V, 'down'); V.vx = 0;
}
export function techStep(V) {
  const n = V.techDir ? TECH.getup.roll : TECH.getup.stand;
  if (V.techDir) { const moving = Math.round(n * 0.75); V.vx = V.f <= moving ? (V.techDir * TECH.roll * (V.h / BODY)) / (moving / 60) : 0; V.vy = 0; } else traction(V);
  V.mo.mode = 'vel';
  if (V.f >= n) go(V, 'idle');
}
/** A knockdown: the bounce, then lying until a getup is chosen (or standing anyway). */
export function downStep(V, I) {
  traction(V); V.mo.mode = 'vel';
  if (V.f < KIT.downBounce) return;
  const chose = I.atkP ? 'attack' : I.tapX || Math.abs(I.x) > KIT.stick ? 'roll' : I.jumpP || I.shieldP || I.y > KIT.stick || I.specP || I.smashP ? 'stand' : null;
  if (chose || V.f >= KIT.downBounce + KIT.downMax) getup(V, chose || 'stand', Math.abs(I.x) > KIT.stick ? Math.sign(I.x) : V.face);
}
function getup(V, kind, dir) {
  go(V, 'getup'); V.getup = kind; V.getupDir = dir; V.getupN = TECH.getup[kind];
  V.intan = Math.round(V.getupN * KIT.getupIntan);
  if (kind === 'attack') V.m = 'getupAttack';
}
export function getupStep(V) {
  const n = V.getupN;
  if (V.getup === 'roll') { const moving = Math.round(n * 0.75); V.vx = V.f <= moving ? (V.getupDir * TECH.roll * (V.h / BODY)) / (moving / 60) : 0; V.vy = 0; } else traction(V);
  V.mo.mode = 'vel';
  if (V.getup === 'attack') { const [a0, a1] = KIT.getupAttackAt; V.active = V.f >= a0 && V.f <= a1; if (V.f === a0) V.hits = new Set(); }
  if (V.f >= n) { V.active = false; V.m = null; go(V, 'idle'); }
}

/** The shield at nothing: broken, launched up; dizzy on the floor after (fallLanding). */
export function breakShield(V) {
  V.shield = SHIELD.reset; go(V, 'broken'); V.vx = 0; V.vy = KIT.breakUp; V.grounded = false; V.dizzyN = SHIELD.breakStun(V.percent);
  V.env.broke?.(V);
}
export function fallLanding(V) { go(V, 'dizzy'); V.vx = 0; V.vy = 0; }
