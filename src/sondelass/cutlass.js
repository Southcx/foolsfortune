// ---------------------------------------------------------------------------------------
// THE CUTLASS: the Sondelass's first melee form. A three-stroke combo and a lunge, played from the Universal Animation Library's
// sword clips (CC0) over the upper body, so the legs keep running. A stroke has a wind-up, a window in which the blade can hurt
// what it passes through, and a window in which the next press chains; the third stroke is the overhead one and cuts hardest.
//
// Prior art, and what was taken:
//  - Every third-person action game's light combo (Zelda's, Dark Souls' R1 string): a buffered press inside the chain window
//    continues, a late one starts over, and each stroke steps you a little way toward what you are cutting.
//  - Monster Hunter: the hit window is a slice of the clip, not the whole of it, and the blade is tested along its length
//    every frame in that slice (a swept segment, not a point) so a fast swing cannot skip through something.
// The blade is tested against breakables and clapperjars by distance from the blade's segment (they are few and near); each is
// hit once per stroke.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { BLADE_LEN } from './model.js';

const STROKES = [
  { clip: 'swordA', dur: 0.43, hit: [0.14, 0.32], chain: [0.26, 0.75], dmg: 1.0, lunge: 3.2, power: 1.2 },
  { clip: 'swordB', dur: 0.53, hit: [0.12, 0.34], chain: [0.28, 0.8], dmg: 1.1, lunge: 3.2, power: 1.3 },
  { clip: 'swordC', dur: 0.95, hit: [0.44, 0.78], chain: [], dmg: 1.9, lunge: 5, power: 2.0 },
];
const HEAVY = { clip: 'swordAtk', dur: 1.05, hit: [0.36, 0.62], chain: [], dmg: 2.6, lunge: 9.5, power: 2.6 };
const DMG = 62;
const _up = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3();

/** Distance from point p to the segment ab. */
function segDist(a, b, p) {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? THREE.MathUtils.clamp(_c.subVectors(p, a).dot(_d) / l2, 0, 1) : 0;
  return _c.copy(a).addScaledVector(_d, t).distanceTo(p);
}

export class Cutlass {
  constructor(tool) {
    this.tool = tool;
    this.stroke = null; // the one being played
    this.t = 0;
    this.n = -1; // the last stroke of the combo
    this.buffer = 0;
    this.idle = 9; // time since the last stroke ended
    this.hit = new Set();
    this.combo = 0;
  }
  get busy() { return !!this.stroke; }
  get playing() { return !!this.stroke; }
  get game() { return this.tool.game; }
  cancel() { this.stroke = null; this.buffer = 0; }

  start(def, n, heavy = false) {
    const P = this.tool.P, g = this.game;
    this.stroke = def; this.t = 0; this.n = n; this.hit.clear(); this.buffer = 0; this.heavy = heavy;
    // toward the aim: the body turns to the camera's heading, and steps into it
    P.bodyYaw = P.yaw;
    const f = _a.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    P.impulse(f.clone().multiplyScalar(def.lunge * (P.grounded ? 1 : 0.5)), 'cut');
    sfx.slash(heavy);
    this.combo = heavy ? 0 : n + 1;
    g.events?.emit(heavy ? 'cut.heavy' : 'cut.swing', { n });
    this.tool.track?.play('swordIdle', 0, 0.2);
  }

  update(dt, inp) {
    const P = this.tool.P;
    this.idle += dt;
    if (!this.stroke) {
      if (this.idle > 0.9) this.n = -1;
      if (inp.wasPressed('Mouse0') && P.techs.active?.id !== 'swim') this.start(STROKES[(this.n + 1) % STROKES.length], (this.n + 1) % STROKES.length);
      else if (inp.wasPressed('Mouse2')) this.start(HEAVY, -1, true);
      return;
    }
    const s = this.stroke;
    this.t += dt;
    if (inp.wasPressed('Mouse0')) this.buffer = 0.35;
    this.buffer -= dt;
    if (this.t >= s.hit[0] && this.t <= s.hit[1]) this.sweep();
    // the next stroke: a press inside the chain window
    if (s.chain.length && this.buffer > 0 && this.t >= s.chain[0] && this.t <= s.chain[1]) { this.start(STROKES[this.n + 1], this.n + 1); return; }
    if (this.t >= s.dur) { this.stroke = null; this.idle = 0; }
  }

  /** The blade's segment through everything near it. */
  sweep() {
    const g = this.game, m = this.tool.model, P = this.tool.P;
    m.group.updateMatrixWorld(true);
    m.bladeSegment(_a, _b);
    const dir = _d.copy(_b).sub(_a).normalize();
    const s = this.stroke;
    let struck = 0;
    for (const ent of [...g.breakables.items]) {
      if (!ent.alive || this.hit.has(ent) || ent.def?.trial) continue;
      const t = ent.body.translation();
      _p.set(t.x, t.y + ent.P.height * 0.45, t.z);
      if (_p.distanceToSquared(P.pos) > 36) continue;
      if (segDist(_a, _b, _p) > 0.22 + ent.P.rMax * 0.9) continue;
      this.hit.add(ent); struck++;
      g.breakables.damage(ent, DMG * s.dmg, _p.clone(), dir.clone(), s.power);
      g.events?.emit('cut.hit', { what: 'pot', combo: this.combo });
    }
    for (const c of [...g.clappers.list]) {
      if (!c.alive || this.hit.has(c)) continue;
      _p.copy(c.pos).y += 0.35;
      if (_p.distanceToSquared(P.pos) > 36) continue;
      if (segDist(_a, _b, _p) > 0.7) continue;
      this.hit.add(c); struck++;
      g.clappers.hit(c, _p.clone(), dir.clone(), s.power, 'sliced');
      g.events?.emit('cut.hit', { what: 'clapper', combo: this.combo });
    }
    // the tip on the water: a sheet of spray
    if (struck) {
      sfx.cutHit(s.dmg);
      P.shake = Math.max(P.shake, 0.12 * s.dmg);
      g.fx.slash?.(_a.clone(), _b.clone(), _up);
    }
  }

  /** The clip layer: { pose, w } while a stroke is playing. */
  pose(C, out) {
    const s = this.stroke;
    if (!s) return null;
    C.sample(s.clip, s.clip === 'swordC' ? this.t : this.t, out, false);
    const w = Math.min(1, this.t / 0.06) * (1 - THREE.MathUtils.smoothstep(this.t, s.dur - 0.2, s.dur));
    return { pose: out, w };
  }
}
