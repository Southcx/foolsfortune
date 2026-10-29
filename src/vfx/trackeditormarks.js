// ---------------------------------------------------------------------------------------
// THE TRACK EDITOR'S MARKS (docs/plans/TRACK-EDITOR.md 3; Dovina's handoff of 2026-10-24): what the editor (world/raceway/editor.js)
// shows on the build lot while it is open, in place of her placeholder pegs and ring. World marks: no words.
//   A PEG         each point of the line as a surveyor's stake of the Raceway's clay, a gold collar, a pale glazed cap, standing in a soft
//                 gold ring on the sand (read from the editor's camera at its highest)
//   THE SELECTION the thing selected (a point, a piece, a trap, a span's end) ringed in gold with four ticks pointing in, turning slowly,
//                 a breathing halo under it; the thing under the cursor ringed faintly in the film's violet (what a click would take)
//   THE HAND      the god hand (the Vessoul's, godhand/godhand.js cursorAt) as the cursor over the lot: hanging down out of the view, its
//                 fingers to the point the cursor meets the ground, its back to the camera, dipping as you press; scaled with the
//                 camera's height so it reads as a hand at any zoom. The pointer is hidden over the world while it shows.
// Materials: the park's stone (vertex colours, flat), basic glows (no fog, as her line's): no program added.
//
// Prior art: a surveyor's stakes and string (laying a road on the land), Black & White's and Populous's hand as the cursor over the
// land, RollerCoaster Tycoon's and Trackmania's selection rings (a ring on the ground round what is picked).
//
//   game.trackEditorMarks = new TrackEditorMarks(game)   .claim(editor) -> true (her drawHandles stands back)   .update(dt)   TRACK_MARKS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RW } from '../world/raceway/track.js';
import { LOT, MADE } from '../progress/trackdef.js';
import { paint, pattern } from './racewaytraps/kit.js';

/** The numbers: a peg (its stake's radius and height, m; its ring's radius); the selection (its ring's radius for a point and for a piece
 *  or trap, m, before the editor's reach; its turn, rad a real second); the hand (its scale a metre of the camera's height, its lift over
 *  the ground, m a unit of scale, and how far it dips as you press). */
export const TRACK_MARKS = {
  peg: { r: 1.5, h: 2.8, ring: 4.2 },
  sel: { point: 6, item: 6, turn: 0.4 },
  hand: { k: 0.1, lift: 0.6, dip: 0.45 },
  colour: { clay: 0xd9906a, collar: 0xffd696, cap: 0xf0d6b0, gold: 0xffd36a, hover: 0xb49be6, ring: 0xffd36a },
};
const M = TRACK_MARKS, DOWN = new THREE.Vector3(0, -1, 0);
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _x = new THREE.Vector3(), _f = new THREE.Vector3(), _z = new THREE.Vector3();

export class TrackEditorMarks {
  constructor(game) { this.game = game; this.group = null; this.t = 0; this.handOn = false; }
  /** Her placeholder handles stand back: these draw them (every frame, from the editor's state). */
  claim() { return true; }

  build() {
    const g = this.game, C = M.colour, P = M.peg, group = (this.group = new THREE.Group()); group.name = 'track-editor-marks'; group.userData.zone = 'raceway';
    const stake = mergeGeometries([paint(new THREE.CylinderGeometry(P.r * 0.8, P.r, P.h, 8).translate(0, P.h / 2, 0), C.clay), paint(new THREE.CylinderGeometry(P.r * 0.86, P.r * 0.86, 0.3, 8).translate(0, P.h * 0.62, 0), C.collar),
      paint(new THREE.CylinderGeometry(P.r * 0.95, P.r * 0.82, 0.4, 8).translate(0, P.h + 0.2, 0), C.cap), paint(new THREE.CylinderGeometry(P.r * 0.4, P.r * 0.4, 0.1, 8).translate(0, P.h + 0.43, 0), C.collar)]);
    this.pegs = new THREE.InstancedMesh(stake, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, flatShading: true }), MADE.points[1]);
    const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, map: pattern('ring'), transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.pegRings = new THREE.InstancedMesh(new THREE.PlaneGeometry(2 * P.ring, 2 * P.ring).rotateX(-Math.PI / 2), ringMat(C.gold, 0.55), MADE.points[1]);
    for (const m of [this.pegs, this.pegRings]) { m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); }
    this.pegs.castShadow = true;
    // the selection: a gold ring with four ticks in, over a breathing halo; the hover's ring in the film's violet
    const sel = new THREE.Group(), selMat = new THREE.MeshBasicMaterial({ color: C.ring, fog: false });
    const ticks = [0, 1, 2, 3].map((i) => new THREE.BoxGeometry(0.22, 0.16, 0.5).translate(0, 0, -0.82).rotateY((i * Math.PI) / 2));
    sel.add(new THREE.Mesh(mergeGeometries([new THREE.TorusGeometry(1, 0.05, 6, 48).rotateX(Math.PI / 2), ...ticks]), selMat));
    this.selHalo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), ringMat(C.gold, 0.4)); sel.add(this.selHalo);
    this.sel = sel; group.add(sel);
    this.hover = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3).rotateX(-Math.PI / 2), ringMat(C.hover, 0.5)); group.add(this.hover);
    g.scene.add(group);
  }

  /** Per frame: the pegs, the selection and the hover from the editor's state; the hand over the lot. */
  update(dt) {
    const g = this.game, E = g.trackEditor, R = g.raceway, on = !!(E?.active && R?.active && E.def);
    if (!on) { if (this.group) this.group.visible = false; this.hideHand(); return; }
    if (!this.group) this.build();
    this.t += dt; this.group.visible = true;
    const D = E.def, y = (x, z) => R.heightAt(RW.x + LOT.x + x, RW.z + LOT.z + z), at = (x, z, up = 0) => _v.set(RW.x + LOT.x + x, y(x, z) + up, RW.z + LOT.z + z);
    // the pegs
    const n = Math.min(D.points.length, MADE.points[1]), sp = E.sel?.type === 'point' ? E.sel.i : -1;
    for (let i = 0; i < n; i++) {
      const p = D.points[i], s = i === sp ? 1.25 : 1;
      this.pegs.setMatrixAt(i, _m.compose(at(p[0], p[1], -0.2), new THREE.Quaternion(), _x.set(s, s, s)));
      this.pegRings.setMatrixAt(i, _m.compose(at(p[0], p[1], 0.15), new THREE.Quaternion(), _x.set(s, 1, s)));
    }
    this.pegs.count = this.pegRings.count = n; this.pegs.instanceMatrix.needsUpdate = this.pegRings.instanceMatrix.needsUpdate = true;
    // the selection and the hover
    const spot = (s) => { if (!s) return null; if (s.type === 'point') { const p = D.points[s.i]; return p && { x: p[0], z: p[1] }; } const it = (s.type === 'piece' ? D.pieces : D.traps)[s.i]; return it && E.spot(it, s.end); };
    const reach = E.reach?.() ?? 1, q = spot(E.sel);
    this.sel.visible = !!q;
    if (q) { const r = (E.sel.type === 'point' ? M.sel.point : M.sel.item) * Math.max(1, reach * 0.6); this.sel.position.copy(at(q.x, q.z, 0.4)); this.sel.scale.setScalar(r); this.sel.rotation.y = this.t * M.sel.turn; this.selHalo.material.opacity = 0.25 + 0.2 * Math.sin(this.t * 2.4); }
    const c = E.cursor?.(), h = c && Math.max(Math.abs(c.x), Math.abs(c.z)) <= LOT.half ? E.pick?.(c) : null, hq = h && !(E.sel && h.type === E.sel.type && h.i === E.sel.i && !!h.end === !!E.sel.end) ? spot(h) : null;
    this.hover.visible = !!hq; if (hq) { this.hover.position.copy(at(hq.x, hq.z, 0.3)); this.hover.scale.setScalar((h.type === 'point' ? M.sel.point : M.sel.item) * Math.max(1, reach * 0.6)); }
    // the hand
    const touch = g.input?.device === 'touch', down = g.input?.isDown?.('Mouse0');
    if (c && Math.max(Math.abs(c.x), Math.abs(c.z)) <= LOT.half && (!touch || down)) this.showHand(at(c.x, c.z), E, dt, down ? 1 : 0); else this.hideHand();
  }

  /** The god hand hung over a point of the lot, its fingertip there, its back to the camera, its size the camera's height's. */
  showHand(point, E, dt, press) {
    const god = this.game.god, H = god?.hand, cam = this.game.camera; if (!H?.root || !cam || god.controlling) { this.hideHand(); return; }
    const k = Math.max(2, (E.cam?.h ?? 130) * M.hand.k), p = point.clone();
    god.cursorAt(p, _z.subVectors(cam.position, p).setY(0).lengthSq() > 1e-6 ? _z : _z.set(0, 0, 1), dt, { press }); // (its clips, its show; then turned and sized here)
    _z.subVectors(cam.position, p).normalize();
    _f.copy(DOWN).addScaledVector(_z, -DOWN.dot(_z)); if (_f.lengthSq() < 1e-6) _f.set(0, 0, 1); _f.normalize();
    _x.crossVectors(_f, _z).normalize();
    H.root.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _f, _z));
    H.root.scale.setScalar(k);
    const tip = p.addScaledVector(_z, k * (M.hand.lift - M.hand.dip * press));
    H.root.position.copy(tip).addScaledVector(_f, -H.tip.length() * k); H.root.updateMatrixWorld(true);
    if (!this.handOn) { this.handOn = true; document.body?.classList.add('tedit-hand'); }
  }
  hideHand() {
    if (!this.handOn) return; this.handOn = false;
    const H = this.game.god?.hand; if (H?.root) H.root.scale.setScalar(1);
    this.game.god?.hideCursor?.(); document.body?.classList.remove('tedit-hand');
  }
}
