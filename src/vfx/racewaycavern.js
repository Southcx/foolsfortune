// ---------------------------------------------------------------------------------------
// THE CAVERN'S LOOK (docs/plans/SKIFF-RACING.md section 9; Dovina's handoff of 2026-10-14, item 7): the Raceway's roofed gorge
// (world/raceway/cavern.js, its branch in track.js BRANCH) dressed from Dovina's placeholders into one look: a slot canyon of the Dunes'
// stone under a roof of ruin slabs, Lachrymite growing out of its walls and glowing in the dark, and veins of it in the floor that push.
//   - THE STONE: her rock mesh re-cut, its material and its one draw kept. The roof slabs as the ruins' lintels (the kit's clay over a
//     dark umber underside, the pillars' gold band round each), the stalactites as banded dripstone with a bead of Lachrymite at the
//     tip, and a SKIN over the gorge's own cells (the walls and the floor, the terrain's very triangles lifted a few centimetres along
//     their normals, so it lies on the sand and never crosses it): strata up the walls, Shigaraki's natural ash glaze run down from the
//     lip in green-gold beads (vfx/roomglazes.js `ash`), bedrock underfoot. THE DARK is baked into it (the sixth generation's vertex
//     lighting): under a slab the stone is a third as bright as at the lip, under a skylight it is lit, and round each crystal cluster
//     it takes Lachryma's cold light.
//   - THE CRYSTALS: her emissive octahedra replaced by the Dunes' own spires (world/dunes/crystals.js: the six-sided prism and its
//     point, the frets' material, vfx/crystalfrets.js), in clusters growing out of the walls: each cluster's stave wears its five frets
//     in the notes' colours, glowing at night's strength always; one instanced draw. A lamp at every third cluster, a plain PointLight
//     lent by the light budget (render/lightbudget.js), never lit around it.
//   - THE VEINS (raceway.plates with `vein`): a vein of Lachrymite in the floor, not a sun plate: a spine of spires lying in the stone
//     pointing the race's way, barbs swept back from it like an arrow's fletching (in the crystals' draw), and a glow along the same
//     shape, leaded dark at its sides so it reads on noon sand, with pulses running forward (one draw for every vein). Ridden over: `raceway.vein` (vfx/racewaycaverneffects.js)
//     and the frets of the staves near it run foot to point. The sun plates' dress (vfx/racewaylooks.js) leaves
//     the veins out itself (no gold glyph, no gold flash).
//   - THE EDGE STRINGS of the branch (vfx/racewayedgestrings.js, `line: 'cavern'`, raceway.edgeLines(step, 'cavern')): run while
//     raceway.line is 'cavern' (raceway.sb its place along it), cooled to the night's white-blue under the roof; the main line's
//     run waits meanwhile (`EDGE_LINE.lit`).
//   - ROUND 4 (the park; Dovina's handoff of 2026-10-14): the deeper cavern re-fit by the same numbers (its slabs, dripstone and skin
//     read BRANCH and ROOF as they are now). THE CRYSTAL PILLARS (BRANCH.pillars; her colliders kept): each a column of Lachrymite, one of
//     the Dunes' spires grown to the roof (its point through the slabs, seen from outside), fretted up its height, on a ruin plinth with
//     a gold band, lesser spires at its foot, all in the crystals' one draw. THE POOL (its water dressed in liquid Lachryma by
//     vfx/racewaypark.js) ringed by clusters on both banks and one lamp over it: lit by its crystals.
//   - THE RAIN kept out: the roof is a cover for the weather's overhead map (vfx/overhead.js OVERHEAD_COVERS), so nothing falls under
//     a slab and the shafts of the skylights still take it.
// Every material is one already built: her rock material (the kit's vertex-coloured flat standard), the Dunes' crystal program (its
// instanced fret material, identical parameters), the edge strings' three, and the mapped basic of the halos for the veins' glow
// (vfx/racewaylooks.js `raceway-glow`'s program). No program added (measured headless: 188 programs with it and without).
//
// Prior art: Petra's Siq and Antelope Canyon (a slot canyon's banded walls and the shafts of sun down it), the cave courses of racers
// (Crash Team Racing's Dragon Mines, Mario Kart's Wario's Gold Mine and its crystals lighting the walls, F-Zero's tunnels), Vagrant
// Story's Snowfly Forest and Undercity (vertex-lit stone, the dark baked in, a light pool round each lamp), Shigaraki's ash glaze run
// down a kiln's shoulder (tama-dare), real dripstone (calcite banded as it grows, the drop at its tip), and SSX's arrows of light.
//
//   const C = new RacewayCavern(game, o?)   C.update(dt)  (dresses game.raceway once it is built)   C.dress(raceway)   C.veinHit(i)   C.undress()
//   o (the Workbench): parent, vfx, events, raceway (() => R), board (() => bool), looks (() => the sun plates' dress), lend (lamp => void)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crystalFretMaterial, CrystalFrets } from './crystalfrets.js';
import { RacewayEdgeStrings, EDGE_STRINGS, EDGE_LINE } from './racewayedgestrings.js';
import { OVERHEAD_COVERS } from './overhead.js';
import { ensureSmoothNormals } from '../render/outline.js';
import { ROOF } from '../world/raceway/cavern.js';
import { BRANCH, RW } from '../world/raceway/track.js';

/** The numbers. The skin: how far it lies off the sand (m along the normal), the least wall (m) a stretch of gorge has to be skinned, how
 *  far past the wall's foot it runs (m), the stone's colours (strata up the wall, the bedrock, the sunlit lip, the sand it gives way to,
 *  the ash glaze's thick and thin and its specks), the dark (the stone's brightness under a slab at the floor and at the lip). The roof:
 *  the slabs' layers (the underside's share of the thickness, the gold band's height) and colours; the dripstone's bands and tip. The
 *  crystals: a cluster every `every` m, both sides one time in `both`, its stave's height and width, the lesser spires; their colours;
 *  a lamp every `lampEvery` clusters (colour, candela, range, decay). The veins: spires down the spine, barbs a side, the glow's width,
 *  pulses a real second; the light the crystals throw on the stone (m, share). */
export const RACEWAY_CAVERN = {
  skin: { lift: 0.07, minWall: 3.5, past: 1.4, sub: 2 },
  stone: { strata: [0xa8643a, 0x7a4428, 0xc07a48, 0x6a3a24, 0xc98f58, 0x8c5030], band: 1.1, bed: 0x4e3426, lip: 0xc89a6a, sand: 0xd8a070,
    ash: { thick: 0x324a2a, thin: 0x6e5424, speck: 0x9c844c, runs: 0.55, k: 0.8 } },
  dark: { floor: 0.26, lip: 0.5 },
  roof: { under: 0.5, band: 0.22, top: 0xb98a5c, side: 0x9a6a48, low: 0x5a3a2c, belly: 0x2e2019, gold: 0xffd696, jitter: 0.14 },
  drip: { bands: [0xc4a888, 0xa88866, 0x8a6a58], tip: 0xbfefff },
  pillar: { plinth: 1.6, band: 0.25, gold: 0xffd696, stone: 0x6a3a24, top: 0xa8643a, foot: [3, 5] },
  pool: { banks: [0.15, 0.5, 0.85], lamp: 0.5, lift: 3 },
  crystal: { every: 7.5, both: 0.35, stave: [1.3, 2.6], width: [0.5, 0.75], lesser: [2, 4], base: 0xcdb8f2, lach: 0x7fdcff, emissive: 0x2c5a8a, glow: 0.85,
    lampEvery: 3, lamp: { colour: 0x7fdcff, k: 9, range: 12, decay: 1.5 }, bounce: { r: 4, k: 0.22 } },
  vein: { spine: 7, barbs: 3, glowW: 1.1, barbW: 0.6, pulse: 0.55, colour: 0x7fdcff, k: 1.25 },
};
const C = RACEWAY_CAVERN, UP = new THREE.Vector3(0, 1, 0);
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }; // (cavern.js's own: her stalactites placed again where she put them)
const hash2 = (a, b) => hash(a * 0.731 + b * 1.913 + 0.37);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (hex) => new THREE.Color(hex);
const _c = new THREE.Color(), _d = new THREE.Color(), _e = new THREE.Color(), _f = new THREE.Color(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();

/** A geometry with only position and a colour a vertex (non-indexed), coloured by `paint(x, y, z) -> Color` in its own frame. */
function painted(geo, paint) {
  const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, n = P.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) paint(P.getX(i), P.getY(i), P.getZ(i)).toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}

/** The spire of the Dunes' crystals (world/dunes/crystals.js: a six-sided prism 0.8 m with a 0.35 m point, 1 m tall, on its base). */
function spireGeometry() {
  const A = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 6, 1).translate(0, 0.4, 0).toNonIndexed(), B = new THREE.ConeGeometry(0.5, 0.35, 6).translate(0, 0.975, 0).toNonIndexed();
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) { const x = A.attributes[k].array, y = B.attributes[k].array, z = new Float32Array(x.length + y.length); z.set(x); z.set(y, x.length); out.setAttribute(k, new THREE.BufferAttribute(z, 3)); }
  out.computeVertexNormals();
  return out;
}

let PULSE = null; // (the veins' glow: a bright core leaded dark at its sides, a pulse along the core; one for the game)
function pulseTexture() {
  if (PULSE) return PULSE;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'), img = g.createImageData(64, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) {
    // (the core lit and pulsing, the rim a dark lead line: drawn over the sand, not added to it, so it reads on noon sand as in the dark)
    const u = (x + 0.5) / 64 - 0.5, v = (y + 0.5) / 128, core = Math.exp(-u * u * 70), rim = 0.85 * Math.exp(-u * u * 16), along = 0.45 + 0.55 * Math.pow(Math.max(0, Math.sin(v * Math.PI * 2)), 6);
    const l = Math.round(22 + 233 * Math.min(1, core * along * 1.3)), o = (y * 64 + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = l; img.data[o + 3] = Math.round(255 * Math.min(1, Math.max(core, rim)));
  }
  g.putImageData(img, 0, 0);
  PULSE = new THREE.CanvasTexture(c); PULSE.colorSpace = THREE.SRGBColorSpace; PULSE.wrapT = THREE.RepeatWrapping;
  return PULSE;
}

export class RacewayCavern {
  constructor(game, o = {}) {
    this.game = game; this.parent = o.parent || null;
    this.vfxOf = () => o.vfx || game.vfx;
    this.rOf = o.raceway || (() => game.raceway);
    this.boardOf = o.board || (() => !!game.player?.techs?.get?.('skiff')?.active);
    this.looksOf = o.looks || (() => game.racewayLooks);
    this.lend = o.lend || ((l) => game.lights?.adopt?.(l)); // (a lamp lent by the light budget: render/lightbudget.js)
    this.R = null; this.tried = null; this.t = 0; this.flash = 0; this.objects = []; this.lamps = []; this.ringT = [];
    const E = o.events || game.events;
    E?.on('skiff.plate', (e) => { if (this.veinIndex?.has(e?.plate)) this.veinHit(e.plate); });
  }

  // ---------------------------------------------------------------- dressed once the Raceway is built
  dress(R) {
    this.undress();
    const Bn = R.T?.branch, cave = R.cavern; if (!Bn || !cave) return this;
    this.R = R;
    this.slabs = this.slabList(R);
    this.clusters = this.clusterList(R);
    this.cutStone(R);
    this.growCrystals(R);
    this.dressVeins(R);
    if (R.edgeLines) this.strings = new RacewayEdgeStrings({ parent: this.parentOf(), zone: 'raceway', line: 'cavern', loop: false }).build(R.edgeLines(EDGE_STRINGS.step, 'cavern'), EDGE_STRINGS.step);
    this.cover = (x, z) => this.roofOver(x, z); OVERHEAD_COVERS.add(this.cover);
    return this;
  }
  parentOf() { return this.parent || this.game.scene; }
  add(o) { o.userData.zone = 'raceway'; this.parentOf().add(o); this.objects.push(o); return o; }

  /** The roof's slabs where cavern.js lays them (every ROOF.every m where the walls stand BRANCH.roof m; one in ROOF.skylight left out). */
  slabList(R) {
    const Bn = R.T.branch, out = new Map();
    let k = 0;
    for (let sb = 0; sb <= Bn.length; sb += ROOF.every, k++) {
      const f = Bn.frame(sb); if (f.wall < BRANCH.roof) continue;
      const span = 2 * (f.w + BRANCH.wall) + ROOF.over * 2, top = f.wall + 0.4;
      out.set(k, { k, sb, f, span, top, sky: k % ROOF.skylight === 3, y: RW.y + f.y + top });
    }
    return out;
  }
  /** How roofed the gorge is at sb: 1 under a slab, 0 under a skylight or the open sky (eased over a metre or two). */
  roofAt(sb) {
    const k = Math.round(sb / ROOF.every), S = this.slabs.get(k); if (!S) return 0;
    if (!S.sky) return 1;
    return smooth(ROOF.len * 0.25, ROOF.len * 0.6, Math.abs(sb - S.sb)); // (the shaft's light falls on the middle of the gap)
  }
  /** The overhead map's cover (vfx/overhead.js): the slab's top over a world spot under it, or null. */
  roofOver(x, z) {
    const R = this.R; if (!R) return null;
    const lx = x - RW.x, lz = z - RW.z, B = this.bbox; if (lx < B.x0 || lx > B.x1 || lz < B.z0 || lz > B.z1) return null;
    const nb = R.T.branch.nearest(lx, lz); if (!nb) return null;
    const S = this.slabs.get(Math.round(nb.sb / ROOF.every)); if (!S || S.sky || Math.abs(nb.lat) > S.span / 2) return null;
    return S.y;
  }

  /** The crystal clusters on the walls: where each stands, which side, and its spires. */
  clusterList(R) {
    const Bn = R.T.branch, X = C.crystal, out = [];
    let n = 0;
    for (let sb = 12; sb < Bn.length - 12; sb += X.every, n++) {
      const f = Bn.frame(sb); if (f.wall < C.skin.minWall) continue;
      const sides = hash(n * 3.1) < X.both ? [-1, 1] : [n % 2 ? 1 : -1];
      for (const side of sides) {
        const lat = side * (f.w + 0.9 + 0.6 * hash(n + side)), sb2 = sb + (hash(n * 5 + side) - 0.5) * 2;
        const F = Bn.frame(sb2), foot = R.local(F.x - F.fz * lat, F.z + F.fx * lat); foot.y -= 0.25;
        out.push({ sb: sb2, side, lat, foot, inward: new THREE.Vector3(F.fz * side, 0, -F.fx * side), fwd: new THREE.Vector3(F.fx, 0, F.fz), n: out.length, lamp: out.length % X.lampEvery === 1 });
      }
    }
    // the pool's banks: a cluster each side at each of C.pool.banks along it (no lamp: the pool's own hangs over its middle)
    for (const Pl of BRANCH.pools || []) for (const k of C.pool.banks) for (const side of [-1, 1]) {
      const sb = Pl.at + Pl.len * k, F = Bn.frame(sb), lat = side * (F.w + 0.7), foot = R.local(F.x - F.fz * lat, F.z + F.fx * lat); foot.y -= 0.25;
      out.push({ sb, side, lat, foot, inward: new THREE.Vector3(F.fz * side, 0, -F.fx * side), fwd: new THREE.Vector3(F.fx, 0, F.fz), n: out.length, lamp: false });
    }
    return out;
  }

  // ---------------------------------------------------------------- the stone: the roof, the dripstone and the skin, one draw
  cutStone(R) {
    const mesh = R.cavern.mesh; if (!mesh) return;
    const roof = [...this.roofParts(R), ...this.pillarParts(R)], skin = this.skinGeometry(R);
    const outlined = ensureSmoothNormals(mergeGeometries(roof));
    const geo = mergeGeometries([...roof.map((g) => g.clone()), ...(skin ? [skin] : [])]);
    this.old = { mesh, geo: mesh.geometry, outline: mesh.userData.outline?.geometry };
    mesh.geometry = geo; if (mesh.userData.outline) mesh.userData.outline.geometry = outlined; // (the outline round the slabs and dripstone only: the skin lies on the sand)
    for (const g of roof) g.dispose();
  }
  *roofParts(R) {
    const Bn = R.T.branch, F = C.roof, D = C.drip, T = ROOF.thick;
    const jit = (x, y, z) => { const h = hash2(Math.round(x * 10), Math.round(z * 10) + Math.round(y * 10) * 7); return (h - 0.5) * 2 * F.jitter; };
    for (const S of this.slabs.values()) {
      if (S.sky) continue;
      const f = S.f, yaw = Math.atan2(f.fx, f.fz), q = new THREE.Quaternion().setFromAxisAngle(UP, yaw), c = new THREE.Vector3(RW.x + f.x, RW.y + f.y, RW.z + f.z);
      const lo = T * F.under, mid = T - lo - F.band;
      const layer = (h, y0, paint, segs) => {
        const g = new THREE.BoxGeometry(S.span, h, ROOF.len, segs, 1, 2).translate(0, S.top - T + y0 + h / 2, 0), P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); P.setX(i, x + jit(x, y, z + S.k * 13)); P.setZ(i, z + jit(z, y, x + S.k * 7) * 0.6); }
        return painted(g, paint).applyQuaternion(q).translate(c.x, c.y, c.z);
      };
      const half = S.span / 2, inner = f.w + BRANCH.wall;
      // the underside, dark, its inner face streaked where the ash glaze ran off the lip
      yield layer(lo, 0, (x, y) => {
        const yl = y - (S.top - T), a = Math.abs(x), run = a < inner && hash2(S.k, Math.round(x)) > 0.6;
        _c.set(yl < 0.05 ? F.belly : F.low); if (run) _c.lerp(_d.set(C.stone.ash.thick), 0.55);
        return _c.multiplyScalar(0.85 + 0.15 * smooth(inner, half, a));
      }, 10);
      yield layer(F.band, lo, () => _c.set(F.gold), 10); // (the ruins' gold band, as on every pillar)
      yield layer(mid, lo + F.band, (x, y) => { const yl = y - (S.top - T); return _c.set(yl > T - 0.05 ? F.top : F.side).multiplyScalar(0.9 + 0.2 * hash2(S.k, Math.round(x * 0.5))); }, 10);
      // the dripstone: hers where she placed it (cavern.js), banded, a bead of Lachrymite at the tip; and two lesser beside each
      for (let j = 0; j < 2; j++) {
        const k = S.k, side = j ? 1 : -1, lat = side * f.w * (0.55 + 0.4 * hash(k * 2 + j)), len = Math.min(1.5 + 2.5 * hash(k * 7 + j), S.top - T - ROOF.CLEAR);
        if (len < 0.8) continue;
        const r = 0.5 + 0.4 * hash(k + j * 3), z = (hash(k * 3 + j) - 0.5) * ROOF.len * 0.7;
        for (const [dl, dz, s] of [[0, 0, 1], [side * 0.9, 0.8, 0.55], [-side * 0.7, -1.1, 0.4]]) {
          if (Math.abs(lat + dl) > f.w + BRANCH.wall) continue;
          const L = len * s, R0 = r * (0.6 + 0.4 * s), y0 = S.top - T;
          const parts = [];
          for (let b = 0; b < 3; b++) { // (three frusta, each narrower: the calcite's bands as it grew)
            const h = L / 3, r1 = R0 * (1 - b / 3), r2 = R0 * (1 - (b + 1) / 3) + 0.04;
            parts.push(painted(new THREE.CylinderGeometry(r1, r2, h, 6).translate(lat + dl, y0 - h * (b + 0.5), z + dz), () => _c.set(D.bands[b])));
          }
          parts.push(painted(new THREE.OctahedronGeometry(0.12 + 0.06 * s, 0).scale(1, 1.6, 1).translate(lat + dl, y0 - L - 0.05, z + dz), () => _c.set(D.tip)));
          for (const p of parts) yield p.applyQuaternion(q).translate(c.x, c.y, c.z);
        }
      }
    }
  }

  /** The crystal pillars where cavern.js stands them ([sb, lat, r]: its collider a cylinder 0.9 r round, from a metre under the floor
   *  to the wall's top): their foot, height and radius, for the stone and the spires. */
  pillarList(R) {
    const Bn = R.T.branch;
    return (BRANCH.pillars || []).map(([sb, lat, r], n) => { const f = Bn.frame(sb); return { n, sb, r, f, pos: new THREE.Vector3(RW.x + f.x - f.fz * lat, RW.y + f.y - 1, RW.z + f.z + f.fx * lat), h: f.wall + 1 }; });
  }
  /** Each pillar's ruin plinth: dark stone a little wider than the crystal, a gold band round its top, a pale course under it. */
  *pillarParts(R) {
    const X = C.pillar;
    for (const Pp of this.pillarList(R)) {
      const { pos: p, r } = Pp, h = X.plinth + 1;
      yield painted(new THREE.CylinderGeometry(r * 1.02, r * 1.12, h, 7).translate(p.x, p.y + h / 2, p.z), (x, y) => _c.set(y > p.y + h - 0.35 ? X.top : X.stone));
      yield painted(new THREE.CylinderGeometry(r * 1.05, r * 1.05, X.band, 7).translate(p.x, p.y + h - 0.35 - X.band / 2, p.z), () => _c.set(X.gold));
    }
  }

  /** The skin over the gorge's own cells: the terrain's triangles (render/terrain.js: a, c, b and b, c, d in each cell), each split in
   *  `sub` x `sub` along its plane, lifted along the field's normals; coloured by stone() and baked dark. */
  skinGeometry(R) {
    const Bn = R.T.branch, half = RW.half, step = RW.step, n = Math.round((2 * half) / step) + 1, K = C.skin;
    const G = R.grid, Hl = (i, j) => (G ? G.heights[i * n + j] : R.heightAt(RW.x - half + i * step, RW.z - half + j * step) - RW.y);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, wMax = 0;
    for (let i = 0; i < Bn.N; i++) { x0 = Math.min(x0, Bn.X[i]); x1 = Math.max(x1, Bn.X[i]); z0 = Math.min(z0, Bn.Z[i]); z1 = Math.max(z1, Bn.Z[i]); wMax = Math.max(wMax, Bn.W[i]); }
    const pad = wMax + BRANCH.wall + ROOF.over + 4;
    this.bbox = { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
    const i0 = Math.max(1, Math.floor((x0 - pad + half) / step)), i1 = Math.min(n - 2, Math.ceil((x1 + pad + half) / step));
    const j0 = Math.max(1, Math.floor((z0 - pad + half) / step)), j1 = Math.min(n - 2, Math.ceil((z1 + pad + half) / step));
    const W = i1 - i0 + 1, node = new Array(W * (j1 - j0 + 1)), at = (i, j) => node[(j - j0) * W + (i - i0)];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const lx = -half + i * step, lz = -half + j * step, nb = Bn.nearest(lx, lz);
      let v = null;
      if (nb) {
        const f = Bn.frame(nb.sb);
        if (Math.abs(nb.lat) <= f.w + BRANCH.wall + K.past) {
          const y = Hl(i, j), nx = Hl(i - 1, j) - Hl(i + 1, j), nz = Hl(i, j - 1) - Hl(i, j + 1), l = Math.hypot(nx, 2 * step, nz);
          v = { p: new THREE.Vector3(RW.x + lx + (nx / l) * K.lift, RW.y + y + ((2 * step) / l) * K.lift, RW.z + lz + (nz / l) * K.lift), y, sb: nb.sb, lat: nb.lat };
        }
      }
      node[(j - j0) * W + (i - i0)] = v;
    }
    const pos = [], cols = [], m = K.sub;
    const emit = (A, B, Cc) => { // (one of the terrain's triangles, split m x m on its plane: no T-junction, every edge split alike)
      const P = (u, v) => { const w = 1 - u - v; return { p: _s.set(0, 0, 0).addScaledVector(A.p, w).addScaledVector(B.p, u).addScaledVector(Cc.p, v).clone(), y: A.y * w + B.y * u + Cc.y * v, sb: A.sb * w + B.sb * u + Cc.sb * v, lat: A.lat * w + B.lat * u + Cc.lat * v }; };
      const vs = []; for (let a = 0; a <= m; a++) { vs[a] = []; for (let b = 0; b <= m - a; b++) vs[a][b] = P(a / m, b / m); }
      const put = (...t) => { for (const q of t) { q.p.toArray(pos, pos.length); this.stone(q).toArray(cols, cols.length); } };
      for (let a = 0; a < m; a++) for (let b = 0; b < m - a; b++) { put(vs[a][b], vs[a + 1][b], vs[a][b + 1]); if (b < m - a - 1) put(vs[a + 1][b], vs[a + 1][b + 1], vs[a][b + 1]); }
    };
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
      if (!a || !b || !c || !d) continue;
      const sb = (a.sb + d.sb) / 2; if (sb < BRANCH.hold || sb > Bn.length - BRANCH.hold || Bn.frame(sb).wall < K.minWall) continue;
      emit(a, c, b); emit(b, c, d);
    }
    if (!pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    return g;
  }
  /** The stone's colour at a point of the skin ({ y local, sb, lat }), the dark baked in. */
  stone(q) {
    const R = this.R, Bn = R.T.branch, f = Bn.frame(q.sb), S = C.stone, a = Math.abs(q.lat), side = q.lat < 0 ? -1 : 1;
    const hh = Math.min(1, Math.max(0, (q.y - f.y) / Math.max(1, f.wall))); // (the share of the way up the wall)
    const band = Math.floor((q.y + 0.7 * Math.sin(q.sb * 0.13 + side)) / S.band), strata = S.strata[((band % S.strata.length) + S.strata.length) % S.strata.length];
    const out = _c.set(S.bed).multiplyScalar(0.85 + 0.3 * hash2(Math.round(q.sb * 0.7), Math.round(q.lat)));
    out.lerp(_d.set(strata), smooth(f.w - 0.3, f.w + 0.8, a)); // (bedrock underfoot, strata up the wall)
    // the ash glaze run down from the lip, a run every metre and a half or so, its glass pooled thick at the top, thin below
    const run = Math.floor(q.sb / 1.4), runLen = 0.25 + 0.55 * hash2(run, side * 9);
    if (hh > 0.2 && hash2(run, side) < S.ash.runs && hh > 1 - runLen) {
      const k = smooth(1 - runLen, 1 - runLen + 0.15, hh) * S.ash.k;
      out.lerp(_e.set(S.ash.thin).lerp(_f.set(S.ash.thick), smooth(0.7, 0.95, hh)), k);
      if (hash2(Math.round(q.sb * 3), Math.round(q.y * 3)) > 0.86) out.lerp(_d.set(S.ash.speck), 0.6);
    }
    out.lerp(_d.set(S.lip), smooth(0.86, 1, hh) * 0.7); // (the lip, in the sun)
    // the dark: under a slab, darkest at the floor; a skylight's shaft lit
    const roofed = this.roofAt(q.sb), D = C.dark, lit = D.floor + (D.lip - D.floor) * hh;
    out.multiplyScalar(1 + (lit - 1) * roofed * (f.wall >= BRANCH.roof ? 1 : smooth(C.skin.minWall, BRANCH.roof, f.wall)));
    // Lachryma's light thrown on the stone round each cluster
    let glow = 0; const X = C.crystal.bounce;
    for (const cl of this.clusters) { if (cl.side !== side || Math.abs(cl.sb - q.sb) > X.r * 2) continue; const d2 = (cl.sb - q.sb) ** 2 + (Math.abs(cl.lat) - a) ** 2 + (q.y - (cl.foot.y - RW.y)) ** 2 * 0.5; glow = Math.max(glow, Math.exp(-d2 / (X.r * X.r))); }
    if (glow > 0.01) out.add(_d.set(C.crystal.lach).multiplyScalar(glow * X.k * 0.6));
    // where the gorge is shallow, the stone gives way to the sand (at the skin's ends and past the lip)
    const sandK = Math.max(1 - smooth(C.skin.minWall, C.skin.minWall + 2, f.wall), smooth(f.w + BRANCH.wall + 0.2, f.w + BRANCH.wall + C.skin.past, a));
    return out.lerp(_d.set(S.sand), sandK);
  }

  // ---------------------------------------------------------------- the crystals: the Dunes' spires, in clusters, one instanced draw
  growCrystals(R) {
    if (R.cavern.crystals) R.cavern.crystals.visible = false; // (her octahedra: the spires replace them)
    const X = C.crystal, spires = [];
    for (const cl of this.clusters) {
      const n = cl.n, h = X.stave[0] + (X.stave[1] - X.stave[0]) * hash(n * 1.7), w = X.width[0] + (X.width[1] - X.width[0]) * hash(n * 2.3);
      const dir = new THREE.Vector3(0, 1, 0).addScaledVector(cl.inward, 0.28).addScaledVector(cl.fwd, (hash(n * 4.1) - 0.5) * 0.3).normalize();
      spires.push({ pos: cl.foot.clone(), dir, h, w, stave: true, cl });
      const m = X.lesser[0] + Math.floor(hash(n * 6.7) * (X.lesser[1] - X.lesser[0] + 1));
      for (let j = 0; j < m; j++) {
        const along = (j % 2 ? 1 : -1) * (0.35 + 0.35 * hash(n * 9 + j)), p = cl.foot.clone().addScaledVector(cl.fwd, along).addScaledVector(cl.inward, -0.2 * hash(n + j * 11));
        const d = new THREE.Vector3(0, 1, 0).addScaledVector(cl.inward, 0.35 + 0.4 * hash(n * 3 + j)).addScaledVector(cl.fwd, along * 0.9).normalize();
        spires.push({ pos: p, dir: d, h: h * (0.3 + 0.3 * hash(n * 13 + j)), w: w * (0.45 + 0.2 * hash(n + j)), stave: false, cl });
      }
    }
    // the pillars: a spire grown to the roof (its prism to the wall's top, its point on through the slabs), fretted up its height,
    // radius 0.9 r (her collider's), and lesser spires round its foot
    for (const Pp of this.pillarList(R)) {
      const H = Pp.h / 0.8, base = Pp.pos.clone().setY(Pp.pos.y + 0.6);
      spires.push({ pos: base, dir: UP.clone(), h: H, w: Pp.r * 1.8, stave: true, pillar: true });
      const m = C.pillar.foot[0] + Math.floor(hash(Pp.n * 4.3) * (C.pillar.foot[1] - C.pillar.foot[0] + 1));
      for (let j = 0; j < m; j++) {
        const a = (j / m) * Math.PI * 2 + hash(Pp.n + j), out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), p = base.clone().addScaledVector(out, Pp.r * 0.95).setY(Pp.pos.y + C.pillar.plinth + 0.9);
        spires.push({ pos: p, dir: UP.clone().addScaledVector(out, 0.3 + 0.2 * hash(j * 7 + Pp.n)).normalize(), h: 0.8 + 0.9 * hash(Pp.n * 9 + j), w: 0.35 + 0.2 * hash(j + Pp.n * 3), stave: false });
      }
    }
    this.veinSpires = this.veinSpireList(R); spires.push(...this.veinSpires);
    if (!spires.length) return;
    const mat = (this.crystalMat = crystalFretMaterial({ color: 0xffffff, emissive: X.emissive, emissiveIntensity: X.glow, roughness: 0.22, metalness: 0.15, flatShading: true }, X.base)); // (the Dunes' crystals' very parameters: their program)
    const mesh = (this.crystals = new THREE.InstancedMesh(spireGeometry(), mat, spires.length));
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spires.length * 3), 3);
    const frets = (this.frets = new CrystalFrets(mesh)), base = col(X.base), lach = col(X.lach);
    spires.forEach((s, i) => {
      _q.setFromUnitVectors(UP, s.dir); mesh.setMatrixAt(i, _m.compose(s.pos, _q, _s.set(s.w, s.h, s.w)));
      mesh.setColorAt(i, s.vein ? _c.copy(lach).lerp(base, 0.25) : s.stave ? base : _c.copy(base).lerp(lach, 0.55));
      frets.set(i, s.pos.y, s.h * s.dir.y, s.stave ? 1 : 0); s.i = i;
    });
    mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false; mesh.name = 'raceway-cavern-spires'; // (no shadow: an instanced depth program the warm-up does not build, measured; hers cast none)
    this.add(mesh);
    this.staves = spires.filter((s) => s.stave);
    // the lamps: plain PointLights the budget lends (render/lightbudget.js), at every third cluster, out from the wall
    for (const cl of this.clusters) {
      if (!cl.lamp) continue;
      const L = X.lamp, l = new THREE.PointLight(L.colour, L.k, L.range, L.decay);
      l.position.copy(cl.foot).addScaledVector(cl.inward, 1.3).addScaledVector(UP, 1.4); l.userData.zone = 'raceway';
      this.parentOf().add(l); this.lend(l); this.lamps.push(l);
    }
    // the pool's lamp: Lachryma's light over the middle of the water, from the crystals on its banks
    for (const Pl of BRANCH.pools || []) {
      const F = R.T.branch.frame(Pl.at + Pl.len * C.pool.lamp), L = X.lamp, l = new THREE.PointLight(L.colour, L.k * 1.4, L.range * 1.6, L.decay);
      l.position.copy(R.local(F.x, F.z)).addScaledVector(UP, C.pool.lift); l.userData.zone = 'raceway';
      this.parentOf().add(l); this.lend(l); this.lamps.push(l);
    }
  }

  // ---------------------------------------------------------------- the veins: Lachrymite in the floor, an arrow the race's way
  veinFrame(R, P) {
    const Bn = R.T.branch, F = Bn.frame(P.s0 + (P.s1 - P.s0) / 2), c = R.local(F.x - F.fz * P.lat, F.z + F.fx * P.lat);
    return { c, fwd: new THREE.Vector3(F.fx, 0, F.fz), right: new THREE.Vector3(-F.fz, 0, F.fx), len: P.s1 - P.s0 };
  }
  veinSpireList(R) {
    const V = C.vein, out = [];
    this.veins = R.plates.filter((p) => p.vein && p.line === 'cavern');
    this.veinIndex = new Set(this.veins.map((p) => p.index));
    for (const P of this.veins) {
      const F = this.veinFrame(R, P), ground = (p) => { p.y = R.heightAt(p.x, p.z) - 0.12; return p; };
      for (let k = 0; k < V.spine; k++) { // (the spine: spires lying in the stone, pointing on, nosed up a little)
        const z = -F.len / 2 + (k + 0.5) * (F.len / V.spine), p = ground(F.c.clone().addScaledVector(F.fwd, z).addScaledVector(F.right, (hash(k + P.index * 5) - 0.5) * 0.3));
        out.push({ pos: p, dir: F.fwd.clone().addScaledVector(UP, 0.22).normalize(), h: 0.8 + 0.3 * hash(k * 3 + P.index), w: 0.26, vein: true });
      }
      for (let k = 0; k < V.barbs; k++) for (const sd of [-1, 1]) { // (the barbs: swept back from the spine, pointing on and out: the fletching)
        const z = -F.len / 2 + 1 + k * ((F.len - 2) / Math.max(1, V.barbs - 1)), p = ground(F.c.clone().addScaledVector(F.fwd, z).addScaledVector(F.right, sd * 0.25));
        out.push({ pos: p, dir: F.fwd.clone().multiplyScalar(0.82).addScaledVector(F.right, sd * 0.57).addScaledVector(UP, 0.18).normalize(), h: 0.7, w: 0.2, vein: true });
      }
    }
    return out;
  }
  dressVeins(R) {
    if (!this.veins.length) return;
    const V = C.vein, pos = [], uv = [];
    const strip = (F, a, b, w) => { // (a strip from a to b (local metres: [lat, along]) w wide, on the stone; u across, v along in tiles)
      const A = F.c.clone().addScaledVector(F.right, a[0]).addScaledVector(F.fwd, a[1]), B = F.c.clone().addScaledVector(F.right, b[0]).addScaledVector(F.fwd, b[1]);
      const d = B.clone().sub(A), L = d.length(), s = new THREE.Vector3(d.z, 0, -d.x).normalize().multiplyScalar(w / 2);
      const P = [A.clone().add(s), A.clone().sub(s), B.clone().add(s), B.clone().sub(s)].map((p) => { p.y = R.heightAt(p.x, p.z) + 0.05; return p; });
      const v0 = a[1] / 1.75, v1 = v0 + L / 1.75, U = [[0, v0], [1, v0], [0, v1], [1, v1]];
      for (const k of [0, 1, 2, 1, 3, 2]) { P[k].toArray(pos, pos.length); uv.push(...U[k]); }
    };
    for (const P of this.veins) {
      const F = this.veinFrame(R, P), h = F.len / 2;
      strip(F, [0, -h - 0.6], [0, h + 0.9], V.glowW);
      for (let k = 0; k < V.barbs; k++) { const z = -h + 1 + k * ((F.len - 2) / Math.max(1, V.barbs - 1)); for (const sd of [-1, 1]) strip(F, [sd * 0.2, z], [sd * 1.3, z + 1.6], V.barbW); }
      P.mesh.visible = false; P.mesh.userData.dressed = true; // (her slab)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    // (winding: up; the mapped basic of the halos, raceway-glow's program, with ordinary blending: the blend is state, not a program)
    const mat = (this.veinMat = new THREE.MeshBasicMaterial({ name: 'raceway-vein-glow', map: pulseTexture(), color: V.colour, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'raceway-cavern-veins'; mesh.renderOrder = 3; mesh.frustumCulled = false; this.add(mesh);
    for (const P of this.veins) { const F = this.veinFrame(R, P), l = new THREE.PointLight(V.colour, C.crystal.lamp.k, 9, C.crystal.lamp.decay); l.position.copy(F.c).addScaledVector(UP, 0.8); l.userData.zone = 'raceway'; this.parentOf().add(l); this.lend(l); this.lamps.push(l); }
  }
  /** A vein ridden (skiff.plate on it): Lachryma's flash and ring along it, the glow flaring, the staves near it ringing up their frets. */
  veinHit(i) {
    const P = this.veins?.find((p) => p.index === i); if (!P || !this.R) return;
    const F = this.veinFrame(this.R, P);
    this.vfxOf()?.play('raceway.vein', { pos: F.c, dir: F.fwd.clone().addScaledVector(UP, 0.3).normalize(), normal: UP });
    this.flash = 1;
    for (const s of this.staves || []) { const d = s.pos.distanceTo(F.c); if (d < 22) this.ringT.push({ i: s.i, at: this.t + d / 30 }); } // (the ring travels: 30 m a real second)
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const R = this.rOf();
    if (R?.cavern && this.R !== R && this.tried !== R) { this.tried = R; this.dress(R); }
    if (!this.R) return;
    if (this.R.active === false) return;
    this.t += dt;
    const on = this.R.line === 'cavern';
    EDGE_LINE.lit = this.R.line || 'main';
    this.strings?.update(dt, { s: on && this.boardOf() ? this.R.sb : null, d: this.R.d ?? 0, night: 1 }); // (cooled under the roof)
    if (this.frets) {
      this.frets.update(dt, 0); // (at night's glow always: it is dark in here)
      this.crystalMat.emissiveIntensity = C.crystal.glow * (0.9 + 0.1 * Math.sin(this.t * 0.6)); // (a slow breath, never a flicker)
      if (this.ringT.length) { this.ringT = this.ringT.filter((r) => (this.t >= r.at ? (this.frets.run(r.i), false) : true)); }
    }
    if (this.veinMat) {
      this.flash = Math.max(0, this.flash - dt / 0.6);
      const map = this.veinMat.map; map.offset.y = -((this.t * C.vein.pulse) % 1); // (the pulses run the race's way)
      this.veinMat.color.set(C.vein.colour).multiplyScalar(C.vein.k * (0.85 + 0.15 * Math.sin(this.t * 1.3)) + 1.4 * this.flash);
    }
    for (const [k, l] of this.lamps.entries()) l.intensity = C.crystal.lamp.k * (0.9 + 0.1 * Math.sin(this.t * 0.5 + k * 1.7)) * (1 + this.flash * 0.5);
  }

  undress() {
    if (this.cover) OVERHEAD_COVERS.delete(this.cover); this.cover = null;
    this.strings?.dispose(); this.strings = null; EDGE_LINE.lit = 'main';
    for (const o of this.objects) { o.parent?.remove(o); o.geometry?.dispose(); }
    for (const l of this.lamps) l.parent?.remove(l);
    this.crystals?.dispose(); this.crystalMat?.dispose(); this.veinMat?.dispose();
    if (this.old) { const { mesh, geo, outline } = this.old; mesh.geometry.dispose(); mesh.geometry = geo; if (outline && mesh.userData.outline) { mesh.userData.outline.geometry.dispose(); mesh.userData.outline.geometry = outline; } }
    if (this.R?.cavern?.crystals) this.R.cavern.crystals.visible = true;
    for (const P of this.veins || []) P.mesh.visible = true;
    this.objects = []; this.lamps = []; this.old = null; this.crystals = this.crystalMat = this.veinMat = this.frets = null; this.veins = []; this.veinIndex = new Set(); this.R = null;
  }
}
