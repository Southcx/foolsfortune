// ---------------------------------------------------------------------------------------
// THE PLANE RETICLE: the Courier's aim in a side-on mode (Strawman's Well's frame, world/strawmanwell/wellframe.js), lent to the aim source
// (core/aimsource.js) so every tool aims along the stage instead of into the backdrop the side camera looks at. A reticle on the stage's
// plane round the chest, moved by the mouse (or the look thumb) in the view's own pixels and kept between `reach` metres of the chest; an
// aim camera set a little behind the chest on the line to it and pointed at it, so a tool's ray from "the camera" starts at the body and
// runs in the plane (the psygun's skip, the hook's probe, the rod's cast, the brush's stream, the fork's throw). The body is turned to the
// reticle's side while a tool is out, and its pitch follows the reticle, so what reads the body's look (`P.lookDir`, the aim's arm)
// agrees. With no tool out the reticle keeps ahead of the run. A placeholder mark (a thin ring and a dot, depth-tested off) shows where
// it is until the psygun's reticle is drawn there (Calissa's: `game.aim.screen`).
//
// Prior art: the mouse reticle of side-on shooters (Terraria, Noita, Metroid Dread's free aim, Contra's eight ways made continuous),
// Celeste-likes' aim from the body not the camera.
//
//   const A = new PlaneReticle(game)   A.set({ z })   A.update(dt, input, face, toolOut) -> wanted face   A.camera()   A.screen(out)
//   A.pitch   A.point (world)   A.show(on)   A.dispose()   PLANE_RETICLE (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The reticle's reach from the chest (m), where it starts (ahead, a little up), the chest's height (m), how far behind the chest the
 *  aim camera sits on the line (m), and the turn the mouse gives (the view's own metres a pixel, scaled). */
export const PLANE_RETICLE = { reach: [1.4, 11], start: [3.2, 0.5], chest: 1.3, back: 1.2, gain: 1, pitchMax: 1.35 };

const _c = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4();

export class PlaneReticle {
  constructor(game) {
    this.game = game; this.z = 0; this.off = new THREE.Vector2(...PLANE_RETICLE.start);
    this.cam = new THREE.PerspectiveCamera(52, 1, 0.05, 500); this.point = new THREE.Vector3(); this.pitch = 0;
    this.mark = null;
  }
  set({ z }) { this.z = z ?? this.z; }

  /** The chest the aim leaves from (world). */
  chest(out) { const P = this.game.player; return out.set(P.renderPos.x, P.renderPos.y + PLANE_RETICLE.chest, this.z); }

  /** Each frame: the reticle moved by the input's pixels (the view's metres a pixel at the plane), kept in reach; returns the facing the
   *  body should take (the reticle's side while a tool is out, else `face`). */
  update(dt, input, face, toolOut, view) {
    const g = this.game, cam = view || g.camera, H = innerHeight || 720;
    const dist = Math.max(1, Math.abs((cam?.position?.z ?? this.z + 14) - this.z));
    const mpp = (2 * dist * Math.tan(((cam?.fov ?? 52) * Math.PI) / 360)) / H * PLANE_RETICLE.gain;
    const dx = input?.dx || 0, dy = input?.dy || 0;
    if (toolOut) { this.off.x += dx * mpp; this.off.y -= dy * mpp; }
    else if (Math.sign(this.off.x || 1) !== face) this.off.x = Math.abs(this.off.x) * face; // (no tool out: the reticle kept ahead of the run)
    const [lo, hi] = PLANE_RETICLE.reach, L = this.off.length();
    if (L < 1e-3) this.off.set(lo * face, 0);
    else if (L > hi) this.off.multiplyScalar(hi / L);
    else if (L < lo) this.off.multiplyScalar(lo / L);
    this.chest(_c); this.point.set(_c.x + this.off.x, _c.y + this.off.y, this.z);
    this.pitch = THREE.MathUtils.clamp(Math.atan2(this.off.y, Math.abs(this.off.x)), -PLANE_RETICLE.pitchMax, PLANE_RETICLE.pitchMax);
    this.place();
    return toolOut && Math.abs(this.off.x) > 0.15 ? Math.sign(this.off.x) : face;
  }

  /** The aim camera behind the chest on the line to the reticle, pointed at it. */
  place() {
    this.chest(_c); _p.copy(this.point).sub(_c).normalize();
    this.cam.position.copy(_c).addScaledVector(_p, -PLANE_RETICLE.back);
    _m.lookAt(this.cam.position, this.point, _up); this.cam.quaternion.setFromRotationMatrix(_m);
    this.cam.fov = this.game.camera?.fov ?? 52; this.cam.updateMatrixWorld(true);
    if (this.mark?.visible) this.mark.position.copy(this.point);
  }
  camera() { return this.cam; }

  /** The reticle on the screen: its offset from the view's middle in CSS px (y up). */
  screen(out) {
    const cam = this.game.camera; if (!cam) return out.set(0, 0);
    _p.copy(this.point).project(cam);
    return out.set((_p.x * innerWidth) / 2, (_p.y * innerHeight) / 2);
  }

  /** The placeholder mark: a thin ring and a dot on the reticle, over everything (Calissa's reticle to come). */
  show(on) {
    if (on && !this.mark) {
      const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xf2e6c8, depthTest: false, depthWrite: false, transparent: true, opacity: 0.9 });
      g.add(new THREE.Mesh(new THREE.RingGeometry(0.22, 0.27, 28), mat), new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), mat));
      g.renderOrder = 999; for (const m of g.children) m.renderOrder = 999;
      this.game.scene.add(g); this.mark = g;
    }
    if (this.mark) { this.mark.visible = !!on; if (on) this.mark.position.copy(this.point); }
  }
  dispose() { if (this.mark) { this.mark.removeFromParent(); for (const m of this.mark.children) m.geometry.dispose(); this.mark.children[0].material.dispose(); this.mark = null; } }
}
