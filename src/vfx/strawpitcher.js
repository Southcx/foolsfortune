// ---------------------------------------------------------------------------------------
// THE STRAW PITCHER AND ITS CLAY BALLS: the parry range's thrower dressed (docs/plans/COMBAT-LAB.md section 4; the pitching is Petra's,
// world/throwingroom/parryrange.js, its balls the lobbers' `launch`, creatures/lobber.js). Looks only: nothing here decides when a ball
// flies, how fast or where; it reads the range (`on`, `pick.from`, the queue and the rest) and the balls' own `lob.fire` and draws them.
//
//   THE PITCHER   one of Pip's tries in Strawman's family, stood on the range's plinth: a burlap sack on a post (the scarecrow's), set on
//                 a giant cotton reel wound with oxblood thread (Pip's sewing kit at a toy's scale), a round sack head with two button
//                 eyes and a stitched grin, a felt cap with a straw tuft, straw bursting at its seams, a small three-ring target on its
//                 chest (the family's mark, never Pip's heart charm: that is Strawman's alone). Its throwing arm is a charcoal sleeve
//                 with a wicker scoop on its cuff (a jai alai cesta), a clay ball sitting in it; its other a stub with a cream mitten.
//                 A basket of clay balls stands on the plinth behind it.
//   THE HEAVE     a softball windmill read off the range's clock: as the next ball nears it leans back on its reel and draws the scoop
//                 down and behind it (the anticipation), then whips it over the top, lunging forward, and lets go at the spout's
//                 place (PARRY_RANGE.mouth: the ball comes from where the scoop is); the follow-through runs on down, the sack a beat
//                 behind, and it settles. A ball from ACROSS is not its: it only turns its head to watch.
//   THE BALLS     the lobbers' ball redressed as a clay training ball, bisque with a slip-trailed oxblood seam (a tennis ball's curve,
//                 so its spin reads) and grog flecks. PLAIN wears no outline (its lobber's mark kept); OUTLINED wears the outline and the parry mark (vfx/parrymark.js, the ink
//                 and film that nothing else wears, as an outlined shot at sea does: vfx/railshots.js). The ball's body, its outline
//                 hull and its mark's shells are given the one shared geometry; nothing of the ball's flight is touched.
//
// Prior art: the batting cage's pitching machine (the rhythm), the softball windmill and jai alai's cesta (the arm and the scoop), the
// scarecrow and LittleBigPlanet's sackfolk (Strawman's family: vfx/strawman.js), Cuphead's pink parry objects (one look means "parry
// this": the house's parry mark), the bisque of the Workshop's pots (an unglazed first firing) for the ball.
//
//   const P = new StrawPitcher(game)   P.update(rawDt)   P.dispose()   P.group   (set down by ThrowingRoomDress, vfx/throwingroomkit.js)
//   dressTrainingBall(ball, game)   (a lobber's ball record: { mesh, mark, outlined }; the pitcher calls it on `lob.fire` with `training`)
//   PITCHER_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TR } from '../world/throwingroom/layout.js';
import { addOutline, ensureSmoothNormals } from '../render/outline.js';

/** The heave's beats (real s before or after the release), the arm's angles about the shoulder (rad, 0 straight up, + toward the
 *  marks), the lean back and forward on the reel (rad), and the ball's radius (the lobbers': 0.22 m). */
export const PITCHER_LOOK = {
  wind: 0.95, heave: 0.32, follow: 0.6,
  rest: 2.95, back: 1.25, release: 1.03,
  leanBack: -0.22, leanFwd: 0.2, ball: 0.22,
};
const C = { burlap: 0xcdb48c, seam: 0x6b5236, sleeve: 0x3a2f3a, cream: 0xf3e6c8, red: 0xb8402e, straw: 0xe0c070, wood: 0xa77a4a, post: 0x3b2a1e, thread: 0x7a2a1e, felt: 0x5b3a52, wicker: 0xb08a4e, bisque: 0xe2c6a0, button: 0x241a16 };
const TAU = Math.PI * 2;
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const ease = (u) => u * u * (3 - 2 * u);

/** The sack's cloth: a burlap weave, its seams, a stitched patch and the family's small target on the front (u 0.5, the lathe turned so). */
function clothTexture({ face = false } = {}) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = hex(C.burlap); g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 3) {
    g.fillStyle = `rgba(80,55,30,${0.08 + 0.06 * Math.sin(i * 1.7)})`; g.fillRect(i, 0, 1, S);
    g.fillStyle = `rgba(255,240,210,${0.06 + 0.05 * Math.sin(i * 2.3)})`; g.fillRect(0, i, S, 1);
  }
  g.strokeStyle = hex(C.seam); g.lineWidth = 2;
  const stitches = (x0, y0, x1, y1, n) => { for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(x - 4, y - 3); g.lineTo(x + 4, y + 3); g.stroke(); } };
  if (face) { // (the head: the front is u 0.25 on a sphere) two button eyes, four holes each, and a stitched grin
    stitches(0, S * 0.12, S, S * 0.12, 24);
    for (const [x, y, r] of [[S * 0.2, S * 0.45, 15], [S * 0.31, S * 0.43, 12]]) {
      g.fillStyle = hex(C.button); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, TAU); g.fill();
      g.fillStyle = hex(C.burlap); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(x + dx * r * 0.3, y + dy * r * 0.3, 2, 0, TAU); g.fill(); }
    }
    g.strokeStyle = '#2a1d14'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(S * 0.17, S * 0.6); g.quadraticCurveTo(S * 0.25, S * 0.68, S * 0.34, S * 0.59); g.stroke();
    for (let k = 0; k < 4; k++) { const x = S * 0.19 + k * S * 0.04; g.beginPath(); g.moveTo(x, S * 0.6); g.lineTo(x + 1, S * 0.67); g.stroke(); }
  } else {
    stitches(0, 8, S, 8, 24); stitches(S - 8, 0, S - 8, S, 24); stitches(8, 0, 8, S, 24);
    const cx = S * 0.5, cy = S * 0.5; // (the target, narrow across so it reads round on the sack)
    for (const [r, col] of [[34, C.red], [25, C.cream], [16, C.red], [8, C.cream], [3, C.red]]) { g.fillStyle = hex(col); g.beginPath(); g.ellipse(cx, cy, r * 0.5, r, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#8f6f8a'; g.fillRect(S * 0.7, S * 0.62, 30, 34); // (a patch, stitched round: Pip mended it)
    g.strokeStyle = hex(C.cream); g.lineWidth = 2; g.setLineDash([4, 4]); g.strokeRect(S * 0.7 + 3, S * 0.62 + 3, 24, 28); g.setLineDash([]);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---- the clay training ball: one geometry and one material for every ball of the range
let BALL = null;
function trainingBall() {
  if (BALL) return BALL;
  const geo = new THREE.SphereGeometry(PITCHER_LOOK.ball, 28, 18), pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3);
  const base = new THREE.Color(C.bisque), seam = new THREE.Color(C.thread), grog = new THREE.Color(0x9a7a58), c = new THREE.Color(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(pos, i).normalize();
    const a = Math.atan2(p.z, p.x), s = Math.abs(p.y - 0.55 * Math.sin(2 * a)); // (a tennis ball's seam: a curve round the ball rising and falling twice)
    const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453, fleck = (h - Math.floor(h)) > 0.93;
    c.copy(base).lerp(seam, s < 0.09 ? 1 : s < 0.15 ? 0.35 : 0); if (fleck && s >= 0.15) c.lerp(grog, 0.7);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); ensureSmoothNormals(geo); geo.name = 'clay-training-ball';
  const mat = new THREE.MeshStandardMaterial({ name: 'clay-training-ball', vertexColors: true, roughness: 0.88, metalness: 0, emissive: 0xffd9a0, emissiveIntensity: 0.12 }); // (a breath of warmth so it reads in flight against the hall's dark)
  mat.userData.shared = true; geo.userData.shared = true;
  return (BALL = { geo, mat });
}

/** A lobber's ball redressed as the range's clay ball: its body, its outline hull and its mark's shells take the one geometry; whatever
 *  mark the lobber gave it stays (a plain ball's flash where V answers it is kept: looks only, the cue untouched). */
export function dressTrainingBall(b, game) {
  if (!b?.mesh || b.dressed) return; b.dressed = true;
  const B = trainingBall(), m = b.mesh;
  m.geometry = B.geo; m.material = B.mat;
  for (const o of m.children) if (o.userData.isOutline || o.userData.parryShell) o.geometry = B.geo;
}

// ---- the pitcher's body
const lathe = (pts, n = 14, start = 0) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n, start);
function strawTuft(n, r, len, seed) { // (a burst of straw: thin cones fanned out, merged)
  const out = []; let a = seed;
  for (let k = 0; k < n; k++) { a = (a * 9301 + 49297) % 233280; const u = a / 233280; const g = new THREE.ConeGeometry(0.012, len * (0.6 + 0.6 * u), 3); g.translate(0, len * 0.4, 0); g.rotateZ((u - 0.5) * 1.6); g.rotateY(k * 2.4); g.translate(Math.cos(k * 2.4) * r, 0, Math.sin(k * 2.4) * r); out.push(g); }
  return mergeGeometries(out);
}

export class StrawPitcher {
  constructor(game) {
    this.game = game; this.state = 'rest'; this.a = PITCHER_LOOK.rest; this.lean = 0; this.t = 0; this.since = 9; this.h0 = 1; this.a0 = 0; this.T = 0; this.w0 = 1;
    this.mats = [];
    const mat = (o) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, ...o }); this.mats.push(m); return m; };
    const M = { cloth: mat({ map: clothTexture() }), face: mat({ map: clothTexture({ face: true }) }), wood: mat({ color: C.wood, roughness: 0.7 }), thread: mat({ color: C.thread }), post: mat({ color: C.post }),
      sleeve: mat({ color: C.sleeve }), cream: mat({ color: C.cream }), straw: mat({ color: C.straw, roughness: 0.9 }), felt: mat({ color: C.felt }), wicker: mat({ color: C.wicker, side: THREE.DoubleSide }) };
    this.M = M;
    const [px, pz] = TR.wing.parryRange.pitcher, G = new THREE.Group(); G.name = 'straw-pitcher'; G.position.set(px, 0, pz);
    const add = (parent, geo, m, outline = true, at = null) => { const o = new THREE.Mesh(geo, m); if (at) o.position.set(...at); o.castShadow = true; parent.add(o); if (outline) addOutline(o); return o; };
    // the reel on the plinth (top at 0.5 m): two flanges and the wound thread
    add(G, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), M.wood, true, [0, 0.53, 0]);
    add(G, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 18), M.thread, false, [0, 0.71, 0]);
    add(G, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), M.wood, true, [0, 0.89, 0]);
    // the basket of clay balls behind it
    const basket = add(G, lathe([[0.13, 0], [0.17, 0.2], [0.18, 0.22]], 12), M.wicker, true, [-0.38, 0.5, -0.36]);
    const B = trainingBall();
    for (const [x, y, z] of [[0, 0.16, 0], [0.08, 0.13, 0.06], [-0.07, 0.14, 0.05], [0.04, 0.15, -0.08], [-0.05, 0.22, -0.03]]) { const b = new THREE.Mesh(B.geo, B.mat); b.scale.setScalar(0.42); b.position.set(x, y, z); basket.add(b); }
    // the body: leaning on the reel's top
    const lean = this.leanG = new THREE.Group(); lean.position.y = 0.92; G.add(lean);
    add(lean, new THREE.CylinderGeometry(0.035, 0.04, 1.05, 8), M.post, false, [0, 0.5, 0]);
    add(lean, lathe([[0.1, 0.02], [0.22, 0.08], [0.3, 0.28], [0.29, 0.48], [0.22, 0.66], [0.11, 0.74]], 16, Math.PI), M.cloth);
    add(lean, strawTuft(9, 0.18, 0.12, 7), M.straw, false, [0, 0.02, 0]); // (straw out of the hem)
    add(lean, new THREE.TorusGeometry(0.11, 0.025, 6, 14).rotateX(Math.PI / 2), M.thread, false, [0, 0.75, 0]); // (the neck's cord)
    add(lean, strawTuft(7, 0.07, 0.1, 3), M.straw, false, [0, 0.74, 0]);
    const head = this.head = new THREE.Group(); head.position.y = 0.95; lean.add(head);
    add(head, new THREE.SphereGeometry(0.19, 16, 12), M.face);
    add(head, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 14), M.felt, true, [0, 0.16, 0]).rotation.x = -0.15;
    add(head, strawTuft(5, 0.03, 0.12, 11), M.straw, false, [0, 0.2, -0.02]);
    // the throwing arm: a sleeve from the right shoulder, the scoop on its cuff and a ball in it
    const sh = new THREE.Group(); sh.position.set(0.26, 0.63, -0.03); sh.rotation.z = -0.1; lean.add(sh);
    const arm = this.arm = new THREE.Group(); sh.add(arm);
    add(arm, new THREE.CylinderGeometry(0.055, 0.065, 0.34, 8), M.sleeve, true, [0, 0.17, 0]);
    add(arm, new THREE.CylinderGeometry(0.068, 0.068, 0.05, 8), M.cream, false, [0, 0.33, 0]);
    const scoop = new THREE.Group(); scoop.position.y = 0.36; arm.add(scoop);
    add(scoop, new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55).rotateX(Math.PI / 2 + 0.3).translate(0, 0.1, -0.03), M.wicker, true); // (a curved wicker scoop, its mouth toward the throw)
    this.held = new THREE.Mesh(B.geo, B.mat); this.held.position.set(0, 0.12, 0.02); scoop.add(this.held);
    add(sh, strawTuft(5, 0.04, 0.08, 5), M.straw, false);
    // the other arm: a stub of sleeve and a mitten
    const off = this.off = new THREE.Group(); off.position.set(-0.26, 0.6, 0); off.rotation.z = 0.25; lean.add(off);
    add(off, new THREE.CylinderGeometry(0.05, 0.06, 0.26, 8).translate(0, -0.13, 0), M.sleeve);
    add(off, new THREE.SphereGeometry(0.075, 10, 8).translate(0, -0.29, 0), M.cream);
    (game.scene).add(G); this.group = G;
    this.off_ = game.events?.on('lob.fire', (e) => {
      if (!e.training) return;
      const L = game.lobbers, b = L?.balls?.[L.balls.length - 1]; dressTrainingBall(b, game);
      if (this.range()?.pick?.from !== 'across') { this.state = 'follow'; this.since = 0; this.a = this.T || this.a; this.held.visible = false; }
    });
  }

  range() { return this.game.throwingRoom?.parryRange; }

  /** Real seconds to the next ball from the pitcher, or Infinity (resting, from across, out of the range, the god hand up). */
  nextBall() {
    const R = this.range(), g = this.game, P = g.player;
    if (!R?.on || R.pick.from === 'across' || g.god?.active || !P || !R.inside(P)) return Infinity;
    return R.queue.length ? Math.min(...R.queue) : Math.max(0, R.t);
  }

  update(raw = 1 / 60) {
    const L = PITCHER_LOOK, dt = Math.min(raw, 0.05); this.t += dt; this.since += dt;
    const tn = this.nextBall();
    // the heave's state, read off the range's clock
    if (tn <= L.heave && this.state !== 'heave') { // (the whip: from wherever the arm is to the release over the top, at least half a turn)
      this.state = 'heave'; this.a0 = this.a; this.h0 = Math.max(0.12, tn); this.T = L.release; while (this.T - this.a0 < 2.4) this.T += TAU; this.l0 = this.lean; this.held.visible = true;
    } else if (this.state === 'rest' && tn <= L.wind) { this.state = 'wind'; this.w0 = tn; this.a0 = this.a; this.l0 = this.lean; }
    else if (this.state === 'wind' && tn > L.wind + 0.2) this.state = 'rest'; // (the Courier stepped out: it lets the draw go)
    else if (this.state === 'heave' && tn > this.h0 + 0.2) { this.state = 'follow'; this.since = 0; } // (no ball came: it follows through all the same)
    if (this.state === 'heave') {
      const u = THREE.MathUtils.clamp(1 - tn / this.h0, 0, 1);
      this.a = this.a0 + (this.T - this.a0) * u * u; this.lean = THREE.MathUtils.lerp(this.l0, L.leanFwd, ease(u));
    } else if (this.state === 'wind') {
      const u = ease(THREE.MathUtils.clamp(1 - (tn - L.heave) / Math.max(0.05, this.w0 - L.heave), 0, 1));
      const back = this.restNear(this.a0) + L.back;
      this.a = THREE.MathUtils.lerp(this.a0, back, u); this.lean = THREE.MathUtils.lerp(this.l0, L.leanBack, u);
      this.held.visible = true;
    } else if (this.state === 'follow') {
      const u = Math.min(1, this.since / L.follow), k = 1 - (1 - u) * (1 - u), to = this.restNear(this.T + 0.5);
      this.a = THREE.MathUtils.lerp(this.T, to, k); this.lean = L.leanFwd * (1 - k) + Math.sin(u * Math.PI) * 0.06;
      if (u >= 1) { this.state = 'rest'; this.held.visible = true; }
    } else { // (at rest: a breath, the arm hanging, the lean easing home)
      const want = this.restNear(this.a) + Math.sin(this.t * 1.3) * 0.05;
      this.a += (want - this.a) * Math.min(1, dt * 4); this.lean += (Math.sin(this.t * 0.9) * 0.03 - this.lean) * Math.min(1, dt * 3);
      if (this.since > 1) this.held.visible = true;
    }
    while (this.a > 3 * TAU) { this.a -= TAU; this.a0 -= TAU; this.T -= TAU; }
    this.arm.rotation.x = this.a; this.leanG.rotation.x = this.lean;
    this.off.rotation.x = -this.lean * 2.2 - Math.sin(this.a) * 0.4; // (the mitten swings against the throw, for balance)
    // the head: on the Courier when a ball comes from across, else down the line, nodding with the heave
    const P = this.game.player, R = this.range(), G = this.group;
    let yaw = 0; if (P && R?.on && R.pick.from === 'across') yaw = THREE.MathUtils.clamp(Math.atan2(P.pos.x - G.position.x, P.pos.z - G.position.z), -0.9, 0.9);
    this.head.rotation.y += (yaw - this.head.rotation.y) * Math.min(1, dt * 5); this.head.rotation.x = -this.lean * 0.8;
  }
  /** The rest angle in the same turn as `a` (the arm's angle is kept unwrapped through a windmill). */
  restNear(a) { const r = PITCHER_LOOK.rest; return r + TAU * Math.round((a - r) / TAU); }

  dispose() { this.off_?.(); this.group.parent?.remove(this.group); this.group.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); }); for (const m of this.mats) { m.map?.dispose(); m.dispose(); } }
}
