// ---------------------------------------------------------------------------------------
// THE SWARM: a voxel boid flock poured through the frame as one shape (docs/plans/RAIL-FLOW.md 2; its row ROSTER.swarm, Dovina's; the
// glossary's "a swarm"). 24 to 48 one-hit bodies on the waves' roll, flown by one Flock (creatures/ai/flock.js: Reynolds' three rules
// over a spatial hash, as the shoal's glints are), each seeking its slot on its SHAPE while the shape runs through the view's frame
// (foemoves.js viewFrame: in a plane view its play plane, in chase across the screen and down the scroll):
//   river   a band across the frame, rows deep, from beyond the far edge to past the near one
//   ribbon  a helix round the ship's lane (in a plane view a weave across it), stretched along the scroll
//   bloom   flown in packed to a point in the frame's far half, held a beat, then burst outward and scattered off the frame
// It fires nothing: its danger is its body. A member within CONTACT m of the ship is a blow the roll dodges (a rammer's), and is
// spent. Shot, a member is down (it pays as a school's fish and stands outside the chain, as the shoal's fish do: one body,
// RAIL-STANDARDS.md 2). It is drawn by Calissa's swarm look (vfx/voxels/swarmlook.js:
// voxel fry, one draw call, a member bursting into its voxels as it falls), one swarm a look (`game.swarmLooks`: two); a third in flight
// at once (or any, headless) is drawn by the placeholder here, a cube in its feeling's colour. Its edge mark shows where it will come in (RAIL-FLOW.md 4).
//
// Prior art: Reynolds' boids (SIGGRAPH 1987), Resogun's and Nex Machina's swarms (a cloud of one-hit bodies to clear), Rez's lock-on
// feast, Ikaruga's chains.
//
//   const S = new Swarm(waves, wave, wi)   S.step(dt)   S.draw()   S.done -> true once every member is gone   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Flock } from '../../creatures/ai/flock.js';
import { COLOR, OPPOSITE } from '../../progress/weather.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { CARRIER_AT } from '../../progress/rail/legs.js';
import { CRUISE } from '../../courier/ship/views.js';
import { viewFrame } from './foemoves.js';

const CROSS_S = 5, CONTACT = 1.6, VOXEL = 0.7, BODY_R = 1.26; // (real s to cross the frame; how near is a touch, m; the placeholder voxel's edge, m; a member's hurt sphere, m: its fry drawn 1.8 times a voxel, vfx/voxels SWARM_SCALE, and the sphere never smaller than the silhouette, RAIL-FLOW.md 6.3)
const _t = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 0);
const ease = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
let GEO = null; const MATS = new Map();
const matOf = (aspect) => { if (!MATS.has(aspect)) { const c = COLOR[aspect] ?? 0xbfefff; MATS.set(aspect, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.5, flatShading: true })); } return MATS.get(aspect); };

export class Swarm {
  constructor(W, w, wi) {
    const n = Math.max(1, w.count | 0), view = W.view || 'chase', side = view === 'side', plane = side || view === 'above';
    const B = (CARRIER_AT[view] || CARRIER_AT.chase).box, P = viewFrame(view), shape = ['river', 'ribbon', 'bloom'].includes(w.formation) ? w.formation : 'river';
    const aspect = wi % 2 ? OPPOSITE[W.aspect] || W.aspect : W.aspect, lane = w.lane ?? 0;
    Object.assign(this, { W, n, view, plane, shape, aspect, t: 0, members: [], done: false });
    // a point of the frame from (a across -1..1, s along the scroll: 1 the far edge, 0 the near), up `y` m in chase
    const across = side ? (B.y[1] - B.y[0]) / 2 : B.x, along = B.z[1] - B.z[0];
    this.place = (a, s, y, out) => (plane ? out.copy(side ? P(2 * s - 1, (a + 1) / 2) : P(a, s)) : out.set(a * B.x * 0.8, CRUISE + 0.5 + y, B.z[0] + s * along));
    this.span = { across, along };
    const cols = shape === 'river' ? Math.ceil(n / 3) : n;
    this.slot = (i, t, out) => { // (member i's place on the shape at t real s)
      const run = 1.12 - (1.5 * t) / CROSS_S; // (in from just past the far edge: a third of a real s to come in)
      if (shape === 'river') { const c = i % cols, r = Math.floor(i / cols); return this.place(-0.8 + (1.6 * c) / Math.max(1, cols - 1) + 0.08 * Math.sin(t * 1.2 + r), run + (r * 2.2) / along, Math.sin(t * 1.6 + c * 0.7) * 0.8, out); }
      if (shape === 'ribbon') { const u = i / n, g = u * Math.PI * 4 + t * 2.4, S = W.ship?.local; const a0 = S ? (plane ? (side ? (S.y - (B.y[0] + B.y[1]) / 2) / across : S.x / B.x) : S.x / (B.x * 0.8)) : 0;
        return plane ? this.place(a0 + 0.45 * Math.sin(g), run + u * 0.6, 0, out) : this.place(a0 + (Math.cos(g) * 5) / (B.x * 0.8), run + u * 0.6, Math.sin(g) * 3 + (S ? S.y - CRUISE - 0.5 : 0), out); }
      const c = this.place(lane * 0.3, 1.25 - 0.55 * ease(t / BAR_S), 1, _t), burst = Math.max(0, t - 1.5 * BAR_S) * 9, g = (i / n) * Math.PI * 2 + i * 0.37; // (the bloom: in, held a beat, burst)
      out.copy(c);
      if (plane) { const A = side ? 'y' : 'x'; out[A] += Math.cos(g) * (0.6 + burst); out.z += Math.sin(g) * (0.6 + burst); }
      else { out.x += Math.cos(g) * (0.6 + burst); out.y += Math.sin(g) * (0.6 + burst) * 0.6; out.z += Math.sin(g * 1.7) * burst * 0.4; }
      return out;
    };
    this.gone = (p, t) => (shape === 'bloom' ? t > 4 * BAR_S : 1.12 - (1.5 * t) / CROSS_S < -0.35) || (plane && (p.z < B.z[0] - 8 || p.z > B.z[1] + 30)) || (!plane && p.z < -14);
    this.flock = new Flock({ max: n, sep: [1.3, 1.8], align: [3.5, 0.7], coh: [5, 0.4], speed: 14, turn: 7, stride: n > 32 ? 2 : 1 });
    this.mesh = new THREE.InstancedMesh(GEO ||= new THREE.BoxGeometry(VOXEL, VOXEL, VOXEL), matOf(aspect), n);
    this.mesh.frustumCulled = false; this.mesh.userData.zoneFree = true; W.scene.add(this.mesh);
    const looks = W.game.swarmLooks || (W.game.swarmLook ? [W.game.swarmLook] : []), taken = W.swarmLooksTaken ||= new Set(), L = looks.find((x) => !taken.has(x)); // (a free look of Calissa's)
    if (L) { taken.add(L); this.look = L; L.setAspect?.(aspect); L.setKind?.('fry'); this.mesh.visible = false; this.boids = []; }
    const cls = w.cls ?? 0, hp = w.hp ?? 1; // (its row's share of its class's hit points: waves.js)
    for (let i = 0; i < n; i++) {
      this.slot(i, 0, _t); const k = this.flock.add(_t.x, _t.y, _t.z, 0, 0, -10);
      const f = W.add({
        kind: 'rail.swarm', name: 'a body of the swarm', role: 'swarm', cls, aspect, radius: BODY_R, hp, local: _t.clone(), form: 'swarm', chain: false,
        tick: (dt, m) => this.tick(m), onGone: () => this.flock.remove(k), onDown: () => this.look?.down(i),
      });
      f.k = k; f.slotI = i; this.members.push(f);
    }
    W.markEntry(this.members[0], 'swarm', (t, out) => this.slot(0, t, out));
  }
  /** The flock a frame: each member seeks its slot on the shape, faster the further it is. */
  step(dt) {
    this.t += dt; this.dt = dt; const t = this.t, want = new THREE.Vector3(), p = new THREE.Vector3(), M = this.members;
    const byK = this.byK ||= new Map(M.map((f) => [f.k, f]));
    this.flock.step(dt, {
      seek: (k, out) => { const f = byK.get(k); if (!f) return 0; this.slot(f.slotI, t, out); return 2.6; },
      speed: (k) => { const f = byK.get(k); if (!f) return 14; this.slot(f.slotI, t, want); this.flock.get(k, p); return Math.min(34, Math.max(8, p.distanceTo(want) * 3)); },
    });
  }
  /** A member's frame: where its boid is; a touch on the ship is a blow and spends it; off the frame, it is gone. */
  tick(f) {
    if (!f.alive) return false;
    this.flock.get(f.k, f.local);
    const S = this.W.ship?.local;
    if (S && f.local.distanceTo(S) < CONTACT) { this.W.game.emocean?.blow?.(1, { by: 'creature', what: 'swarm', rollable: true }); return false; }
    return !this.gone(f.local, this.t);
  }
  /** One draw call: every live member's voxel where it is, turned the way it flies; the gone at nought. */
  draw() {
    const v = new THREE.Vector3(); let live = 0;
    if (this.look) { // (Calissa's look: the boids as it reads them, rail-local)
      for (let i = 0; i < this.members.length; i++) { const f = this.members[i], b = (this.boids[i] ||= { pos: new THREE.Vector3(), vel: new THREE.Vector3(), alive: false }); b.alive = f.alive; if (f.alive) { this.flock.get(f.k, b.pos, b.vel); live++; } }
      this.look.set(this.boids, this.W.rail, this.dt || 1 / 60); if (!live) this.done = true; return;
    }
    for (let i = 0; i < this.members.length; i++) {
      const f = this.members[i];
      if (!f.alive) { _m.compose(f.pos, _q.identity(), _z); this.mesh.setMatrixAt(i, _m); continue; }
      live++; this.flock.get(f.k, _t, v); this.W.rail.dirWorld?.(v, v);
      if (v.lengthSq() > 1e-6) _q.setFromUnitVectors(_s.set(0, 0, 1), v.normalize()); else _q.identity();
      _m.compose(f.pos, _q, _s.set(1, 1, 1.6)); this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (!live) this.done = true;
  }
  dispose() {
    if (this.look) { for (const b of this.boids) b.alive = false; this.look.set(this.boids, this.W.rail, 0); this.W.swarmLooksTaken?.delete(this.look); this.look = null; }
    this.mesh.parent?.remove(this.mesh); this.mesh.dispose(); this.flock.clear();
  }
}
