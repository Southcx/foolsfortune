// ---------------------------------------------------------------------------------------
// THE MECH'S STYLE WINDOW'S CAMERA (plain name): the shot the style window (ui/mechs/stylewindow.js) holds on the gantry's mech while it
// is open: a front three-quarter on the frame, moved to the part the hovered slot is about (the helm the head, the harness and the hip
// piece the pelvis, the cradle mount and the back piece the back, the gunblade the arm that holds it), orbited by a drag on the free
// side of the screen (a finger or the mouse; the wheel or a pinch the distance), and kept inside the hall (HANGAR, world/hangar/layout.js:
// 2 m off every wall, under the roof). The mech is framed on the free side, clear of the window set aside to its right.
// The index window pauses the frame (boot/frame.js modalOpen), so the camera is written here each display frame while the window is open
// (a cinema shot needs the frame's tick); when it closes, the shot is handed to the cinema (game.cinema.shot) at the pose it stood in
// and let go at once, so the player's camera eases back from it rather than cutting.
//
// Prior art: Armored Core's garage camera (the frame turned on a pad, the view moving to the part chosen), the mech mount's camera
// (vfx/mechs/mount.js: a shot asked each frame, damped toward its want), Monster Hunter's equipment box (the hunter turned, zoomed to
// the slot).
//
//   const C = new StyleCam(game)   C.focus(key)   C.drag(dx, dy)   C.zoom(k)   C.update(rawDt, asideW)   C.release()   C.active   FOCUS   STYLE_CAM
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HANGAR } from '../../world/hangar/layout.js';

/** Each focus: the joint looked at (or a share of the frame's height), the yaw off the mech's front (rad; + toward its left), the
 *  pitch (rad, + looking down), the distance in the frame's heights. */
export const FOCUS = {
  whole: { at: 0.5, yaw: -0.62, pitch: 0.1, dist: 1.5 },
  head: { joint: 'head', yaw: -0.5, pitch: 0.06, dist: 0.5 },
  shoulders: { joint: 'chest', yaw: -0.75, pitch: 0.12, dist: 0.72 },
  pelvis: { joint: 'pelvis', yaw: -0.45, pitch: 0.06, dist: 0.78 },
  back: { joint: 'chest', yaw: Math.PI - 0.55, pitch: 0.42, dist: 0.95 },
  weapon: { joint: 'grip', yaw: -1.05, pitch: 0.16, dist: 0.62 },
};
/** Its numbers: the ease (1/s), the drag's turn (rad a pixel), the pitch's limits, the zoom's, the wall margin and the roof's (m). */
export const STYLE_CAM = { ease: 4.5, turn: 0.006, pitch: [-0.25, 1.2], zoom: [0.55, 1.8], wall: 2, roof: 2, floor: 1.2, handoff: 3 };
const _t = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3();

export class StyleCam {
  constructor(game) { this.game = game; this.key = 'whole'; this.dyaw = 0; this.dpitch = 0; this.zk = 1; this.pos = null; this.look = null; this.active = false; }
  get pilot() { return this.game.hangar?.pilot || null; }
  /** The mech stands in its gantry, unsealed, in the built hall: the only place this camera frames it. */
  can() { const P = this.pilot; return !!(this.game.hangar?.built && P?.mech && P.mode === 'gantry' && !this.game.cradles?.sealed); }
  focus(key) { if (!FOCUS[key] || key === this.key) return; this.key = key; this.dyaw = 0; this.dpitch = 0; this.zk = 1; }
  drag(dx, dy) { const C = STYLE_CAM; this.dyaw -= dx * C.turn; this.dpitch = Math.max(C.pitch[0] - FOCUS[this.key].pitch, Math.min(C.pitch[1] - FOCUS[this.key].pitch, this.dpitch + dy * C.turn)); }
  zoom(k) { const Z = STYLE_CAM.zoom; this.zk = Math.max(Z[0], Math.min(Z[1], this.zk * k)); }

  /** Where the focus looks: its joint's world point, or a share of the frame's height over its feet. */
  target(out) {
    const B = this.pilot.mech, Fo = FOCUS[this.key];
    B.group.updateMatrixWorld(true);
    const base = _l.setFromMatrixPosition(B.group.matrixWorld), head = B.joints?.head;
    const h = head ? Math.max(4, (head.getWorldPosition(out).y - base.y) * 1.1) : Math.min(40, B.height || 15); // (the frame's height over its feet, read off its head)
    let j = Fo.joint && B.joints?.[Fo.joint];
    if (Fo.joint === 'grip') { const sel = this.game.hangar?.state?.sel || {}; j = B.joints?.[sel.weaponR === 'greatBlade' || sel.weaponL !== 'greatBlade' ? 'gripR' : 'gripL'] || B.joints?.handR; }
    if (j) j.getWorldPosition(out); else out.copy(base).setY(base.y + h * (Fo.at ?? 0.5));
    return h;
  }

  /** The shot this frame: damped toward its want, kept in the hall, the frame shifted to the free side (asideW: the window's px). */
  update(raw, asideW = 0) {
    if (!this.can()) { this.active = false; return; }
    const g = this.game, cam = g.camera, P = this.pilot, Fo = FOCUS[this.key], C = STYLE_CAM;
    const h = this.target(_t), yaw = (P.yaw ?? 0) + Fo.yaw + this.dyaw, pitch = Fo.pitch + this.dpitch, dist = h * Fo.dist * this.zk;
    _f.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); // (from the target toward the camera)
    const want = _d.copy(_t).addScaledVector(_f, dist), look = _l.copy(_t);
    // the free side: the frame shifted left by half the window's width, at the target's distance
    if (asideW > 0 && cam.isPerspectiveCamera) {
      const W = innerWidth || 1, half = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist * cam.aspect, sh = (asideW / W) * half;
      _r.set(_f.z, 0, -_f.x).normalize(); // (the camera's right)
      want.addScaledVector(_r, sh); look.addScaledVector(_r, sh);
    }
    const A = HANGAR.at, hx = HANGAR.w / 2 - C.wall, hz = HANGAR.d / 2 - C.wall;
    want.x = Math.max(A.x - hx, Math.min(A.x + hx, want.x)); want.z = Math.max(A.z - hz, Math.min(A.z + hz, want.z));
    want.y = Math.max(A.y + C.floor, Math.min(A.y + HANGAR.h - C.roof, want.y));
    if (!this.pos) { this.pos = cam.position.clone(); this.look = cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(dist)); }
    const k = 1 - Math.exp(-(raw || 0.016) * C.ease);
    this.pos.lerp(want, k); this.look.lerp(look, k);
    cam.position.copy(this.pos); cam.up.set(0, 1, 0); cam.lookAt(this.look); cam.updateMatrixWorld();
    this.active = true;
  }

  /** The window shut: the shot handed to the cinema at the pose it stood in and let go, so the player's camera eases back. */
  release() {
    const Ci = this.game.cinema;
    if (this.active && this.pos && Ci?.shot) {
      const s = Ci.shot('mechStyle', { pos: this.pos, look: this.look, bars: 0, ease: STYLE_CAM.handoff, fov: 0 });
      if ('sk' in Ci) { Ci.lastShot = s; Ci.sk = 1; } // (the cinema eases from it back to the player's: vfx/cinema.js update)
      Ci.unshot('mechStyle');
    }
    this.active = false; this.pos = null; this.look = null; this.key = 'whole'; this.dyaw = 0; this.dpitch = 0; this.zk = 1;
  }
}
