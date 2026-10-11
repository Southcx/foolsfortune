// ---------------------------------------------------------------------------------------
// THE CARRY THROW'S MARK: with nothing in the hands but a thing carried (courier/moves/carry.js: F lifts a pot, LMB throws it, along
// where you look), where it would land if thrown now (docs/plans/MELEE-LOADOUT.md section 4: every tool its own UI; the crosshair is the
// psygun's alone, so the throw had no mark). Shown only while the throw can be made (the carry holds it, nothing is drawn from the
// belt) and gone the moment it cannot (the throw begun, the thing set down or dropped). A world mark: no words, no numbers.
//
//   THE LANDING   the paint reticle's own look (vfx/brushmarks.js PaintReticle, Splatoon's ground reticle: a point, a ring, four
//                 ticks, the far one down the throw) laid on whatever the throw would meet first, the ring as wide as what it hits
//                 round where it stops (carry.js: targets within 0.8 m), in the crosshair's cream (index.html --ink): the crosshair's
//                 look, softened and set down where it lands.
//   THE ARC       the flight to it, faint and broken into dashes (a dotted line, never a beam), fading in off the hands so it never
//                 covers the Courier: the wire of the rail's marks (vfx/railmark.js), screen-space, a pixel and a half at most,
//                 depth-tested.
//
// The flight is the carry's own throw worked forward (carry.js `release`, read, never driven): from where the hands let go (over the
// hold, where the overhand throw's clip has them at its release), along the look lifted a tenth, at the carry's speed less a little for the thing's mass, half
// the Courier's run added; then the physics' own gravity and the body's own damping, stepped at the physics' rate, until a ray meets
// something (a wall, the floor, a pot: what it would hit), three real seconds at most. Recomputed every frame it shows.
//
// No program of its own: the reticle is the ribbons' (vfx/ribbonlight.js), the arc the rail mark's (casebook rule 124).
//
// Prior art: Uncharted's grenade arc and landing ring (the path dotted, the place ringed, shown only while the throw is held), Zelda's
// (Ocarina's to Tears of the Kingdom's) carry-and-throw, Splatoon's ground reticle, and the ballistic preview of every artillery game
// (Worms, Angry Birds' dotted trail).
//
//   const M = new CarryThrowMark(game)   M.update(rawDt)   (each frame, after the techs)   M.read() -> what is shown (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PaintReticle } from './brushmarks.js';
import { MarkBuffer, wireStrip } from './railmark.js';

const INK = 0xfbe3cf;          // the crosshair's cream (index.html --ink)
const STEP = 1 / 60, SUB = 2, MAX_T = 3; // the flight's step (the physics'), steps a ray (a segment of the path), its longest (real seconds)
const RELEASE = { fwd: 0.08, up: 0.4, right: -0.08 }; // where the hands let go, from the hold: the throw clip's hands at its release (carry.js `shown`), measured over seven throws
const DASH = 2;                // segments a dash, and a gap as long
const ARC = { m: 0.02, lo: 1.2, hi: 2.0, wire: false };
const HIT_R = 0.8;             // what it hits round where it stops (carry.js trackFlying: the targets within 0.8 m): the ring's radius

const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _f = new THREE.Vector3(), _px = new THREE.Vector2(), _c = new THREE.Color();

export class CarryThrowMark {
  constructor(game) {
    this.game = game;
    this.reticle = new PaintReticle(game); this.reticle.mesh.name = 'carry-throw-reticle';
    this.buf = new MarkBuffer(120, { renderOrder: 39 });
    this.buf.mat.depthTest = true; // (a state, not a program)
    this.buf.mesh.name = 'carry-throw-arc'; this.buf.mesh.visible = false;
    game.scene?.add(this.buf.mesh);
    _c.set(INK); this.rgb = [_c.r, _c.g, _c.b];
    this.path = []; this.n = 0; this.hit = null; this.normal = new THREE.Vector3(0, 1, 0); this.shown = false;
  }

  /** The carry, if a throw can be made now: it holds a thing, and nothing is out of the belt (the hands are the carry's). */
  thrower() {
    const g = this.game, c = g.techs?.get('carry');
    if (!c?.item || c.state !== 'hold' || g.belt?.inHand || g.god?.controlling || document.body.classList.contains('cine')) return null;
    return c;
  }

  update(dt) {
    const c = this.thrower();
    if (!c || !this.fly(c)) {
      if (this.shown) { this.reticle.set(false, null, null, {}, 10); this.buf.count = 0; this.buf.flush(); this.buf.mesh.visible = false; this.shown = false; } // (gone at once)
      return;
    }
    this.shown = true;
    const along = _f.set(this.path[this.n - 1].x - this.path[0].x, 0, this.path[this.n - 1].z - this.path[0].z);
    if (along.lengthSq() < 1e-6) along.set(Math.sin(this.game.player.yaw), 0, Math.cos(this.game.player.yaw));
    this.reticle.set(!!this.hit, this.hit, this.normal, { ring: HIT_R, along: along.normalize(), color: INK }, dt);
    this.arc();
  }

  /** The throw worked forward from where the hands would let go; true if it meets something. */
  fly(c) {
    const g = this.game, P = g.player, e = c.item, body = e.body, ph = g.physics;
    if (!body?.isValid?.() || !ph) return false;
    const t = body.translation(), yaw = P.bodyYaw ?? P.yaw;
    const p = _p.set(t.x + Math.sin(yaw) * RELEASE.fwd - Math.cos(yaw) * RELEASE.right, t.y + RELEASE.up, t.z + Math.cos(yaw) * RELEASE.fwd + Math.sin(yaw) * RELEASE.right);
    const dir = P.lookDir(_v); dir.y += 0.1; dir.normalize();
    const cfg = c.cfg || {}, sp = THREE.MathUtils.clamp((cfg.speed ?? 14) - body.mass() * 0.18, 6, cfg.speed ?? 14);
    const v = dir.multiplyScalar(sp).add(_d.set(P.vel.x * 0.5, 0, P.vel.z * 0.5));
    const gy = (ph.world.gravity?.y ?? -21) * (body.gravityScale?.() ?? 1), damp = body.linearDamping?.() ?? 0, handle = body.handle;
    const skip = (col) => !col.isSensor() && col.parent()?.handle !== handle;
    const path = this.path; this.n = 0; this.hit = null;
    (path[this.n++] ||= new THREE.Vector3()).copy(p);
    for (let s = 0; s * STEP < MAX_T; s += SUB) {
      const q = _q.copy(p);
      for (let k = 0; k < SUB; k++) { v.y += gy * STEP; v.multiplyScalar(1 / (1 + STEP * damp)); q.addScaledVector(v, STEP); } // (semi-implicit, as the physics steps it)
      const len = q.distanceTo(p);
      if (len > 1e-5) {
        const hit = ph.raycast(p, _d.subVectors(q, p).divideScalar(len), len, P.collider, undefined, skip);
        if (hit) { this.hit = (this.hitAt ||= new THREE.Vector3()).copy(hit.point); this.normal.copy(hit.normal); (path[this.n++] ||= new THREE.Vector3()).copy(hit.point); return true; }
      }
      p.copy(q);
      if (this.n < 200) (path[this.n++] ||= new THREE.Vector3()).copy(p);
    }
    return false;
  }

  /** The flight's dashes: fading in off the hands over its first metre and a half, faint, a dash every DASH segments. */
  arc() {
    const g = this.game, cam = g.camera, B = this.buf, n = this.n, path = this.path;
    cam.updateWorldMatrix(true, false); // (where it looks this frame; its parents only: the camera carries the first-person tools)
    B.count = 0;
    g.renderer?.getDrawingBufferSize(_px);
    const pxk = cam.projectionMatrix.elements[5] * 0.5 * (_px.y || 480);
    let run = 0;
    const seg = [];
    for (let i = 0; i + 1 < n; i++) {
      run += path[i].distanceTo(path[i + 1]);
      if (Math.floor(i / DASH) % 2) continue; // (the gap)
      const k = THREE.MathUtils.smoothstep(run, 0.6, 1.6) * 0.8;
      if (k <= 0.01) continue;
      seg[0] = path[i]; seg[1] = path[i + 1];
      wireStrip(B, seg, 2, { look: ARC, a: k, rgb: this.rgb, camera: cam, pxk });
    }
    B.flush(); B.mesh.visible = B.count > 0;
  }

  /** What the eye is shown (tests, the sheets). */
  read() {
    return { shown: this.shown, reticle: this.reticle.mesh.visible, arc: this.buf.mesh.visible, dashes: this.buf.count, steps: this.n,
      at: this.hit ? [+this.hit.x.toFixed(2), +this.hit.y.toFixed(2), +this.hit.z.toFixed(2)] : null };
  }
}
