// ---------------------------------------------------------------------------------------
// THE RACEWAY PARK'S DRESS (docs/plans/SKIFF-RACING.md section 10; Dovina's handoff of 2026-10-14, "the Raceway as a park of tracks"):
// the park's new placeholders (world/raceway/features.js, railsrings.js) dressed into the Raceway's one look, glazed stone and gold.
//   - THE WATER (her `waterMesh`): the Mirror lake and the fords in the game's own water (vfx/water.js, the Weir's pond's very material:
//     the painted sky, the caustics on the bed, foam at the shore), and the cavern's pool in liquid Lachryma (the Weir's Well's: ink, the
//     thin film in the marbling), lit by the crystals round it (vfx/racewaycavern.js grows them). Each sheet an ellipse laid in rings,
//     every vertex carrying the depth of the bed under it (the shader's `aDepth`), so the shallows clear to sand at the shore.
//   - THE BRIDGE DECKS (her `deckMesh`): one stone section swept along each deck (no overlapping boxes, so no coplanar faces to crawl):
//     paving slabs on top, a parapet each side with a pale coping, the fascia in the rails' amber ame glaze over an iron-dark drip line, a
//     gold band along it; the piers where she stands them, clay on a plinth with a gold band and capital.
//   - THE COASTER RAIL (its lintels in her `railMesh`) and THE HELIX TOWER: the rail one swept lintel following the rail's own up (banked,
//     upside down through the loop), glazed as Ilkhanid lajvardina (a lapis-blue glaze with gold over it), the keel's path worn pale on
//     top, a gold collar at every join; its columns where it stands upright; the tower a ruin of stacked clay drums with gold bands and a
//     dark cap, the helix carried on stone spokes from it. Her coaster lintels and columns are cut out of the rail mesh (the rest of it
//     untouched), so nothing stands through the loop.
//   - THE ANTLION'S MAW (her `pits[i].group`): the throat a dark well in a ring of broken stone, the two jaws an antlion larva's
//     mandibles (sickles curving in, teeth along the inner edge) in an iron-dark tenmoku glaze, amber at the edge, ivory at the tip, gold
//     at the root; her snap (stepPits turns the same two objects) closes them. On `raceway.pit`: a dust burst from the throat and the
//     sand sliding down the cone after it (vfx/racewayparkeffects.js). Her collision and pull are as she left them.
// Every material is one already built: her vertex-coloured flat standard (the kit's, the decks', the rails'), and the water's (the
// pond's and the Well's own instances: one program, the kind a uniform). No program added. Draw calls: the stone one mesh and its
// outline in place of the decks' (0 net); the water two in place of her one (+1); the maws in place (0).
//
// Prior art: Ilkhanid lajvardina ware (Kashan, 13th-14th c.: a cobalt-lapis glaze with gold leaf fired over it) for the coaster; the
// Pont du Gard and Roman bridge decks (a parapet, a coping, piers on plinths); a roller coaster's helix carried on spokes from its
// central tower; the antlion larva (Myrmeleontidae: sickle mandibles, toothed inside) and Star Wars' Sarlacc; the house's own pond and
// Well (vfx/water.js) and the rails' glaze (vfx/racewaylooks.js), whose numbers these follow.
//
//   game.racewayPark = new RacewayPark(game, o?)   (main.js; dresses game.raceway on `raceway.enter`, or at once if it is built)
//   .dress(raceway)   .snap(pitId)   .undress()   o (the Workbench): parent, vfx, events
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeWaterMaterial } from './water.js';
import { addOutline } from '../render/outline.js';
import { DECK } from '../world/raceway/features.js';
import { coasterPath } from '../world/raceway/coasterrail.js';
import { RW } from '../world/raceway/track.js';

/** The numbers. The water: rings and segments every `cell` m. The deck: its parapet (width, height), the gold band's place on the
 *  fascia (m under the deck's top), the slabs' length; its colours. The coaster rail's section (half-width, half-height of the body, the
 *  top), its columns (m apart; the least up), its collars (m apart); the lajvardina's colours. The tower's drums (m tall). The maw. */
export const RACEWAY_PARK = {
  water: { cell: 1.5, edge: 0.9 },
  deck: { parapet: [0.6, 0.9], band: [0.35, 0.15], slab: 3,
    colour: { pave: [0xd8b48a, 0xc9a47a], coping: 0xf0d6b0, inner: 0xc98a52, body: 0xb8692e, drip: 0x4a2414, gold: 0xffd696, clay: 0xd9906a, plinth: 0x8a4a3a } },
  coaster: { hw: 0.3, hh: 0.16, top: 0.17, post: 8, upright: 0.85, collar: 6,
    colour: { body: 0x2c3f8f, edge: 0x4a63b8, drip: 0x16204a, worn: 0xfff0c8, gold: 0xffd696, clay: 0xd9906a } },
  tower: { drum: 3, strata: [0xd9906a, 0xc07a48, 0xa8643a], gold: 0xffd696, cap: 0x8a4a3a, lapis: 0x2c3f8f, spoke: 5 },
  maw: { body: 0x3a2214, edge: 0xb8692e, tip: 0xf0d6b0, gold: 0xffd696, throat: 0x0c0806, stone: [0xc98a52, 0xa8643a, 0x8a4a3a], slides: 8 },
};
const P = RACEWAY_PARK, UP = new THREE.Vector3(0, 1, 0);
const _c = new THREE.Color(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

/** A builder of non-indexed triangles with a colour a vertex. */
class Tris {
  constructor() { this.pos = []; this.col = []; }
  tri(a, b, c, ca, cb = ca, cc = ca) { a.toArray(this.pos, this.pos.length); b.toArray(this.pos, this.pos.length); c.toArray(this.pos, this.pos.length); for (const k of [ca, cb, cc]) _c.set(k).toArray(this.col, this.col.length); }
  quad(a, b, c, d, ca, cb = ca, cc = ca, cd = ca) { this.tri(a, b, c, ca, cb, cc); this.tri(a, c, d, ca, cc, cd); } // (a b c d counter-clockwise seen from outside)
  /** A geometry shaped and painted elsewhere (BoxGeometry and the like), its colour `col`. */
  add(geo, col) { const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position; for (let i = 0; i < p.count; i++) { this.pos.push(p.getX(i), p.getY(i), p.getZ(i)); _c.set(col).toArray(this.col, this.col.length); } }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.computeVertexNormals(); return g; }
}

/** A closed section swept along a path. `frames[i]` = { p, X, Y } (X = Y x T: the section's (x, y) counter-clockwise faces out); the
 *  section [[x(i), y, colour(i, edge)]] (x may depend on the frame: a deck's width). Both ends capped by `caps(frame, sign)`. */
function sweep(out, frames, section, caps) {
  const at = (F, x, y) => F.p.clone().addScaledVector(F.X, x).addScaledVector(F.Y, y);
  for (let i = 0; i < frames.length - 1; i++) {
    const A = frames[i], B = frames[i + 1];
    for (let e = 0; e < section.length; e++) {
      const s0 = section[e], s1 = section[(e + 1) % section.length], x0a = typeof s0[0] === 'function' ? s0[0](A) : s0[0], x1a = typeof s1[0] === 'function' ? s1[0](A) : s1[0];
      const x0b = typeof s0[0] === 'function' ? s0[0](B) : s0[0], x1b = typeof s1[0] === 'function' ? s1[0](B) : s1[0], c = typeof s0[2] === 'function' ? s0[2](i) : s0[2];
      out.quad(at(A, x0a, s0[1]), at(A, x1a, s1[1]), at(B, x1b, s1[1]), at(B, x0b, s0[1]), c);
    }
  }
  if (caps) { caps(frames[0], -1); caps(frames[frames.length - 1], 1); }
}

export class RacewayPark {
  constructor(game, o = {}) {
    this.game = game; this.parent = o.parent || null; this.vfxOf = () => o.vfx || game.vfx;
    this.R = null; this.objects = []; this.hidden = []; this.swaps = [];
    const E = o.events || game.events;
    E?.on('raceway.enter', () => { const R = game.raceway; if (R?.built && this.R !== R) this.dress(R); });
    E?.on('raceway.pit', (e) => this.snap(e?.pit));
    if (game.raceway?.built) this.dress(game.raceway);
  }
  parentOf() { return this.parent || this.game.scene; }
  add(o) { o.userData.zone = 'raceway'; this.parentOf().add(o); this.objects.push(o); return o; }
  hide(m) { if (m && m.visible) { m.visible = false; this.hidden.push(m); } }

  dress(R) {
    this.undress(); this.R = R;
    this.dressWater(R);
    const stone = new Tris();
    this.dressDecks(R, stone);
    this.dressCoaster(R, stone);
    if (stone.pos.length) {
      const mesh = new THREE.Mesh(stone.geometry(), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, flatShading: true })); // (her decks' parameters: their program)
      mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'raceway-park-stone'; this.add(mesh); addOutline(mesh);
    }
    this.dressMaws(R);
    return this;
  }

  // ---------------------------------------------------------------- the water: the pond's and the Well's own materials
  dressWater(R) {
    const W = this.game.water, lakes = R.P?.lakes || []; if (!W || !lakes.length) return;
    const parts = { water: [], lachryma: [] };
    for (const L of lakes) parts[/\.pool$/.test(L.id) ? 'lachryma' : 'water'].push(this.lakeGeometry(R, L));
    for (const [kind, geos] of Object.entries(parts)) {
      if (!geos.length) continue;
      const mat = (W.mats[kind] ||= makeWaterMaterial(W.sky, kind)); // (the Weir's own instance: Water.update keeps its clock)
      const m = new THREE.Mesh(mergeGeometries(geos), mat); m.renderOrder = 2; m.name = `raceway-${kind}`; m.frustumCulled = false; this.add(m);
      for (const g of geos) g.dispose();
    }
    this.hide(R.waterMesh);
  }
  /** An ellipse of water laid in rings (world coordinates), each vertex with the bed's depth under it, 0 at the shore. */
  lakeGeometry(R, L) {
    const cell = P.water.cell, big = Math.max(L.rx, L.rz), small = Math.min(L.rx, L.rz), rings = Math.max(4, Math.ceil(big / cell)), segs = Math.max(24, Math.ceil((Math.PI * 2 * big) / cell));
    const c = Math.cos(L.rot || 0), s = Math.sin(L.rot || 0), y = RW.y + L.y, pos = [], depth = [], idx = [];
    const vert = (rho, th) => {
      const u = L.rx * rho * Math.cos(th), v = L.rz * rho * Math.sin(th), lx = L.x + c * u + s * v, lz = L.z - s * u + c * v; // (park.js lakeE, inverted)
      pos.push(RW.x + lx, y, RW.z + lz); depth.push(Math.max(0, Math.min(L.y - R.P.heightAt(lx, lz), (1 - rho) * small * P.water.edge)));
    };
    vert(0, 0);
    for (let r = 1; r <= rings; r++) for (let k = 0; k < segs; k++) vert(r / rings, (k / segs) * Math.PI * 2);
    const at = (r, k) => (r === 0 ? 0 : 1 + (r - 1) * segs + (k % segs));
    for (let k = 0; k < segs; k++) idx.push(0, at(1, k + 1), at(1, k)); // (wound to face up)
    for (let r = 1; r < rings; r++) for (let k = 0; k < segs; k++) idx.push(at(r, k), at(r, k + 1), at(r + 1, k + 1), at(r, k), at(r + 1, k + 1), at(r + 1, k));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDepth', new THREE.Float32BufferAttribute(depth, 1)); g.setIndex(idx);
    return g;
  }

  // ---------------------------------------------------------------- the bridge decks
  dressDecks(R, out) {
    if (!R.decks?.length) return;
    const D = P.deck, Cc = D.colour, th = DECK.thick, [pw, ph] = D.parapet, [b0, b1] = D.band;
    for (const deck of R.decks) {
      const frames = deck.pts.map((p, i, a) => {
        const q = a[Math.min(a.length - 1, i + 1)], o = a[Math.max(0, i - 1)], T = _a.set(q.x - o.x, 0, q.z - o.z).normalize();
        return { p: new THREE.Vector3(p.x, p.y, p.z), Y: UP.clone(), X: new THREE.Vector3().crossVectors(UP, T).normalize(), w: p.w };
      });
      const W = (k, o = 0) => (F) => k * F.w + o, pave = (i) => Cc.pave[Math.floor((i * DECK.step) / D.slab) % 2];
      // the section, counter-clockwise: the drip line under, the fascia, its gold band, the parapet out and its coping, in, the paving,
      // and the same on the other side
      const sec = [
        [W(-1), -th, Cc.drip], [W(1), -th, Cc.body], [W(1), -b0, Cc.gold], [W(1), -b1, Cc.body], [W(1), ph, Cc.coping], [W(1, -pw), ph, Cc.inner], [W(1, -pw), 0, pave],
        [W(-1, pw), 0, Cc.inner], [W(-1, pw), ph, Cc.coping], [W(-1), ph, Cc.body], [W(-1), -b1, Cc.gold], [W(-1), -b0, Cc.body],
      ];
      sweep(out, frames, sec, (F, sg) => { // (the ends: the body and the two parapets, wound to face out)
        const at = (x, y) => F.p.clone().addScaledVector(F.X, x).addScaledVector(F.Y, y), w = F.w;
        const rect = (x0, x1, y0, y1, c) => (sg > 0 ? out.quad(at(x0, y0), at(x1, y0), at(x1, y1), at(x0, y1), c) : out.quad(at(x0, y0), at(x0, y1), at(x1, y1), at(x1, y0), c));
        rect(-w, w, -th, 0, Cc.body); rect(w - pw, w, 0, ph, Cc.body); rect(-w, -w + pw, 0, ph, Cc.body);
      });
      // the piers where she stands them (features.js buildDecks: nothing passing under, the deck over 1.5 m up)
      for (let i = 0; i < deck.pts.length; i += Math.round(DECK.pier / DECK.step)) {
        const p = deck.pts[i], foot = R.heightAt(p.x, p.z);
        const under = R.tracks.some((T2) => { const n = T2.nearest(p.x - RW.x, p.z - RW.z, null, 2); return n && n.d < T2.frame(n.s).w + 4 && Math.abs(T2.frame(n.s).y - (p.y - RW.y)) > 3; });
        if (under || p.y - foot < 1.5) continue;
        const y0 = foot - 1, y1 = p.y - th, h = y1 - y0;
        out.add(new THREE.BoxGeometry(2.4, h, 2.4).translate(p.x, y0 + h / 2, p.z), Cc.clay);
        out.add(new THREE.BoxGeometry(2.9, 1.8, 2.9).translate(p.x, y0 + 0.9, p.z), Cc.plinth);
        out.add(new THREE.BoxGeometry(2.55, 0.25, 2.55).translate(p.x, y1 - 0.75, p.z), Cc.gold);
        out.add(new THREE.BoxGeometry(2.9, 0.45, 2.9).translate(p.x, y1 - 0.23, p.z), Cc.clay);
      }
    }
    this.hide(R.deckMesh);
  }

  // ---------------------------------------------------------------- the coaster rail and its helix tower
  dressCoaster(R, out) {
    const rails = (R.rails || []).filter((r) => r.coaster && r.ups); if (!rails.length) return;
    const K = P.coaster, Cc = K.colour, towers = this.towersOf(R);
    for (const rail of rails) {
      const { pts, ups, cum } = rail, n = pts.length;
      const frames = pts.map((p, i) => {
        const T = _a.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize(), Y = ups[i].clone().addScaledVector(T, -ups[i].dot(T)).normalize();
        return { p, Y, X: new THREE.Vector3().crossVectors(Y, T).normalize(), T: T.clone() };
      });
      const { hw, hh, top } = K;
      const sec = [ // (counter-clockwise: the drip line under, the sides with their gold leaf, the glaze thinning to the edge, the keel's worn path)
        [-hw, -hh, Cc.drip], [hw, -hh, Cc.body], [hw, -0.02, Cc.gold], [hw, 0.06, Cc.body], [hw - 0.02, hh, Cc.edge], [0.13, top, Cc.worn],
        [-0.13, top, Cc.edge], [-hw + 0.02, hh, Cc.body], [-hw, 0.06, Cc.gold], [-hw, -0.02, Cc.body],
      ];
      sweep(out, frames, sec, (F, sg) => {
        const at = (x, y) => F.p.clone().addScaledVector(F.X, x).addScaledVector(F.Y, y), ring = sec.map(([x, y]) => at(x, y)), c0 = at(0, 0);
        for (let e = 0; e < ring.length; e++) { const a = ring[e], b = ring[(e + 1) % ring.length]; if (sg > 0) out.tri(c0, a, b, Cc.body); else out.tri(c0, b, a, Cc.body); }
      });
      // a gold collar at each join of the lintels; the columns where it stands upright and no tower carries it
      const near = (p) => towers.some((Tw) => Math.hypot(p.x - Tw.x, p.z - Tw.z) < Tw.hr * 1.3);
      for (let d = K.collar, i = 0; d < cum[n - 1]; d += K.collar) {
        while (i < n - 2 && cum[i + 1] < d) i++;
        const F = frames[i], m = new THREE.Matrix4().makeBasis(F.X, F.Y, F.T).setPosition(F.p);
        out.add(new THREE.BoxGeometry(hw * 2 + 0.1, hh * 2 + 0.06, 0.22).translate(0, -0.01, 0).applyMatrix4(m), Cc.gold);
      }
      for (let d = 0, i = 0; d <= cum[n - 1]; d += K.post) {
        while (i < n - 2 && cum[i + 1] < d) i++;
        if (ups[i].y < K.upright) continue;
        const p = pts[i].clone().lerp(pts[i + 1], (d - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i])); if (near(p)) continue;
        const foot = R.heightAt(p.x, p.z) - 0.4, h = p.y - hh - foot; if (h <= 0.2) continue;
        out.add(new THREE.CylinderGeometry(0.2, 0.28, h, 6).translate(p.x, foot + h / 2, p.z), Cc.clay);
        out.add(new THREE.BoxGeometry(0.62, 0.16, 0.62).translate(p.x, p.y - hh - 0.08, p.z), Cc.gold);
      }
      // the helix's spokes: stone beams from the tower to the rail's underside
      for (const Tw of towers) for (let i = 0; i < n; i += P.tower.spoke) {
        const p = pts[i], d = Math.hypot(p.x - Tw.x, p.z - Tw.z); if (d < Tw.hr * 0.75 || d > Tw.hr * 1.25 || p.y > Tw.top + 2) continue;
        const dir = _b.set(p.x - Tw.x, 0, p.z - Tw.z).normalize(), len = d - Tw.r * 0.95, mid = new THREE.Vector3(Tw.x, p.y - hh - 0.2, Tw.z).addScaledVector(dir, Tw.r * 0.95 + len / 2);
        const yaw = Math.atan2(dir.x, dir.z);
        out.add(new THREE.BoxGeometry(0.45, 0.4, len).rotateY(yaw).translate(mid.x, mid.y, mid.z), Cc.clay);
        out.add(new THREE.BoxGeometry(0.5, 0.1, len).rotateY(yaw).translate(mid.x, mid.y + 0.24, mid.z), Cc.gold);
      }
    }
    // the towers: clay drums of the ruins, a gold band between, a lapis course and a dark cap at the crown
    const Tc = P.tower;
    for (const Tw of towers) {
      let y = R.heightAt(Tw.x, Tw.z) - 1, k = 0;
      while (y < Tw.top - 0.01) {
        const dh = Math.min(Tc.drum, Tw.top - y), r = Tw.r * (0.97 + 0.06 * hash(k * 3.7 + Tw.x));
        out.add(new THREE.CylinderGeometry(r, r * 1.02, dh, 10).rotateY(k * 0.31).translate(Tw.x, y + dh / 2, Tw.z), Tc.strata[k % Tc.strata.length]);
        if (k % 2) out.add(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.22, 10).translate(Tw.x, y + 0.11, Tw.z), Tc.gold);
        y += dh; k++;
      }
      out.add(new THREE.CylinderGeometry(Tw.r * 1.12, Tw.r * 1.06, 0.9, 10).translate(Tw.x, Tw.top + 0.45, Tw.z), Tc.lapis);
      out.add(new THREE.CylinderGeometry(Tw.r * 1.14, Tw.r * 1.14, 0.2, 10).translate(Tw.x, Tw.top + 0.98, Tw.z), Tc.gold);
      out.add(new THREE.ConeGeometry(Tw.r * 1.05, Tw.r * 0.9, 10).translate(Tw.x, Tw.top + 1.08 + Tw.r * 0.45, Tw.z), Tc.cap);
    }
    this.cutCoaster(R, rails, towers);
  }
  /** The helix towers in the world (coasterrail.js lays them: centre, top, radius; `hr` the helix's radius round them). */
  towersOf(R) {
    const out = [];
    for (const T of R.tracks || []) for (const def of T.features?.coaster || []) {
      const hel = def.path.filter((p) => p && p.helix).map((p) => p.helix.r);
      coasterPath(def).towers.forEach((Tw, i) => out.push({ x: RW.x + Tw.x, z: RW.z + Tw.z, top: RW.y + Tw.top, r: Tw.r, hr: hel[i] ?? Tw.r / 0.45 }));
    }
    return out;
  }
  /** Her coaster lintels, their columns and the tower's placeholder cut out of the rail mesh; every other rail left as it is. */
  cutCoaster(R, rails, towers) {
    const mesh = R.railMesh; if (!mesh) return;
    const cell = 2, grid = new Map(), key = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
    for (const r of rails) for (const p of r.pts) { const k = key(p.x, p.z); (grid.get(k) || grid.set(k, []).get(k)).push(p); }
    const test = (x, y, z) => { // (-> 0: not the coaster's; 1: under or on it; 2: on its lintel)
      for (const Tw of towers) if (Math.hypot(x - Tw.x, z - Tw.z) < Tw.r + 0.3 && y < Tw.top + 0.5) return 2;
      let best = 0, cx = Math.floor(x / cell), cz = Math.floor(z / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of grid.get(`${cx + i},${cz + j}`) || []) {
        if (Math.hypot(x - p.x, z - p.z) > 0.95 || y > p.y + 0.6) continue;
        best = Math.max(best, Math.abs(y - p.y) < 0.8 ? 2 : 1);
      }
      return best;
    };
    const cut = (geo) => {
      const pos = geo.attributes.position, idx = geo.index, nT = (idx ? idx.count : pos.count) / 3, keep = [];
      const v = (t, c) => (idx ? idx.getX(t * 3 + c) : t * 3 + c);
      for (let t = 0; t < nT; t++) {
        const a = v(t, 0), b = v(t, 1), c = v(t, 2), ta = test(pos.getX(a), pos.getY(a), pos.getZ(a)), tb = test(pos.getX(b), pos.getY(b), pos.getZ(b)), tc = test(pos.getX(c), pos.getY(c), pos.getZ(c));
        const ext = Math.max(Math.abs(pos.getX(a) - pos.getX(b)), Math.abs(pos.getX(a) - pos.getX(c)), Math.abs(pos.getZ(a) - pos.getZ(b)), Math.abs(pos.getZ(a) - pos.getZ(c)));
        const gone = ta && tb && tc && ((ta === 2 && tb === 2 && tc === 2) || ext < 0.8);
        if (!gone) keep.push(a, b, c);
      }
      if (keep.length === nT * 3) return null;
      const g = new THREE.BufferGeometry();
      for (const [name, A] of Object.entries(geo.attributes)) { const s = A.itemSize, arr = new A.array.constructor(keep.length * s); keep.forEach((k, i) => { for (let j = 0; j < s; j++) arr[i * s + j] = A.array[k * s + j]; }); g.setAttribute(name, new THREE.BufferAttribute(arr, s, A.normalized)); }
      return g;
    };
    const old = mesh.geometry, ol = mesh.userData.outline, oldOl = ol?.geometry, geo = cut(old); if (!geo) return;
    mesh.geometry = geo;
    if (ol) ol.geometry = oldOl === old ? geo : cut(oldOl) || oldOl;
    this.swaps.push({ mesh, old, oldOl });
  }

  // ---------------------------------------------------------------- the antlion's maw
  dressMaws(R) {
    const mat = (this.vc ||= new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, flatShading: true })); // (the kit's parameters: its program)
    for (const Pt of R.pits || []) {
      const throat = Pt.group.children[0];
      if (throat?.isMesh) { this.swaps.push({ mesh: throat, old: throat.geometry, mat: throat.material, y: throat.position.y }); throat.geometry = this.throatGeometry(); throat.material = mat; throat.position.y = 0; }
      Pt.jaws?.forEach((j, i) => { this.swaps.push({ mesh: j, old: j.geometry, mat: j.material }); j.geometry = this.mandible(i ? 1 : -1); j.material = mat; });
      Pt.group.children.forEach((c) => { if (c.isMesh) c.castShadow = true; });
    }
  }
  /** The throat: a dark well going down, its mouth in a ring of broken ruin stone. */
  throatGeometry() {
    const M = P.maw, out = new Tris(), n = 14, r0 = 2.7, r1 = 0.7, d = 2.4;
    for (let k = 0; k < n; k++) { // (the well's inner wall, seen from above: dark, darker down)
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, P0 = (r, y, a) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      out.quad(P0(r0, 0.1, a0), P0(r0, 0.1, a1), P0(r1, -d, a1), P0(r1, -d, a0), 0x2a1a12, 0x2a1a12, M.throat, M.throat);
      out.tri(P0(r1, -d, a0), P0(r1, -d, a1), new THREE.Vector3(0, -d, 0), M.throat);
    }
    for (let k = 0; k < 9; k++) { // (broken stones round the mouth, leaning in)
      const a = (k / 9) * Math.PI * 2 + hash(k) * 0.3, r = r0 + 0.3 + 0.3 * hash(k * 5), h = 0.6 + 0.9 * hash(k * 7), w = 0.8 + 0.5 * hash(k * 3);
      const g = new THREE.BoxGeometry(w, h, 0.7).rotateZ((hash(k * 11) - 0.5) * 0.4).rotateX(-0.35).rotateY(-a + Math.PI / 2).translate(Math.cos(a) * r, h * 0.3, Math.sin(a) * r);
      out.add(g, M.stone[k % M.stone.length]);
      if (k % 3 === 0) out.add(new THREE.BoxGeometry(w * 1.02, 0.12, 0.72).rotateX(-0.35).rotateY(-a + Math.PI / 2).translate(Math.cos(a) * r, h * 0.55, Math.sin(a) * r), M.gold);
    }
    return out.geometry();
  }
  /** A mandible for the jaw at side `sd` (-1 the left): a sickle 5 m long from its root at the origin, curving in toward the middle
   *  (+x for the left), a diamond in section, toothed along the inside; in her jaw's frame (stepPits turns it about z). */
  mandible(sd) {
    const M = P.maw, out = new Tris(), N = 10, inX = -sd, rows = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, c = new THREE.Vector3(inX * 1.5 * t * t, 5 * t, 0), r = 0.55 * (1 - t) + 0.04, tan = new THREE.Vector3(inX * 3 * t, 5, 0).normalize();
      const nx = new THREE.Vector3(tan.y, -tan.x, 0).multiplyScalar(inX), nz = new THREE.Vector3(0, 0, 1); // (nx: toward the inside of the curve)
      const col = (k) => (t > 0.86 ? M.tip : t < 0.1 ? M.gold : k === 0 ? M.edge : M.body);
      rows.push([[c.clone().addScaledVector(nx, r), col(0)], [c.clone().addScaledVector(nz, r * 0.55), col(1)], [c.clone().addScaledVector(nx, -r), col(2)], [c.clone().addScaledVector(nz, -r * 0.55), col(3)], c]);
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) {
      const A = rows[i], B = rows[i + 1], a = A[k], b = A[(k + 1) % 4], c = B[(k + 1) % 4], d = B[k];
      const nrm = _a.subVectors(b[0], a[0]).cross(_b.subVectors(d[0], a[0])), mid = a[0].clone().add(c[0]).multiplyScalar(0.5).sub(A[4]);
      if (nrm.dot(mid) >= 0) out.quad(a[0], b[0], c[0], d[0], a[1], b[1], c[1], d[1]); else out.quad(a[0], d[0], c[0], b[0], a[1], d[1], c[1], b[1]);
    }
    const tip = rows[N]; for (let k = 0; k < 4; k++) { const a = tip[k][0], b = tip[(k + 1) % 4][0], p = tip[4].clone().add(new THREE.Vector3(inX * 0.15, 0.25, 0)); const nrm = _a.subVectors(b, a).cross(_b.subVectors(p, a)); if (nrm.dot(_b.subVectors(a, tip[4])) >= 0) out.tri(a, b, p, M.tip); else out.tri(a, p, b, M.tip); }
    for (const t of [0.32, 0.5, 0.68]) { // (the teeth on the inner edge)
      const c = new THREE.Vector3(inX * 1.5 * t * t, 5 * t, 0), r = 0.55 * (1 - t) + 0.04;
      out.add(new THREE.ConeGeometry(0.12, 0.45, 4).rotateZ(-inX * Math.PI / 2).translate(c.x + inX * (r + 0.18), c.y, c.z), M.tip);
    }
    return out.geometry();
  }
  /** The maw snapped (`raceway.pit`): dust out of the throat, the sand sliding down the cone after it. */
  snap(id) {
    const R = this.R, V = this.vfxOf(), Pt = R?.pits?.find((p) => p.id === id); if (!Pt || !V) return;
    V.play('raceway.pit.snap', { pos: Pt.bottom.clone(), dir: UP });
    for (let k = 0; k < P.maw.slides; k++) {
      const a = (k / P.maw.slides) * Math.PI * 2 + Math.random() * 0.4, d = Pt.r * (0.18 + 0.2 * Math.random()), x = Pt.bottom.x + Math.cos(a) * d, z = Pt.bottom.z + Math.sin(a) * d;
      const p = new THREE.Vector3(x, R.heightAt(x, z) + 0.2, z), dir = Pt.bottom.clone().sub(p).normalize();
      V.play('raceway.pit.slide', { pos: p, dir });
    }
  }

  undress() {
    for (const o of this.objects) { o.parent?.remove(o); o.geometry?.dispose(); if (o.material && o.material !== this.game.water?.mats?.water && o.material !== this.game.water?.mats?.lachryma) o.material.dispose?.(); }
    for (const m of this.hidden) m.visible = true;
    for (const S of this.swaps.reverse()) {
      if (S.mat) { S.mesh.geometry.dispose(); S.mesh.geometry = S.old; S.mesh.material = S.mat; if (S.y != null) S.mesh.position.y = S.y; S.mesh.castShadow = false; continue; }
      const ol = S.mesh.userData.outline; if (ol && ol.geometry !== S.mesh.geometry) ol.geometry.dispose();
      S.mesh.geometry.dispose(); S.mesh.geometry = S.old; if (ol) ol.geometry = S.oldOl;
    }
    this.objects = []; this.hidden = []; this.swaps = []; this.R = null;
  }
}
