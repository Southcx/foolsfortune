// ---------------------------------------------------------------------------------------
// THE HANGAR'S DRESS: THE GANTRY (plain name; docs/plans/MECHS.md 5.1): the cage the frame stands in, drawn over the runtime's iron
// boxes (world/hangar/hangar.js: two towers, a beam, two clamps, the walkway and its ramp, the lift's deck), one job: the gantry and
// what hangs on it, looks only (her colliders and the deck's ride untouched).
//   THE PIERS      her towers as stacked kiln-brick piers (firebrick, vfx/roomglazes.js) on stone plinths, banded in iron every 3 m,
//                  each band bolted, each bolt ringed in gold (the bolts one glowing mesh: lit by the mount's beats, dim at rest)
//   THE BEAM       her beam lacquered vermilion as a torii's nuki, a black kasagi over it with upturned ends (the gantry is a gate the
//                  frame walks out of), and under it the shimenawa: a straw rope swagged across, straw tassels, five shide of paper
//                  that sway (moved on the CPU: a dozen quads; a breeze always, a gust on a beat)
//   THE CLAMPS     her clamps as iron arms from the piers' backs, a jaw at each end, gold-banded bolts, a ram braced to the pier
//   THE SCAFFOLD   ashiba (bamboo and iron) up the piers' outer sides: poles, ledgers every 2.2 m, braces, boards at three levels
//   THE WALKWAY    her walkways (HANGAR.walks, a ring round the frame; HANGAR.walk alone until then) and ramp lacquered (sang de boeuf),
//                  a gold fascia, vermilion rails with gold giboshi on the outer edges only (none across where two walkways meet, none
//                  facing the frame), black pillars to the floor clear of the lift's deck, paper lanterns on posts at the runs' ends
//                  (their bodies one glowing mesh: flared gold by the mount)
//   THE DECK       the lift's deck (hers, it rides up with the mech) worn as a grate: hazard stripes round its rim, iron bars across
//                  it, a child of her mesh so it rides along
// DRAWS: the piers (firebrick, 1), the lacquer (1), the kit (vertex colours, 1 + its outline), the bolts (1), the lanterns (1), the
// shide (1), the deck's grate (1).
//
// Prior art: Evangelion's cage (the unit clamped standing in its bay, the umbilical bridge at its chest), Pacific Rim's Shatterdome
// bays, Bandai's Gundam Base gantries; the torii and its shimenawa with shide (a sacred boundary: Ise, Izumo's great rope); ashiba,
// Hong Kong's and Japan's bamboo-and-iron scaffold; the climbing kiln's firebrick; Kyoto's lacquered bridges (Togetsukyō, the
// vermilion of Fushimi Inari) and their giboshi.
//
//   buildGantry(D, hangar) -> { bolts (Mesh), lanterns (Mesh), shide { mesh, rest, k }, lamp }   GANTRY_LOOK   walksOf()   railsOf(walks, ramp)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris, V, bx, cyl, tube, lantern, shideStrip, hash } from './kit.js';
import { HANGAR } from '../../../world/hangar/layout.js';
import { ROOM_GLAZES } from '../../roomglazes.js';

/** The numbers (local metres from HANGAR.at) and the colours. */
export const GANTRY_LOOK = {
  pier: { x: 8.5, w: 2.5, top: 23.6, band: 3, plinth: [3.5, 1.2] },
  kasagi: { y0: 23.6, h: 1.2, d: 1.8, half: 11.4, lift: 0.9 },
  rope: { y: 20.9, sag: 1.4, r: 0.42, half: 7.6, shide: [-6, -3, 0, 3, 6], tassels: [-4.5, -1.5, 1.5, 4.5] },
  scaffold: { out: [10.3, 12.6], half: 2.1, ledger: 2.2, boards: [6.6, 13.2, 19.8] },
  col: {
    iron: 0x2e2a28, ironHi: 0x4a4440, stone: 0x8a8278, stoneDark: 0x6e665c, lacquer: 0x1a1210, vermilion: 0xc23a22, gold: 0xe0b04a,
    straw: 0xcfae62, strawDark: 0xa8853e, paper: 0xf6f1e4, bamboo: 0xb8b070, bambooDark: 0x8a8a4e, board: 0x8a6a48, knot: 0x222020,
    hazard: 0xd2431f, black: 0x161412, grate: 0x3a3634, boltGold: 0xffc65a, lanternPaper: 0xffb85a,
  },
};
const G = GANTRY_LOOK, C = G.col, DECK = { w: 12, d: 10 }; // (the lift's deck, world/hangar/hangar.js)

export function buildGantry(D, hangar) {
  const A = HANGAR.at, X = (x) => A.x + x, Y = (y) => A.y + y, Z = (z) => A.z + z, Gz = HANGAR.gantry.z;
  const kit = new Tris(), bolts = new Tris(), glow = new Tris(), lac = [], brick = [];
  const brickBox = (x, y, z, w, h, d) => brick.push(new THREE.BoxGeometry(w, h, d).translate(X(x), Y(y), Z(z)));
  // ---------------------------------------------------------------- the piers
  const P = G.pier;
  for (const s of [-1, 1]) {
    const px = s * P.x;
    brickBox(px, P.top / 2, Gz, P.w, P.top, P.w);
    bx(kit, X(px), Y(P.plinth[1] / 2), Z(Gz), P.plinth[0], P.plinth[1], P.plinth[0], C.stone);
    bx(kit, X(px), Y(P.plinth[1] + 0.12), Z(Gz), P.plinth[0] - 0.3, 0.24, P.plinth[0] - 0.3, C.stoneDark);
    for (let y = 3; y < P.top - 1; y += P.band) {
      bx(kit, X(px), Y(y), Z(Gz), P.w + 0.22, 0.34, P.w + 0.22, C.iron);
      for (let f = 0; f < 4; f++) for (const o of [-0.6, 0.6]) { // (two bolts a face: an iron head, a gold band round it)
        const n = f < 2 ? V(f ? 1 : -1, 0, 0) : V(0, 0, f === 2 ? 1 : -1), t = V(-n.z, 0, n.x), at = V(X(px), Y(y), Z(Gz)).addScaledVector(n, P.w / 2 + 0.11).addScaledVector(t, o);
        cyl(kit, at, at.clone().addScaledVector(n, 0.14), 0.1, 0.09, C.ironHi, 6);
        cyl(bolts, at.clone().addScaledVector(n, -0.01), at.clone().addScaledVector(n, 0.06), 0.16, 0.16, C.boltGold, 8);
      }
    }
  }
  // ---------------------------------------------------------------- the beam (her beam as the nuki), the kasagi, the rope
  lac.push(new THREE.BoxGeometry(19.4, 1.5, 2.15).translate(X(0), Y(22.6), Z(Gz)));
  const K = G.kasagi;
  bx(kit, X(0), Y(K.y0 + K.h / 2), Z(Gz), 2 * 9.6, K.h, K.d, C.lacquer);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { // (the ends upturned: five steps out and up)
    const u = (i + 0.5) / 5, x = s * (9.6 + u * (K.half - 9.6)), lift = K.lift * u * u;
    bx(kit, X(x), Y(K.y0 + K.h / 2 + lift), Z(Gz), (K.half - 9.6) / 5 + 0.02, K.h, K.d, C.lacquer);
  }
  bx(kit, X(0), Y(K.y0 + K.h + 0.08), Z(Gz), 2 * 9.6, 0.16, K.d + 0.1, C.gold); // (its gold cap)
  for (const s of [-1, 1]) bx(kit, X(s * (P.x)), Y(22.6), Z(Gz), P.w + 0.3, 1.7, P.w + 0.3, C.iron); // (the iron saddles where the nuki meets the piers)
  const R = G.rope, ropeAt = (x) => V(X(x), Y(R.y - R.sag * (1 - (x / R.half) ** 2)), Z(Gz + 0.75));
  const ropePts = []; for (let i = 0; i <= 16; i++) ropePts.push(ropeAt(-R.half + (2 * R.half * i) / 16));
  tube(kit, ropePts, R.r, C.straw, 7);
  for (let k = 0; k < 2; k++) { // (its twist: two strands wound round it)
    const pts = []; for (let i = 0; i <= 64; i++) { const x = -R.half + (2 * R.half * i) / 64, a = i * 0.9 + k * Math.PI, c = ropeAt(x); pts.push(c.add(V(0, Math.cos(a) * R.r * 0.85, Math.sin(a) * R.r * 0.85))); }
    tube(kit, pts, R.r * 0.32, C.strawDark, 4);
  }
  for (const s of [-1, 1]) { const e = ropeAt(s * R.half); tube(kit, [e, e.clone().add(V(s * 0.6, 0.4, 0)), V(X(s * (R.half + 0.7)), Y(21.9), Z(Gz + 0.75))], 0.12, C.strawDark, 4); }
  for (const x of R.tassels) { const t = ropeAt(x); cyl(kit, t.clone().add(V(0, -1.3, 0)), t, 0.3, 0.06, C.straw, 7); }
  const sh = [];
  for (const x of R.shide) sh.push(...shideStrip(ropeAt(x).add(V(0, -R.r * 0.6, 0.12)), 1.7, 0.36));
  const sp = [], sk = [];
  for (const q of sh) for (const [i, j, k] of [[0, 1, 2], [0, 2, 3]]) for (const n of [i, j, k]) { sp.push(q.p[n].x, q.p[n].y, q.p[n].z); sk.push(q.k[n]); }
  const shGeo = new THREE.BufferGeometry(); shGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); shGeo.computeVertexNormals();
  // ---------------------------------------------------------------- the clamps
  for (const s of [-1, 1]) {
    const y = 12, z = Gz - 3.2;
    bx(kit, X(s * 6.2), Y(y), Z(z), 2.8, 1.2, 1.0, C.iron);
    bx(kit, X(s * P.x), Y(y), Z(Gz - 2.2), 1.4, 1.1, 2.2, C.iron); // (the arm back from the pier)
    bx(kit, X(s * 7.2), Y(y), Z(z + 0.2), 1.6, 1.0, 1.2, C.iron);
    for (const dy of [-0.75, 0.75]) bx(kit, X(s * 4.75), Y(y + dy), Z(z + 0.5), 0.5, 0.3, 1.8, C.ironHi); // (the jaw's two prongs)
    cyl(kit, V(X(s * P.x), Y(y - 4), Z(Gz - 1.2)), V(X(s * 6.8), Y(y - 0.5), Z(z + 0.3)), 0.28, 0.2, C.ironHi, 8); // (the ram)
    for (const dx of [-0.8, 0, 0.8]) { const at = V(X(s * 6.2 + dx), Y(y), Z(z + 0.5)); cyl(kit, at, at.clone().add(V(0, 0, 0.16)), 0.13, 0.12, C.ironHi, 6); cyl(bolts, at.clone().add(V(0, 0, -0.01)), at.clone().add(V(0, 0, 0.07)), 0.2, 0.2, C.boltGold, 8); }
  }
  // ---------------------------------------------------------------- the scaffold (ashiba) up the piers' outer sides
  const S = G.scaffold;
  for (const s of [-1, 1]) {
    const xs = S.out.map((x) => s * x), zs = [Gz - S.half, Gz + S.half];
    for (const x of xs) for (const z of zs) cyl(kit, V(X(x), Y(0), Z(z)), V(X(x), Y(P.top - 0.2), Z(z)), 0.11, 0.09, (x + z) % 2 ? C.bamboo : C.bambooDark, 6);
    let lv = 0;
    for (let y = S.ledger; y < P.top - 0.5; y += S.ledger, lv++) {
      for (const z of zs) { cyl(kit, V(X(xs[0]), Y(y), Z(z)), V(X(xs[1]), Y(y), Z(z)), 0.08, 0.08, C.bamboo, 5); }
      for (const x of xs) cyl(kit, V(X(x), Y(y), Z(zs[0])), V(X(x), Y(y), Z(zs[1])), 0.08, 0.08, C.bambooDark, 5);
      for (const x of xs) for (const z of zs) bx(kit, X(x), Y(y), Z(z), 0.3, 0.26, 0.3, C.knot); // (the iron clamp at each crossing)
      const yb = y + S.ledger; if (yb < P.top) cyl(kit, V(X(xs[1]), Y(y), Z(lv % 2 ? zs[0] : zs[1])), V(X(xs[1]), Y(yb), Z(lv % 2 ? zs[1] : zs[0])), 0.07, 0.07, C.bamboo, 5); // (the brace, zigzag up the outer face)
    }
    for (const y of S.boards) for (let i = 0; i < 4; i++) bx(kit, X(s * (S.out[0] + S.out[1]) / 2), Y(y + 0.15), Z(Gz - S.half + 0.5 + i * 1.05), S.out[1] - S.out[0] + 0.4, 0.07, 0.95, i % 2 ? C.board : 0x7a5c3e);
  }
  // ---------------------------------------------------------------- the walkways and the ramp, lacquered; rails, pillars, lanterns
  const walks = walksOf(), wy = HANGAR.walkY, Rp = HANGAR.ramp;
  const run = Rp.x1 - Rp.x0, a = Math.atan2(wy, run), t = 0.55, len = Math.hypot(run, wy) + 0.3;
  lac.push(new THREE.BoxGeometry(len, t, Rp.w + 0.14).rotateZ(a).translate(X((Rp.x0 + Rp.x1) / 2) + (Math.sin(a) * 0.5) / 2, Y(wy / 2 - (Math.cos(a) * 0.5) / 2), Z(Rp.z)));
  const rampY = (x) => ((x - Rp.x0) / run) * wy; // (the ramp's top at local x)
  const post = (x, y, z, h = 1.1) => { cyl(kit, V(X(x), Y(y), Z(z)), V(X(x), Y(y + h), Z(z)), 0.09, 0.09, C.vermilion, 6); const c = V(X(x), Y(y + h + 0.1), Z(z)); const gb = new THREE.SphereGeometry(0.14, 8, 6).scale(1, 1.3, 1).translate(c.x, c.y, c.z); kit.add(gb, C.gold); gb.dispose(); };
  for (const zz of [Rp.z - Rp.w / 2 - 0.05, Rp.z + Rp.w / 2 + 0.05]) {
    const pts = [];
    for (let x = Rp.x0 + 0.6; x <= Rp.x1 + 0.01; x += 3) { post(x, rampY(x), zz); pts.push(V(X(x), Y(rampY(x) + 1.05), Z(zz))); }
    if (pts.length > 1) cyl(kit, pts[0], pts[pts.length - 1], 0.06, 0.06, C.vermilion, 5);
  }
  for (let x = Rp.x0 + 6; x < Rp.x1; x += 6) { const top = rampY(x) - 0.3; for (const zz of [Rp.z - 1.2, Rp.z + 1.2]) bx(kit, X(x), Y(top / 2), Z(zz), 0.35, top, 0.35, C.lacquer); }
  // each walkway's slab, then its outer edges (railsOf): a gold fascia, a vermilion rail on posts with a gold top rail, black pillars
  // under it to the floor where the lift's deck does not ride, a lantern at each run's ends (one where two runs meet)
  const lan = [];
  walks.forEach((Wk, i) => { // (each slab grown 0.1 m past its edges, but not where another walkway meets it; one laid over an earlier one
    // stands 1.6 cm lower: no two tops in one plane, CASEBOOK 1)
    const g = (nx, nz) => (walks.some((q) => q !== Wk && meets(Wk, q, nx, nz)) ? 0 : 0.1);
    const x0 = Wk.x0 - g(-1, 0), x1 = Wk.x1 + g(1, 0), z0 = Wk.z0 - g(0, -1), z1 = Wk.z1 + g(0, 1);
    const under = walks.slice(0, i).filter((q) => q.x0 < Wk.x1 && q.x1 > Wk.x0 && q.z0 < Wk.z1 && q.z1 > Wk.z0).length * 0.016;
    lac.push(new THREE.BoxGeometry(x1 - x0, 0.46, z1 - z0).translate(X((x0 + x1) / 2), Y(wy - 0.21 - under), Z((z0 + z1) / 2)));
  });
  const pil = [], pillar = (x, z) => { if (onDeck(x, z) || pil.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.2)) return; pil.push([x, z]); bx(kit, X(x), Y((wy - 0.45) / 2), Z(z), 0.4, wy - 0.45, 0.4, C.lacquer); };
  for (const e of railsOf(walks, Rp)) {
    const { ax, az, bx: ex, bz: ez, nx, nz } = e, L = Math.hypot(ex - ax, ez - az), o = 0.05;
    const P0 = V(X(ax + nx * o), Y(wy), Z(az + nz * o)), P1 = V(X(ex + nx * o), Y(wy), Z(ez + nz * o));
    bx(kit, (P0.x + P1.x) / 2 + nx * 0.06, Y(wy - 0.32), (P0.z + P1.z) / 2 + nz * 0.06, Math.abs(ex - ax) + (nx ? 0.05 : 0.2), 0.14, Math.abs(ez - az) + (nz ? 0.05 : 0.2), C.gold); // (the fascia's gold band)
    const n = Math.max(1, Math.round(L / 2.5));
    for (let k = 0; k <= n; k++) { const u = k / n; post(ax + (ex - ax) * u + nx * o, wy, az + (ez - az) * u + nz * o); }
    cyl(kit, P0.clone().setY(Y(wy + 1.05)), P1.clone().setY(Y(wy + 1.05)), 0.06, 0.06, C.gold, 5);
    const m = Math.max(1, Math.round(L / 5));
    for (let k = 0; k <= m; k++) { const u = k / m; pillar(ax + (ex - ax) * u - nx * 0.25, az + (ez - az) * u - nz * 0.25); }
    for (const [x, z] of [[ax, az], [ex, ez]]) { const at = V(x + nx * 0.4, wy, z + nz * 0.4); if (!lan.some((l) => Math.hypot(l.x - at.x, l.z - at.z) < 1.5)) lan.push(at); }
  }
  // the lanterns: on tall posts along the ramp's south side, and at the walkways' corners
  for (let x = Rp.x0 + 3; x < Rp.x1; x += 6) lan.push(V(x, rampY(x), Rp.z + Rp.w / 2 + 0.35));
  for (const l of lan) {
    const foot = V(X(l.x), Y(l.y), Z(l.z)), top = foot.clone().add(V(0, 3.0, 0));
    cyl(kit, foot, top, 0.07, 0.06, C.lacquer, 5);
    cyl(kit, top, top.clone().add(V(0, 0, 0.7)), 0.05, 0.05, C.lacquer, 4);
    lantern(kit, glow, top.clone().add(V(0, -1.2, 0.7)), 0.38, C.lanternPaper);
  }
  // ---------------------------------------------------------------- the deck's grate (rides with her deck)
  const grate = new Tris(), dw = DECK.w / 2, dd = DECK.d / 2, gy = 0.52;
  const flat = (x0, z0, x1, z1, y, col) => grate.quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), col);
  flat(-dw, -dd, dw, dd, gy - 0.005, C.black);
  let i = 0;
  for (let x = -dw; x < dw; x += 1.0, i++) { flat(x, dd - 0.7, x + 1.0, dd, gy + 0.004, i % 2 ? C.hazard : C.black); flat(x, -dd, x + 1.0, -dd + 0.7, gy + 0.004, i % 2 ? C.black : C.hazard); }
  for (let z = -dd + 0.7, j = 0; z < dd - 0.7; z += 1.0, j++) { const zz = Math.min(z + 1.0, dd - 0.7); flat(-dw, z, -dw + 0.7, zz, gy + 0.004, j % 2 ? C.hazard : C.black); flat(dw - 0.7, z, dw, zz, gy + 0.004, j % 2 ? C.black : C.hazard); }
  for (let x = -dw + 1.1; x < dw - 0.9; x += 0.55) { const g = new THREE.BoxGeometry(0.1, 0.06, 2 * dd - 1.6).translate(x, gy + 0.03, 0); grate.add(g, C.grate); g.dispose(); }
  for (let z = -dd + 1.1; z < dd - 0.9; z += 1.1) { const g = new THREE.BoxGeometry(2 * dw - 1.6, 0.05, 0.12).translate(0, gy + 0.025, z); grate.add(g, C.grate); g.dispose(); }
  // ---------------------------------------------------------------- laid in
  const merge = (list) => { const m = mergeAll(list); for (const g of list) g.dispose(); return m; };
  D.put(merge(brick), D.glazed(ROOM_GLAZES.firebrick.body), { outline: true });
  D.put(merge(lac), D.glazed(ROOM_GLAZES.sangDeBoeuf.body), { outline: true });
  D.put(kit.geometry(), D.kitMat('gantry'), { outline: true });
  const boltMesh = D.put(bolts.geometry(), D.glowMat('bolts'));
  const lanterns = D.put(glow.geometry(), D.glowMat('lanterns'));
  const shMat = new THREE.MeshStandardMaterial({ name: 'hangar-shide', color: C.paper, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x2a2418 }); D.mats.push(shMat);
  const shMesh = D.put(shGeo, shMat);
  if (hangar.deck) D.put(grate.geometry(), D.kitMat('grate'), { parent: hangar.deck });
  const zs = Math.max(...walks.map((w) => w.z1)); const lamp = D.lamp(X(0), Y(wy + 2.4), Z(zs + 1.5), 0xffc070, 14, 18);
  boltMesh.material.color.setScalar(0.35);
  return { bolts: boltMesh, lanterns, shide: { mesh: shMesh, rest: Float32Array.from(sp), k: Float32Array.from(sk), seed: hash(3) }, lamp };
}

/** The walkways (Petra's: a list once she lays them round the frame, the one before the chest until then). */
export const walksOf = () => HANGAR.walks ?? [HANGAR.walk];
/** Does a local point stand on the lift's deck (it rides up with the frame: no pillar there)? */
const onDeck = (x, z) => Math.abs(x - HANGAR.gantry.x) < DECK.w / 2 + 0.3 && Math.abs(z - HANGAR.gantry.z) < DECK.d / 2 + 0.3;
/** Does rect q reach past w's edge at `at` (the edge with outward normal nx, nz), within `e`? */
const reaches = (q, at, nx, nz, e = 0.05) => (nx ? (nx > 0 ? q.x0 <= at + e && q.x1 > at + e : q.x1 >= at - e && q.x0 < at - e) : (nz > 0 ? q.z0 <= at + e && q.z1 > at + e : q.z1 >= at - e && q.z0 < at - e));
/** Does rect q hold the strip just inside w's edge at `at` (so the two share that edge)? */
const holds = (q, at, nx, nz, e = 0.05) => (nx ? (nx > 0 ? q.x0 < at - e && q.x1 >= at - e : q.x1 > at + e && q.x0 <= at + e) : (nz > 0 ? q.z0 < at - e && q.z1 >= at - e : q.z1 > at + e && q.z0 <= at + e));
/** Does walkway q meet walkway w across w's edge (nx, nz), the two overlapping along it? */
function meets(w, q, nx, nz) {
  const at = nx > 0 ? w.x1 : nx < 0 ? w.x0 : nz > 0 ? w.z1 : w.z0;
  if (!reaches(q, at, nx, nz)) return false;
  return nx ? q.z1 > w.z0 && q.z0 < w.z1 : q.x1 > w.x0 && q.x0 < w.x1;
}
/** The walkways' outer edges as rail runs { ax, az, bx, bz, nx, nz (the outward normal) }: an edge is outer when it faces away from the
 *  frame (the side toward the chest or the back is where the cradle is reached, left open), less what another walkway (or the ramp's
 *  top) abuts, so a ring of rects reads as one walkway with no rail across where two meet. */
export function railsOf(walks, ramp = HANGAR.ramp) {
  const Gx = HANGAR.gantry.x, Gz = HANGAR.gantry.z, out = [];
  const others = [...walks]; if (ramp) others.push({ x0: ramp.x1 - 1, x1: ramp.x1, z0: ramp.z - ramp.w / 2, z1: ramp.z + ramp.w / 2, ramp: true });
  walks.forEach((w, i) => {
    const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2;
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const along = nx ? 'z' : 'x', lo = nx ? w.z0 : w.x0, hi = nx ? w.z1 : w.x1, at = nx > 0 ? w.x1 : nx < 0 ? w.x0 : nz > 0 ? w.z1 : w.z0;
      const mx = nx ? at : cx, mz = nz ? at : cz; if ((mx - Gx) * nx + (mz - Gz) * nz <= 0) continue; // (facing the frame: open)
      let segs = [[lo, hi]];
      for (const q of others) {
        if (q === w) continue;
        if (!reaches(q, at, nx, nz) && !(others.indexOf(q) < i && holds(q, at, nx, nz))) continue; // (covered outside, or the same edge an earlier walkway already railed)
        const a0 = along === 'z' ? q.z0 : q.x0, a1 = along === 'z' ? q.z1 : q.x1, next = [];
        for (const [s0, s1] of segs) { if (a1 <= s0 || a0 >= s1) { next.push([s0, s1]); continue; } if (a0 > s0) next.push([s0, a0]); if (a1 < s1) next.push([a1, s1]); }
        segs = next;
      }
      for (const [s0, s1] of segs) if (s1 - s0 > 0.4) out.push(nx ? { ax: at, az: s0, bx: at, bz: s1, nx, nz } : { ax: s0, az: at, bx: s1, bz: at, nx, nz });
    }
  });
  return out;
}

/** Box geometries (each with position, normal and uv) merged into one, position and normal only (a dressed material maps by position). */
function mergeAll(list) {
  let n = 0; for (const g of list) n += (g.index ? g.index.count : g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, q = g.attributes.normal.array;
    pos.set(p, o); nor.set(q, o); o += p.length; if (g !== g0) g.dispose();
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return out;
}
export { mergeAll };
