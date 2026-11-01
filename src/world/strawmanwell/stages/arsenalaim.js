// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE ARSENAL'S AIM (docs/plans/STRAWMANS-WELL.md 3.5): the psygun's shot held to the stage's plane and aimed eight
// ways by the keys, and a tool lent to a stage for its length; the Arsenal's, lent to the Pit (its save shrines are shot) and the Swing
// (the hook's aim). Nothing of the psygun is changed: while the Courier stands in a stage that asked for it, the weapon's own ray
// (`shotRay`, what every round and the charged beam fly along) and its aim point (`computeAimPoint`, where the arm points) are wrapped on
// the instance, the frame's way (wellframe.js), each wrapper asking at the call whether it is still wanted and handing the call on to
// the weapon's own when not; taken off whole when the stage is left. The shot, its cost, its tracer, its hits and `shot.fire` are the
// house's.
//   the aim     A and D across, W up, S down; none of them: the mouse's reticle (the frame's, courier/planereticle.js), else the facing. On the ground S alone is the crouched shot ahead (Contra's prone
//               shot); in the air, straight down
//   a tool lent the belt's main (and its form) made a stage's for its length, and the main, the sub, the form and whether it was out given
//               back on leaving (the belt's own `equip`, quietly: a script's, never refused or said)
//
// Prior art: Contra's and Metal Slug's eight-way run and gun (the stick is the aim, the facing the default), Mega Man's charge kept in
// the button; the frame's wrap-and-give-back (wellframe.js), the stress test's wrap of `move`.
//
//   aimOf(well, out) -> Vector3 (unit, in the plane)   reticleOf(well, out) -> Vector3 | null   chestOf(well, out)   const A = new PlaneAim(well, ['arsenal', 'pit'])   A.on()   A.off()
//   const L = lendTool(well, id, { form, draw })   L.restore()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The chest a shot leaves from (m over the feet, standing and crouched), how far ahead of it, and how far the aim point stands. */
export const AIM = { chest: 1.25, low: 0.8, ahead: 0, point: 12 }; // (from inside the body, which the ray leaves out: a muzzle ahead of it could start inside a wall the body leans on)

/** The eight-way aim from the keys, a unit vector in the plane (z 0). */
export function aimOf(well, out = new THREE.Vector3()) {
  const R = well.frame.realInput, P = well.game.player, face = well.frame.face || 1;
  if (!R) return out.set(face, 0, 0);
  const h = (R.isDown('KeyD') ? 1 : 0) - (R.isDown('KeyA') ? 1 : 0), v = (R.isDown('KeyW') ? 1 : 0) - (R.isDown('KeyS') ? 1 : 0);
  if (!h && !v) return reticleOf(well, out) || out.set(face, 0, 0); // (no key held: where the mouse's reticle is, courier/planereticle.js)
  if (!h) return v < 0 && P.grounded ? out.set(face, 0, 0) : out.set(0, v, 0);
  return out.set(h, v, 0).normalize();
}
/** The plane reticle's way (unit, in the plane) while the frame lends the aim (core/aimsource.js), or null. */
export function reticleOf(well, out = new THREE.Vector3()) {
  const A = well.game.aim; if (!A?.lent) return null;
  A.dir(out).setZ(0); return out.lengthSq() > 1e-6 ? out.normalize() : null;
}
/** Where a shot leaves from: the chest, a little ahead along the aim. */
export function chestOf(well, aim, out = new THREE.Vector3()) {
  const P = well.game.player, low = P.crouching || P.shape === 'low';
  return out.set(P.pos.x, P.pos.y + (low ? AIM.low : AIM.chest), P.pos.z).addScaledVector(aim, AIM.ahead);
}

export class PlaneAim {
  constructor(well, ids) { this.well = well; this.ids = new Set(ids); this.wrapped = null; }
  /** Wanted now: the Courier in one of these stages, the frame on. */
  get live() { const W = this.well; return W.frame.on && W.here && this.ids.has(W.stage?.id); }

  on() {
    const W = this.well, w = W.game.weapon; if (!w || this.wrapped) return;
    const self = this, own = (k) => (Object.prototype.hasOwnProperty.call(w, k) ? w[k] : null);
    this.wrapped = { w, shotRay: own('shotRay'), computeAimPoint: own('computeAimPoint') };
    const ray = own('shotRay') || Object.getPrototypeOf(w).shotRay, point = own('computeAimPoint') || Object.getPrototypeOf(w).computeAimPoint;
    w.shotRay = function planeRay(camera, player, character, dir) {
      if (!self.live) return ray.call(this, camera, player, character, dir);
      const d = aimOf(W, new THREE.Vector3());
      return { origin: chestOf(W, d), dir: d };
    };
    w.computeAimPoint = function planePoint(camera, player) {
      if (!self.live) return point.call(this, camera, player);
      const d = aimOf(W, new THREE.Vector3());
      return this.aimPoint.copy(chestOf(W, d)).addScaledVector(d, AIM.point);
    };
  }
  off() {
    const S = this.wrapped; if (!S) return;
    for (const k of ['shotRay', 'computeAimPoint']) { if (S[k]) S.w[k] = S[k]; else delete S.w[k]; }
    this.wrapped = null;
  }
}

/** The belt's main made `id` (its `form`, if it has forms) for a stage's length, drawn if `draw`; `restore()` gives the belt back. */
export function lendTool(well, id, { form = null, draw = true } = {}) {
  const g = well.game, B = g.belt; if (!B?.get(id)) return { restore() {} };
  const was = { main: B.main, sub: B.sub, out: !!(B.inHand && (B.inHand.wants || B.inHand.drawT > 0.02)), form: g.techs?.get?.('sondelass')?.form ?? null };
  B.equip(id, 'main', { quiet: true });
  const t = B.get(id);
  if (form && t?.tech?.setForm) { t.tech.form = form; }
  if (draw) B.draw(t); else for (const x of B.tools) if (x.wants || x.drawT > 0) x.stow();
  let done = false;
  return {
    restore() {
      if (done) return; done = true;
      const S = g.techs?.get?.('sondelass');
      if (S?.hookshot?.att) S.hookshot.release('stow');
      if (was.form && S && S.form !== was.form) S.form = was.form;
      if (B.sub !== was.sub && was.sub) B.equip(was.sub, 'sub', { quiet: true });
      if (B.main !== was.main && was.main) B.equip(was.main, 'main', { quiet: true });
      if (!was.out) for (const x of B.tools) if (x.wants || x.drawT > 0) x.stow();
    },
  };
}
