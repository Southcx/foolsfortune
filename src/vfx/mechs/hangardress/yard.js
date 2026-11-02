// ---------------------------------------------------------------------------------------
// THE HANGAR'S DRESS: THE PROVING GROUND (plain name; docs/plans/MECHS.md 5.2): the yard at the mech's scale dressed over its
// placeholder (world/hangar/provingground.js), one job: the yard's own things, looks only. The toy city's buildings, the straw giant,
// the boxing ring and the props are Dovina's and untouched; their colliders and hers stay as they are.
//   THE GROUND     her clay floor worn as fired paving: a decal over it (6 m slabs, each its own tint, drainage channels every 60 m,
//                  a gutter round the walls), range rings out from the launch every 50 m in white paint, the street's centre line
//                  dashed in vermilion, and each ring's metres in neuralese numerals painted beside the line (vfx/wornnumerals.js)
//   THE WALL       her low walls hidden and built as a castle's ishigaki: dry-laid granite in courses, battered out at its foot, a
//                  white plaster parapet over it under a black tile cap with a gold ridge (the door's gap kept)
//   THE BLOCKS     her knee-high blocks as firebrick plinths under a stone cap (each exactly her box)
//   THE SOCKETS    her sockets as glazed bollard-pylons: an octagonal celadon bollard with the socket's ring glowing at its top where
//                  the cable plugs in (mechpilot.js draws it from 1.6 m), four horns round it and a gold hoop over it
//   THE LAUNCH     the lift's head where the mech is set down: an iron plate in a gold rim, its seams, hazard chevrons round it,
//                  the cradle's octagon at its heart, arrows east toward the giant, amber lift lights in its rim
//   THE LIGHT      four floodlight towers at the corners (steel lattice, a head of sodium lamps, a faint beam toward the middle), each
//                  lent a lamp by the light budget; a dusk sky (a dome kept round the camera) and a ring of far hills at the sky's edge
// DRAWS: the ground's decal (1), the numerals (1), the firebrick (1), the celadon (1), the kit (1 + its outline), the glow (1), the beams
// (1), the sky (1), the hills (1).
//
// Prior art: Ratchet & Clank's Giant Clank arenas (a city as a toy table at the mech's scale), Pacific Rim's Hong Kong night and its
// sodium-lit docks, Evangelion's umbilical sockets and the launch's lift head; Japan's ishigaki (Kumamoto's and Osaka's battered
// granite, the musha-gaeshi curve) and the dobei plaster wall under its tile cap; a stadium's lattice floodlight towers; an airfield's
// painted markings and a firing range's distance rings.
//
//   buildYard(D, hangar) -> { dome (Mesh), glow (Mesh), lamps [PointLight] }   YARD_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris, V, bx, cyl, canvasTex, hash } from './kit.js';
import { mergeAll } from './gantry.js';
import { PROVING } from '../../../world/hangar/layout.js';
import { ROOM_GLAZES } from '../../roomglazes.js';
import { numeralDecals } from '../../wornnumerals.js';

/** The numbers (local metres from PROVING.at) and the colours. */
export const YARD_LOOK = {
  slab: 6, decal: 2048, drain: 60, rings: [50, 100, 150, 200, 250, 300],
  wall: { course: 0.85, courses: 4, batter: 0.6, plaster: 0.45, cap: 0.2 },
  towers: [[-166, -166], [166, -166], [166, 166], [-166, 166]], tower: { h: 32, foot: 2.6, top: 1.2, every: 4 },
  socket: { r: 1.85, h: 1.5, horn: 4.6, hoop: 1.7 },
  pad: { r: 13 },
  dome: 470, hills: { r: 330, n: 90 },
  col: {
    granite: [0x8c867c, 0x7a746a, 0x9a9488, 0x6e685e, 0x857a6c], mortar: 0x4a443c, plaster: 0xece4d4, tile: 0x1e1a18, gold: 0xe0b04a,
    stone: 0x9a9284, steel: 0x4a4e54, steelDark: 0x2c3036, sodium: 0xffc070, sodiumHot: 0xfff0c8, housing: 0x22252a,
    celadon: 0x8fbfa8, socket: 0x7fd8ff, socketHot: 0xe8fbff, iron: 0x3a3634, ironHi: 0x5a5450, hazard: 0xd2431f, black: 0x161412,
    amber: 0xffa030, vermilion: 0xc23a22, hill: 0x2c2a46, hillTop: 0x45405e,
    sky: [[-1, 0x9a8a78], [0, 0xc89a7a], [0.04, 0xe8a070], [0.12, 0xb07080], [0.3, 0x4a4272], [0.6, 0x232650], [1, 0x121630]], sun: 0xffb26a,
  },
};
const Y_ = YARD_LOOK, C = Y_.col;
/** Her colours (world/hangar/provingground.js C): how her merged meshes are found. */
const HERS = { wall: 0x9c5a3e, block: 0xb5764a, plinth: 0x5a4a3e };

export function buildYard(D, hangar) {
  const F = hangar.field, A = PROVING.at, X = (x) => A.x + x, Y = (y) => A.y + y, Z = (z) => A.z + z, h = PROVING.half, L = PROVING.launch;
  const kit = new Tris(), glow = new Tris(), beams = new Tris(), brick = [], celadon = [];
  const found = D.find(F.group, HERS);
  for (const k of Object.keys(found)) for (const m of found[k]) D.hide(m);
  for (const m of F.group.children) if (m.isMesh && F.glow && m.material === F.glow) D.hide(m); // (her socket caps: the pylons' rings stand there)
  // ---------------------------------------------------------------- the ground's decal
  const N = Y_.decal, pm = N / (2 * h), px = (x) => (x + h) * pm, pz = (z) => (z + h) * pm;
  const tex = canvasTex(N, N, (g) => {
    const n = (2 * h) / Y_.slab;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = hash(i * 13 + j * 71); g.fillStyle = r < 0.5 ? `rgba(60,34,18,${0.05 + r * 0.16})` : `rgba(255,232,196,${(r - 0.5) * 0.18})`; g.fillRect(i * Y_.slab * pm, j * Y_.slab * pm, Y_.slab * pm, Y_.slab * pm); }
    g.strokeStyle = 'rgba(40,24,14,0.42)'; g.lineWidth = Math.max(1.2, 0.18 * pm);
    for (let x = -h; x <= h; x += Y_.slab) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), N); g.stroke(); }
    for (let z = -h; z <= h; z += Y_.slab) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(N, pz(z)); g.stroke(); }
    for (let x = -h + Y_.drain; x < h; x += Y_.drain) for (const [a, b] of [[x, 'v'], [x, 'h']]) { // (the drainage channels: dark, edged lighter)
      g.fillStyle = 'rgba(28,18,12,0.6)'; if (b === 'v') g.fillRect(px(a - 0.45), 0, 0.9 * pm, N); else g.fillRect(0, pz(a - 0.45), N, 0.9 * pm);
      g.fillStyle = 'rgba(255,236,206,0.22)'; if (b === 'v') { g.fillRect(px(a - 0.6), 0, 0.15 * pm, N); g.fillRect(px(a + 0.45), 0, 0.15 * pm, N); } else { g.fillRect(0, pz(a - 0.6), N, 0.15 * pm); g.fillRect(0, pz(a + 0.45), N, 0.15 * pm); }
    }
    g.strokeStyle = 'rgba(30,20,14,0.5)'; g.lineWidth = 2.2 * pm; g.strokeRect(px(-h + 1.1), pz(-h + 1.1), (2 * h - 2.2) * pm, (2 * h - 2.2) * pm); // (the gutter round the walls)
    g.strokeStyle = 'rgba(240,232,214,0.72)'; g.lineWidth = 1.0 * pm;
    for (const r of Y_.rings) { g.beginPath(); g.arc(px(L.x), pz(L.z), r * pm, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = 'rgba(240,232,214,0.72)';
    for (let x = L.x + 10; x < h - 4; x += 10) { const big = (x - L.x) % 50 === 0; g.fillRect(px(x - 0.3), pz(-(big ? 4 : 2)), 0.6 * pm, (big ? 8 : 4) * pm); }
    g.fillStyle = 'rgba(194,58,34,0.78)'; for (let x = L.x + Y_.pad.r + 2; x < h - 4; x += 8) g.fillRect(px(x), pz(-0.5), 4.5 * pm, 1.0 * pm); // (the street's centre line, dashed)
  });
  D.tex.push(tex);
  const floorMat = new THREE.MeshStandardMaterial({ name: 'proving-floor-decal', map: tex, transparent: true, depthWrite: false, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  D.mats.push(floorMat);
  D.put(new THREE.PlaneGeometry(2 * h, 2 * h).rotateX(-Math.PI / 2).translate(X(0), Y(0.02), Z(0)), floorMat, { order: 1 });
  const nums = numeralDecals(Y_.rings.filter((r) => L.x + r < h - 6).map((r) => ({ n: r, pos: V(X(L.x + r + 4.5), Y(0.04), Z(-8)), normal: V(0, 1, 0), up: V(1, 0, 0), size: 5 })), { ink: '#f0e6d0', name: 'proving-rings' });
  nums.userData.zone = 'provingground'; nums.renderOrder = 2; D.group.add(nums); D.disposers.push(() => nums.userData.dispose?.());
  // ---------------------------------------------------------------- the ishigaki wall and its parapet
  const W = Y_.wall, run = (ox, oz, dx, dz, len, nx, nz, seed) => { // (a wall's inner face from (ox, oz) along (dx, dz) for len m; (nx, nz) into the yard)
    let course = 0;
    for (let y = 0; course < W.courses; y += W.course, course++) {
      const bat = W.batter * (1 - (y + W.course / 2) / (W.course * W.courses)) ** 1.5; // (the batter: out at the foot, the musha-gaeshi curve)
      for (let s = -(course % 2) * 0.9, i = 0; s < len; i++) {
        const r = hash(seed + course * 977 + i * 13.7), s0 = Math.max(0, s), s1 = Math.min(len, s + 1.3 + r * 1.6), sw = s1 - s0, mid = (s0 + s1) / 2;
        const inner = bat - hash(seed + i * 3.3 + course) * 0.12, deep = 1 + bat, off = inner - deep / 2; // (its face `inner` m into the yard, its back in her wall)
        const cx = ox + dx * mid + nx * off, cz = oz + dz * mid + nz * off, wx = Math.abs(dx) * (sw - 0.08) + Math.abs(nx) * deep, wz = Math.abs(dz) * (sw - 0.08) + Math.abs(nz) * deep;
        if (sw > 0.2) bx(kit, X(cx), Y(y + W.course / 2), Z(cz), wx, W.course - 0.07, wz, C.granite[Math.floor(hash(seed + i * 7.1 + course * 3) * C.granite.length)]);
        s = s1;
      }
    }
    const top = W.course * W.courses, mx = ox + dx * len / 2, mz = oz + dz * len / 2, lx = Math.abs(dx) * len + Math.abs(nx) * 1.0, lz = Math.abs(dz) * len + Math.abs(nz) * 1.0;
    bx(kit, X(mx - nx * 0.5), Y(top / 2), Z(mz - nz * 0.5), lx * 0.999 - Math.abs(nx) * 0.2, top, lz * 0.999 - Math.abs(nz) * 0.2, C.mortar); // (the mortar behind the stones)
    bx(kit, X(mx - nx * 0.5), Y(top + W.plaster / 2), Z(mz - nz * 0.5), lx, W.plaster, lz, C.plaster);
    bx(kit, X(mx - nx * 0.5), Y(top + W.plaster + W.cap / 2), Z(mz - nz * 0.5), lx + Math.abs(nx) * 0.5, W.cap, lz + Math.abs(nz) * 0.5, C.tile);
    bx(kit, X(mx - nx * 0.5), Y(top + W.plaster + W.cap + 0.05), Z(mz - nz * 0.5), lx * (dx ? 1 : 0.12), 0.1, lz * (dz ? 1 : 0.12), C.gold);
  };
  const D0 = PROVING.door, gap = 2.4;
  run(-h - 0.5, -h, 1, 0, 2 * h + 1, 0, 1, 11); run(-h - 0.5, h, 1, 0, 2 * h + 1, 0, -1, 23); // (north, south)
  run(h, -h, 0, 1, 2 * h, -1, 0, 37);
  run(-h, -h, 0, 1, D0.z - gap + h, 1, 0, 41); run(-h, D0.z + gap, 0, 1, h - D0.z - gap, 1, 0, 53);
  // ---------------------------------------------------------------- the blocks
  const BH = PROVING.blockH;
  for (const B of PROVING.blocks) {
    brick.push(new THREE.BoxGeometry(B.w, BH - 0.25, B.d).translate(X(B.x), Y((BH - 0.25) / 2), Z(B.z)));
    bx(kit, X(B.x), Y(BH - 0.125), Z(B.z), B.w + 0.3, 0.25, B.d + 0.3, C.stone);
    bx(kit, X(B.x), Y(BH + 0.01), Z(B.z), B.w - 0.6, 0.02, B.d - 0.6, 0x847c70);
  }
  // ---------------------------------------------------------------- the sockets
  const S = Y_.socket;
  for (const s of PROVING.sockets) {
    const cx = X(s.x), cz = Z(s.z);
    celadon.push(new THREE.CylinderGeometry(S.r * 0.92, S.r, S.h, 8).rotateY(Math.PI / 8).translate(cx, Y(S.h / 2), cz));
    const band = new THREE.CylinderGeometry(S.r * 0.95, S.r * 0.95, 0.18, 8).rotateY(Math.PI / 8).translate(cx, Y(S.h - 0.12), cz); kit.add(band, C.gold); band.dispose();
    const rim = new THREE.TorusGeometry(0.75, 0.13, 6, 16).rotateX(Math.PI / 2).translate(cx, Y(S.h + 0.06), cz); glow.add(rim, C.socket); rim.dispose();
    const heart = new THREE.CircleGeometry(0.62, 16).rotateX(-Math.PI / 2).translate(cx, Y(S.h + 0.04), cz); glow.add(heart, C.socketHot); heart.dispose();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, fx = cx + Math.cos(a) * S.r * 0.95, fz = cz + Math.sin(a) * S.r * 0.95;
      cyl(kit, V(fx, Y(0), fz), V(fx + Math.cos(a) * 0.2, Y(S.horn), fz + Math.sin(a) * 0.2), 0.34, 0.16, C.celadon, 7);
      const tip = new THREE.SphereGeometry(0.22, 8, 6).translate(fx + Math.cos(a) * 0.2, Y(S.horn + 0.1), fz + Math.sin(a) * 0.2); glow.add(tip, C.socket); tip.dispose();
    }
    const hoop = new THREE.TorusGeometry(S.r * 1.02, 0.09, 5, 24).rotateX(Math.PI / 2).translate(cx, Y(S.horn - 0.5), cz); kit.add(hoop, C.gold); hoop.dispose();
  }
  // ---------------------------------------------------------------- the launch: the lift's head
  const Pd = Y_.pad, lx = X(L.x), lz = Z(L.z), py = Y(0.05);
  const oct = (r, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return V(lx + Math.cos(a) * r, py, lz + Math.sin(a) * r); };
  for (let i = 0; i < 8; i++) {
    kit.tri(V(lx, py, lz), oct(Pd.r, i + 1), oct(Pd.r, i), C.iron);
    const a0 = oct(Pd.r, i), a1 = oct(Pd.r, i + 1), b0 = oct(Pd.r + 1.4, i), b1 = oct(Pd.r + 1.4, i + 1); // (the hazard band round it, two stripes a side)
    const m0 = a0.clone().lerp(a1, 0.5), n0 = b0.clone().lerp(b1, 0.5); for (const p of [m0, n0, a0, a1, b0, b1]) p.y = py + 0.004;
    kit.quad(a0, m0, n0, b0, C.hazard); kit.quad(m0, a1, b1, n0, C.black);
    const g0 = oct(Pd.r + 1.4, i), g1 = oct(Pd.r + 1.75, i), g2 = oct(Pd.r + 1.75, i + 1), g3 = oct(Pd.r + 1.4, i + 1); for (const p of [g0, g1, g2, g3]) p.y = py + 0.008;
    kit.quad(g0, g3, g2, g1, C.gold);
    const lamp = new THREE.CylinderGeometry(0.35, 0.4, 0.14, 10).translate(...oct(Pd.r - 0.6, i + 0.5).toArray()); glow.add(lamp, C.amber); lamp.dispose();
  }
  for (const r of [4.5, 3.8]) for (let i = 0; i < 8; i++) { const a = oct(r, i), b = oct(r, i + 1), c = oct(r - 0.35, i + 1), d = oct(r - 0.35, i); for (const p of [a, b, c, d]) p.y = py + 0.01; kit.quad(a, d, c, b, r > 4 ? C.vermilion : C.gold); }
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(2 * Pd.r * 0.92, 0.02, 0.18).translate(lx, py + 0.012, lz + s * 6.5); kit.add(g, C.ironHi); g.dispose(); const g2 = new THREE.BoxGeometry(0.18, 0.02, 2 * Pd.r * 0.92).translate(lx + s * 6.5, py + 0.012, lz); kit.add(g2, C.ironHi); g2.dispose(); }
  for (let k = 0; k < 3; k++) { // (arrows east, toward the giant)
    const x0 = lx + 6.5 + k * 2.2, y2 = py + 0.014;
    kit.quad(V(x0, y2, lz - 2.4), V(x0, y2, lz - 1.4), V(x0 + 1.6, y2, lz + 0.5), V(x0 + 1.6, y2, lz - 0.5), C.gold);
    kit.quad(V(x0 + 1.6, y2, lz + 0.5), V(x0, y2, lz + 2.4), V(x0, y2, lz + 1.4), V(x0 + 1.6, y2, lz - 0.5), C.gold);
  }
  // ---------------------------------------------------------------- the floodlight towers
  const Tw = Y_.tower, lamps = [];
  for (const [tx, tz] of Y_.towers) {
    const cx = X(tx), cz = Z(tz), legs = (y) => { const r = Tw.foot + (Tw.top - Tw.foot) * (y / Tw.h); return [[-r, -r], [r, -r], [r, r], [-r, r]].map(([a, b]) => V(cx + a, Y(y), cz + b)); };
    const foot = legs(0), top = legs(Tw.h);
    for (let i = 0; i < 4; i++) { cyl(kit, foot[i], top[i], 0.22, 0.16, C.steel, 6); bx(kit, foot[i].x, Y(0.4), foot[i].z, 0.9, 0.8, 0.9, C.stone); }
    for (let y = Tw.every, k = 0; y <= Tw.h; y += Tw.every, k++) {
      const a = legs(y - Tw.every), b = legs(y);
      for (let i = 0; i < 4; i++) { cyl(kit, b[i], b[(i + 1) % 4], 0.1, 0.1, C.steelDark, 5); cyl(kit, a[i], b[(i + 1) % 4], 0.08, 0.08, C.steel, 4); }
    }
    const yaw = Math.atan2(-tx, -tz), fw = V(Math.sin(yaw), 0, Math.cos(yaw)), rt = V(fw.z, 0, -fw.x), head = V(cx, Y(Tw.h + 1.6), cz);
    bx(kit, cx, Y(Tw.h + 0.2), cz, 4, 0.3, 4, C.steelDark);
    const hb = new THREE.BoxGeometry(6.4, 3.4, 0.6).rotateY(yaw).translate(head.x, head.y, head.z); kit.add(hb, C.housing); hb.dispose();
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const at = head.clone().addScaledVector(rt, (c - 1.5) * 1.5).add(V(0, (r - 0.5) * 1.5, 0)).addScaledVector(fw, 0.32);
      const disc = new THREE.CircleGeometry(0.62, 12).lookAt(fw).translate(at.x, at.y, at.z); glow.add(disc, C.sodiumHot); disc.dispose();
      const ring = new THREE.RingGeometry(0.62, 0.72, 12).lookAt(fw).translate(at.x, at.y, at.z); glow.add(ring, C.sodium); ring.dispose();
    }
    // its beam: a faint cone from the head down toward the middle, bright at the head, gone at its foot
    const to = V(X(tx * 0.45), Y(0), Z(tz * 0.45)), axis = to.clone().sub(head), len = axis.length(), seg = 14, rad = 26;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), axis.clone().normalize()), Bc = new THREE.Color(C.sodium);
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const p0 = V(Math.cos(a0) * 1.4, 0, Math.sin(a0) * 1.4).applyQuaternion(q).add(head), p1 = V(Math.cos(a1) * 1.4, 0, Math.sin(a1) * 1.4).applyQuaternion(q).add(head);
      const f0 = V(Math.cos(a0) * rad, len, Math.sin(a0) * rad).applyQuaternion(q).add(head), f1 = V(Math.cos(a1) * rad, len, Math.sin(a1) * rad).applyQuaternion(q).add(head);
      beams.quad(p0, p1, f1, f0, Bc.clone().multiplyScalar(0.09).getHex(), Bc.clone().multiplyScalar(0.09).getHex(), 0x000000, 0x000000);
    }
    lamps.push(D.lamp(head.x + fw.x * 6, head.y - 4, head.z + fw.z * 6, 0xffb060, 520, 200, 1.3));
  }
  // ---------------------------------------------------------------- the sky at dusk, and the hills at its edge
  const dome = new THREE.SphereGeometry(Y_.dome, 40, 20), dp = dome.attributes.position, dc = new Float32Array(dp.count * 3), sun = V(-0.94, 0.08, 0.33).normalize(), cc = new THREE.Color(), c2 = new THREE.Color(), sc = new THREE.Color(C.sun);
  for (let i = 0; i < dp.count; i++) {
    const v = V(dp.getX(i), dp.getY(i), dp.getZ(i)).normalize(), e = v.y, stops = C.sky;
    let j = 0; while (j < stops.length - 2 && e > stops[j + 1][0]) j++;
    const [e0, k0] = stops[j], [e1, k1] = stops[j + 1], u = Math.max(0, Math.min(1, (e - e0) / (e1 - e0)));
    cc.setHex(k0).lerp(c2.setHex(k1), u);
    const s = Math.max(0, v.dot(sun)); cc.lerp(sc, Math.pow(s, 10) * 0.85 * (e > -0.05 ? 1 : 0));
    cc.toArray(dc, i * 3);
  }
  dome.setAttribute('color', new THREE.BufferAttribute(dc, 3));
  const domeMat = new THREE.MeshBasicMaterial({ name: 'proving-sky', vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  D.mats.push(domeMat);
  const domeMesh = D.put(dome, domeMat, { order: -10 }); domeMesh.frustumCulled = false;
  const hills = new Tris(), HR = Y_.hills;
  for (let i = 0; i < HR.n; i++) {
    const a0 = (i / HR.n) * Math.PI * 2, a1 = ((i + 1) / HR.n) * Math.PI * 2, ht = (a) => 14 + 34 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)) * (0.6 + 0.4 * Math.sin(a * 7.7)) + 6 * Math.sin(a * 19);
    const r0 = HR.r + 20 * Math.sin(a0 * 5), r1 = HR.r + 20 * Math.sin(a1 * 5);
    const b0 = V(X(Math.cos(a0) * r0), Y(-4), Z(Math.sin(a0) * r0)), b1 = V(X(Math.cos(a1) * r1), Y(-4), Z(Math.sin(a1) * r1));
    hills.quad(b0, b1, b1.clone().setY(Y(ht(a1))), b0.clone().setY(Y(ht(a0))), C.hill, C.hill, C.hillTop, C.hillTop);
  }
  D.put(hills.geometry(), D.glowMat('hills', { fog: true }));
  // ---------------------------------------------------------------- laid in
  D.put(mergeAll(brick), D.glazed(ROOM_GLAZES.firebrick.body), { outline: true, shadow: true });
  D.put(mergeAll(celadon), D.glazed(ROOM_GLAZES.celadon.body), { outline: true, shadow: true });
  for (const g of brick) g.dispose(); for (const g of celadon) g.dispose();
  D.put(kit.geometry(), D.kitMat('yard'), { outline: true, shadow: true });
  const glowMesh = D.put(glow.geometry(), D.glowMat('glow'));
  const beamMat = new THREE.MeshBasicMaterial({ name: 'proving-beams', vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  D.mats.push(beamMat);
  D.put(beams.geometry(), beamMat, { order: 3 });
  return { dome: domeMesh, glow: glowMesh, lamps };
}
