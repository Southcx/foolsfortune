// ---------------------------------------------------------------------------------------
// A PENNANT'S SHAPE (the owner, 2026-10-24: "new paintjobs for the skiff"): the masthead pennant of the Solar Skiff in three more shapes
// past the maker's tab and streamer (its colour and length stay vfx/skiffpaintlook.js's and the bake's), keyed by Dovina's catalogue's
// id (progress/skiffpaint.js PAINT.length, whose tab and streamer are the first two shapes); an id this file does not know is the maker's.
//   SWALLOWTAIL  the regatta's burgee: the pennant's cloth cut with a V into its fly, in the worn pennant's colour with its pale band.
//   CARP         a koinobori: a windsock carp, its gold mouth hoop at the mast, its body in the worn colour with a white belly and rows
//                of scales, its tail flaring flat; it fills as the wind rises and hangs limp and flattened in a calm.
//   PRAYER       a string of seven little flags hung off the pennant's line (lungta's way, here the seven feelings in their order:
//                weather.js DISPLAY_ORDER and COLOR, Wonder to Dread), each fluttering on its own beat.
// The shapes ride the pennant's own bones (boat.js own: its root turned to the wind, its five links rippling, its length as worn): each
// frame, once posed, the chain is read and the shape laid along it, and the maker's strip is folded away into its root (its root's
// scale, which the clip writes again every frame, so nothing builds up). One mesh of vertex colours a shape, the wake's material settings
// (world/ground/wake.js: the same program), shaded by the game hour's light and a fold's turn to a fixed sun.
//
// Prior art: a racing dinghy's burgee and a swallowtail ensign; Japan's koinobori for Children's Day (the carp that fills in the wind,
// its mouth hoop and fukinagashi); Tibetan prayer flags, lungta, strung in their order; the old pennant's own ripple (boat.js).
//
//   const P = new SkiffPennantShapes(skiff)   P.set(id, colourHex | null) -> bool   P.pose(bones)  (after boat.js own and the length)
//   P.dispose()   PENNANT_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR, DISPLAY_ORDER, lightAt } from '../../progress/weather.js';

/** The numbers (m): the pennant's own red and band; the hoist at the root and its taper; the swallowtail's band (of the hoist) and its V
 *  (of the last link); the carp's rings (sides, columns), radius along it, how full at no wind, its belly, scales, gold hoop, eye; the
 *  prayer flags (count, each one's width and drop, where along the line, the flutter); the light (floor, the sun's way, a fold's share). */
export const PENNANT_LOOK = {
  red: 0xc2432b, band: 0xf2c84b, hoist: 0.36, taper: 0.45,
  swallowtail: { band: 0.2, v: 0.75 },
  carp: { sides: 8, cols: 12, r: [0.15, 0.2, 0.17, 0.1, 0.06], limp: 0.3, flat: 0.45, belly: 0xf6efe4, scale: 0.82, hoop: 0xffd36a, eye: [0.12, 0.05], eyeR: 0.045, tail: [0.24, 0.03] },
  prayer: { n: 7, w: 0.2, drop: 0.24, from: 0.1, to: 0.96, flutter: [5, 9], flap: 0.55, thread: 0.012, threadColour: 0xe8dcc4 },
  light: { floor: 0.4, sun: [0.4, 0.85, 0.35], fold: 0.35 },
};
const PL = PENNANT_LOOK;
const SHAPES = ['swallowtail', 'carp', 'prayer'];
const SUN = new THREE.Vector3(...PL.light.sun).normalize();
const LINKS = ['pennant_root', 'pennant_2', 'pennant_3', 'pennant_4', 'pennant_5']; // (pennant_1 sits 5.5 cm off the root: left out)
const PTS = LINKS.length + 1; // (and the fly's tip, one link past the last)

const _m = new THREE.Matrix4(), _w = new THREE.Vector3(), _t = new THREE.Vector3(), _hh = new THREE.Vector3(), _sd = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _fn = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
const EDGE = new Float32Array(7);
const _col = new THREE.Color(), _red = new THREE.Color(), _band = new THREE.Color(), _belly = new THREE.Color(PL.carp.belly), _hoop = new THREE.Color(PL.carp.hoop), _white = new THREE.Color(0xffffff), _black = new THREE.Color(0x14100e), _thread = new THREE.Color(PL.prayer.threadColour);
const FEEL = DISPLAY_ORDER.map((f) => new THREE.Color(COLOR[f]));

function geometry(verts, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(verts * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  return g;
}
const quad = (idx, a, b, c, d) => idx.push(a, b, c, b, d, c);

export class SkiffPennantShapes {
  constructor(skiff) {
    this.skiff = skiff; this.id = null; this.meshes = {};
    this.pts = Array.from({ length: PTS }, () => new THREE.Vector3());
    this.len = new Float32Array(PTS); // (the distance along the chain to each point)
    // (the wake's settings: world/ground/wake.js, so the same program; written depth, as a solid cloth)
    this.mat = new THREE.MeshBasicMaterial({ forceSinglePass: true, vertexColors: true, transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: true });
  }

  /** Wear a shape by its id (and the worn pennant's colour, or null for the maker's red): true if this file draws it. */
  set(id, hex) {
    this.id = SHAPES.includes(id) ? id : null;
    _red.set(hex ?? PL.red); _band.copy(_red).lerp(new THREE.Color(PL.band), hex == null ? 1 : 0.6);
    this.hex = hex;
    for (const [k, m] of Object.entries(this.meshes)) m.visible = k === this.id;
    return !!this.id;
  }

  mesh(id) {
    if (this.meshes[id]) return this.meshes[id];
    let verts, idx = [];
    if (id === 'swallowtail') { // seven rows (top, the band's two edges twice, the middle, bottom) a point of the chain
      const rows = 7; verts = PTS * rows;
      for (let c = 0; c < PTS - 1; c++) for (let r = 0; r < rows - 1; r++) quad(idx, c * rows + r, c * rows + r + 1, (c + 1) * rows + r, (c + 1) * rows + r + 1);
    } else if (id === 'carp') { // a tube of rings, then two eyes (a white fan and a pupil each)
      const C = PL.carp, R = C.sides; verts = C.cols * R + 4 * (R + 1);
      for (let c = 0; c < C.cols - 1; c++) for (let r = 0; r < R; r++) quad(idx, c * R + r, c * R + (r + 1) % R, (c + 1) * R + r, (c + 1) * R + (r + 1) % R);
      for (let e = 0; e < 4; e++) { const o = C.cols * R + e * (R + 1); for (let k = 0; k < R; k++) idx.push(o, o + 1 + k, o + 1 + ((k + 1) % R)); }
    } else { // the thread (a strip a point) and the flags
      const F = PL.prayer; verts = PTS * 2 + F.n * 4;
      for (let c = 0; c < PTS - 1; c++) quad(idx, c * 2, c * 2 + 1, c * 2 + 2, c * 2 + 3);
      for (let f = 0; f < F.n; f++) { const o = PTS * 2 + f * 4; quad(idx, o, o + 1, o + 2, o + 3); }
    }
    const m = new THREE.Mesh(geometry(verts, idx), this.mat);
    m.name = `skiff-pennant-${id}`; m.frustumCulled = false; m.visible = this.id === id; m.renderOrder = 1;
    this.skiff.group.add(m);
    return (this.meshes[id] = m);
  }

  /** After the pennant is posed (boat.js own, then its length): read its chain into the board's frame, lay the shape on it, and fold
   *  the maker's strip away. */
  pose(B) {
    const id = this.id, root = B?.pennant_root; if (!id || !root) return;
    const G = this.skiff.group;
    root.updateWorldMatrix(true, true);
    _m.copy(G.matrixWorld).invert();
    for (let i = 0; i < LINKS.length; i++) this.pts[i].setFromMatrixPosition(B[LINKS[i]].matrixWorld).applyMatrix4(_m);
    this.pts[PTS - 1].copy(this.pts[PTS - 2]).multiplyScalar(2).sub(this.pts[PTS - 3]);
    this.len[0] = 0; for (let i = 1; i < PTS; i++) this.len[i] = this.len[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]);
    root.scale.setScalar(1e-4); // (the maker's strip folded into its root: the clip writes its scale again next frame)
    // the hoist: the mast's way in the board's frame (the body's stakes tilt it)
    _hh.set(0, 1, 0); if (this.skiff.body) _hh.applyQuaternion(this.skiff.body.quaternion);
    this.light = PL.light.floor + (1 - PL.light.floor) * lightAt();
    const m = this.mesh(id), g = m.geometry;
    if (id === 'swallowtail') this.swallowtail(g); else if (id === 'carp') this.carp(g); else this.prayer(g);
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  }

  /** The way along the chain at point i (_t), and the hoist squared to it (_n: the cloth's own up), and the side (_sd). */
  frameAt(i) {
    const P = this.pts, a = P[Math.max(0, i - 1)], b = P[Math.min(PTS - 1, i + 1)];
    _t.copy(b).sub(a).normalize(); _n.copy(_hh).addScaledVector(_t, -_hh.dot(_t)).normalize(); _sd.crossVectors(_t, _n);
  }
  /** The same frame at a distance d along the chain, from the chain a little either side of it. */
  frameAtD(d) {
    this.at(d - 0.08, _p1); this.at(d + 0.08, _p2);
    _t.copy(_p2).sub(_p1).normalize(); _n.copy(_hh).addScaledVector(_t, -_hh.dot(_t)).normalize(); _sd.crossVectors(_t, _n);
  }
  /** A point on the chain at distance d along it (into out). */
  at(d, out) {
    const P = this.pts, L = this.len; let i = 1; while (i < PTS - 1 && L[i] < d) i++;
    const f = Math.min(1, Math.max(0, (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]))); return out.copy(P[i - 1]).lerp(P[i], f);
  }
  shade(normal, c, out) { const k = this.light * (1 - PL.light.fold + PL.light.fold * Math.abs(normal.dot(SUN))); return out.setRGB(c.r * k, c.g * k, c.b * k); }
  put(g, i, p, c, a = 1) { const P = g.attributes.position.array, C = g.attributes.color.array; P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z; C[i * 4] = c.r; C[i * 4 + 1] = c.g; C[i * 4 + 2] = c.b; C[i * 4 + 3] = a; }

  swallowtail(g) {
    const S = PL.swallowtail, rows = 7, L = this.len[PTS - 1], vStart = this.len[PTS - 2] + (L - this.len[PTS - 2]) * (1 - S.v);
    for (let c = 0; c < PTS; c++) {
      this.frameAt(c);
      const u = this.len[c] / L, h = PL.hoist * (1 - PL.taper * u) * 0.5, tip = c === PTS - 1;
      const bh = h * S.band * 2, edge = EDGE; edge[0] = h; edge[1] = edge[2] = bh; edge[3] = 0; edge[4] = edge[5] = -bh; edge[6] = -h;
      for (let r = 0; r < rows; r++) {
        const isBand = r >= 2 && r <= 4;
        _a.copy(this.pts[c]).addScaledVector(_n, edge[r]);
        if (tip && r === 3) this.at(vStart, _a); // (the V cut into the fly: its middle pulled back up the last link)
        this.shade(_sd, isBand ? _band : _red, _col);
        this.put(g, c * rows + r, _a, _col);
      }
    }
  }

  carp(g) {
    const C = PL.carp, R = C.sides, L = this.len[PTS - 1], wind = Math.min(1, this.skiff.wind?.str ?? 0.6);
    const full = C.limp + (1 - C.limp) * wind, flat = 1 - C.flat * (1 - wind);
    const radius = (u) => { const n = C.r.length - 1, x = Math.min(0.9999, u) * n, i = Math.floor(x), f = x - i; return C.r[i] + (C.r[i + 1] - C.r[i]) * f; };
    for (let c = 0; c < C.cols; c++) {
      const u = c / (C.cols - 1), d = u * L;
      this.at(d, _b); this.frameAtD(d);
      const tail = Math.max(0, (u - 0.8) / 0.2); // (the tail: the tube pressed flat and flared in the hoist)
      const r0 = (c === 0 ? C.r[0] : radius(u) * full), rh = r0 * (1 - tail) + C.tail[0] * tail, rs = (c === 0 ? r0 : r0 * flat) * (1 - tail) + C.tail[1] * tail;
      _b.addScaledVector(_n, -r0 * 0.6 * (1 - full) * u); // (limp, it sags under its line)
      for (let r = 0; r < R; r++) {
        const a = (r / R) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        _a.copy(_b).addScaledVector(_n, ca * rh).addScaledVector(_sd, sa * rs);
        _w.copy(_n).multiplyScalar(ca).addScaledVector(_sd, sa);
        const base = c === 0 ? _hoop : ca < -0.55 ? _belly : _red, sc = (c + (r >> 1)) % 2 && c > 0 && ca >= -0.55 ? C.scale : 1;
        this.shade(_w, base, _col).multiplyScalar(sc);
        this.put(g, c * R + r, _a, _col);
      }
    }
    // the eyes: on both sides a little behind the mouth, a white disc and its pupil, facing out
    this.at(C.eye[0] * L, _b); this.frameAtD(C.eye[0] * L);
    const r0 = C.r[0] * 1.02;
    for (let e = 0; e < 4; e++) {
      const side = e < 2 ? 1 : -1, pupil = e % 2 === 1, o = C.cols * R + e * (R + 1), rr = pupil ? C.eyeR * 0.5 : C.eyeR;
      _w.copy(_b).addScaledVector(_n, C.eye[1]).addScaledVector(_sd, side * (r0 + (pupil ? 0.008 : 0.004)));
      const col = pupil ? _black : _white;
      this.put(g, o, _w, col);
      for (let k = 0; k < R; k++) { const a = (k / R) * Math.PI * 2; _a.copy(_w).addScaledVector(_t, Math.cos(a) * rr).addScaledVector(_n, Math.sin(a) * rr); this.put(g, o + 1 + k, _a, col); }
    }
  }

  prayer(g) {
    const F = PL.prayer, L = this.len[PTS - 1], t = this.skiff.wind?.t ?? 0;
    for (let c = 0; c < PTS; c++) {
      this.frameAt(c); _col.copy(_thread).multiplyScalar(this.light);
      this.put(g, c * 2, _a.copy(this.pts[c]).addScaledVector(_n, F.thread), _col); this.put(g, c * 2 + 1, _a.copy(this.pts[c]).addScaledVector(_n, -F.thread), _col);
    }
    for (let f = 0; f < F.n; f++) {
      const u = F.from + (F.to - F.from) * (f / (F.n - 1)), d = u * L, o = PTS * 2 + f * 4;
      this.at(d, _b); this.frameAtD(d);
      const th = Math.sin(t * (F.flutter[0] + (F.flutter[1] - F.flutter[0]) * ((f * 0.37) % 1)) + f * 1.9) * F.flap;
      _w.copy(_n).multiplyScalar(-Math.cos(th)).addScaledVector(_sd, Math.sin(th)); // (the flag's drop, swung about the line)
      this.shade(_fn.crossVectors(_t, _w), FEEL[f], _col);
      const w = F.w * 0.5;
      this.put(g, o, _a.copy(_b).addScaledVector(_t, -w), _col); this.put(g, o + 1, _a.copy(_b).addScaledVector(_t, w), _col);
      this.put(g, o + 2, _a.copy(_b).addScaledVector(_t, -w).addScaledVector(_w, F.drop), _col); this.put(g, o + 3, _a.copy(_b).addScaledVector(_t, w).addScaledVector(_w, F.drop), _col);
    }
  }

  dispose() { for (const m of Object.values(this.meshes)) { m.removeFromParent(); m.geometry.dispose(); } this.mat.dispose(); this.meshes = {}; }
}
