// ---------------------------------------------------------------------------------------
// AN INSTRUMENT SKIN'S GARNISH (vfx/instrumentskins.js): what a skin grows or bolts onto the Sight's housing (vfx/sight.js) and the
// Lachrimeter's tube (vfx/lachrimetertube.js) beyond a repaint, in the instrument's own units, hung on its tilt (the Sight) or its
// instrument group (the tube), so it turns and scales with it. Every part is a lit part of the overlay's one set-up (`overlayStd`: the
// same program as the brass), merged by material: no program of its own, a few draws a garnish.
//   gears   the clockwork's: toothed wheels behind the discs, the yoke and the scale plate, meshing and turning (each its speed by its
//           size, the meshed one the other way), a balance wheel rocking on the yoke
//   moss    the living one's: roots creeping along the yoke's back, round the rods and up the plate's frame, grown in over three real
//           seconds when the skin is put on (the index drawn further each frame); moss tufts and two glowing caps fade in after
//   coral   the reef's: branching coral up off the anode and down off the cathode, on the plinth's ends, a sea fan behind the plate;
//           pearls at the yoke's ends; a slow sway
//   mimic   the weird one: the discs a chest's jaws, teeth biting at the globe; two eyes on the anode's rim that look about and blink;
//           on the tube a row of teeth along the plinth's top and an eye on a stalk where the finial was
// Nothing is laid over a readout: the globe, the clock ring, the column, the counts and the yoke's studs and arc are left clear (a
// garnish stands behind them, or outside their circle).
//
// Prior art: the skeleton clock and the open-worked watch movement (the gears); kokedama, bonsai roots over a rock and the Ghibli
// forest's moss on machines (Castle in the Sky's robot); Victorian coral-and-shell grottoes, Fabergé's mounts (the coral); the Mimic
// (D&D's, Dark Souls' chest with teeth), Shōwa wind-up toys' painted eyes.
//
//   buildGarnish(kind, which, parts) -> { group, tick(dt), dispose() } | null   (kind: 'gears' | 'moss' | 'coral' | 'mimic'; which: 'sight' | 'tube';
//   parts the instrument's `skinParts`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { overlayStd } from '../lachrimetertube.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
/** A geometry readied for merging: only position, normal and uv, never indexed (so any mix merges). */
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; };
const placed = (g, p, q) => { const m = new THREE.Matrix4().compose(p, q || new THREE.Quaternion(), V(1, 1, 1)); return flat(g.applyMatrix4(m)); };
const up = V(0, 1, 0);
/** A cylinder from a to b of radius r (a coral branch, a stalk). */
function rod(a, b, r0, r1 = r0, seg = 6) {
  const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, seg, 1);
  g.translate(0, L / 2, 0); return placed(g, a, new THREE.Quaternion().setFromUnitVectors(up, d.normalize()));
}
/** A toothed wheel facing +z: `teeth` teeth, its rim r, a hub hole and four lightening holes. */
function gearGeo(r, teeth, depth = 0.05) {
  const s = new THREE.Shape(), n = teeth * 4, ri = r * 0.84;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = i % 4 < 2 ? r : ri, x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hole = (cx, cy, hr) => { const p = new THREE.Path(); p.absarc(cx, cy, hr, 0, Math.PI * 2, true); s.holes.push(p); };
  hole(0, 0, r * 0.12); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; hole(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.2); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.2, bevelSize: depth * 0.2, bevelSegments: 1, curveSegments: 8 });
  g.translate(0, 0, -depth / 2); return g;
}

// ---------- the gears ----------
function gears(which, P, mat) {
  const group = new THREE.Group(), brass = mat({ color: 0xe0b448, metalness: 1, roughness: 0.26 }), steel = mat({ color: 0xa8b0c0, metalness: 1, roughness: 0.2 });
  // [x, y, z, r, teeth, steel?] in the instrument's units; a train: each the last's mesh, turning the other way, at the speed its size gives
  const trains = which === 'sight'
    ? [[[-0.9, 1.45, -0.5, 0.38, 16], [-1.31, 1.04, -0.5, 0.24, 10, 1]], [[0.85, -1.5, -0.5, 0.32, 14], [1.28, -1.12, -0.48, 0.22, 10, 1]], [[-0.95, -1.35, -0.42, 0.2, 9, 1]]]
    : [[[0.98, 3.3, -0.36, 0.26, 12], [0.98, 2.86, -0.36, 0.2, 9, 1], [1.02, 2.42, -0.36, 0.26, 12]], [[-1.85, -0.2, -0.24, 0.28, 12, 1], [-1.4, -0.08, -0.3, 0.2, 9]]];
  const spin = [];
  for (const train of trains) {
    let dir = 1;
    for (const [x, y, z, r, teeth, st] of train) {
      const m = new THREE.Mesh(gearGeo(r, teeth), st ? steel : brass); m.position.set(x, y, z); m.rotation.z = Math.random() * 2; group.add(m);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, 0.09, 12).rotateX(Math.PI / 2), st ? brass : steel); m.add(hub);
      spin.push([m, (dir * 0.28) / r]); dir = -dir;
    }
  }
  // the balance wheel: a rim and its spokes, rocking (the escapement's beat, about two a real second)
  let bal = null;
  { const p = which === 'sight' ? V(2.08, 0.5, -0.62) : V(-2.3, 0.05, -0.1), R = which === 'sight' ? 0.17 : 0.15;
    const rim = new THREE.TorusGeometry(R, 0.016, 6, 28), sp = [0, 1, 2].map((k) => new THREE.BoxGeometry(2 * R, 0.014, 0.014).rotateZ((k * Math.PI) / 3));
    bal = new THREE.Mesh(mergeGeometries([flat(rim), ...sp.map(flat)]), brass); bal.position.copy(p); group.add(bal);
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat({ color: 0xd02040, roughness: 0.1, metalness: 0.2, emissive: 0x300008 })); bal.add(jewel); }
  let t = 0;
  return { group, tick(dt) { t += dt; for (const [m, w] of spin) m.rotation.z += w * dt; bal.rotation.z = Math.sin(t * Math.PI * 2.5) * 1.6; } };
}

// ---------- the moss and roots ----------
function moss(which, P, mat) {
  const group = new THREE.Group(), R = rng(which === 'sight' ? 19 : 23), curves = [];
  const tube = (pts, r) => curves.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 4), r, 5, false));
  const tufts = [], caps = [];
  const tuft = (p, s = 1) => { for (let k = 0; k < 5; k++) { const g = new THREE.IcosahedronGeometry((0.035 + R() * 0.04) * s, 0); tufts.push(placed(g, p.clone().add(V((R() - 0.5) * 0.12 * s, R() * 0.04 * s, (R() - 0.5) * 0.12 * s)))); } };
  const cap = (p, h) => { caps.push(rod(p, p.clone().add(V(0, h, 0)), 0.012, 0.01), placed(new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1), p.clone().add(V(0, h, 0)))); };
  if (which === 'sight') {
    const Y = P.yoke, n = Y.length / 3, { DY, DR, DT } = P;
    for (const ph of [0, 2.1]) { const pts = []; for (let i = 4; i < n - 4; i += 10) { const w = Math.sin(i * 0.11 + ph) * 0.035; pts.push(V(Y[i * 3] - 0.04 + w, Y[i * 3 + 1] + w * 0.5, Y[i * 3 + 2] - 0.08)); } tube(pts, 0.02); }
    { const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, a = u * Math.PI * 6, rr = 0.06 + 0.06 * u; pts.push(V(Math.cos(a) * rr, -DY + DT / 2 + u * (DY - DT / 2 - 0.98), Math.sin(a) * rr)); } tube(pts, 0.016); }
    { const pts = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * 0.35 + (i / 20) * Math.PI * 1.3; pts.push(V(Math.sin(a) * (DR + 0.025), DY + Math.sin(i * 0.9) * 0.05, Math.cos(a) * (DR + 0.025))); } tube(pts, 0.022); }
    for (const [x, z] of [[-0.32, -0.3], [0.38, -0.2], [0.05, 0.35]]) { const a = V(x, -DY - DT / 2, z); tube([a, a.clone().add(V(x * 0.3, -0.14, 0)), a.clone().add(V(x * 0.5 + 0.03, -0.3, 0.02)), a.clone().add(V(x * 0.4, -0.42, 0))], 0.012); }
    tuft(V(0.2, DY + DT / 2, -0.4)); tuft(V(-0.4, DY + DT / 2, -0.3), 0.8); tuft(V(Y[0], Y[1], Y[2])); tuft(V(Y[(n - 1) * 3], Y[(n - 1) * 3 + 1], Y[(n - 1) * 3 + 2]));
    tuft(V(1.8, 0.2, -0.8), 0.9); tuft(V(-0.5, -DY + DT / 2, -0.35), 0.8);
    cap(V(-0.45, -DY + DT / 2, 0.32), 0.07); cap(V(-0.32, -DY + DT / 2, 0.4), 0.045);
  } else {
    const { PL } = P;
    { const pts = []; for (let i = 0; i <= 16; i++) { const y = PL.y0 + (i / 16) * (PL.y1 - PL.y0 - 0.5); pts.push(V(PL.x1 + 0.04 + Math.sin(i * 1.3) * 0.04, y, -0.3 + Math.cos(i * 0.9) * 0.05)); } tube(pts, 0.024); }
    { const pts = []; for (let i = 0; i <= 14; i++) { const x = -2.2 + (i / 14) * 3.1; pts.push(V(x, -0.45 + Math.abs(Math.sin(i * 1.7)) * 0.04, -0.4 + Math.sin(i * 0.8) * 0.03)); } tube(pts, 0.026); }
    { const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18, a = u * Math.PI * 5; pts.push(V(-0.98 + Math.cos(a) * 0.05, 0.9 + u * 0.95, -0.22 + Math.sin(a) * 0.05)); } tube(pts, 0.014); }
    tuft(V(-2.15, -0.46, 0.25)); tuft(V(0.9, -0.46, 0.25), 0.9); tuft(V(-0.98, 1.88, -0.22), 0.8); tuft(V(0.3, PL.y1, -0.29), 0.8); tuft(V(PL.x1 + 0.04, 2.2, -0.3), 0.7);
    cap(V(0.75, -0.48, 0.15), 0.09); cap(V(0.88, -0.48, 0.02), 0.06);
  }
  const rootG = mergeGeometries(curves); curves.forEach((g) => g.dispose());
  const root = new THREE.Mesh(rootG, mat({ color: 0x4a3420, roughness: 0.9 })); group.add(root);
  const mossMat = mat({ color: 0x5c8a2e, roughness: 1, emissive: 0x0a1404, opacity: 0 }), capMat = mat({ color: 0xe8f0c8, roughness: 0.5, emissive: 0x6aa860, emissiveIntensity: 0.6, opacity: 0 });
  group.add(new THREE.Mesh(mergeGeometries(tufts), mossMat), new THREE.Mesh(mergeGeometries(caps), capMat));
  const N = rootG.index ? rootG.index.count : rootG.attributes.position.count; let t = 0; rootG.setDrawRange(0, 0);
  return { group, tick(dt) {
    if (t > 4.5) return; t += dt;
    const k = Math.min(1, t / 3); rootG.setDrawRange(0, Math.floor((N * k) / 3) * 3);
    const f = Math.min(1, Math.max(0, (t - 1.2) / 1.5)); mossMat.opacity = f; capMat.opacity = f;
  } };
}

// ---------- the coral ----------
function coral(which, P, mat) {
  const group = new THREE.Group(), R = rng(which === 'sight' ? 31 : 37), parts = [], tips = [], pearls = [];
  const branch = (p, d, len, r, depth) => {
    const q = p.clone().add(d.clone().multiplyScalar(len)); parts.push(rod(p, q, r, r * 0.72));
    if (depth <= 0) { tips.push(placed(new THREE.SphereGeometry(r * 0.9, 6, 4), q)); return; }
    const kids = 2 + (R() < 0.35 ? 1 : 0);
    for (let k = 0; k < kids; k++) { const nd = d.clone().add(V((R() - 0.5) * 1.1, (R() - 0.3) * 0.5, (R() - 0.5) * 0.7)).normalize(); branch(q, nd, len * (0.65 + R() * 0.15), r * 0.72, depth - 1); }
  };
  const fan = (p, s) => { for (let k = 0; k < 9; k++) { const a = -1.2 + (k / 8) * 2.4; branch(p, V(Math.sin(a), Math.cos(a), 0), 0.22 * s, 0.014 * s, 2); } };
  if (which === 'sight') {
    const { DY, DR, DT, yoke: Y } = P, n = Y.length / 3;
    for (const [a, l] of [[2.6, 0.2], [3.4, 0.24], [4.1, 0.16], [-0.6, 0.14]]) branch(V(Math.sin(a) * DR * 0.8, DY + DT / 2, Math.cos(a) * DR * 0.8), V(Math.sin(a) * 0.4, 1, Math.cos(a) * 0.4).normalize(), l, 0.03, 3);
    for (const [a, l] of [[2.2, 0.16], [3.8, 0.2], [1.1, 0.12]]) branch(V(Math.sin(a) * DR * 0.85, -DY - DT / 2, Math.cos(a) * DR * 0.85), V(Math.sin(a) * 0.7, -1, Math.cos(a) * 0.5).normalize(), l, 0.026, 2);
    fan(V(-0.95, 1.3, -0.45), 1.1);
    for (const i of [0, n - 1]) pearls.push(placed(new THREE.SphereGeometry(0.06, 14, 10), V(Y[i * 3] + 0.02, Y[i * 3 + 1] + (i ? -0.08 : 0.08), Y[i * 3 + 2] + 0.06)));
    for (let k = 0; k < 6; k++) { const a = 0.9 + k * 0.42; pearls.push(placed(new THREE.SphereGeometry(0.03, 10, 8), V(Math.sin(a) * (DR + 0.03), -DY + 0.02, Math.cos(a) * (DR + 0.03)))); }
  } else {
    for (const [x, z, l] of [[-2.05, 0.15, 0.24], [-1.85, 0.3, 0.16], [0.82, 0.12, 0.22], [0.92, -0.1, 0.16]]) branch(V(x, -0.48, z), V((R() - 0.5) * 0.4, 1, (R() - 0.5) * 0.3).normalize(), l, 0.03, 3);
    fan(V(0.95, 2.0, -0.42), 1.5);
    for (const [x, y, z, r] of [[-0.62, 1.86, -0.22, 0.045], [-1.36, 1.86, -0.22, 0.04], [0.92, -0.46, 0.32, 0.05]]) pearls.push(placed(new THREE.SphereGeometry(r, 14, 10), V(x, y, z)));
  }
  const body = new THREE.Mesh(mergeGeometries([...parts, ...tips]), mat({ color: 0xff8a8a, roughness: 0.7, emissive: 0x2a0606 }));
  const sway = new THREE.Group(); sway.add(body); group.add(sway);
  group.add(new THREE.Mesh(mergeGeometries(pearls), mat({ color: 0xfff4f0, roughness: 0.08, metalness: 0.35, emissive: 0x141018 })));
  let t = 0;
  return { group, tick(dt) { t += dt; sway.rotation.z = Math.sin(t * 0.7) * 0.012; sway.position.x = Math.sin(t * 0.9) * 0.006; } };
}

// ---------- the mimic ----------
function mimic(which, P, mat) {
  const group = new THREE.Group(), R = rng(43), teeth = [], toothMat = mat({ color: 0xf2ead2, roughness: 0.35 });
  const tooth = (p, down, s = 1) => { const g = new THREE.ConeGeometry(0.042 * s, 0.13 * s, 5); g.translate(0, 0.065 * s, 0); if (down) g.rotateX(Math.PI); teeth.push(placed(g, p)); };
  const eyes = [];
  const eye = (p, n, r) => {
    const e = new THREE.Group(); e.position.copy(p); e.lookAt(p.clone().add(n)); group.add(e);
    const white = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat({ color: 0xf4f0e4, roughness: 0.2, emissive: 0x141210 }));
    const look = new THREE.Group(); e.add(white, look);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(r * 0.6, 14, 10), mat({ color: 0xe8a020, roughness: 0.2, emissive: 0x5a2a00 })); iris.position.z = r * 0.5;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 0.32, 12, 8), mat({ color: 0x080404, roughness: 0.1 })); pupil.position.z = r * 0.82; pupil.scale.set(0.55, 1, 0.6);
    look.add(iris, pupil); eyes.push({ e, look, gx: 0, gy: 0, tx: 0, ty: 0, next: 0 });
  };
  if (which === 'sight') {
    const { DY, DR, DT } = P;
    for (let k = 0; k < 11; k++) { const a = -1.35 + (k / 10) * 2.7, s = 0.8 + R() * 0.45; tooth(V(Math.sin(a) * DR * 0.9, DY - DT / 2, Math.cos(a) * DR * 0.9), true, s); tooth(V(Math.sin(a + 0.12) * DR * 0.9, -DY + DT / 2, Math.cos(a + 0.12) * DR * 0.9), false, s * 0.9); }
    for (const a of [-0.42, 0.42]) eye(V(Math.sin(a) * (DR + 0.02), DY + 0.02, Math.cos(a) * (DR + 0.02)), V(Math.sin(a), 0.15, Math.cos(a)), 0.1);
  } else {
    for (let x = -2.12; x < 0.98; x += 0.16) { if (x > -0.62 && x < 0.5) continue; tooth(V(x, -0.48, 0.36), false, 0.8 + R() * 0.4); }
    group.add(new THREE.Mesh(rod(V(0, 4.5, 0), V(0.05, 4.86, 0.02), 0.03, 0.022), mat({ color: 0x6a3a22, roughness: 0.6 })));
    eye(V(0.06, 4.98, 0.04), V(0, 0.1, 1), 0.14);
  }
  group.add(new THREE.Mesh(mergeGeometries(teeth), toothMat));
  let t = 0, blink = 2 + R() * 3;
  return { group, tick(dt) {
    t += dt; blink -= dt; const b = blink < 0 ? Math.max(0.08, Math.abs(blink + 0.07) / 0.07) : 1; if (blink < -0.14) blink = 2.5 + R() * 4;
    for (const E of eyes) {
      if ((E.next -= dt) <= 0) { E.next = 0.6 + R() * 1.8; E.tx = (R() - 0.5) * 0.9; E.ty = (R() - 0.5) * 0.5; }
      E.gx += (E.tx - E.gx) * Math.min(1, dt * 9); E.gy += (E.ty - E.gy) * Math.min(1, dt * 9);
      E.look.rotation.set(E.gy, E.gx, 0); E.e.scale.y = b;
    }
  } };
}

const BUILD = { gears, moss, coral, mimic };
/** A skin's garnish for one instrument, hung on its tilt (the Sight) or its instrument group (the tube) by the caller. */
export function buildGarnish(kind, which, parts) {
  const make = BUILD[kind]; if (!make || !parts?.env) return null;
  const mats = [], mat = (o) => { const m = overlayStd(parts.env, o); mats.push(m); return m; };
  const G = make(which, parts, mat);
  G.group.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  G.dispose = () => { G.group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); mats.forEach((m) => m.dispose()); G.group.removeFromParent(); };
  return G;
}
