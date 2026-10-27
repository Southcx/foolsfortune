// ---------------------------------------------------------------------------------------
// THE FORGE'S PARTS' LOOKS (docs/plans/OPEN-SEA.md 15.4; Dovina's rules, progress/opensea/forge.js, SHIP_PARTS rows `from: 'forge'`): the
// parts made from the beasts beaten, each telling of its beast at a glance, worn through shipkit/partlooks.js (`look.wearParts(worn)`)
// over the class's own look; looks only (the polar, the turn and the hits are Dovina's numbers). No new program: the sails are drawn in
// the sail's ('sloop-sail', shipkit/vane.js: opaque cloth, its colour and glow per material), the hulls' livery and fittings in the hull's
// ('ship-hull', vertex-coloured, the glow in the alpha's code).
//   SAIL  krakenSail   the kraken's: a dark ink-purple fore-and-aft sail on each mast, its leech torn into tentacle scallops, three arms'
//                      sucker rings laid across it in pairs (shrinking toward the tip), and bioluminescent dots in Dread's light
//         worldSail    Jormungandr's: a broad square course on each mast under a yard, its cloth scale-mail in green-bronze and bronze
//                      rows, the world serpent's knot (an ouroboros, gold) at its heart, its seams and rim glowing Gall's violet
//   HULL  akhlutHull   the akhlut's: an orca's livery laid over both sides (black, the white belly sweeping up amidships, the eye
//                      patch forward, the grey saddle aft), a wolf's paw-print trail walking the waterline toward the bow and an orca's
//                      dorsal fin as a crest over the stern, Fury's ember along the sheer, the prints and the fin's leading edge
//         monkHull     the umibozu's: ink-black lacquer over both sides (a deep plum gloss slow along it), a pale eye at the bow each
//                      side (a boat's oculi, the umibozu's own stare) and the tale's bottomless ladle hung off a davit at the stern
//   KEEL  serpentKeel  under the waterline, never seen at the helm's camera: no look (as the deep and shallow keels)
// A sail's decorations are drape meshes in the sail's own uv: each vertex sits at a (s, v) of its sheet and a lift off it, so the
// program's belly and flutter move them exactly as the cloth (vane.js), and they are laid again with it when the wind changes side.
//
// Prior art: Monster Hunter's forged gear (a beast's look carried by what is made of it: the Rathalos plate is the wyvern's scale),
// Sea of Thieves' Kraken and Megalodon trophy sails and hulls (one silhouette, the beast read from afar); the real things: an
// octopus's arm (suckers paired, smaller to the tip) and a squid's photophores; lamellar scale-mail (rows over rows, each a pointed
// plate); the ouroboros of the Norse world serpent (Jormungandr biting its tail round Midgard); an orca's markings (the eye patch, the
// saddle, the white flank's sweep: a killer whale's countershading); oculi painted on Mediterranean and Chinese bows; the umibozu tale
// (it asks the sailors for a ladle and fills the boat with it: they give one with its bottom knocked out).
//
//   FORGE_LOOK (the colours and sizes)   isForgeSail(id)   isForgeHull(id)
//   buildForgeSail(parts, rig, id)   buildForgeHull(parts, id)   poseForge(parts, side, show, rel)   (parts: the ShipPartLooks)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Mesher, sideAt, loftAt, deckAt } from './hullkit.js';
import { COLOR } from '../../progress/weather.js';

export const FORGE_LOOK = {
  kraken: { cloth: 0x2a1836, ring: 0xb88aac, cup: 0x4a2440, dots: COLOR.dread, dotGlow: 0x6af0b0, dotK: 2.2, arms: 3, pairs: 13, scallops: 6 },
  world: { cloth: 0x26301c, scaleA: 0x6f8a3c, scaleB: 0x9a8442, seam: COLOR.gall, seamK: 1.8, yard: 0x4a3a28, rows: 26 },
  akhlut: { black: 0x101215, white: 0xe6eaee, saddle: 0x868c94, ember: 0xff5a28, emberCode: 0.48 },
  monk: { lacquer: 0x0a0a10, sheen: 0x221a34, eye: 0xe8e4d6, iris: 0x121218, glint: 0xffffff, wood: 0x7a5a3c, bowl: 0x5a4028 },
};
export const isForgeSail = (id) => id === 'krakenSail' || id === 'worldSail';
export const isForgeHull = (id) => id === 'akhlutHull' || id === 'monkHull';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Matrix4(), _col = new THREE.Color();
const _l0 = new THREE.Vector3(), _l1 = new THREE.Vector3(), _l2 = new THREE.Vector3(), _tw = new THREE.Vector3(), _k0 = new THREE.Vector3(); // (the lay's own and the cloth functions' own: never shared with a caller's)
const smooth = (x) => x * x * (3 - 2 * x);
const rand = (i, k = 1) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- a drape: vertices at (s, v) on a sheet, lifted along its normal
class Drape {
  constructor() { this.uv = []; this.lift = []; this.idx = []; }
  v(s, v, lift = 0) { this.uv.push(s, v); this.lift.push(lift); return this.lift.length - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  /** A shape given in metres round (s0, v0) (`du`, `dv`: metres a unit of s and v there), on both faces; CCW in (s, v) like the sheet. */
  shape(s0, v0, du, dv, pts, lift) { for (const L of [lift, -lift]) { const c = this.v(s0, v0, L), r = pts.map(([x, y]) => this.v(s0 + x / du, v0 + y / dv, L)); for (let i = 0; i < r.length; i++) this.tri(c, r[i], r[(i + 1) % r.length]); } }
  ring(s0, v0, du, dv, r0, r1, n, lift) {
    for (const L of [lift, -lift]) {
      const A = [], B = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; A.push(this.v(s0 + Math.cos(a) * r0 / du, v0 + Math.sin(a) * r0 / dv, L)); B.push(this.v(s0 + Math.cos(a) * r1 / du, v0 + Math.sin(a) * r1 / dv, L)); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.tri(A[i], B[i], B[j]); this.tri(A[i], B[j], A[j]); }
    }
  }
  geometry(off) {
    const n = this.lift.length, g = new THREE.BufferGeometry(), uv = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { uv[2 * k] = this.uv[2 * k] + off; uv[2 * k + 1] = this.uv[2 * k + 1]; }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(this.idx);
    g.userData.st = Float32Array.from(this.uv); g.userData.lift = Float32Array.from(this.lift);
    return g;
  }
}
/** A sheet's grid as a drape: (nu + 1) x (nv + 1), each row's far edge at sMax(v) (the kraken's torn leech). */
function sheetDrape(nu, nv, sMax = () => 1) {
  const D = new Drape();
  for (let j = 0; j <= nv; j++) { const v = j / nv, e = sMax(v); for (let i = 0; i <= nu; i++) D.v((i / nu) * e, v, 0); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; D.tri(a, b, d); D.tri(a, d, c); }
  return D;
}
/** Every geometry of a sail laid: at(s, v, out) the cloth's point, its one normal turned to `toward`. */
function layDrapes(geos, at, toward) {
  _tw.copy(toward); at(0.5, 0.45, _l0); at(0.62, 0.45, _l1); at(0.5, 0.6, _l2); _l1.sub(_l0); _l2.sub(_l0); _n.crossVectors(_l1, _l2).normalize();
  if (!Number.isFinite(_n.x) || _n.lengthSq() < 0.5) _n.copy(_tw); else if (_n.dot(_tw) < 0) _n.negate();
  for (const g of geos) {
    const P = g.attributes.position, N = g.attributes.normal, st = g.userData.st, L = g.userData.lift;
    for (let k = 0; k < P.count; k++) { at(st[2 * k], st[2 * k + 1], _l0).addScaledVector(_n, L[k]); P.setXYZ(k, _l0.x, _l0.y, _l0.z); N.setXYZ(k, _n.x, _n.y, _n.z); }
    P.needsUpdate = N.needsUpdate = true; g.computeBoundingSphere();
  }
}
/** A mast's point at rest (the fold aside: the sails are hidden whenever it is not at rest), its offsets in the mast's frame. */
const restPoint = (M, h, x, z, out) => out.set(x, h, z).applyMatrix4(_m.makeRotationX(-(M.rake || 0)).setPosition(M.x, M.y0, M.z));
/** Metres a unit of s and of v at (s, v) on a sail. */
function metres(at, s, v) { at(s, v, _l0); at(s + 0.01, v, _l1); const du = _l1.distanceTo(_l0) / 0.01; at(s, v + 0.01, _l1); return [Math.max(1e-3, du), Math.max(1e-3, _l1.distanceTo(_l0) / 0.01)]; }

/** The parts' drape meshes added: the sheet and its decorations, each its own material (one program), kept as one item to lay. */
function addSail(P, drapes, off, extra) {
  const meshes = drapes.map(([D, mat]) => { const it = P.add('forgeDrape', D.geometry(off), mat); it.mesh.castShadow = false; return it.mesh; });
  meshes[0].castShadow = true;
  const it = { meshes, ...extra }; (P.forge ||= []).push(it); return it;
}

// ---------------------------------------------------------------- the kraken sail
function buildKraken(P, rig) {
  const L = FORGE_LOOK.kraken, zs = rig.masts.map((M) => M.z), stern = -P.look.length / 2;
  rig.masts.forEach((M, mi) => {
    const H = M.height, aftRoom = M.z - Math.max(...zs.filter((z) => z < M.z - 0.1), stern), aft = Math.min(0.45 * H, 0.8 * aftRoom);
    const lo = 0.12 * H, hi = 0.86 * H, sMax = (v) => { const f = 0.5 + 0.5 * Math.cos(v * Math.PI * 2 * L.scallops); return 1 + 0.03 * f * f * f - 0.13 * (1 - f) * smooth(Math.min(1, v * 3)); }; // (the leech torn into tentacle tips, whole at the head)
    const at = (s, v, out, side = 1) => { restPoint(M, THREE.MathUtils.lerp(hi, lo, v), 0, 0, _k0); const x = side * 0.025 * H * v, z = -THREE.MathUtils.lerp(0.05 * H, aft, v); return restPoint(M, THREE.MathUtils.lerp(hi - 0.02 * H, lo, v), x, z, out).sub(_k0).multiplyScalar(s).add(_k0); }; // (the luff on the mast, the leech from the head aft to the clew)
    const cloth = P.sailMat({ vane: false, belly: 0.3 * P.look.scale }); cloth.color.setHex(L.cloth);
    const ringM = P.sailMat({ vane: false, belly: 0.3 * P.look.scale }); ringM.color.setHex(L.ring);
    const cupM = P.sailMat({ vane: false, belly: 0.3 * P.look.scale }); cupM.color.setHex(L.cup);
    const dotM = P.sailMat({ vane: false, belly: 0.3 * P.look.scale }); dotM.color.setHex(L.dots); dotM.emissive.setHex(L.dotGlow); dotM.emissiveIntensity = L.dotK;
    const sheet = sheetDrape(10, 6 * L.scallops, sMax), rings = new Drape(), cups = new Drape(), dots = new Drape(), lift = 0.004 * H;
    for (let a = 0; a < L.arms; a++) { // (each arm laid from near the luff's head across toward the leech, its suckers paired and shrinking)
      const v0 = 0.16 + 0.26 * a, v1 = Math.min(0.95, v0 + 0.22), s0 = 0.14, s1 = 0.86;
      for (let i = 0; i < L.pairs; i++) {
        const t = i / (L.pairs - 1), s = THREE.MathUtils.lerp(s0, s1, t), v = THREE.MathUtils.lerp(v0, v1, t) + 0.035 * Math.sin(t * 5 + a), r = (0.02 - 0.012 * t) * H;
        const [du, dv] = metres(at, s, v), ax = (s1 - s0) * du, ay = (v1 - v0) * dv, al = Math.hypot(ax, ay), px = -ay / al, py = ax / al; // (across the arm, in metres)
        for (const k of [-1, 1]) { const ss = s + (k * px * r * 1.25) / du, vv = v + (k * py * r * 1.25) / dv; if (ss > sMax(vv) - 0.04 || vv > 0.97) continue; rings.ring(ss, vv, du, dv, r * 0.5, r, 10, lift); cups.shape(ss, vv, du, dv, Array.from({ length: 8 }, (_, q) => [Math.cos(q * Math.PI / 4) * r * 0.5, Math.sin(q * Math.PI / 4) * r * 0.5]), lift * 0.6); }
      }
    }
    for (let i = 0; i < 46; i++) { const v = 0.06 + 0.9 * rand(i, mi + 1), s = (0.06 + 0.88 * rand(i, mi + 7)) * sMax(v), r = (0.003 + 0.004 * rand(i, 3)) * H, [du, dv] = metres(at, s, v); dots.shape(s, v, du, dv, Array.from({ length: 6 }, (_, q) => [Math.cos(q * Math.PI / 3) * r, Math.sin(q * Math.PI / 3) * r]), lift * 1.4); }
    addSail(P, [[sheet, cloth], [rings, ringM], [cups, cupM], [dots, dotM]], 2, { at, mi, sided: true });
  });
}

// ---------------------------------------------------------------- the Jormungandr sail
/** The ouroboros for the sail's emblem slot (vane.js's lotus: gold by its alpha in a box at uv (0.42, 0.5), 0.62 x 0.5), drawn as an
 *  ellipse round uv (0.5, 0.5) of radii (rs, rv) so it reads round on the cloth. */
function ouroboros(rs, rv) {
  const W = 256, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
  const cx = (0.5 + (0.5 - 0.42) / 0.62) * W, cy = 0.5 * W, rx = (rs / 0.62) * W, ry = (rv / 0.5) * W, at = (a, k = 1) => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  g.fillStyle = '#fff'; const a0 = -Math.PI / 2, n = 90;
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + 0.35 + t * (Math.PI * 2 - 0.55), w = 0.16 * (1 - 0.72 * t) + 0.02; const [x, y] = at(a); g.beginPath(); g.ellipse(x, y, rx * w, ry * w, 0, 0, Math.PI * 2); g.fill(); } // (the body from behind the head round to the tail, tapering)
  const [hx, hy] = at(a0 + 0.18); g.beginPath(); g.ellipse(hx, hy, rx * 0.25, ry * 0.2, 0, 0, Math.PI * 2); g.fill(); // (the head over the tail's tip, biting it)
  g.globalCompositeOperation = 'destination-out';
  const [ex, ey] = at(a0 + 0.24, 1.08); g.beginPath(); g.arc(ex, ey, W * 0.012, 0, Math.PI * 2); g.fill(); // (the eye)
  g.lineWidth = W * 0.008; g.strokeStyle = '#000';
  for (let i = 0; i < 40; i++) { const a = a0 + 0.5 + (i / 40) * (Math.PI * 2 - 0.9), [x0, y0] = at(a, 0.9), [x1, y1] = at(a + 0.05, 1.1); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } // (the scales' chevrons cut across the body)
  const [jx, jy] = at(a0 + 0.02, 1.0); g.beginPath(); g.moveTo(hx, hy); g.lineTo(jx, jy); g.stroke(); // (the jaw's line)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function buildWorld(P, rig) {
  const L = FORGE_LOOK.world;
  rig.masts.forEach((M, mi) => {
    const H = M.height, hw = Math.max(P.look.beam * 0.72, 0.2 * H), top = 0.8 * H, foot = 0.16 * H;
    const pivot = new THREE.Group(); pivot.position.set(M.x, 0, M.z); P.group.add(pivot);
    const at = (s, v, out) => restPoint(M, THREE.MathUtils.lerp(top, foot, v), (s - 0.5) * 2 * hw * (1 + 0.12 * v), 0.02 * H * Math.sin(v * Math.PI), out).sub(_k0.set(M.x, 0, M.z)); // (in the pivot's frame)
    const Wd = 2 * hw * 1.06, Hd = top - foot, rs = Math.min(0.22, (0.34 * Math.min(Wd, Hd)) / Wd), rv = Math.min(0.24, (rs * Wd) / Hd), tex = ouroboros(rs, rv); (P.texs ||= []).push(tex);
    const cloth = P.sailMat({ vane: false, belly: 0.35 * P.look.scale }); cloth.color.setHex(L.cloth); cloth.userData.u.uLotus.value = tex;
    const mA = P.sailMat({ vane: false, belly: 0.35 * P.look.scale }); mA.color.setHex(L.scaleA);
    const mB = P.sailMat({ vane: false, belly: 0.35 * P.look.scale }); mB.color.setHex(L.scaleB);
    const seamM = P.sailMat({ vane: false, belly: 0.35 * P.look.scale }); seamM.color.setHex(L.seam); seamM.emissive.setHex(L.seam); seamM.emissiveIntensity = L.seamK;
    const sheet = sheetDrape(10, 10), A = new Drape(), B = new Drape(), seam = new Drape(), lift = 0.004 * H, [du, dv] = metres(at, 0.5, 0.5);
    const rowH = (1 / L.rows) * dv, sz = rowH * 1.5, cols = Math.max(6, Math.round((Wd / sz) * 0.95));
    for (let r = 0; r < L.rows; r++) for (let q = 0; q <= cols; q++) {
      const v = 0.035 + (r + 0.5) / L.rows * 0.93, s = (q + (r % 2) * 0.5) / cols; if (s < 0.025 || s > 0.975) continue;
      const ex = (s - 0.5) / rs, ey = (v - 0.5) / rv; if (ex * ex + ey * ey < 1.25) continue; // (the knot's ground left bare)
      const w = sz * 0.52, pts = [[-w, sz * 0.5], [-w * 1.04, -sz * 0.1], [-w * 0.6, -sz * 0.55], [0, -sz * 0.78], [w * 0.6, -sz * 0.55], [w * 1.04, -sz * 0.1], [w, sz * 0.5]].map(([x, y]) => [x, -y]); // (a lamellar plate, its point down the cloth: v runs down)
      (r % 2 ? B : A).shape(s, v, du * (1 + 0.12 * v), dv, pts, lift * (1 + 0.15 * (r % 3)));
    }
    const strip = (s0, v0, s1, v1, wm) => { const L2 = Math.hypot((s1 - s0) * du, (v1 - v0) * dv), nx = (-(v1 - v0) * dv / L2) * wm, ny = ((s1 - s0) * du / L2) * wm; for (const lf of [lift * 2, -lift * 2]) { const a = seam.v(s0 - nx / du, v0 - ny / dv, lf), b = seam.v(s1 - nx / du, v1 - ny / dv, lf), c = seam.v(s1 + nx / du, v1 + ny / dv, lf), d = seam.v(s0 + nx / du, v0 + ny / dv, lf); seam.tri(a, b, c); seam.tri(a, c, d); } };
    const sw = 0.0035 * H;
    for (let k = 1; k < 4; k++) strip(0.01, k / 4, 0.99, k / 4, sw); // (the panels' seams across)
    strip(0.006, 0.006, 0.994, 0.006, sw); strip(0.994, 0.006, 0.994, 0.994, sw); strip(0.994, 0.994, 0.006, 0.994, sw); strip(0.006, 0.994, 0.006, 0.006, sw); // (the rim's bolt rope)
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, b = ((i + 1) / 48) * Math.PI * 2; strip(0.5 + Math.cos(a) * rs * 1.12, 0.5 + Math.sin(a) * rv * 1.12, 0.5 + Math.cos(b) * rs * 1.12, 0.5 + Math.sin(b) * rv * 1.12, sw * 0.8); } // (the knot's ring)
    const it = addSail(P, [[sheet, cloth], [A, mA], [B, mB], [seam, seamM]], 0, { at, mi, pivot, sided: false });
    for (const m of it.meshes) { P.group.remove(m); pivot.add(m); }
    const G = new Mesher(), r = Math.max(0.05, (M.segs[0].r0 ?? 0.3) * 0.5); at(0, 0, _a); at(1, 0, _b); _a.y += r; _b.y += r; // (the yard, and the parrel)
    G.cyl(_a.clone().addScaledVector(_b.clone().sub(_a).normalize(), -0.03 * H), _b.clone().addScaledVector(_b.clone().sub(_a).normalize(), 0.03 * H), r, r, 7, L.yard, 0, { smooth: true });
    at(0.5, 0, _a); G.cyl([_a.x, _a.y - r * 2, _a.z], [_a.x, _a.y + r * 3, _a.z], r * 1.8, r * 1.8, 7, FORGE_LOOK.world.scaleB, 0);
    const sp = P.add('spar', G.geometry(), P.look.hullMat, { pivot }); P.group.remove(sp.mesh); pivot.add(sp.mesh);
    layDrapes(it.meshes.map((m) => m.geometry), at, _a.set(0, 0, 1)); // (laid once: it swings on its pivot, bellied forward)
  });
}

export function buildForgeSail(P, rig, id) { if (id === 'krakenSail') buildKraken(P, rig); else if (id === 'worldSail') buildWorld(P, rig); }

// ---------------------------------------------------------------- the hulls
/** A point on the hull's side at (z, y) for side sx, lifted along its normal: [point, normal, tz, ty]. */
function sideFrame(spec, z, y, sx, lift) {
  const w = sideAt(spec, z, y), wy = (sideAt(spec, z, y + 0.05) - sideAt(spec, z, y - 0.05)) / 0.1, wz = (sideAt(spec, z + 0.05, y) - sideAt(spec, z - 0.05, y)) / 0.1;
  const tz = new THREE.Vector3(sx * wz, 0, 1).normalize(), ty = new THREE.Vector3(sx * wy, 1, 0).normalize(), n = new THREE.Vector3().crossVectors(ty, tz).normalize(); if (n.x * sx < 0) n.negate();
  return { w, p: new THREE.Vector3(sx * w, y, z).addScaledVector(n, lift), n, tz, ty };
}
const topAt = (spec, z) => loftAt(spec, z)[2] * spec.shape[spec.shape.length - 1][1];
/** The livery laid over both sides from just under the waterline to under the sheer: col(u stern 0 .. bow 1, h waterline 0 .. sheer 1) -> [colour, code]. */
function shell(G, spec, col, { lift, dz, rows }) {
  const S = spec.stations, z0 = S[0][0] + 0.04, z1 = S[S.length - 1][0] - 0.04, zs = new Set();
  for (let z = z0; z <= z1; z += dz) zs.add(+z.toFixed(3)); for (const st of S) if (st[0] > z0 && st[0] < z1) { zs.add(+(st[0] - 0.02).toFixed(3)); zs.add(+(st[0] + 0.02).toFixed(3)); }
  const Z = [...zs].sort((a, b) => a - b), L = z1 - z0;
  for (const sx of [1, -1]) {
    const grid = Z.map((z) => { const top = topAt(spec, z) - 0.07; return Array.from({ length: rows + 1 }, (_, j) => { const y = THREE.MathUtils.lerp(-0.12, top, j / rows); return { ...sideFrame(spec, z, y, sx, lift), u: (z - z0) / L, h: Math.max(0, y) / Math.max(0.1, top) }; }); });
    for (let i = 0; i < Z.length - 1; i++) for (let j = 0; j < rows; j++) {
      const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1]; if (Math.min(a.w, b.w, c.w, d.w) < 0.08) continue;
      const ref = [0, (a.p.y + c.p.y) / 2, (a.p.z + c.p.z) / 2];
      for (const [p, q, r] of [[a, b, c], [a, c, d]]) { const [hex, code] = col((p.u + q.u + r.u) / 3, (p.h + q.h + r.h) / 3); G.tri(p.p, q.p, r.p, hex, code, ref, p.n, q.n, r.n); } // (a triangle's colour read at its middle: the mesher colours by the face)
    }
  }
}
/** A flat decal on the side at (z, y): pts in metres (u along the hull, v up), as a fan. */
function decal(G, spec, z, y, sx, pts, colour, code, lift) {
  const F = sideFrame(spec, z, y, sx, lift); if (F.w < 0.08) return;
  const P3 = pts.map(([u, v]) => F.p.clone().addScaledVector(F.tz, u).addScaledVector(F.ty, v));
  G.poly(P3, colour, code, F.p.clone().addScaledVector(F.n, -1));
}
const ellipse = (rx, ry, n = 12, x0 = 0, y0 = 0) => Array.from({ length: n }, (_, i) => [x0 + Math.cos((i / n) * Math.PI * 2) * rx, y0 + Math.sin((i / n) * Math.PI * 2) * ry]);
const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;

function buildAkhlut(P) {
  const spec = P.look.spec.hull, A = FORGE_LOOK.akhlut, k = P.look.scale, Lh = P.look.length, G = new Mesher(), lift = 0.012 * k;
  shell(G, spec, (u, h) => {
    const belly = 0.26 + 0.24 * Math.exp(-(((u - 0.38) / 0.17) ** 2)) - 0.08 * smooth(Math.max(0, (u - 0.75) / 0.25)); // (the white flank sweeping up amidships)
    if (h < belly || inEll(u, h, 0.8, 0.62, 0.065, 0.15)) return [A.white, 0];
    if (inEll(u, h, 0.16, 0.86, 0.1, 0.14)) return [A.saddle, 0];
    return [A.black, 0];
  }, { lift, dz: Math.max(0.25, Lh / 120), rows: 16 });
  const S = spec.stations, zS = S[0][0], zB = S[S.length - 1][0], L = zB - zS;
  for (const sx of [1, -1]) {
    for (let z = zS + 0.12 * L, i = 0; z < zB - 0.14 * L; z += 0.045 * L, i++) { // (a wolf's trail walking the waterline to the bow)
      const y = 0.1 * topAt(spec, z) + (i % 2 ? 0.07 : -0.07) * topAt(spec, z), s = Math.min(0.9, 0.012 * L);
      decal(G, spec, z, y, sx, ellipse(s * 0.55, s * 0.5, 9, -s * 0.15, 0), A.ember, A.emberCode, lift * 2);
      for (const [tu, tv] of [[0.55, 0.62], [0.78, 0.22], [0.78, -0.22], [0.55, -0.62]]) decal(G, spec, z + tu * s * 1.2, y + tv * s * 0.9, sx, ellipse(s * 0.2, s * 0.17, 7), A.ember, A.emberCode, lift * 2);
    }
    for (let z = zS + 0.02 * L; z < zB - 0.03 * L; z += 0.02 * L) { const t0 = topAt(spec, z) - 0.07, t1 = topAt(spec, z + 0.02 * L) - 0.07, a = sideFrame(spec, z, t0, sx, lift * 1.6), b = sideFrame(spec, z + 0.02 * L, t1, sx, lift * 1.6); if (Math.min(a.w, b.w) < 0.08) continue; G.quad(a.p, b.p, b.p.clone().addScaledVector(b.ty, -0.06 * k), a.p.clone().addScaledVector(a.ty, -0.06 * k), A.ember, A.emberCode, [0, t0 - 1, z]); } // (Fury's ember along the sheer)
  }
  const z0 = zS + 0.015 * L, z1 = zS + 0.075 * L, y0 = deckAt(spec, (z0 + z1) / 2) - 0.05, hF = Math.min(0.085 * L, 3.2 * k), n = 10; // (the orca's dorsal fin: tall, falcate, raked aft over the stern)
  const lead = (t) => [0, y0 + hF * t, THREE.MathUtils.lerp(z1, z0 - 0.05 * L, t * t) + 0.012 * L * Math.sin(t * Math.PI)], trail = (t) => [0, y0 + hF * t * (0.85 + 0.15 * t), THREE.MathUtils.lerp(z0, z0 - 0.05 * L, Math.pow(t, 0.7)) - 0.006 * L * Math.sin(t * Math.PI)];
  for (let i = 0; i < n; i++) {
    const t = i / n, u = (i + 1) / n, th = (x) => 0.05 * k * (1 - x * 0.9), la = lead(t), lb = lead(u), ta = trail(t), tb = trail(u), ref = [0, y0 + hF * (t + u) / 2 - 0.3, (la[2] + ta[2]) / 2];
    for (const sx of [1, -1]) G.quad([sx * th(t), la[1], la[2]], [sx * th(u), lb[1], lb[2]], [sx * th(u) * 0.5, tb[1], tb[2]], [sx * th(t) * 0.5, ta[1], ta[2]], A.black, 0, [0, ref[1], ref[2]]);
    G.quad([th(t), la[1], la[2]], [th(u), lb[1], lb[2]], [-th(u), lb[1], lb[2]], [-th(t), la[1], la[2]], A.ember, A.emberCode, ref); // (its leading edge in ember)
    G.quad([th(t) * 0.5, ta[1], ta[2]], [th(u) * 0.5, tb[1], tb[2]], [-th(u) * 0.5, tb[1], tb[2]], [-th(t) * 0.5, ta[1], ta[2]], A.black, 0, ref);
  }
  P.add('livery', G.geometry(), P.look.hullMat);
}

function buildMonk(P) {
  const spec = P.look.spec.hull, Mo = FORGE_LOOK.monk, k = P.look.scale, Lh = P.look.length, G = new Mesher(), lift = 0.012 * k;
  const lac = new THREE.Color(Mo.lacquer), sh = new THREE.Color(Mo.sheen);
  shell(G, spec, (u, h) => { const g = smooth(Math.max(0, Math.sin(u * 9.0 + h * 2.2) * 0.5 + 0.5 - 0.35) / 0.65) * smooth(Math.min(1, h * 1.6)); return [_col.copy(lac).lerp(sh, g * 0.8).getHex(), 0]; }, { lift, dz: Math.max(0.3, Lh / 100), rows: 10 }); // (lacquer's slow plum gloss along it)
  const S = spec.stations, zS = S[0][0], zB = S[S.length - 1][0], L = zB - zS;
  for (const sx of [1, -1]) { // (the oculi: an almond eye each side of the bow, its iris and a glint, staring forward)
    const z = zB - 0.13 * L, y = 0.56 * topAt(spec, z), a = 0.055 * L, b = 0.24 * topAt(spec, z);
    const almond = Array.from({ length: 16 }, (_, i) => { const t = (i / 16) * Math.PI * 2, c = Math.cos(t); return [c * a, Math.sin(t) * b * Math.pow(1 - c * c, 0.25) * (c > 0 ? 1 : 0.85)]; });
    decal(G, spec, z, y, sx, almond, Mo.eye, 0.3, lift * 2);
    decal(G, spec, z + 0.012 * L, y, sx, ellipse(b * 0.62, b * 0.62, 14), Mo.iris, 0, lift * 3);
    decal(G, spec, z + 0.012 * L + b * 0.2, y + b * 0.22, sx, ellipse(b * 0.14, b * 0.14, 8), Mo.glint, 0.5, lift * 4);
  }
  const dY = deckAt(spec, zS + 0.03 * L), r = 0.012 * k, tip = [0.25 * k, dY + 0.3 * k, zS - 0.12 * k]; // (the davit off the taffrail's quarter, and the ladle hung off it: a long handle, its bowl bottomless)
  G.cyl([0.25 * k, dY - 0.02, zS + 0.05 * L], [0.25 * k, dY + 0.32 * k, zS + 0.01 * L], r * 1.2, r, 7, Mo.wood, 0, { smooth: true });
  G.cyl([0.25 * k, dY + 0.32 * k, zS + 0.01 * L], tip, r, r, 7, Mo.wood, 0, { smooth: true });
  const hb = [tip[0], tip[1] - 0.32 * k, tip[2] - 0.02 * k]; G.cyl(tip, hb, r * 0.7, r * 0.8, 6, Mo.wood, 0, { smooth: true });
  const n = 12, rim = 0.09 * k, hole = 0.035 * k, rimC = new THREE.Vector3(hb[0], hb[1] - 0.02 * k, hb[2] - 0.08 * k), holeC = new THREE.Vector3(hb[0], hb[1] - 0.13 * k, hb[2] - 0.06 * k);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, R = (c, rr, a) => [c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr * 0.25, c.z + Math.sin(a) * rr];
    const p = [R(holeC, hole, a0), R(holeC, hole, a1), R(rimC, rim, a1), R(rimC, rim, a0)];
    G.quad(p[0], p[1], p[2], p[3], Mo.bowl, 0); G.quad(p[0], p[3], p[2], p[1], Mo.bowl, 0); // (both faces: open at the rim and at the knocked-out bottom)
  }
  P.add('livery', G.geometry(), P.look.hullMat);
}

export function buildForgeHull(P, id) { if (id === 'akhlutHull') buildAkhlut(P); else if (id === 'monkHull') buildMonk(P); }

/** Each frame: the forge sails shown with the vanes and laid again on a change of side (the world sail swung on its pivot). */
export function poseForge(P, side, show, rel) {
  for (const it of P.forge || []) {
    if (it.sided) { const key = `${side}|${show}`; if (key !== it.key && show) { it.key = key; layDrapes(it.meshes.map((m) => m.geometry), (s, v, o) => it.at(s, v, o, side), _a.set(side, 0, 0)); } }
    if (it.pivot) { const want = rel == null ? 0 : THREE.MathUtils.clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1, 1) * 0.45; it.pivot.rotation.y += (want - it.pivot.rotation.y) * 0.05; } // (braced round toward the wind's way, slowly)
  }
}
