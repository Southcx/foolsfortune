// ---------------------------------------------------------------------------------------
// THE HANGAR'S DRESS: THE HALL (plain name; docs/plans/MECHS.md 5.1): the hangar's room around the gantry, drawn over the runtime's
// clay boxes (world/hangar/hangar.js: floor, walls, roof with the lift's hole), one job: the hall as a kiln-cathedral where frames are
// fired and fitted, looks only (her colliders, lamps, labels and door untouched; nothing of hers hidden: this stands in front of it).
//   THE FLOOR      her floor worn as fired tiles: a decal over it (joints every 3 m, each tile its own tint, kiln scorch toward the
//                  climbing kiln), the lift painted round in vermilion and black hazard stripes, the cradle's octagon before the
//                  gantry in vermilion and gold, the aisle from the door in two vermilion lines
//   THE WALLS      firebrick pilasters on stone bases (their capitals iron), a tenmoku dado round the foot, timber beams under the roof
//                  (split round the lift's hole), chains with hooks hung from them
//   THE KILN       a noborigama up the east wall: four chambers climbing north, firebrick under ash-glazed vaults, each mouth glowing
//                  (the mouths one glowing mesh, brighter while the Jar is sealed), its stack to the roof; and an alcove either side of
//                  the gantry on the north wall, a kiln's mouth burning in each
//   THE SHAFT      the lift's shaft above the roof's hole (brick going cool toward the top) and the sky at its head; light falling down
//                  it as crossed cards (additive, a soft column), dust motes drifting in it
//   THE RACKS      spare parts racked on the west wall: iron uprights and timber shelves, bisque heads, arms laid down, a pauldron on a
//                  stand; baked once from the parts body's own builders (vfx/mechs/parts/: game.makeMechBody), one mesh for them all
// DRAWS: the floor's decal (1), the pilasters and the kiln's bases (firebrick, 1), the vaults (ash, 1), the kit (1 + its outline), the
// kiln's mouths (1), the shaft and its sky (1), the light (1), the motes (1), the spare parts (1 + its outline).
//
// Prior art: Evangelion's cages under NERV (the umbilical bridges, the long fall of light from the shaft), Pacific Rim's Shatterdome
// (the hall as a cathedral, the launch bays' painted floors), Bandai's Gundam Base and its racked spare parts; the noborigama, the
// climbing kiln of Seto and Karatsu (its chambers stepped up a slope, each mouth stoked in turn, the stack at the top); a church's nave
// lit from its lantern; industrial floor paint (ISO 3864's hazard stripes).
//
//   buildHall(D, hangar) -> { kiln (Mesh), lamps { kiln: [PointLight], shaft }, motes { points, speed } }   HALL_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris, V, bx, cyl, chain, canvasTex, hash } from './kit.js';
import { mergeAll } from './gantry.js';
import { HANGAR } from '../../../world/hangar/layout.js';
import { ROOM_GLAZES } from '../../roomglazes.js';

/** The numbers (local metres from HANGAR.at) and the colours. */
export const HALL_LOOK = {
  tile: 3, decal: 1024,
  pilasters: { w: 1.8, d: 0.9, west: [-26, -18, 2, 12, 22], east: [-26, -18, 26], north: [-25, -16, 16, 25], south: [-24, -14, -6, 6, 14, 24] },
  kiln: { x0: 23.8, chambers: 4, z0: 20, len: 5.6, step: 1.7, body: 2.2, mouth: [1.7, 2.0], stack: { x: 27.2, z: -4.2, w: 3.2 } },
  alcoves: [-20, 20],
  beams: { y: 39.2, z: [26, 18, 10, 2, -8, -16, -24] },
  chains: [[-20, 10, 14], [20, 18, 9], [-14, 24, 18], [16, 2, 16], [-22, -20, 22], [22, -24, 12]],
  shaft: { top: 76, rise: 0.5 },
  racks: { x: [-29.4, -26.4], z: [-4, 26], every: 6, shelves: [0.35, 7.2, 14.2] },
  motes: 220,
  col: {
    stone: 0x8a8278, iron: 0x2e2a28, timber: 0x3a2418, timberHi: 0x55361f, dado: 0x2c1c14, chain: 0x3a3634,
    shaftLow: 0x2a1c16, shaftHigh: 0x6a86b0, sky: 0xbfdcff, skyEdge: 0x7fa2d6, light: 0x6f8fc4,
    mouthHot: 0xfff0a0, mouthMid: 0xffa040, mouthRim: 0xc8401a, ember: 0x7a1e0a, ashLip: 0xb8a878,
    shelf: 0x5a3a24,
  },
};
const H = HALL_LOOK, C = H.col;

export function buildHall(D, hangar) {
  const A = HANGAR.at, X = (x) => A.x + x, Y = (y) => A.y + y, Z = (z) => A.z + z, w = HANGAR.w / 2, d = HANGAR.d / 2, h = HANGAR.h, Gz = HANGAR.gantry.z, o = HANGAR.hole;
  const kit = new Tris(), mouths = new Tris(), sky = new Tris(), brick = [], ash = [];
  const brickBox = (x, y, z, ww, hh, dd) => brick.push(new THREE.BoxGeometry(ww, hh, dd).translate(X(x), Y(y), Z(z)));
  // ---------------------------------------------------------------- the floor's decal
  const N = H.decal, px = (x) => ((x + w) / (2 * w)) * N, pz = (z) => ((z + d) / (2 * d)) * N, pm = N / (2 * w);
  const tex = canvasTex(N, N, (g) => {
    for (let i = 0; i < 2 * w / H.tile; i++) for (let j = 0; j < 2 * d / H.tile; j++) { // (each tile its own tint)
      const r = hash(i * 31 + j * 7), k = r < 0.5 ? `rgba(40,24,14,${0.06 + r * 0.14})` : `rgba(255,236,200,${(r - 0.5) * 0.16})`;
      g.fillStyle = k; g.fillRect(i * H.tile * pm, j * H.tile * pm, H.tile * pm, H.tile * pm);
    }
    const sc = g.createRadialGradient(px(28), pz(9), 2, px(28), pz(9), 15 * pm); sc.addColorStop(0, 'rgba(20,10,6,0.55)'); sc.addColorStop(1, 'rgba(20,10,6,0)'); // (the kiln's scorch)
    g.fillStyle = sc; g.fillRect(0, 0, N, N);
    g.strokeStyle = 'rgba(30,18,12,0.55)'; g.lineWidth = 0.09 * pm;
    for (let x = -w; x <= w; x += H.tile) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), N); g.stroke(); }
    for (let z = -d; z <= d; z += H.tile) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(N, pz(z)); g.stroke(); }
    // the lift's hazard band (round the deck: x -7..7, z -22..-10), stripes at 45 degrees
    g.save(); g.beginPath(); g.rect(px(-7.4), pz(-22.4), 14.8 * pm, 12.8 * pm); g.rect(px(-6.1), pz(-21.1), 12.2 * pm, 10.2 * pm); g.clip('evenodd');
    g.fillStyle = '#16120f'; g.fillRect(0, 0, N, N); g.fillStyle = '#d2431f';
    for (let s = -N; s < N * 2; s += 1.6 * pm) { g.beginPath(); g.moveTo(s, 0); g.lineTo(s + 0.8 * pm, 0); g.lineTo(s + 0.8 * pm - N, N); g.lineTo(s - N, N); g.fill(); }
    g.restore();
    // the cradle's octagon before the gantry, and the aisle to the door
    const oct = (r, lw, col) => { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const fx = px(Math.cos(a) * r), fz = pz(-3 + Math.sin(a) * r); i ? g.lineTo(fx, fz) : g.moveTo(fx, fz); } g.lineWidth = lw * pm; g.strokeStyle = col; g.stroke(); };
    oct(4.2, 0.5, 'rgba(194,58,34,0.92)'); oct(3.5, 0.16, 'rgba(232,184,74,0.95)'); oct(2.2, 0.12, 'rgba(232,184,74,0.7)');
    g.fillStyle = 'rgba(194,58,34,0.88)'; for (const x of [-3.2, 3.2]) g.fillRect(px(x - 0.2), pz(1.6), 0.4 * pm, (27.6 - 1.6) * pm);
    g.fillStyle = 'rgba(232,184,74,0.8)'; for (let z = 4; z < 27; z += 3) { g.beginPath(); g.moveTo(px(-1), pz(z + 1)); g.lineTo(px(0), pz(z)); g.lineTo(px(1), pz(z + 1)); g.lineTo(px(1), pz(z + 1.5)); g.lineTo(px(0), pz(z + 0.5)); g.lineTo(px(-1), pz(z + 1.5)); g.fill(); } // (chevrons toward the gantry)
    g.beginPath(); g.arc(px(HANGAR.lectern.x), pz(HANGAR.lectern.z), 1.6 * pm, 0, Math.PI * 2); g.lineWidth = 0.14 * pm; g.strokeStyle = 'rgba(232,184,74,0.85)'; g.stroke();
  });
  D.tex.push(tex);
  const floorMat = new THREE.MeshStandardMaterial({ name: 'hangar-floor-decal', map: tex, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  D.mats.push(floorMat);
  D.put(new THREE.PlaneGeometry(2 * w, 2 * d).rotateX(-Math.PI / 2).translate(X(0), Y(0.012), Z(0)), floorMat, { order: 1 });
  // ---------------------------------------------------------------- the walls: pilasters, dado, beams, chains
  const P = H.pilasters, pil = (x, z, ax) => { // (ax: the wall's normal axis, 'x' or 'z')
    const [ww, dd] = ax === 'x' ? [P.d, P.w] : [P.w, P.d];
    brickBox(x, h / 2, z, ww, h, dd);
    bx(kit, X(x), Y(0.6), Z(z), ww + 0.4, 1.2, dd + 0.4, C.stone);
    for (const y of [12, 24, 36]) bx(kit, X(x), Y(y), Z(z), ww + 0.2, 0.4, dd + 0.2, C.iron);
  };
  for (const z of P.west) pil(-w + P.d / 2, z, 'x');
  for (const z of P.east) pil(w - P.d / 2, z, 'x');
  for (const x of P.north) pil(x, -d + P.d / 2, 'z');
  for (const x of P.south) pil(x, d - P.d / 2, 'z');
  for (const s of [-1, 1]) { bx(kit, X(s * (w - 0.06)), Y(0.7), Z(0), 0.12, 1.4, 2 * d, C.dado); bx(kit, X(0), Y(0.7), Z(-d + 0.06), 2 * w, 1.4, 0.12, C.dado); }
  for (const s of [-1, 1]) bx(kit, X(s * ((2.2 + w) / 2)), Y(0.7), Z(d - 0.06), w - 2.2, 1.4, 0.12, C.dado);
  for (const z of H.beams.z) {
    const inHole = Math.abs(z - Gz) < o + 0.5;
    const spans = inHole ? [[-w, -o - 0.6], [o + 0.6, w]] : [[-w, w]];
    for (const [x0, x1] of spans) { bx(kit, X((x0 + x1) / 2), Y(H.beams.y), Z(z), x1 - x0, 1.4, 0.8, C.timber); bx(kit, X((x0 + x1) / 2), Y(H.beams.y - 0.78), Z(z), x1 - x0, 0.16, 0.9, C.timberHi); }
  }
  for (const x of [-20, 20]) bx(kit, X(x), Y(H.beams.y + 0.3), Z(0), 0.7, 0.8, 2 * d, C.timber); // (the purlins along the hall)
  for (const [x, z, len] of H.chains) chain(kit, V(X(x), Y(H.beams.y - 0.7), Z(z)), len, C.chain);
  // ---------------------------------------------------------------- the climbing kiln up the east wall
  const K = H.kiln, mouth = (x, y, z, mw, mh, k = 1) => { // (a glowing arch on the face at x, facing -x: hot at its heart, ember at its rim)
    const seg = 10, cx = X(x), cy = Y(y), cz = Z(z), hot = new THREE.Color(C.mouthHot).multiplyScalar(k).getHex();
    const at = (u, r) => { const a = Math.PI * u; const rr = mw / 2; return u < 0 ? null : V(cx, cy + (mh - rr) + Math.sin(a) * rr * r, cz + Math.cos(a) * rr * r); };
    const mid = V(cx, cy + mh * 0.42, cz);
    for (let i = 0; i < seg; i++) { const a = at(i / seg, 1), b = at((i + 1) / seg, 1); mouths.tri(mid, b, a, hot, C.mouthRim, C.mouthRim); }
    const bl = V(cx, cy, cz + mw / 2), br = V(cx, cy, cz - mw / 2), tl = V(cx, cy + mh - mw / 2, cz + mw / 2), tr = V(cx, cy + mh - mw / 2, cz - mw / 2);
    mouths.tri(mid, bl, tl, hot, C.ember, C.mouthRim); mouths.tri(mid, tr, br, hot, C.mouthRim, C.ember); mouths.tri(mid, br, bl, hot, C.ember, C.ember);
  };
  for (let i = 0; i < K.chambers; i++) {
    const zc = K.z0 - i * (K.len + 0.15), base = i * K.step, len = w - K.x0;
    brickBox(K.x0 + len / 2, base / 2 + 0.3, zc, len, base + 0.6, K.len + 0.3); // (the step it stands on)
    brickBox(K.x0 + len / 2, base + 0.6 + K.body / 2, zc, len, K.body, K.len);
    const r = K.len / 2, vault = new THREE.CylinderGeometry(r, r, len, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(X(K.x0 + len / 2), Y(base + 0.6 + K.body), Z(zc));
    ash.push(vault);
    const cap = new THREE.CircleGeometry(r, 14, 0, Math.PI).rotateY(-Math.PI / 2).translate(X(K.x0 - 0.001), Y(base + 0.6 + K.body), Z(zc)); ash.push(cap); // (the vault's face toward the hall)
    mouth(K.x0 - 0.04, base + 0.75, zc, K.mouth[0] * (i ? 1 : 1.35), K.mouth[1] * (i ? 1 : 1.3), i ? 0.9 : 1.15);
    bx(kit, X(K.x0 - 0.12), Y(base + 0.75 + K.mouth[1] * (i ? 1 : 1.3) + 0.1), Z(zc), 0.3, 0.3, K.mouth[0] * 1.6, C.ashLip); // (the mouth's lintel)
  }
  const St = K.stack;
  brickBox(St.x, h / 2, St.z, St.w, h, St.w);
  for (const y of [8, 16, 24, 32]) bx(kit, X(St.x), Y(y), Z(St.z), St.w + 0.25, 0.35, St.w + 0.25, C.iron);
  for (const x of H.alcoves) { // (the north wall's alcoves, a kiln's mouth burning in each)
    const z = -d + 0.7;
    for (const s of [-1, 1]) brickBox(x + s * 2.6, 3.8, z, 1.0, 7.6, 1.4);
    brickBox(x, 8.0, z, 6.2, 1.0, 1.6); bx(kit, X(x), Y(8.6), Z(z + 0.1), 6.6, 0.25, 1.9, C.iron);
    const ap = Z(-d + 0.08), seg = 12, cx = X(x), mw = 4.0, mh = 6.4, hot = C.mouthHot, mid = V(cx, Y(mh * 0.4), ap);
    const at = (u) => { const a = Math.PI * u, rr = mw / 2; return V(cx + Math.cos(a) * rr, Y(mh - rr + Math.sin(a) * rr), ap); };
    for (let i = 0; i < seg; i++) mouths.tri(mid, at(i / seg), at((i + 1) / seg), hot, C.mouthRim, C.mouthRim);
    const bl = V(cx - mw / 2, Y(0), ap), br = V(cx + mw / 2, Y(0), ap), tl = V(cx - mw / 2, Y(mh - mw / 2), ap), tr = V(cx + mw / 2, Y(mh - mw / 2), ap);
    mouths.tri(mid, tl, bl, hot, C.mouthRim, C.ember); mouths.tri(mid, br, tr, hot, C.ember, C.mouthRim); mouths.tri(mid, bl, br, hot, C.ember, C.ember);
  }
  // ---------------------------------------------------------------- the shaft and its sky
  const y0 = h + 0.5, y1 = H.shaft.top, lo = new THREE.Color(C.shaftLow), hi = new THREE.Color(C.shaftHigh);
  const ring = [[-o, -o], [o, -o], [o, o], [-o, o]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = ring[i], [bx2, bz] = ring[(i + 1) % 4];
    for (let y = y0, k = 0; y < y1; y += 4, k++) {
      const ya = y, yb = Math.min(y1, y + 4), ca = lo.clone().lerp(hi, ((ya - y0) / (y1 - y0)) ** 1.6), cb = lo.clone().lerp(hi, ((yb - y0) / (y1 - y0)) ** 1.6);
      if (k % 2) { ca.multiplyScalar(0.86); cb.multiplyScalar(0.86); }
      sky.quad(V(X(ax), Y(ya), Z(Gz + az)), V(X(bx2), Y(ya), Z(Gz + bz)), V(X(bx2), Y(yb), Z(Gz + bz)), V(X(ax), Y(yb), Z(Gz + az)), ca.getHex(), ca.getHex(), cb.getHex(), cb.getHex());
    }
  }
  const sc = V(X(0), Y(y1), Z(Gz));
  for (let i = 0; i < 4; i++) { const [ax, az] = ring[i], [bx2, bz] = ring[(i + 1) % 4]; sky.tri(sc, V(X(bx2), Y(y1), Z(Gz + bz)), V(X(ax), Y(y1), Z(Gz + az)), C.sky, C.skyEdge, C.skyEdge); }
  // ---------------------------------------------------------------- the light falling down the shaft (crossed additive cards) and its motes
  const light = new Tris(), L = new THREE.Color(C.light), drift = V(0, 0, 5);
  const card = (ax, az, bx2, bz) => { // (a card from the hole's edge to edge, falling to the floor, soft at its sides and its foot)
    const cols = [0, 0.5, 1], top = (u) => V(X(ax + (bx2 - ax) * u), Y(h), Z(Gz + az + (bz - az) * u)), foot = (u) => top(u).add(V(0, -h, 0)).add(drift);
    for (let c = 0; c < 2; c++) {
      const u0 = cols[c], u1 = cols[c + 1], k0 = u0 === 0.5 ? 1 : 0, k1 = u1 === 0.5 ? 1 : 0;
      const t0 = L.clone().multiplyScalar(0.07 * k0).getHex(), t1 = L.clone().multiplyScalar(0.07 * k1).getHex(), f0 = L.clone().multiplyScalar(0.015 * k0).getHex(), f1 = L.clone().multiplyScalar(0.015 * k1).getHex();
      light.quad(top(u0), top(u1), foot(u1), foot(u0), t0, t1, f1, f0);
    }
  };
  const e = o - 1;
  for (const z of [-5, 0, 5]) card(-e, z, e, z);
  for (const x of [-5, 0, 5]) card(x, -e, x, e);
  const lightMat = new THREE.MeshBasicMaterial({ name: 'hangar-shaftlight', vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  D.mats.push(lightMat);
  D.put(light.geometry(), lightMat, { order: 2 });
  const M = H.motes, mp = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) { mp[i * 3] = X((hash(i * 3.1) - 0.5) * 2 * e); mp[i * 3 + 1] = Y(1 + hash(i * 5.7) * (h - 2)); mp[i * 3 + 2] = Z(Gz + (hash(i * 9.3) - 0.5) * 2 * e); }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const dot = canvasTex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
  D.tex.push(dot);
  const moteMat = new THREE.PointsMaterial({ name: 'hangar-motes', map: dot, color: 0xcfe0ff, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  D.mats.push(moteMat);
  const points = new THREE.Points(mg, moteMat); points.renderOrder = 3; D.group.add(points); D.geos.push(mg);
  // ---------------------------------------------------------------- the racks and the spare parts
  const R = H.racks;
  for (let z = R.z[0]; z <= R.z[1] + 0.01; z += R.every) for (const x of R.x) bx(kit, X(x), Y(8), Z(z), 0.35, 16, 0.35, C.iron);
  for (const y of R.shelves) for (let z = R.z[0]; z < R.z[1]; z += R.every) { bx(kit, X((R.x[0] + R.x[1]) / 2), Y(y), Z(z + R.every / 2), R.x[1] - R.x[0] + 0.4, 0.3, R.every, C.shelf); for (const x of R.x) bx(kit, X(x), Y(y + 0.2), Z(z + R.every / 2), 0.2, 0.2, R.every, C.iron); }
  const parts = spareParts(hangar.game, X, Y, Z);
  // ---------------------------------------------------------------- laid in
  D.put(mergeAll(brick), D.glazed(ROOM_GLAZES.firebrick.body), { outline: true });
  D.put(mergeAll(ash), D.glazed(ROOM_GLAZES.ash.body), { outline: true });
  for (const g of brick) g.dispose(); for (const g of ash) g.dispose();
  D.put(kit.geometry(), D.kitMat('hall'), { outline: true });
  const kiln = D.put(mouths.geometry(), D.glowMat('kilnmouths'));
  D.put(sky.geometry(), D.glowMat('shaft', { fog: false }));
  if (parts) { const pm2 = D.kitMat('spares'); pm2.side = THREE.DoubleSide; pm2.flatShading = false; pm2.roughness = 0.45; D.put(parts, pm2, { outline: true }); }
  const lamps = { kiln: [D.lamp(X(K.x0 - 3), Y(3.5), Z(K.z0 - 3), 0xff7a2a, 26, 26), D.lamp(X(-20), Y(4), Z(-d + 4), 0xff7a2a, 16, 20)], shaft: D.lamp(X(0), Y(30), Z(Gz + 2), 0x86a8ff, 30, 46, 1.2) };
  return { kiln, lamps, motes: { points, e, top: h } };
}

/** The spare parts on the west wall's racks: two frames built by the parts body (vfx/mechs/partsbody.js, through game.makeMechBody),
 *  their heads, an arm and a pauldron baked into one vertex-coloured geometry in the racks' places, the bodies let go. Null if the
 *  parts body is not installed or throws (the racks stand empty). */
function spareParts(game, X, Y, Z) {
  if (!game.makeMechBody) return null;
  const out = [];
  try {
    const sels = [{}, { head: 'watcherHead', arms: 'strongArms' }, { arms: 'quickArms' }];
    const bodies = sels.map((sel) => game.makeMechBody({ ...sel }));
    for (const b of bodies) b.group.updateMatrixWorld(true);
    const J = (b, id) => b.joints?.[id] || null;
    const lay = (obj, at, fit, rot = [0, 0, 0]) => { const g = bake(obj, fit, rot); if (!g) return; g.translate(X(at[0]), Y(at[1]), Z(at[2])); out.push(g); };
    const [a, b2, c] = bodies, R = H.racks, mx = (R.x[0] + R.x[1]) / 2;
    // heads on the middle and top shelves, facing the hall (+x)
    lay(J(a, 'head'), [mx, R.shelves[1] + 0.15, 2], 2.6, [0, Math.PI / 2, 0]);
    lay(J(b2, 'head'), [mx, R.shelves[1] + 0.15, 9], 2.6, [0, Math.PI / 2, 0]);
    lay(J(c, 'head'), [mx, R.shelves[2] + 0.15, 21], 2.4, [0, Math.PI / 2, 0]);
    lay(J(a, 'head'), [mx, R.shelves[2] + 0.15, 15], 2.4, [0, Math.PI / 2, 0]);
    // arms laid down on the floor shelf, along the wall
    lay(J(b2, 'shoulderL'), [mx, R.shelves[0] + 1.3, 5], 6.2, [0, 0, Math.PI / 2]);
    lay(J(c, 'shoulderR'), [mx, R.shelves[0] + 1.1, 16], 5.8, [0, 0, Math.PI / 2]);
    lay(J(a, 'shoulderL'), [mx, R.shelves[1] + 1.2, 22.5], 5.0, [0, 0, Math.PI / 2]);
    // a pauldron on its stand by the racks' south end
    const pl = J(a, 'pauldronL') || J(b2, 'pauldronL');
    if (pl) lay(pl, [-24.5, 2.6, 26.5], 3.2, [0, Math.PI / 2, 0]);
    for (const b of bodies) b.dispose();
  } catch (e) { console.warn('hangar dress: the spare parts were not baked', e); }
  if (!out.length) return null;
  const merged = mergeColoured(out); for (const g of out) g.dispose(); return merged;
}

/** One subtree of a built body baked in the subtree's own space (vertex colour x its material's colour, position, normal), turned
 *  by `rot` and scaled so its tallest side is `fit` m, its foot at 0 and its middle at x = z = 0. */
function bake(root, fit, rot) {
  if (!root) return null;
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), list = [];
  root.traverse((m) => {
    if (!m.isMesh || !m.geometry?.attributes?.position || m.userData.isOutline || m.visible === false) return;
    const g0 = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(), mat = [].concat(m.material)[0];
    g0.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    if (!g0.attributes.normal) g0.computeVertexNormals();
    const n = g0.attributes.position.count, col = new Float32Array(n * 3), vc = g0.attributes.color, base = mat?.color || new THREE.Color(1, 1, 1), em = mat?.emissive;
    for (let i = 0; i < n; i++) {
      let r = vc ? vc.getX(i) : 1, gg = vc ? vc.getY(i) : 1, bb = vc ? vc.getZ(i) : 1; r *= base.r; gg *= base.g; bb *= base.b;
      if (em && mat.emissiveIntensity) { r += em.r * 0.5; gg += em.g * 0.5; bb += em.b * 0.5; }
      col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = bb;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    list.push(g);
  });
  if (!list.length) return null;
  const g = mergeColoured(list); for (const q of list) q.dispose();
  g.rotateX(rot[0]); g.rotateY(rot[1]); g.rotateZ(rot[2]);
  g.computeBoundingBox(); const bb = g.boundingBox, s = bb.getSize(new THREE.Vector3()), k = fit / Math.max(0.01, s.x, s.y, s.z), c = bb.getCenter(new THREE.Vector3());
  g.translate(-c.x, -bb.min.y, -c.z); g.scale(k, k, k);
  return g;
}

/** Geometries with position, normal and colour merged into one. */
function mergeColoured(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of list) { pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}
