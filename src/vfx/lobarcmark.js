// ---------------------------------------------------------------------------------------
// THE LOB'S ARC MARK: the Bombardier's shell previewed on its mortar arc (OVERLAY.md 19: "bolt and bounce carriers lob, previewed on the
// ground"; Calissa's board v10, figure 02). While the Bombardier is drawn and the shell under its hammer flies a lob (a runner row whose
// carrier the variant lobs, `play.lob` in kinds.js, or a lob of its own; the Bomb), where it would land if fired now, and the flight to it.
// A world mark: no words, no numbers.
//
//   THE ARC       the flight from the muzzle in the System's violet, dotted (a dash every few steps, never a beam), fading in off the gun so it never covers
//                 the Courier: the wire of the rail's marks (vfx/railmark.js), as the carry throw's mark draws its own
//   THE RING      at the landing, as wide as the shell's area there (its radius times the Bombardier's x2.45, the +500% area): the
//                 paint reticle's look (vfx/brushmarks.js PaintReticle) in the System's labradorite; inside it the shell's own radius
//                 dashed, so the x6 reads against what it would have been
//
// The flight is the runner's own lob worked forward (tools/psygun/shellrunner.js CARRIER.lob, read, never driven; the Bomb's from
// T.shells.bomb): from the muzzle along the shot's ray (weapon.shotRay), its speed and its lift, gravity times its share, stepped at
// the physics' rate until a ray meets something, its life at most (where it runs out, the runner lands it). Recomputed every frame it shows.
//
// No program of its own: the ring is the ribbons' (the paint reticle), the arc and the dashed ring the rail mark's.
//
// Prior art: the carry throw's mark (vfx/carrythrowmark.js, this one's twin), Ratchet & Clank's arc for the Fusion Grenade, Uncharted's
// grenade arc and landing ring, and every artillery game's ballistic preview (Worms, the mortar's in Battlefield).
//
//   const M = new LobArcMark(game)   M.update(rawDt)   (each frame, after the techs: main.js)   M.read() -> what is shown (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PaintReticle } from './brushmarks.js';
import { MarkBuffer, wireStrip } from './railmark.js';
import { CARRIER } from '../tools/psygun/shellrunner.js';
import { T } from '../core/config.js';

const ARC_INK = 0x6a3fe0, RING = 0x9a7cff, SELF = 0x1f7a6c; // (the arc and the ring in the System's labradorite violet, the shell's own radius in verdigris: dark enough to read on the Dunes' white sand, where cream was lost)
const STEP = 1 / 60, SUB = 2;   // the flight's step (the physics'), steps a ray
const DASH = 2;                 // segments a dash, and a gap as long
const ARC = { m: 0.03, lo: 1.6, hi: 2.8, wire: false };
const AREA = ['r', 'radius', 'popRadius', 'poolRadius']; // (a row's area, as variantplay.js scales it)
const RING_SEGS = 48;

const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _f = new THREE.Vector3(), _m = new THREE.Vector3(), _px = new THREE.Vector2(), _c = new THREE.Color();

export class LobArcMark {
  constructor(game) {
    this.game = game;
    this.reticle = new PaintReticle(game, { aim: false }); this.reticle.mesh.name = 'lob-arc-reticle';
    this.buf = new MarkBuffer(200, { renderOrder: 39 });
    this.buf.mat.depthTest = true; // (a state, not a program)
    this.buf.mesh.name = 'lob-arc'; this.buf.mesh.visible = false;
    game.scene?.add(this.buf.mesh);
    this.ink = [_c.set(ARC_INK).r, _c.g, _c.b]; this.self = [_c.set(SELF).r, _c.g, _c.b];
    this.path = []; this.n = 0; this.hit = null; this.normal = new THREE.Vector3(0, 1, 0); this.shown = false; this.spec = null; this.t = 0;
  }

  /** The lob under the hammer, if the Bombardier is drawn and its shell lobs: { speed, lift, grav, life, r (its area there), r0 (its own) }. */
  lobNow() {
    const g = this.game, W = g.weapon, S = g.shells, gun = S?.gun, P = gun?.play;
    if (!W || !P?.lob || !W.drawn || (W.drawT ?? 1) < 0.5 || W.reloading || g.god?.controlling || document.body.classList.contains('cine')) return null;
    const t = S.type; if (!t || !(S.counts?.[t.id] > 0 || g.lend?.has?.('shells'))) return null;
    const k = P.radiusMult ?? 1;
    if (t.runner && t.row && (P.lob.includes(t.row.carrier) || t.row.carrier === 'lob')) {
      const C = CARRIER.lob, key = AREA.find((a) => typeof t.row.n?.[a] === 'number'), r0 = key ? t.row.n[key] : 1;
      return { speed: C.speed, lift: C.lift, grav: C.grav, life: C.life, r0, r: r0 * k };
    }
    if (t.id === 'bomb') { const B = T.shells.bomb; return { speed: B.speed, lift: B.lift, grav: 1, life: 3, r0: B.radius, r: B.radius * k }; }
    return null;
  }

  update(dt) {
    this.t += dt;
    const spec = this.lobNow();
    if (!spec || !this.fly(spec)) {
      if (this.shown) { this.reticle.set(false, null, null, {}, 10); this.buf.count = 0; this.buf.flush(); this.buf.mesh.visible = false; this.shown = false; } // (gone at once)
      return;
    }
    this.shown = true; this.spec = spec;
    const along = _f.set(this.path[this.n - 1].x - this.path[0].x, 0, this.path[this.n - 1].z - this.path[0].z);
    if (along.lengthSq() < 1e-6) along.set(Math.sin(this.game.player.yaw), 0, Math.cos(this.game.player.yaw));
    this.reticle.set(true, this.hit, this.normal, { ring: spec.r, along: along.normalize(), color: RING }, dt);
    this.draw();
  }

  /** The lob worked forward from the muzzle; true if it lands (it meets something, or its life runs out where it is). */
  fly(L) {
    const g = this.game, W = g.weapon, P = g.player, ch = g.character, cam = g.camera, ph = g.physics;
    if (!ph || !ch?.gunPoint || !cam) return false;
    const fwd = _d.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const ray = W.shotRay(cam, P, ch, fwd.clone());
    const p = ch.gunPoint('muzzle', _p);
    const v = _v.copy(ray.dir).multiplyScalar(L.speed); v.y += L.lift;
    const gy = -T.physics.gravity * L.grav, path = this.path; this.n = 0; this.hit = null;
    (path[this.n++] ||= new THREE.Vector3()).copy(p);
    const skip = (col) => !col.isSensor();
    for (let s = 0; s * STEP < L.life; s += SUB) {
      const q = _q.copy(p);
      for (let k = 0; k < SUB; k++) { v.y += gy * STEP; q.addScaledVector(v, STEP); }
      const len = q.distanceTo(p);
      if (len > 1e-5) {
        const hit = ph.raycast(p, _m.subVectors(q, p).divideScalar(len), len, P.collider, undefined, skip);
        if (hit) { this.hit = (this.hitAt ||= new THREE.Vector3()).copy(hit.point); this.normal.copy(hit.normal); (path[this.n++] ||= new THREE.Vector3()).copy(hit.point); return true; }
      }
      p.copy(q);
      if (this.n < 400) (path[this.n++] ||= new THREE.Vector3()).copy(p);
    }
    this.hit = (this.hitAt ||= new THREE.Vector3()).copy(p); this.normal.set(0, 1, 0); return true; // (its life out in the air: the runner lands it where it is)
  }

  /** The flight's dashes, marching slowly down it (a dash a thirty-second of the flight, so it is alive but never flickers), and the
   *  shell's own radius dashed on the ground inside the ring. */
  draw() {
    const g = this.game, cam = g.camera, B = this.buf, n = this.n, path = this.path;
    cam.updateWorldMatrix(true, false);
    B.count = 0;
    g.renderer?.getDrawingBufferSize(_px);
    const pxk = cam.projectionMatrix.elements[5] * 0.5 * (_px.y || 480);
    const march = Math.floor(this.t / 0.11) % (DASH * 2); // (the dashes step a segment every 0.11 real s)
    const seg = []; let run = 0;
    for (let i = 0; i + 1 < n; i++) {
      run += path[i].distanceTo(path[i + 1]);
      if (Math.floor((i + DASH * 2 - march) / DASH) % 2) continue; // (the gap)
      const k = THREE.MathUtils.smoothstep(run, 0.8, 2.2) * 0.85;
      if (k <= 0.01) continue;
      seg[0] = path[i]; seg[1] = path[i + 1];
      wireStrip(B, seg, 2, { look: ARC, a: k, rgb: this.ink, camera: cam, pxk });
    }
    // the shell's own radius, dashed flat round the landing (on the ground's plane through it)
    const r0 = this.spec.r0, at = this.hit, nrm = this.normal, a = _f.set(1, 0, 0); if (Math.abs(nrm.x) > 0.9) a.set(0, 0, 1);
    const u = a.clone().cross(nrm).normalize(), w = nrm.clone().cross(u).normalize(), rot = this.t * 0.15;
    for (let i = 0; i < RING_SEGS; i += 2) {
      const a0 = rot + (i / RING_SEGS) * Math.PI * 2, a1 = rot + ((i + 1) / RING_SEGS) * Math.PI * 2;
      seg[0] = new THREE.Vector3().copy(at).addScaledVector(u, Math.cos(a0) * r0).addScaledVector(w, Math.sin(a0) * r0).addScaledVector(nrm, 0.06);
      seg[1] = new THREE.Vector3().copy(at).addScaledVector(u, Math.cos(a1) * r0).addScaledVector(w, Math.sin(a1) * r0).addScaledVector(nrm, 0.06);
      wireStrip(B, seg, 2, { look: ARC, a: 0.7, rgb: this.self, camera: cam, pxk });
    }
    B.flush(); B.mesh.visible = B.count > 0;
  }

  /** What the eye is shown (tests, the sheets). */
  read() {
    return { shown: this.shown, reticle: this.reticle.mesh.visible, arc: this.buf.mesh.visible, dashes: this.buf.count, steps: this.n, r: this.spec?.r ?? 0,
      at: this.hit ? [+this.hit.x.toFixed(2), +this.hit.y.toFixed(2), +this.hit.z.toFixed(2)] : null };
  }
}
