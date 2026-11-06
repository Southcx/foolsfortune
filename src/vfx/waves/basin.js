// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S DRESS (docs/ref/WAVE-RIDING.md 5): the basin round the water in the Raceway's kit, glazed stone and gold (the park's
// decks' and coaster's colours: vfx/racewaypark.js RACEWAY_PARK), and the machine that makes the wave.
//   THE COPING     a pale stone rim round three sides (the deep wall and the two ends; the beach side open), a gold band under its
//                  lip, the walls below it in the rails' amber ame glaze down to the bed, a lapis waterline band (Ilkhanid lajvardina,
//                  the coaster's glaze) where the water meets them, an iron-dark drip line at the foot
//   THE BEACH      the park's own sand (park.js cuts the pool's bed into its ground and grades the banks: the beach is the terrain),
//                  running on up out of the water with no kerb; every coping's top laid 0.15 m proud of the graded deck it caps
//   THE DECK       pale stone pavers (the park's decks' two shades, open joints showing the sand) on the flat the banks are graded to
//                  (park.js poolBanksOf), along the deep side and the two ends, stopping where the beach's sand meets them and where
//                  the dunes ease back in (the corners left sand)
//   THE RAIL       two iron rails on sleepers along the deep wall's coping, the foil's car riding them
//   THE CAR        the foil's carriage (Surf Ranch's "train"): a clay housing on a plinth and four iron wheels, gold bands and a lapis
//                  panel, an arm out over the wall holding the foil down in the water, a lapis plough with a gold rim; set each frame
//                  where the pass's crest meets the deep wall (its root), so it leads the wave down the pool
// Every piece one vertex-coloured flat standard material (the park's own parameters: its program): two meshes, one static, one moved
// (the car with its outline).
//
// Prior art: Kelly Slater's Surf Ranch (Lemoore: the foil's train on a rail along the deep side, the pool's coping and its beach),
// URBNSURF Melbourne and BSR Surf Resort (Waco): a paved deck flush round the coping, a sand beach into the water,
// the house's park dress (vfx/racewaypark.js, whose Tris builder and colours these are), the Pont du Gard's coping.
//
//   const B = new WavePoolBasin(game, pool, raceway)   B.static   B.car   B.place(S, t)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris, RACEWAY_PARK } from '../racewaypark.js';
import { addOutline, releaseOutlines } from '../../render/outline.js';
import { RW } from '../../world/raceway/track.js';
import { poolBanksOf } from '../../world/raceway/park.js';

const D = RACEWAY_PARK.deck.colour, K = RACEWAY_PARK.coaster.colour;
/** The coping's height over the still water and its width; the band's; the beach's run back; the car's size (m). */
export const WAVE_BASIN = {
  coping: { up: 1.6, w: 2.2 }, band: 0.18, rail: [0.7, 1.6], slab: 3, // (slab: the deck's pavers, m)
  colour: { coping: D.coping, gold: D.gold, wall: D.body, drip: D.drip, lapis: K.body, sleeper: 0x6a3a26, iron: 0x2a1c16, clay: D.clay, plinth: D.plinth, roof: 0x3a2214 },
};

export class WavePoolBasin {
  constructor(game, pool, R) {
    this.game = game; this.S = pool; this.R = R; const P = pool.POOL, ax = pool.axes ?? { ux: 1, uz: 0, vx: 0, vz: 1 };
    this.P = P; this.ax = ax;
    this.static = this.mesh(this.buildStatic(), 'wavepool-basin', false); // (thin faces: no hull; sets deepTop, the car's rail)
    this.car = this.mesh(this.buildCar(), 'wavepool-car', true);
    this.car.rotation.y = P.yaw;
  }
  mesh(geo, name, outline) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, flatShading: true, side: outline ? THREE.FrontSide : THREE.DoubleSide }));
    m.castShadow = m.receiveShadow = true; m.name = name; m.userData.zone = 'raceway'; if (outline) addOutline(m);
    return m;
  }
  /** A world point at (u, v) in the pool's frame and y over the layer's floor (park-local). */
  at(u, v, y) { const P = this.P, a = this.ax, du = u - P.L / 2, dv = v - P.W / 2; return new THREE.Vector3(RW.x + P.x + du * a.ux + dv * a.vx, RW.y + y, RW.z + P.z + du * a.uz + dv * a.vz); }
  /** The bed under (u, v): the pool's own (bedAt), or the park's ground where that lies lower (the beach park.js lays), so a wall's face
   *  always reaches the ground it stands on. */
  bedV(u, v) {
    const P = this.P, a = this.ax, du = u - P.L / 2, dv = v - P.W / 2, x = P.x + du * a.ux + dv * a.vx, z = P.z + du * a.uz + dv * a.vz, b = this.S.bedAt(x, z) ?? P.y - P.depth.deep;
    return this.R?.heightAt ? Math.min(b, this.R.heightAt(RW.x + x, RW.z + z) - RW.y) : b;
  }

  buildStatic() {
    const P = this.P, B = WAVE_BASIN, C = B.colour, out = new Tris(), cw = B.coping.w, wl = P.y, R = this.R;
    const q = (a, b, c, d, col) => out.quad(a, b, c, d, col);
    // the coping's top at (u, v) on the wall line, `ou, ov` outward: over the still water, and over the park's ground under it (the
    // terrain's bank where the basin is cut into the dunes: the field's cells are 2.5 m, the coping wider), so it caps the cut
    const topAt = (u, v, ou, ov) => {
      let g = -1e9;
      if (R?.heightAt) for (const k of [0.1, cw * 0.5, cw + 0.4]) { const p = this.at(u + ou * k, v + ov * k, 0); g = Math.max(g, R.heightAt(p.x, p.z) - RW.y); }
      return Math.max(P.y + B.coping.up, g + 0.15);
    };
    // a wall's inner face from the coping to the bed between two (u, v) points, with its coping on top: the gold under the lip, the
    // glaze, the lapis waterline, the drip line at the foot; the slab out to `cw` and its outer face down into the ground
    const wall = (u0, v0, u1, v1, ou, ov, bed0, bed1, fixed = null) => {
      const t0 = fixed ?? topAt(u0, v0, ou, ov), t1 = fixed ?? topAt(u1, v1, ou, ov);
      const bands = [[0, B.band, C.gold], [B.band, null, C.wall], [wl + 0.6, wl - 0.5, C.lapis], [wl - 0.5, -1e9, C.drip]];
      for (const [y0r, y1r, col] of bands) { // (the first two bands hang from the coping's top; the rest are the water's)
        const y00 = y0r === 0 || y0r === B.band ? t0 - y0r : y0r, y01 = y0r === 0 || y0r === B.band ? t1 - y0r : y0r;
        const y10 = y1r == null ? wl + 0.6 : y1r === B.band ? t0 - B.band : y1r, y11 = y1r == null ? wl + 0.6 : y1r === B.band ? t1 - B.band : y1r;
        const b0 = Math.max(y10, bed0), b1 = Math.max(y11, bed1); if (b0 >= y00 && b1 >= y01) continue; // (the band under the bed here)
        q(this.at(u0, v0, Math.max(y00, b0)), this.at(u0, v0, b0), this.at(u1, v1, b1), this.at(u1, v1, Math.max(y01, b1)), col);
      }
      const a0 = this.at(u0, v0, t0), a1 = this.at(u1, v1, t1), c0 = this.at(u0 + ou * cw, v0 + ov * cw, t0), c1 = this.at(u1 + ou * cw, v1 + ov * cw, t1);
      q(a0, a1, c1, c0, C.coping);
      const dn = (p) => p.clone().setY(p.y - 2.5);
      q(c0, c1, dn(c1), dn(c0), C.coping);
    };
    // the deep wall (v = W) and the two ends (u = 0, u = L), each facing the water; the beach's back (v = -beach) a low kerb
    const segU = 6, segV = 1.5;
    let deep = 0; for (let u = 0; u <= P.L; u += segU) deep = Math.max(deep, topAt(u, P.W, 0, 1));
    this.deepTop = deep; // (the deep side level its whole length: the foil's car rides it)
    for (let u = 0; u < P.L - 1e-6; u += segU) { const u1 = Math.min(P.L, u + segU); wall(u1, P.W, u, P.W, 0, 1, this.bedV(u1, P.W - 0.01), this.bedV(u, P.W - 0.01), deep); }
    for (let v = -P.beach; v < P.W - 1e-6; v += segV) {
      const v1 = Math.min(P.W, v + segV), b0 = this.bedV(0.01, v), b1 = this.bedV(0.01, v1);
      wall(0, v, 0, v1, -1, 0, b0, b1); wall(P.L, v1, P.L, v, 1, 0, this.bedV(P.L - 0.01, v1), this.bedV(P.L - 0.01, v));
    }
    this.deck(out);
    // the rail along the deep coping: two iron bars on clay sleepers, on its top
    for (let u = -cw; u < P.L + cw - 1e-6; u += segU) {
      const u1 = Math.min(P.L + cw, u + segU), top = deep;
      for (const rv of B.rail) this.box(out, u, P.W + rv - 0.07, u1, P.W + rv + 0.07, top + 0.12, top + 0.3, C.iron);
      for (let k = u + 1; k < u1; k += 2.2) this.box(out, k - 0.25, P.W + 0.3, k + 0.25, P.W + 2.0, top, top + 0.12, C.sleeper);
    }
    return out.geometry();
  }

  /** The deck's pavers on the banks' flat (park.js poolBanksOf): a grid of slabs `slab` m in the pool's frame along the deep side and the
   *  ends, each an inset quad 0.04 m over the graded ground, kept where the ground is the deck's level (not the beach's sand, not the
   *  dunes' fall) and clear of the coping. */
  deck(out) {
    const P = this.P, B = poolBanksOf(P), C = RACEWAY_PARK.deck.colour.pave, cw = WAVE_BASIN.coping.w, sl = WAVE_BASIN.slab, gap = 0.07, y = B.deck + 0.04, R = this.R;
    const ok = (u, v) => { // (a slab's corner on the flat, at the deck's level)
      const ou = u < 0 ? -u : u > P.L ? u - P.L : 0, ov = v > P.W ? v - P.W : 0;
      if (v < -P.beach + B.blendV || Math.hypot(ou, ov) > B.flat - 0.5) return false;
      if (!R?.heightAt) return true; const p = this.at(u, v, 0); return Math.abs(R.heightAt(p.x, p.z) - RW.y - B.deck) < 0.03;
    };
    const lay = (u0, v0, nu, nv) => {
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = u0 + i * sl, b = v0 + j * sl, c = a + sl, d = b + sl;
        if (!ok(a, b) || !ok(c, b) || !ok(c, d) || !ok(a, d)) continue;
        const col = C[(i * 7 + j * 3 + ((i * j) % 5)) % 3 === 0 ? 1 : 0];
        out.quad(this.at(a + gap, b + gap, y), this.at(a + gap, d - gap, y), this.at(c - gap, d - gap, y), this.at(c - gap, b + gap, y), col);
      }
    };
    const n = Math.ceil((B.flat - cw) / sl), along = Math.ceil((P.L + 2 * (cw + n * sl)) / sl);
    lay(-cw - n * sl, P.W + cw, along, n); // (the deep side, the machine's apron)
    const across = Math.ceil((P.W + cw + P.beach) / sl), v0 = P.W + cw - across * sl;
    lay(-cw - n * sl, v0, n, across); lay(P.L + cw, v0, n, across); // (the two ends)
  }

  /** An axis box in (u, v, y) laid as six quads (its faces out). */
  box(out, u0, v0, u1, v1, y0, y1, col) {
    const p = (u, v, y) => this.at(u, v, y), A = p(u0, v0, y0), B = p(u1, v0, y0), C = p(u1, v1, y0), Dd = p(u0, v1, y0), E = p(u0, v0, y1), F = p(u1, v0, y1), G = p(u1, v1, y1), H = p(u0, v1, y1);
    out.quad(E, H, G, F, col); out.quad(A, B, C, Dd, col); out.quad(A, E, F, B, col); out.quad(B, F, G, C, col); out.quad(C, G, H, Dd, col); out.quad(Dd, H, E, A, col);
  }

  /** The car, built in its own frame (x along the pool, z across it from the deep wall's face, y the world's height). */
  buildCar() {
    const P = this.P, C = WAVE_BASIN.colour, out = new Tris(), top = 0, wy = P.y - this.deepTop; // (y over the deep coping's top; the water's level `wy` under it, the foil reaching down past it)
    const bx = (x0, x1, z0, z1, y0, y1, col) => out.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), col);
    const zr = [WAVE_BASIN.rail[0], WAVE_BASIN.rail[1]];
    for (const x of [-3.6, 3.6]) for (const z of zr) out.add(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 14).rotateX(Math.PI / 2).translate(x, top + 0.85, z), C.iron); // (the wheels on the rails)
    bx(-5, 5, 0.1, 2.3, top + 0.9, top + 1.5, C.plinth); // (the plinth)
    bx(-4.6, 4.6, 0.25, 2.15, top + 1.5, top + 3.6, C.clay); // (the housing)
    bx(-4.7, 4.7, 0.2, 2.2, top + 2.3, top + 2.5, C.gold); // (its gold band)
    bx(-1.6, 1.6, 0.18, 0.26, top + 1.8, top + 3.2, C.lapis); // (the lapis panel toward the water)
    bx(-5.1, 5.1, 0.0, 2.4, top + 3.6, top + 4.0, C.roof); // (the roof, tenmoku dark)
    bx(-5.2, 5.2, -0.05, 2.45, top + 4.0, top + 4.12, C.gold);
    // the arm out over the wall and the foil down in the water: a plough of lapis, its edge in gold
    bx(-0.5, 0.5, -3.2, 0.2, top + 2.6, top + 3.2, C.clay);
    bx(-0.35, 0.35, -3.4, -2.8, wy - 2.6, top + 3.2, C.iron);
    const fy0 = wy - 3, fy1 = wy + 0.5, seg = 8;
    for (let i = 0; i < seg; i++) { // (the plough's face, curved: deepest at its middle, a hull's section)
      const x0 = -4 + (8 * i) / seg, x1 = -4 + (8 * (i + 1)) / seg, z0 = -3.1 - 0.9 * Math.sin((Math.PI * i) / seg), z1 = -3.1 - 0.9 * Math.sin((Math.PI * (i + 1)) / seg);
      const a = new THREE.Vector3(x0, fy0, z0), b = new THREE.Vector3(x1, fy0, z1), c = new THREE.Vector3(x1, fy1, z1), d = new THREE.Vector3(x0, fy1, z0);
      out.quad(a, b, c, d, C.lapis); out.quad(d, c, b, a, C.lapis);
      out.add(new THREE.BoxGeometry(x1 - x0 + 0.02, 0.16, 0.2).translate((x0 + x1) / 2, fy1, (z0 + z1) / 2), C.gold);
    }
    return out.geometry();
  }

  /** The car where the pass's crest meets the deep wall (its root), held at the pool's ends between passes. */
  place(S, t) {
    const st = S.state(t), P = this.P, W = P.W, sw = (W - P.vb) / Math.max(0.05, st.tv);
    const u = Math.min(P.L - 6, Math.max(6, st.ub + sw * st.tu));
    this.car.position.copy(this.at(u, W, this.deepTop));
  }

  dispose() { for (const m of [this.static, this.car]) { m.parent?.remove(m); releaseOutlines(m); m.geometry.dispose(); m.material.dispose(); } }
}
