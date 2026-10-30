// ---------------------------------------------------------------------------------------
// THE SANDBOX'S PITCH DRESSED: THE GOAL'S NET AND THE BALL'S LOOK (plain names; the pitch, its ball, its goal and its rules are the
// runtime's and Dovina's, world/sandbox/pitch.js, progress/sandbox.js GOAL, BALL; docs/plans/SANDBOX.md 3, 5): looks only, her
// colliders and her ball's body untouched.
//   - THE GOAL: round posts and a crossbar glazed white, the frame behind them in dark iron (rear posts, a top bar back, the side bars
//     and the ground bars), in place of her square posts (hidden); and THE NET: knotted rope in diamond mesh hung on the frame, its back,
//     its sides and its roof, in place of her dark boxes (hidden). Mipmapped, so from the hand's height the mesh fades to a veil of
//     rope and never crawls. A goal (`sandbox.goal`) billows it: the net bellies out where the ball struck and swings back, pinned at
//     the frame, over about a real second and a half.
//   - THE BALL: a temari (the thread-wound ball of Japan, its surface divided by stitched great circles into a bold geometry): three
//     gold-thread great circles cut it into eight triangles, vermilion and indigo by turns, each with a cream chrysanthemum knot at its
//     heart in a gold ring. At the hand's height its eight faces turning are the spin you see; the reds and blues alternate so a roll
//     reads which way it goes. Drawn in her ball's own material (the props' vertex-coloured one): its geometry swapped, its body hers.
//   - ITS SHADOW: a soft dark disc on the floor straight under it, smaller and fainter as it rises (the blob shadow's way,
//     vfx/blobshadow.js), so its height reads from above: a keepy-uppy is a ball over its own shadow.
// DRAWS: the goal's frame in one vertex-coloured mesh (the kit's program, for her two posts' meshes), the net in one (the numerals'
// decal program, for her one), the shadow one decal: 3 for her 3. The ball adds none (her mesh, a finer geometry: 3,380 triangles).
//
// Prior art: kemari's ball (the Heian court's kicking game, its aim to keep the ball up: Keepy-Uppy is its whole rule), the temari's
// stitched geometry (the eight-division "hachitō" and the chrysanthemum "kiku" knots), the beach ball's alternating panels (spin read
// from far), the five-a-side goal's net and Rocket League's goal explosion billowing it, and the drop shadow every platformer puts under
// a thing in the air so its height is read (Super Mario 64's, the house's blob shadow).
//
//   const p = new SandboxPitchLook(game)   p.build(room, found) (her meshes by colour, hall.js find)   p.update(raw)   p.goal()   p.teardown()
//   PITCH_LOOK   temariGeometry(r) -> geometry (vertex-coloured)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris } from '../racewaypark.js';
import { addOutline, ensureSmoothNormals, OUTLINES } from '../../render/outline.js';
import { SANDBOX, GOAL, BALL } from '../../progress/sandbox.js';
import { T } from '../../core/config.js';

/** Her goal's colours (world/sandbox/pitch.js C): its posts and its net. */
const HERS = { post: 0xf7f2e4, net: 0x57534b };
/** The numbers: the frame's radii and colours; the net's cell (m), its rope; the billow's reach, depth, swing and time; the ball's
 *  pattern; the shadow's size and how it fades with height. */
export const PITCH_LOOK = {
  frame: { post: 0.065, rear: 0.045, ground: 0.035, white: 0xf3efe6, band: 0xd8d0c2, iron: 0x3a3530 },
  net: { cell: 0.11, tone: 0.78, rope: '#efe7d6', edge: '#7d6e58', knot: '#5a4c3a' },
  billow: { reach: 0.75, depth: 0.42, swing: 9, decay: 0.42, dur: 1.8 },
  temari: { detail: 12, band: 0.085, knot: 0.955, ring: 0.925, gold: 0xe8b84a, red: 0xc9402a, blue: 0x24386e, cream: 0xf3ead6 },
  shadow: { size: 1.0, grow: 0.2, fade: 9, alpha: 0.8, lift: 0.045 },
};
const PL = PITCH_LOOK, S = SANDBOX, V = (x, y, z) => new THREE.Vector3(x, y, z);

/** The temari: an icosphere at r, each face coloured by where its middle lies (three gold great circles, the eight triangles between
 *  them vermilion and indigo by turns, a cream knot ringed gold at each one's heart). */
export function temariGeometry(r = BALL.r) {
  const Tm = PL.temari, g = new THREE.IcosahedronGeometry(r, Tm.detail), p = g.attributes.position, n = p.count;
  const col = new Float32Array(n * 3), m = new THREE.Vector3(), a = new THREE.Vector3(), c = new THREE.Color(), k = 1 / Math.sqrt(3);
  for (let i = 0; i < n; i += 3) {
    m.set(0, 0, 0); for (let j = 0; j < 3; j++) m.add(a.fromBufferAttribute(p, i + j)); m.normalize();
    const oct = V(Math.sign(m.x) || 1, Math.sign(m.y) || 1, Math.sign(m.z) || 1), heart = oct.x * m.x * k + oct.y * m.y * k + oct.z * m.z * k;
    let hex = oct.x * oct.y * oct.z > 0 ? Tm.red : Tm.blue;
    if (heart > Tm.knot) hex = Tm.cream; else if (heart > Tm.ring) hex = Tm.gold;
    if (Math.min(Math.abs(m.x), Math.abs(m.y), Math.abs(m.z)) < Tm.band) hex = Tm.gold;
    c.setHex(hex); for (let j = 0; j < 3; j++) c.toArray(col, (i + j) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv');
  // (a sphere's own normals, so it is drawn round wherever the tier shades smooth; its colours stay one a face)
  const nr = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.fromBufferAttribute(p, i).normalize().toArray(nr, i * 3);
  g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  return g;
}

/** The net's tile: rope run along both diagonals (a diamond mesh when it repeats), a knot where they cross. */
function netTexture() {
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), Nt = PL.net; g.lineCap = 'round';
  const lines = (w, col) => { g.strokeStyle = col; g.lineWidth = w; for (const [x0, y0, x1, y1] of [[-4, -4, N + 4, N + 4], [N + 4, -4, -4, N + 4]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } };
  lines(8, Nt.edge); lines(4.5, Nt.rope);
  for (const [x, y] of [[N / 2, N / 2], [0, 0], [N, 0], [0, N], [N, N]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fillStyle = Nt.knot; g.fill(); g.beginPath(); g.arc(x - 1, y - 1, 2.6, 0, Math.PI * 2); g.fillStyle = Nt.rope; g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
/** A blob shadow's disc: dark at the middle to nothing at the rim. */
function shadowTexture() {
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  for (const [s, a] of [[0, 1], [0.45, 0.8], [0.8, 0.25], [1, 0]]) r.addColorStop(s, `rgba(255,255,255,${a})`);
  g.fillStyle = r; g.fillRect(0, 0, N, N);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** A panel of the net: from corner `o` along `u` (a vector, its length the panel's width) and `v`, in su x sv quads; each vertex keeps
 *  its rest place and its pin (0 on the frame, 1 at the panel's middle), its uv in rope cells. */
function panel(pos, uv, rest, pin, idx, o, u, v, su, sv) {
  const b = pos.length / 3, lu = u.length(), lv = v.length();
  for (let j = 0; j <= sv; j++) for (let i = 0; i <= su; i++) {
    const p = o.clone().addScaledVector(u, i / su).addScaledVector(v, j / sv);
    pos.push(p.x, p.y, p.z); rest.push(p.x, p.y, p.z); uv.push((lu * i) / su / PL.net.cell, (lv * j) / sv / PL.net.cell);
    pin.push(Math.sin((Math.PI * i) / su) * Math.sin((Math.PI * j) / sv));
  }
  for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) { const a = b + j * (su + 1) + i; idx.push(a, a + 1, a + su + 2, a, a + su + 2, a + su + 1); }
}

export class SandboxPitchLook {
  constructor(game) { this.game = game; this.group = null; this.mats = []; this.geos = []; this.outlines = []; this.hidden = []; this.ballEnt = null; this.billowT = -1; }

  build(room, found = {}) {
    this.teardown();
    const g = this.game, X = S.at.x + GOAL.x, Y = S.at.y, Z = S.at.z + GOAL.z, F = PL.frame;
    const grp = (this.group = new THREE.Group()); grp.name = 'sandbox-pitch-look'; grp.userData.zone = 'sandbox';
    // her goal's posts and net found by their colours and hidden (kept: their colliders are hers)
    for (const m of room.children) {
      if (!m.isMesh || m.userData.isOutline || !m.material?.color) continue;
      const hex = m.material.color.getHex(); if (hex === HERS.post || hex === HERS.net) { m.visible = false; this.hidden.push(m); }
    }
    // the frame: white posts and crossbar at the mouth, the iron behind them
    const Tr = new Tris(), hx = GOAL.w / 2 + 0.07, back = -GOAL.depth, h = GOAL.h;
    const bar = (a, b, r, col) => { const ax = new THREE.Vector3().subVectors(b, a), len = ax.length(), c = new THREE.CylinderGeometry(r, r, len, 10, 1); c.translate(0, len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), ax.normalize())).translate(a.x, a.y, a.z); Tr.add(c, col); c.dispose(); };
    const at = (x, y, z) => V(X + x, Y + y, Z + z);
    for (const s of [-1, 1]) {
      bar(at(s * hx, 0, 0), at(s * hx, h + F.post, 0), F.post, F.white);
      bar(at(s * hx, 0.9, 0), at(s * hx, 1.05, 0), F.post + 0.004, F.band);
      bar(at(s * hx, 0, back), at(s * hx, h, back), F.rear, F.iron);
      bar(at(s * hx, h, 0), at(s * hx, h, back), F.rear, F.iron);
      bar(at(s * hx, F.ground, 0), at(s * hx, F.ground, back), F.ground, F.iron);
    }
    bar(at(-hx - F.post, h + F.post, 0), at(hx + F.post, h + F.post, 0), F.post, F.white);
    bar(at(-hx, h, back), at(hx, h, back), F.rear, F.iron);
    bar(at(-hx, F.ground, back), at(hx, F.ground, back), F.ground, F.iron);
    this.frameMat = new THREE.MeshStandardMaterial({ name: 'sandbox-goal-frame', color: 0xffffff, vertexColors: true, roughness: 0.45, metalness: 0, flatShading: true }); this.mats.push(this.frameMat);
    const frame = new THREE.Mesh(Tr.geometry(), this.frameMat); frame.castShadow = frame.receiveShadow = true; grp.add(frame); this.geos.push(frame.geometry);
    g.present?.shadeOne?.(frame, true, T.visual.smooth !== false);
    const o = addOutline(frame); if (o) this.outlines.push(o);
    // the net: its back, its two sides and its roof, hung inside the frame
    const pos = [], uv = [], rest = [], pin = [], idx = [], w = 2 * hx, in0 = 0.02;
    panel(pos, uv, rest, pin, idx, at(-hx, 0, back - in0), V(w, 0, 0), V(0, h, 0), 20, 10);
    for (const s of [-1, 1]) panel(pos, uv, rest, pin, idx, at(s * (hx - in0), 0, -0.06), V(0, 0, back + 0.06), V(0, h, 0), 6, 10);
    panel(pos, uv, rest, pin, idx, at(-hx, h + 0.01, -0.06), V(w, 0, 0), V(0, 0, back + 0.06), 20, 6);
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ng.setIndex(idx); ng.computeBoundingSphere();
    this.net = { geo: ng, rest: new Float32Array(rest), pin: new Float32Array(pin), hit: V(X, Y + 1, Z) };
    this.netMap = netTexture();
    const nm = new THREE.MeshBasicMaterial({ name: 'sandbox-goal-net', map: this.netMap, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
    nm.color.setScalar(PL.net.tone); this.mats.push(nm);
    const net = new THREE.Mesh(ng, nm); net.renderOrder = 2; grp.add(net); this.geos.push(ng);
    // the ball's shadow
    this.shadowMap = shadowTexture();
    const sm = new THREE.MeshBasicMaterial({ name: 'sandbox-ball-shadow', map: this.shadowMap, color: 0x000000, transparent: true, alphaTest: 0.02, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.mats.push(sm);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), sm); this.shadow.visible = false; this.shadow.renderOrder = 1; grp.add(this.shadow); this.geos.push(this.shadow.geometry);
    g.scene.add(grp);
    this.dress();
  }

  /** Her ball (a new one each time it is made) given the temari's geometry: the hull its outline wears too. */
  dress() {
    const e = this.game.sandbox?.pitch?.ball, m = e?.mesh;
    if (!m || e === this.ballEnt) return;
    this.ballEnt = e;
    const geo = temariGeometry(BALL.r), old = m.geometry;
    ensureSmoothNormals(geo); m.geometry = geo; if (m.userData.outline) m.userData.outline.geometry = geo;
    if (old && old !== geo) old.dispose();
  }

  /** A goal: the net bellies out where the ball struck it. */
  goal() {
    const b = this.game.sandbox?.pitch?.ball?.body; if (!this.net) return;
    if (b?.isValid?.()) { const p = b.translation(); this.net.hit.set(p.x, Math.max(S.at.y + 0.3, p.y), Math.min(p.z, S.at.z + GOAL.z - 0.3)); }
    this.billowT = 0;
  }

  update(raw) {
    if (!this.group) return;
    this.dress();
    // the shadow under the ball
    const e = this.game.sandbox?.pitch?.ball, b = e?.body, Sh = PL.shadow;
    if (b?.isValid?.()) {
      const p = b.translation(), hgt = Math.max(0, p.y - BALL.r - S.at.y), s = Sh.size * (1 + Sh.grow * hgt), k = Math.max(0, 1 - hgt / Sh.fade);
      this.shadow.visible = k > 0.02; this.shadow.position.set(p.x, S.at.y + Sh.lift, p.z); this.shadow.scale.set(s, 1, s); this.shadow.material.opacity = Sh.alpha * k;
    } else this.shadow.visible = false;
    // the net's billow, pinned at the frame
    if (this.billowT >= 0) {
      const B = PL.billow, N = this.net, A = N.geo.attributes.position, a = A.array, t = (this.billowT += raw);
      const amp = t >= B.dur ? 0 : B.depth * Math.exp(-t / B.decay) * Math.cos(B.swing * t), r2 = B.reach * B.reach, cx = S.at.x + GOAL.x;
      for (let i = 0; i < N.pin.length; i++) {
        const x = N.rest[i * 3], y = N.rest[i * 3 + 1], z = N.rest[i * 3 + 2], d2 = (x - N.hit.x) ** 2 + (y - N.hit.y) ** 2, f = amp * N.pin[i] * Math.exp(-d2 / r2);
        const side = Math.abs(x - cx) > GOAL.w / 2 - 0.1 && N.pin[i] > 0 ? Math.sign(x - cx) : 0;
        a[i * 3] = x + side * f * 0.35; a[i * 3 + 1] = y; a[i * 3 + 2] = z - f * (side ? 0.3 : 1);
      }
      A.needsUpdate = true;
      if (t >= B.dur) this.billowT = -1;
    }
  }

  teardown() {
    if (!this.group) return;
    for (const o of this.outlines) OUTLINES.delete(o);
    this.game.scene?.remove(this.group);
    for (const geo of this.geos) geo.dispose();
    for (const m of this.mats) m.dispose();
    this.netMap?.dispose(); this.shadowMap?.dispose();
    for (const m of this.hidden) m.visible = true;
    this.group = this.net = this.shadow = this.ballEnt = null; this.mats = []; this.geos = []; this.outlines = []; this.hidden = []; this.billowT = -1;
  }
}
