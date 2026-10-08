// ---------------------------------------------------------------------------------------
// THE BASIN (docs/plans/SOUL-ALCHEMY.md 4.2 and 4.4): the stone the bath lies in, on the Athanor's crown. A dished basin 5 m across
// (its floor's form is `DISH`: the grey centre, a disc of bare clay 25 cm across under a thin skin; the floor deepening to the lip; the
// three throwing lines, a third of the way out, on the tiles' circle and at the lip: the bath's shader draws them through the liquid,
// vfx/alchemy/bath.js), its KERB (a ring of dark basalt 0.45 m wide, its inner arris rounded down into the liquid and in shadow), the
// WARE RING (a step 0.5 m wide just outside the kerb, a hand lower) and a skirt below it, a plinth sloping into the ground so the level
// basin sits into a round planetoid with no gap (the glossary's skirt: its foot takes the Athanor's own ground colour). One lathe, one
// lit material shared with the planetoids' (vertex colours, so no new program). Each attribute's SEAL is carved into the kerb at its
// tile's bearing, 16 px at the press view's widest, upright toward the press and never turned round the circle, filled with its
// tile's glaze (a seal mark, vfx/alchemy/marks.js: self-lit, so it reads on the stone in grey and for every eye).
//
// The colour wheel's geometry lives here too: hue is the bearing, clockwise from north seen from above, with NORTH_HUE (354.5, the gap
// between Resilience and Willpower) under the press; saturation is the distance out, 1 at the lip.
//
// Prior art: the tsukubai (the Japanese garden's stone basin, here fed by the press as by its kakei), the potter's wheel head (the
// throwing lines), Yaozhou carved celadon (the seals), and the level-terrain trick of every engine that sets a flat plinth into a
// slope (a skirt hung below the edge).
//
//   NORTH_HUE   wheelPoint(h, s, R, out) -> the bath's frame (x east, y up, -z north)   DISH { centre, lines, depth, lipDark }
//   KERB { w, top }   WARE { w, y }   const B = new Basin(group, marks, { R })   B.seals(hues)   B.update(dt, lit)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RANGE, MARK } from './marks.js';
import { oklabColour, wheelOklab, wheelColour } from '../wheelcolour.js';

export const NORTH_HUE = 354.5; // (4.4: the press stands over the gap between Resilience and Willpower)
export const DISH = { centre: 0.125, lines: [1 / 3, 0.65, 0.985], depth: 4.8 }; // (metres; saturations; the floor's darkening: linear (1 - s)^depth)
export const KERB = { w: 0.45, top: 0.07 }; // (metres: its width; its top over the liquid)
export const WARE = { w: 0.5, y: -0.03 }; // (metres: its width; its height, a hand under the kerb's top and 2 cm over the highest ground the press found)
const SEAL = { size: 0.34, lift: 0.015 }; // (metres: 16 px at the press view's widest; over the kerb's top: casebook rule 1)
const STONE = { kerb: 0x222126, arris: 0x121114, ware: 0x4a4448, skirt: 0x3a3440, foot: 0x6a5a6a }; // (basalt; the arris in shadow; the step; the Athanor's rock and its top, vfx/garden/planetoid.js)

/** A place on the colour wheel in the bath's own frame. */
export function wheelPoint(h, s, R, out = new THREE.Vector3()) {
  const b = ((h - NORTH_HUE) * Math.PI) / 180, r = Math.min(1, Math.max(0, s)) * R;
  return out.set(Math.sin(b) * r, 0, -Math.cos(b) * r);
}

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
export class Basin {
  constructor(group, marks, { R = 2.5 } = {}) {
    this.R = R; this.marks = marks; this.lit = 0; this.hues = null;
    // the lathe: [radius, height, colour] from the skirt's foot in the ground, up to the ware ring, up the kerb, over it and down its
    // arris into the liquid (a lathe's faces look to the left of the way the profile runs: inward and up, here)
    const k = R + KERB.w, w = k + WARE.w, P = [
      [R - 0.02, -0.2, STONE.arris], [R, -0.012, STONE.arris], [R + 0.025, 0.045, STONE.arris], [R + 0.075, KERB.top, STONE.kerb],
      [k - 0.03, KERB.top, STONE.kerb], [k, KERB.top - 0.025, STONE.kerb], [k + 0.004, WARE.y + 0.004, STONE.arris], [k + 0.02, WARE.y, STONE.ware],
      [w - 0.03, WARE.y, STONE.ware], [w, WARE.y - 0.03, STONE.skirt], [w + 0.08, -0.3, STONE.skirt], [w + 0.4, -1.8, STONE.foot],
    ].reverse();
    const pts = P.map(([r, y]) => new THREE.Vector2(r, y)), geo = new THREE.LatheGeometry(pts, 128);
    const col = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < geo.attributes.position.count; i++) { _c.setHex(P[i % P.length][2]); col.set([_c.r, _c.g, _c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mat = new THREE.MeshStandardMaterial({ name: 'press-basin', vertexColors: true, roughness: 0.85 }); // (as the planetoids' own: the same program)
    const m = (this.mesh = new THREE.Mesh(geo, this.mat)); m.name = 'press-basin'; m.receiveShadow = true; m.castShadow = true; group.add(m);
  }
  /** The seals, one at each attribute's bearing on the kerb (the hues in the attributes' order). */
  seals(hues) { this.hues = hues.slice(); this.draw(); }
  draw() {
    const H = this.hues; if (!H) return;
    const r = this.R + KERB.w * 0.52, [i0] = RANGE.seals;
    H.forEach((h, i) => {
      wheelPoint(h, 1, r, _p); _p.y = KERB.top + SEAL.lift;
      _m.compose(_p, _q.identity(), _s.set(SEAL.size / 2, 1, SEAL.size / 2)); // (upright toward the press: never turned round the circle)
      wheelColour(h, 0.65, _c); const [, a, b] = wheelOklab(h, 0.65); oklabColour(0.83, a, b, _c2, 0.86); // (lit from within: the glaze at a lightness that stands 6.7:1 or more on the basalt, measured; no channel past 0.86, so none blooms)
      this.marks.put(i0 + i, _m, MARK.seal, _c, _c2, [i, this.lit, 0]);
    });
  }
  /** The light in the seals: eased toward `lit` (1 while the press view is open). */
  update(dt, lit) {
    const was = this.lit; this.lit += (lit - this.lit) * Math.min(1, dt * 4); if (Math.abs(this.lit - lit) < 0.003) this.lit = lit;
    if (this.lit !== was) this.draw();
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
