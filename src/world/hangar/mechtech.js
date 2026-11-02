// ---------------------------------------------------------------------------------------
// THE MECH'S TECHNIQUES (docs/plans/MECHS.md 9.2; South, 2026-11-02: "technique capabilities, think incredible hulk's ultimate
// destruction"): Dovina's TECHNIQUES (progress/mechs/techniques.js) on the keys the mech already has, each open by its count way or
// its feat way in the ledger (techniqueOpen; grab and throw from the start; the DEBUG save's Movement Arts lend opens them all), each
// paid from the battery (the pilot's spent kJ), carving the toy city where it lands (city.js strike, its `carve` shape in metres, a cell
// a metre) and striking the straw giant in its reach (giant.js blow, its k x outputK(sync) and its stagger, said as mech.hit):
//   Thunderclap   LMB and RMB pressed within TECH.chord real s: a cone of shock ahead (the first arm's blow called back); glass breaks
//   Ground Pound  C on the ground: a ball carved at the frame's feet, the giant's legs struck in reach
//   Elbow Drop    C in the air: the frame driven down; where it lands a ball carved and the giant's head struck, harder a metre fallen
//   Super Jump    Space held TECH.superHold real s standing still, then let go: the jump x jumpK (a tap standing still jumps on its
//                 release once this is open; moving, Space jumps on the press as before)
//   Battering Ram the assault boost into a building: capsules carved along its path each frame, so the frame goes through the walls
//   Uppercut      W held and LMB: a blow up through the chin (the giant's head) and a column carved up through what is ahead
//   Wrecking Spin LMB held TECH.spinHold real s with a club in hand: a full turn striking all round (props.js swing)
//   Grab, Throw, Javelin, Slab Shield: the props' (props.js): F, RMB with a thing held (tapped a club's swing, held and let go a throw,
//                 point first with a post or girder), V with a slab
// Every jump says `mech.jump`. The plain moveset is unchanged: a technique takes a press only where its own keys are met.
//
// Prior art: The Incredible Hulk: Ultimate Destruction (2005: the Thunderclap, Ground Pound, Elbow Drop, Super Jump, the shoulder charge
// through a wall), Giant Clank's charge and slam, Toribash's threshold (a blow's force past it is what breaks things), the chord as a
// fighting game reads one (two buttons within a few frames: Street Fighter's throw).
//
//   const T = new MechTech(pilot)   T.reset()   T.open(id) -> bool   T.drive(K, dt) -> { L, R } (the arm presses it took)
//   T.jumpKeys(K, dt)   T.ram(dt) (before the move)   T.landed(fall) (the pilot's landing)   T.cityBlow(from, dir, reach, k, r) -> bool
//   T.hitGiant(id, k, stagger, region, heavy) -> giant.js blow's result   TECH
//   events: mech.technique { id, by, through?, fell?, height? }, mech.jump { by, super? }, mech.hit { weapon, region, ..., crit, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TECHNIQUES, techniqueOpen } from '../../progress/mechs/techniques.js';
import { outputK } from '../../progress/mechs/rules.js';
import { legsLeft } from '../../progress/mechs/joints.js';
import { PROVING } from './layout.js';
import { MECH_BODY, seatOf, heightOf } from './mech.js';

/** The keys' timing (real s; placeholders for feel, South's to judge): a chord's window (Street Fighter's throw is about 0.1), Super
 *  Jump's hold, the Wrecking Spin's hold, a technique's rest before it can be done again, the Elbow Drop's dive (m/s down), the
 *  Uppercut's blow landing after the press (the arm's own), and the heights (shares of the frame's) the Battering Ram's capsules ride at. */
export const TECH = { chord: 0.15, superHold: 1, spinHold: 0.6, rest: 0.8, dive: 24, land: 0.3, ramAt: [0.22, 0.55, 0.85], standStill: 1 };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _d = new THREE.Vector3();

export class MechTech {
  constructor(pilot) { this.p = pilot; this.game = pilot.game; this.reset(); }
  reset() { this.t = 0; this.pressT = { L: -9, R: -9 }; this.cool = {}; this.charge = -1; this.diving = null; this.ramming = null; this.lHold = 0; this.rHold = -1; this.spun = false; }
  get city() { return this.p.hangar.city?.built ? this.p.hangar.city : null; }
  get props() { return this.p.hangar.props; }
  out() { return this.p.berserk > 0 ? outputK(1) : outputK(this.p.sync); }
  /** Open by the ledger (count way or feat way), or lent in the DEBUG save (the Movement Arts row: game.lend's `arts`). */
  open(id) { const g = this.game; return techniqueOpen(id, g.ledger) || !!g.lend?.has?.('arts'); }
  ready(id) { return this.open(id) && (this.cool[id] ?? 0) <= this.t; }
  done(id, extras = {}) { this.cool[id] = this.t + TECH.rest; this.game.events?.emit('mech.technique', { id, ...extras, by: 'courier' }); }

  /** A blow of a technique on the giant (when it is in reach), said as the arms' are. */
  hitGiant(id, k, stagger, region, heavy = false) {
    const G = this.p.giant; if (!G) return null;
    const r = G.blow({ weapon: id, k, stagger, heavy, region, from: this.p.pos, by: 'courier' });
    if (!r.blocked && r.staggered) this.p.staggerHit();
    this.game.events?.emit('mech.hit', { weapon: id, region, staggered: !!r.staggered, pierced: !!r.pierced, crit: !!r.crit, ...(r.blocked ? { blocked: true } : {}), ...(r.felled ? { felled: true } : {}), by: 'courier' });
    return r;
  }
  /** A blow on the city along a line: the first standing cell within `reach` m struck with a ball of `r` m. */
  cityBlow(from, dir, reach, k, r = 2) {
    const C = this.city; if (!C) return false;
    const hit = C.raycast(from, dir, reach); if (!hit) return false;
    return C.strike({ kind: 'ball', at: hit.point, r }, k, 'courier').cells > 0;
  }
  chest(out) { return out.copy(this.p.pos).setY(this.p.pos.y + seatOf(this.p.stats)); }
  /** The arms' aim: the frame's facing, pitched as the camera looks (so a fist aimed low strikes a wall's foot). */
  aim(out) { const f = this.p.forward(out), c = this.p.aimDir(_d); f.y = Math.max(-0.9, Math.min(0.6, c.y + 0.15)); return f.normalize(); }

  // ------------------------------------------------------------------ the keys
  /** The arm presses a technique takes this frame (the rest go to the arms as before). */
  drive(K, dt) {
    this.t += dt; const used = { L: false, R: false }, P = this.props, held = P?.held;
    const lP = K.pressed('Mouse0'), rP = K.pressed('Mouse2');
    if (lP) this.pressT.L = this.t; if (rP) this.pressT.R = this.t;
    // the Thunderclap: both hands within the chord (the first's blow called back)
    if ((lP || rP) && Math.abs(this.pressT.L - this.pressT.R) <= TECH.chord && this.ready('thunderclap') && this.p.armLock('L') && this.p.armLock('R') && !held) {
      this.p.weapons.cancel(lP ? 'R' : 'L'); this.thunderclap(); return { L: true, R: true };
    }
    // the Uppercut: W held and LMB
    if (lP && K.down('KeyW') && this.ready('uppercut') && this.p.armLock('L')) { this.uppercut(); used.L = true; }
    // a prop in the right hand: RMB is the prop's (tapped a swing, held and let go a throw); LMB held, the Wrecking Spin
    if (held) {
      used.R = true;
      if (rP) this.rHold = 0; else if (this.rHold >= 0 && K.down('Mouse2')) this.rHold += dt;
      if (this.rHold >= 0 && K.released('Mouse2')) {
        const tap = this.rHold < 0.3 && held.P.hand; this.rHold = -1;
        if (tap) P.swing(); else { const jav = (held.prop === 'post' || held.prop === 'girder') && this.open('javelin'); if (P.throw({ javelin: jav }) && jav) this.done('javelin'); }
      }
      if (held.P.hand && K.down('Mouse0')) { this.lHold += dt; if (this.lHold >= TECH.spinHold && !this.spun && this.ready('spin')) { this.spun = true; this.p.weapons.arms.L.hold = 0; this.p.spend(TECHNIQUES.spin.kJ); P.swing({ spin: true, k: TECHNIQUES.spin.k }); this.done('spin'); } }
      else { this.lHold = 0; this.spun = false; }
    } else this.rHold = -1;
    // C: the Ground Pound on the ground, the Elbow Drop in the air
    if (K.pressed('KeyC')) { if (this.p.grounded) { if (this.ready('groundPound')) this.groundPound(); } else if (!this.diving && this.ready('elbowDrop')) this.elbowDrop(); }
    return used;
  }

  /** Space: a jump on the press (moving), or, standing still with Super Jump open, on the release, x jumpK if held long enough. */
  jumpKeys(K, dt) {
    const p = this.p, S = p.stats, can = p.grounded && S.jump > 0 && !p.broken('legs') && legsLeft(p.state.joints) === 2;
    if (K.pressed('Space') && can) { if (this.open('superJump') && p.speed < TECH.standStill) this.charge = 0; else this.jump(1); }
    if (this.charge < 0) return;
    if (!can) { this.charge = -1; return; }
    if (K.down('Space')) { this.charge += dt; return; }
    const sup = this.charge >= TECH.superHold; this.charge = -1;
    this.jump(sup ? TECHNIQUES.superJump.jumpK : 1, sup);
  }
  jump(m, sup = false) {
    const p = this.p; p.vy = p.stats.jump * m; p.grounded = false; p.peakY = p.pos.y;
    this.game.events?.emit('mech.jump', { ...(sup ? { super: true } : {}), by: 'courier' });
    if (sup) { p.spend(TECHNIQUES.superJump.kJ); this.done('superJump'); }
  }

  // ------------------------------------------------------------------ the techniques
  thunderclap() {
    const T = TECHNIQUES.thunderclap, p = this.p, W = p.weapons, k = T.k * this.out();
    p.spend(T.kJ); W.arms.L.swing = W.arms.R.swing = 1;
    this.city?.strike({ kind: 'cone', at: this.chest(_a), dir: p.forward(_f), r: T.carve.r, angle: T.carve.angle, only: T.carve.only }, k, 'courier');
    if (W.gap() <= T.reach && W.inFront(Math.cos(T.carve.angle))) this.hitGiant('thunderclap', k, T.stagger, 'head');
    this.done('thunderclap');
  }
  groundPound() {
    const T = TECHNIQUES.groundPound, p = this.p, k = T.k * this.out();
    p.spend(T.kJ); p.weapons.arms.L.swing = p.weapons.arms.R.swing = 1; p.kneel = 0.6;
    _a.copy(p.pos).addScaledVector(p.forward(_f), MECH_BODY.radius * 0.8).setY(p.pos.y + 1);
    const s = this.city?.strike({ kind: 'ball', at: _a, r: T.carve.r }, k, 'courier');
    if (p.weapons.gap() <= T.reach) this.hitGiant('groundPound', k, T.stagger, 'legs', true);
    this.done('groundPound', s?.felled.length ? { fell: true } : {});
  }
  elbowDrop() { const p = this.p; p.spend(TECHNIQUES.elbowDrop.kJ); this.diving = { y0: Math.max(p.peakY ?? p.pos.y, p.pos.y) }; p.vy = Math.min(p.vy, -TECH.dive); this.cool.elbowDrop = this.t + TECH.rest; }
  /** The pilot's landing (a fall of `fall` m): the Elbow Drop comes down where it lands. */
  landed(fall) {
    const D = this.diving; if (!D) return; this.diving = null;
    const T = TECHNIQUES.elbowDrop, p = this.p, h = Math.max(0, D.y0 - p.pos.y, fall), k = (T.k + T.fall * h) * this.out();
    p.weapons.arms.R.swing = 1; p.kneel = 0.8;
    _a.copy(p.pos).addScaledVector(p.forward(_f), 2).setY(p.pos.y + 1);
    this.city?.strike({ kind: 'ball', at: _a, r: T.carve.r }, k, 'courier');
    if (p.weapons.gap() <= T.reach) this.hitGiant('elbowDrop', k, T.stagger, 'head', true);
    this.done('elbowDrop', { height: Math.round(h) });
  }
  uppercut() {
    const T = TECHNIQUES.uppercut, p = this.p, lock = p.armLock('L'), k = T.k * this.out() * lock;
    p.spend(T.kJ); p.weapons.arms.L.swing = 1; this.cool.uppercut = this.t + TECH.rest;
    p.weapons.later(TECH.land / lock, () => {
      const at = this.chest(_a).addScaledVector(p.forward(_f), MECH_BODY.radius + T.carve.r);
      this.city?.strike({ kind: 'capsule', at, to: _b.copy(at).setY(at.y + T.carve.up), r: T.carve.r }, k, 'courier');
      if (p.weapons.gap() <= T.reach && p.weapons.inFront()) this.hitGiant('uppercut', k, T.stagger, 'head', true);
      this.game.events?.emit('mech.technique', { id: 'uppercut', by: 'courier' });
    }, 'L');
  }

  /** The Battering Ram: while the assault boost runs into standing cells ahead, capsules carved along the path (the frame's walls no
   *  wall); said once a boost's contact ends, `through` when it went in one side of a building and out the other. */
  ram(dt) {
    const p = this.p, C = this.city, T = TECHNIQUES.battering;
    const end = () => { const R = this.ramming; if (!R) return; this.ramming = null; this.done('battering', R.through ? { through: true } : {}); };
    if (!C || !p.assault || !this.open('battering')) return end();
    const f = p.forward(_f), h = heightOf(p.stats), ahead = MECH_BODY.radius + T.reach;
    _a.copy(p.pos).addScaledVector(f, MECH_BODY.radius * 0.5 + 2);
    const front = C.solidAt(_a.x, _a.z, p.pos.y + 1.2, p.pos.y + h, MECH_BODY.radius * 0.8);
    if (front) {
      const k = T.k * this.out();
      for (const s of TECH.ramAt) { _a.copy(p.pos).setY(p.pos.y + h * s).addScaledVector(f, MECH_BODY.radius - 1); _b.copy(_a).addScaledVector(f, ahead - MECH_BODY.radius + 1).addScaledVector(p.vel, dt); C.strike({ kind: 'capsule', at: _a, to: _b, r: T.carve.r }, k, 'courier'); }
      if (!this.ramming) { const rec = C.recs.find((r) => C.near(r, p.pos.x + f.x * ahead, p.pos.z + f.z * ahead, 0)) || C.recs.find((r) => C.near(r, p.pos.x, p.pos.z, ahead)) || null; this.ramming = { rec, inside: false, through: false }; }
    }
    const R = this.ramming; if (!R) return;
    const inRec = !!R.rec && C.near(R.rec, p.pos.x, p.pos.z, 0), nearRec = !!R.rec && C.near(R.rec, p.pos.x, p.pos.z, ahead);
    if (inRec) R.inside = true;
    else if (R.inside) { R.through = true; end(); } // (in one side and out the other, still boosting: wall to wall)
    else if (!nearRec) end(); // (it glanced off: the contact over)
  }
}
