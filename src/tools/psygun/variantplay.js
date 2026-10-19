// ---------------------------------------------------------------------------------------
// A PSYGUN VARIANT'S PLAY: how each of the five fights, beyond its chamber count (docs/plans/OVERLAY.md 19; the numbers are kinds.js
// `play`, Dovina's; the looks are Calissa's). One job: to bend the psygun's shots and shells by the variant carried. It is called from
// the gun at its few seams (the plain shot, the charge, a shell's rows) and never changes a rule of its own: THE PSYGUN with this off
// fights as it always has.
//
//   THE PSYGUN      the quick taps: a plain shot tapped within 0.25 s of the last comes 1.4x as fast. (Not the fan on R, gunmoves.js.)
//   the Bombardier  every shell's area x6 (its radius x sqrt 6); bolt and bounce carriers lob; plain shots at half the rate, each a flare
//                   that lights where it lands and reveals what is within 6 m for 8 s (`c.revealed`); a shell kicks twice as hard
//   the Carbine     the scope on ADS (2.5x, its sway steadied by a held breath on Shift, 3 s of it, then worse until it is full again); the charge is a full draw (1.6x the
//                   time, 2.5x the damage); scoped, a status shell is a dart (its status 1.5x as long) and a weak point hit counts double
//   the Pentagun    the pentacle: five different chambers fired within 4 real s, and where the fifth is aimed a burst strikes once with
//                   each of the five damage types (each type's status built at a fifth), 4 m round
//   the Pepperbox   seven pellets a plain shot (12 degrees, 12 m, a quarter each, twice the knock, a volley's push on one creature at most
//                   6 m/s: Dovina's ruling, so point-blank does not throw it out of the pellets' reach); a ring shell fires as three at half;
//                   the heart's is one slug at double; both barrels: the shell key held 0.5 s fires every loaded ring chamber at once
//                   (each its own shell and Lachryma), then 6 s before the next
//   every variant   the cylinder's turn (kinds.js `turn`): a shell waits that long after the cylinder turns
//
// Prior art, and what was taken: Ratchet & Clank's arsenal (the owner's model: each gun its own verb, not its own numbers), the
// revolver's fanned hammer, the mortar's lob, the flare pistol, the sniper's held breath (Call of Duty's Shift, Sniper Elite's steadied
// sway), the shotgun's pellets and its slug, the double-barrel's both-at-once, and the pentacle drawn by its five points in turn.
//
//   const V = new VariantPlay(weapon)   (weapon.play)   V.update(dt, input, player)   V.interval() (x the fire interval)
//   V.plain(camera, player, character)   V.chargeTime() / V.chargePower()   V.weak(c, point) (x2 scoped on a weak point)
//   V.rows(row, i, ray, camera) -> [{ row, ray }]   V.legacy(i, ray, camera) -> [{ k, ray }]   V.onShell(i, ray)
//   V.wantsBarrels (the shell key held long enough)   V.pentacleLit (the chambers lit toward the pentacle: the cylinder's look)
//   scaleShell(n, k)  a shell's numbers by { r (radius), p (power), dur (its status's hold) }
// Events: `psygun.flare` { at, r, life, n, by }, `psygun.pentacle` { at, n, by }, `psygun.barrels` { n, by } (tracking.js says each).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, DEG } from '../../core/config.js';
import { TYPES } from '../../progress/combat/types.js';
import { spreadDir } from './shellkit.js';

const AREA = ['r', 'radius', 'popRadius', 'poolRadius'];
const POWER = ['power', 'full', 'fling', 'throw', 'water', 'damage', 'creaturePower', 'dropletDamage', 'poolDps', 'velocity', 'creatureKnock'];
const DUR = ['dur', 'duration', 'stun'];
const ONE = Object.freeze({ r: 1, p: 1, dur: 1 });
const SWAY = { deg: 0.35, held: 0.04, spent: 0.7, fx: 0.55, fy: 0.37 }; // (the scope's drift in degrees: steady, a breath held, a breath held too long; its two rates in Hz: proposals)
const PELLET_KNOCK = 1.5; // (m/s a pellet pushes a creature back, before the variant's knock: a proposal)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();

/** A shell's numbers scaled by `k` (its area's radius, its power, its status's hold); the same object when nothing changes. */
export function scaleShell(n, k) {
  if (!k || (k.r === 1 && k.p === 1 && k.dur === 1)) return n;
  const o = { ...n };
  for (const key of AREA) if (typeof o[key] === 'number') o[key] *= k.r;
  for (const key of POWER) if (typeof o[key] === 'number') o[key] *= k.p;
  for (const key of DUR) if (typeof o[key] === 'number') o[key] *= k.dur;
  return o;
}

export class VariantPlay {
  constructor(weapon) {
    this.W = weapon;
    this.lastTap = -9; this.clock = 0;
    this.breath = 1; this.sway = { x: 0, y: 0 }; this.swayT = 0;
    this.points = new Map(); // (the Pentagun's chambers fired, each its time)
    this.barrelHold = -1; this.barrelsCool = 0; this.wantsBarrels = false;
    this.revealed = new Map(); // (creatures a flare has revealed, each its seconds left: `c.revealed` while it holds)
  }
  get game() { return this.W.game; }
  get gun() { return this.game.shells?.gun; }
  get P() { return this.gun?.play || {}; }
  is(id) { return this.gun?.id === `psygun.${id}`; }
  /** The Carbine's scope is up: down the sights, most of the way. */
  get scoped() { return !!this.P.scope && (this.W.adsEase ?? 0) > 0.5; }
  get pentacleLit() { return [...this.points.keys()]; }

  update(dt, input, player) {
    const g = this.game, S = g.shells, P = this.P;
    this.clock += dt;
    if (S) S.turnT = Math.max(0, (S.turnT || 0) - dt);
    this.barrelsCool = Math.max(0, this.barrelsCool - dt);
    for (const [c, left] of this.revealed) { if (left - dt <= 0 || !c.alive) { c.revealed = false; this.revealed.delete(c); } else this.revealed.set(c, left - dt); }
    for (const [i, t] of this.points) if (this.clock - t > (P.pentacle?.window ?? 4)) this.points.delete(i);
    // the scope: the view narrowed by the sights' ease, and its drift; a breath held on Shift steadies it for 3 s, then it shakes worse
    // until let go and drawn again (as long again to fill)
    const ease = P.scope ? this.W.adsEase ?? 0 : 0;
    player.scopeZoom = 1 + ((P.scope?.zoom ?? 1) - 1) * ease;
    const hold = this.scoped && (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) && !this.spent;
    const most = P.scope?.breath ?? 3;
    if (hold) this.breath = Math.max(0, this.breath - dt / most); else this.breath = Math.min(1, this.breath + dt / most);
    if (this.breath <= 1e-6) this.spent = true; else if (this.breath >= 1 - 1e-6) this.spent = false; // (spent: it shakes worse until the breath is full again, held or not: Dovina's ruling)
    this.swayT += dt;
    const deg = !this.scoped ? 0 : this.spent ? SWAY.spent : hold ? SWAY.held : SWAY.deg;
    const tx = Math.sin(this.swayT * SWAY.fx * Math.PI * 2) * deg * DEG * ease, ty = Math.sin(this.swayT * SWAY.fy * Math.PI * 2 + 1.3) * deg * DEG * 0.7 * ease;
    player.yaw += tx - this.sway.x; player.pitch += ty - this.sway.y; // (only the drift's change: let go, the aim is the player's again)
    this.sway.x = tx; this.sway.y = ty;
    // both barrels: the shell key held (the Pepperbox's, its homing shell aside: that one paints on the hold)
    this.wantsBarrels = false;
    if (P.bothBarrels && S?.type?.id !== 'homing' && this.barrelHold >= 0) {
      if (input.isDown('Mouse1')) { this.barrelHold += dt; if (this.barrelHold >= P.bothBarrels.hold && this.barrelsCool <= 0) { this.barrelHold = -1; this.wantsBarrels = true; } }
      else { this.barrelHold = -1; this.W.wantShell = true; } // (let go short of it: one shell, as on any psygun)
    }
  }
  /** The shell key pressed: true if the variant keeps it to see if it is held (the Pepperbox), false to fire at once as always. */
  holdShell() {
    if (!this.P.bothBarrels || this.game.shells?.type?.id === 'homing' || this.barrelsCool > 0) return false;
    this.barrelHold = 0; return true;
  }

  /** The plain shot's interval, times the gun's: the Bombardier's half rate, THE PSYGUN's quick taps. */
  interval() {
    const P = this.P; let k = 1;
    if (P.plainRate) k /= P.plainRate;
    if (P.fanHammer) { if (this.clock - this.lastTap <= P.fanHammer.window) k /= P.fanHammer.rateMult; this.lastTap = this.clock; }
    return k;
  }
  /** One plain shot, paid for already: a round, a flare, or seven pellets. */
  plain(camera, player, character) {
    const W = this.W, P = this.P;
    if (P.pellets) {
      const L = P.pellets, fwd = _a.set(0, 0, -1).applyQuaternion(camera.quaternion).clone();
      this.volley = new Map(); // (each creature's push this volley, up to L.pushCap: push())
      for (let i = 0; i < L.n; i++) W.shoot(camera, player, character, { dir: spreadDir(fwd, L.spread), range: L.range, power: L.each, knock: PELLET_KNOCK * L.knock, quiet: i > 0, recoil: i === 0 ? 1.6 : 0, pellets: i === 0 ? L.n : 0 });
      this.volley = null;
      return;
    }
    const end = W.shoot(camera, player, character);
    if (P.flare && end) this.flare(end, P.flare);
  }
  /** How much of a pellet's push `ent` may still take this volley (the Pepperbox's cap); outside a volley, all of it. */
  push(ent, knock) {
    const cap = this.P.pellets?.pushCap; if (!this.volley || !cap) return knock;
    const used = this.volley.get(ent) || 0, k = Math.max(0, Math.min(knock, cap - used));
    this.volley.set(ent, used + k); return k;
  }
  /** The Bombardier's flare: a light where the shot landed, and what is within its reach revealed for its life. */
  flare(at, F) {
    const g = this.game;
    let n = 0;
    for (const c of g.creatures?.near?.(at, F.reveal) || []) { if (!c.alive || c.ally) continue; c.revealed = true; this.revealed.set(c, F.life); n++; }
    if (g.vfx?.has?.('psygun.flare')) g.vfx.play('psygun.flare', { pos: at }); else g.fx?.impact(at, _b.set(0, 1, 0), { sparks: 18, dust: 4 }); // (placeholder until Calissa's look: the library's 'psygun.flare')
    g.events?.emit('psygun.flare', { at: at.clone(), r: F.reveal, life: F.life, n, by: 'courier' });
  }

  /** The charge's wind-up time, times the gun's (the Carbine's full draw). */
  chargeTime() { return this.P.fullDraw?.timeMult ?? 1; }
  /** The charged beam's damage, times the gun's. */
  chargePower() { return this.P.fullDraw?.dmgMult ?? 1; }
  /** A blow's multiplier on a creature: the Carbine scoped, on its weak point (the one it names: `lockPoint`), counts double. */
  weak(c, point) {
    const k = this.P.weakScoped; if (!k || !this.scoped || !c?.lockPoint) return 1;
    return c.lockPoint(_b).distanceTo(point) <= Math.max(0.5, (c.radius || 0.5) * 0.6) ? k : 1;
  }

  /** A shell's scale on this variant at chamber `i`: { r, p, dur }. */
  scale(i, row) {
    const P = this.P;
    const r = P.radiusMult ?? 1;
    const p = P.slug && i === this.gun?.heart ? P.slug : P.shellSpread ? P.shellSpread.each : 1;
    const dart = P.dart && this.scoped && (!row || row.payloads?.includes('status')) ? P.dart.statusMult : 1;
    return r === 1 && p === 1 && dart === 1 ? ONE : { r, p, dur: dart };
  }
  /** The rays one shell flies on: one, or the Pepperbox's three fanned across the view (its heart's slug one). */
  rays(i, ray, camera) {
    const P = this.P;
    if (!P.shellSpread || i === this.gun?.heart) return [ray];
    const up = _a.set(0, 1, 0).applyQuaternion(camera.quaternion), n = P.shellSpread.n, out = [];
    const span = (P.pellets?.spread ?? 12) * DEG;
    for (let j = 0; j < n; j++) out.push({ origin: ray.origin, dir: ray.dir.clone().applyQuaternion(_q.setFromAxisAngle(up, n > 1 ? span * (j / (n - 1) - 0.5) : 0)) });
    return out;
  }
  /** A runner shell's rows to fly: its row scaled for this variant (and lobbed, on the Bombardier), on each of its rays. */
  rows(row, i, ray, camera) {
    const k = this.scale(i, row), lob = this.P.lob?.includes(row.carrier);
    const r = k === ONE && !lob ? row : { ...row, n: scaleShell(row.n, k), ...(lob ? { lob: true } : {}) };
    return this.rays(i, ray, camera).map((ray) => ({ row: r, ray }));
  }
  /** A built-in shell's (the Cleave, the push, the well, the mark, the bomb, the paint) scale and rays. */
  legacy(i, ray, camera) { const k = this.scale(i, null); return this.rays(i, ray, camera).map((ray) => ({ k, ray })); }

  /** A shell fired from chamber `i`: the Pentagun counts its points, and the fifth different one draws the pentacle where it is aimed. */
  onShell(i, ray) {
    const P5 = this.P.pentacle; if (!P5) return;
    this.points.set(i, this.clock);
    if (this.points.size < P5.types) return;
    this.points.clear();
    const g = this.game, hit = g.physics.raycast(ray.origin, ray.dir, T.weapon.range, g.player.collider, undefined, (c) => !c.isSensor());
    const at = hit ? hit.point.clone() : ray.origin.clone().addScaledVector(ray.dir, 30);
    let n = 0;
    for (const c of g.creatures?.near?.(at, P5.radius) || []) {
      if (!c.alive || c.ally) continue;
      const mid = _b.copy(c.pos).setY(c.pos.y + (c.height ?? 1) * 0.5), dir = mid.clone().sub(at).setY(0.3).normalize();
      for (const type of Object.keys(TYPES).slice(0, P5.types)) g.creatures.strike(c, mid, dir, 1, 'pentacle', 'courier', null, type, P5.build);
      n++;
    }
    g.breakables?.explode(at, { radius: P5.radius, breakFrac: 0.3, velocity: 6, fx: false, cause: 'pentacle' });
    if (g.vfx?.has?.('psygun.pentacle')) g.vfx.play('psygun.pentacle', { pos: at }); else g.fx?.shockwave(at, P5.radius); // (placeholder until Calissa's look)
    g.events?.emit('psygun.pentacle', { at, n, by: 'courier' });
  }
  /** Both barrels went: the cooldown starts. */
  barrels(n) { this.barrelsCool = this.P.bothBarrels?.cooldown ?? 6; this.game.events?.emit('psygun.barrels', { n, by: 'courier' }); }
}
