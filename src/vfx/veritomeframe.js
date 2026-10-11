// ---------------------------------------------------------------------------------------
// THE LENS'S FRAME: what a plate would hold, shown in the third person while the Veritome is drawn and its lens is not yet raised. Four
// corners in the Flash's warm white stand round the part of the view the lens would take: its field (the zoom the lens was left at,
// `ZOOM`, and the plate's own shape, `PLATE`, cut from the viewfinder's aperture) from the Courier's eye along the aim. No words, no
// numbers, no centre mark (the crosshair is the psygun's alone): the corners are the whole of it (docs/plans/MELEE-LOADOUT.md section 4).
//
//  - PARALLAX, corrected as a rangefinder corrects it. The camera stands behind the shoulder and the lens is at the eye, so what the
//    plate holds depends on how far away the subject is. The frame is the lens's field cut where the aim meets the world (a ray from the
//    eye, the FOCUS), seen from where the camera is: a near subject draws it smaller and to the side, a far one draws it as the field
//    itself. The focus eases like an autofocus (never a jump), so the frame glides as the aim moves from near to far. A real camera's
//    lesson, never said: the window you look through is not the lens.
//  - DRAWN: the corners come in from a little wide and settle (the Snapshot's corners focusing in), once; then they hold, steady.
//  - THE LIFT (RMB held, the 0.3 s of Tome_LensRaise before first person takes over): the corners open out to the viewfinder's own
//    aperture, so the frame becomes the picture's edge as the lens comes up; raised, the viewfinder (tools/veritome/viewfinder.js) takes
//    over and the frame is gone in about a tenth of a second. In first person without the lens the frame is not drawn (the book is low in
//    the view, and the eye is the lens).
//  - NO CHARGE in the third person: the capture charge (the Veritome's charge) fills only through the raised lens (veritome.js
//    lensUpdate), where the capture circle shows it. The frame does not tighten for anything else.
//  - SHOWN only while the Veritome is the tool in the hands (`game.belt.inHand`) and its book is open (the bash shuts it, a stow closes
//    it): it fades with the book, and on a stow or a swap nothing is left (no instance drawn, the mesh hidden).
//
// The look is the Snapshot mount's (vfx/mountpreview.js `MOUNT_LOOK.veritome`: the same tool's frame at sea): the rail-mark program's
// wire (vfx/railmark.js STYLE.wire): the light line with the Mind's schiller along its heart, over a wider line of the stone's ink (the
// icons' hand, a light shape keylined dark, so it holds on noon sand and in the basement's dark alike), screen-space and antialiased
// (it cannot crawl), drawn over everything as a frame of the lens is. No program of its own: one MarkBuffer, one instanced draw of
// sixteen segments (four corners, two arms each, ink and light).
//
// Prior art, as on a museum label:
//   The Leica M3's bright-line frames (1954): the taking lens's field drawn as four bright corners in a window beside the lens, moved by
//   the focus to correct for parallax. The frame here is that window's, the camera over the shoulder its viewing window.
//   Pokémon Snap (1999): the camera's corner brackets round what the picture will hold.
//   Fatal Frame (2001): the Camera Obscura's frame, the world looked at through the device before the shot.
//
//   const F = new VeritomeFrame(game)    F.update(dt)    (after the camera is placed)    F.alpha  F.focus  F.read() -> the corners (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE } from './railmark.js';
import { MOUNT_LOOK } from './mountpreview.js';
import { ZOOM, PLATE, LIFT } from '../tools/veritome/veritome.js';
import { T } from '../core/config.js';

const FOCUS = { near: 1, far: 30, ease: 7 };     // metres from the eye the frame may stand at; the autofocus's ease (per second)
const LINE = 1.5;        // a corner's half-width, pixels at the 480-line present (3 across: the Snapshot preview's line at its least)
const KEY = 1.1;         // its keyline, pixels each side: the stone's ink under the light line (casebook rule 105: a light part and a dark part)
const INK = [0.0018, 0.0014, 0.0033]; // (the keyline's colour, linear light: its middle, lit 1.35 times, is the stone's ink, LAB_INK #0d0b13)
const ARM = { k: 0.16, lo: 9, hi: 30 };          // an arm's length: a share of the frame's shorter side, held between these pixels
const DEPTH = 2;         // (metres before the camera the corners are laid at: they are drawn over everything, so only the angle counts)
const SETTLE = 0.28;     // real seconds the corners take to come in from 8% wide when drawn
const ALPHA = 0.92;

const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _eye = new THREE.Vector3(), _c = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Vector3(), _px = new THREE.Vector2();
const ease = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const damp = THREE.MathUtils.damp;

export class VeritomeFrame {
  constructor(game) {
    this.game = game;
    this.buf = new MarkBuffer(16, { renderOrder: 44 }); // (four corners, two arms each, twice: the ink under, the light over)
    this.mesh = this.buf.mesh; this.mesh.name = 'veritome-frame'; this.mesh.visible = false;
    game.scene.add(this.mesh);
    const c = new THREE.Color(MOUNT_LOOK.veritome.color); this.rgb = [c.r, c.g, c.b];
    this.alpha = 0; this.focus = FOCUS.far; this.since = 0; this.t = 0;
    this.ndc = [[0, 0], [0, 0], [0, 0], [0, 0]]; // (the four corners on the screen, NDC: what read() reports)
    this.W = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]; this.A = [0, 0, 0];
  }

  /** Is the Veritome in the hands, its book open, the lens not raised, the view the third person's, and nothing over the world? */
  want() {
    const g = this.game, V = g.veritome, P = g.player, ch = g.character;
    if (!V || g.belt?.inHand?.id !== 'veritome' || !V.toolOut || V.lens) return 0;
    if (g.god?.controlling || g.god?.active || g.reprogram?.open || g.codex?.open || g.pneukaUI?.open || g.indexMenu?.open) return 0;
    if (ch?.hidden || (ch?.dissolve ?? 0) > 0.3 || document.body.classList.contains('cine') || g.ui?.level > 0 || g.ui?.wants?.size) return 0;
    return THREE.MathUtils.clamp(V.model.open, 0, 1) * (1 - (P.fpWeight ?? 0)); // (the book open: the bash shuts it, a stow closes it)
  }

  update(dt) {
    const g = this.game, V = g.veritome, P = g.player, cam = g.camera, B = this.buf;
    const want = this.want();
    this.alpha = damp(this.alpha, want, want < this.alpha && V?.lens ? 40 : 12, dt);
    if (want <= 0 && this.alpha < 0.01) { this.alpha = 0; this.since = 0; if (this.mesh.visible) { B.count = 0; B.flush(); this.mesh.visible = false; } return; }
    this.since += dt; this.t += dt;
    cam.updateMatrixWorld();
    // the lens: at the eye (player.js's first-person eye), looking where the camera looks (the two views share one turn)
    cam.getWorldDirection(_f); _r.set(1, 0, 0).applyQuaternion(cam.quaternion); _u.set(0, 1, 0).applyQuaternion(cam.quaternion);
    this.eye(_eye);
    // the focus: where the aim meets the world, eased (an autofocus); snapped when the frame first shows
    const hit = g.physics?.raycast(_c.copy(_eye).addScaledVector(_f, 0.25), _f, FOCUS.far, P.collider, undefined, (k) => !k.isSensor());
    const want0 = hit ? THREE.MathUtils.clamp(hit.distance + 0.25, FOCUS.near, FOCUS.far) : FOCUS.far;
    this.focus = this.since <= dt + 1e-6 ? want0 : damp(this.focus, want0, FOCUS.ease, dt);
    // the plate's field: the lens's zoom, the aperture's width (the viewfinder's), the plate's shape
    const asp = cam.aspect || 1, tl = Math.tan(THREE.MathUtils.degToRad(THREE.MathUtils.lerp(ZOOM.wide, ZOOM.tight, V.zoom)) / 2);
    const ap = V.vf.aperture(1, 1), tx = ap.w * asp * tl, ty = tx * (PLATE.h / PLATE.w), D = this.focus;
    // the corners where the field is cut at the focus, as the camera sees them (NDC); opened toward the aperture's own through the lift
    const lift = V.liftT >= 0 ? ease(V.liftT / LIFT) : 0, settle = 1 + 0.08 * (1 - ease(this.since / SETTLE));
    _c.copy(_eye).addScaledVector(_f, D);
    const cx = this.proj(_c, _q).x, cy = _q.y; // (the frame's middle: what it is scaled about as it settles)
    let k = 0;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      _p.copy(_c).addScaledVector(_r, sx * tx * D).addScaledVector(_u, sy * ty * D);
      this.proj(_p, _q);
      const n = this.ndc[k++];
      n[0] = THREE.MathUtils.lerp(cx + (_q.x - cx) * settle, sx * ap.w, lift);
      n[1] = THREE.MathUtils.lerp(cy + (_q.y - cy) * settle, sy * ap.h, lift);
    }
    // the corners as wire, laid a little before the camera (pixels of the target drawn into: the present's lines)
    g.renderer?.getDrawingBufferSize(_px);
    const res = _px.y > 0 ? _px : _px.set(854, 480), hy = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), hx = hy * asp;
    const pxm = (res.y / 2) / (hy * DEPTH); // (pixels per metre at the laid depth)
    const fw = Math.abs(this.ndc[3][0] - this.ndc[0][0]) * res.x / 2, fh = Math.abs(this.ndc[3][1] - this.ndc[0][1]) * res.y / 2;
    const arm = THREE.MathUtils.clamp(Math.min(fw, fh) * ARM.k, ARM.lo, ARM.hi), ax = (arm / res.x) * 2, ay = (arm / res.y) * 2;
    const a = this.alpha * ALPHA;
    B.count = 0;
    // the ink first (wider, the colour alone), then the light line over it, in one draw: instances blend in the order they are written
    for (const [w, rgb, ext] of [[-(LINE + KEY) / pxm, INK, KEY], [LINE / pxm, this.rgb, 0]]) {
      const ex = (ext / res.x) * 2, ey = (ext / res.y) * 2; // (the ink reaches past the arms' ends by its own width: a keyline round the tips too)
      k = 0;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const [nx, ny] = this.ndc[k++];
        this.lay(nx - sx * (ax + ex), ny, hx, hy, this.W[0]); this.lay(nx, ny, hx, hy, this.W[1]); this.lay(nx, ny - sy * (ay + ey), hx, hy, this.W[2]);
        this.strip(w, a, rgb);
      }
    }
    B.time(this.t); B.flush();
    this.mesh.visible = B.count > 0;
  }

  /** The first-person eye (player.js): over the feet at the eye's height, a hand ahead; crouched, slid or mantling, at the posed head. */
  eye(out) {
    const P = this.game.player;
    out.copy(P.renderPos); out.y += T.camera.eyeHeight;
    out.addScaledVector(P.forward(_p), 0.1);
    const posture = Math.max(P.slideBlend || 0, P.crouchBlend || 0, P.mantleBlend || 0);
    if (P.headRel && posture > 0.001) { _q.copy(P.renderPos).add(P.headRel).addScaledVector(P.forward(_p), 0.14); _q.y += 0.04; out.lerp(_q, posture); }
    return out;
  }
  /** A world point on the screen (NDC: x, y; z its depth). */
  proj(p, out) { return out.copy(p).project(this.game.camera); }
  /** A point on the screen (NDC) laid DEPTH metres before the camera, in the world. */
  lay(nx, ny, hx, hy, out) { return out.set(nx * hx * DEPTH, ny * hy * DEPTH, -DEPTH).applyMatrix4(this.game.camera.matrixWorld); }
  /** The three points in W (an arm, the corner, the other arm) as two wire segments, mitred at the corner (hw < 0: no schiller). */
  strip(hw, a, [r, g, b]) {
    const B = this.buf, W = this.W;
    for (let i = 0; i < 2 && B.count < B.cap; i++) {
      const Pa = W[i], Pb = W[i + 1], Pp = W[i > 0 ? i - 1 : i], Pn = W[i + 2 < 3 ? i + 2 : i + 1];
      B.put(B.count++, Pa.x, Pa.y, Pa.z, hw, Pb.x, Pb.y, Pb.z, hw, Pp.x, Pp.y, Pp.z, a, Pn.x, Pn.y, Pn.z, a, STYLE.wire, r, g, b);
    }
  }

  /** What the eye sees (tests, the sheets): shown or not, how strongly, the focus (m), and the corners on the screen (NDC). */
  read() { return { shown: this.mesh.visible, alpha: +this.alpha.toFixed(3), focus: +this.focus.toFixed(2), corners: this.ndc.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]), drawn: this.buf.count }; }
}
