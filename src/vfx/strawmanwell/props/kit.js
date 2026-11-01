// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE SEWING KIT'S PROPS, THEIR KIT: what every prop of the sewing kit (vfx/strawmanwell/props.js) is built with.
// A prop is drawn into a soup a material (matte: wood, thread, felt, chalk; metal: brass and steel; gloss: glass heads, sequins, honey),
// each a vertex-coloured triangle soup laid in the placeholder box's own metres (x along it, y up it, z toward the stalls) and carried
// to where the box stands by the frame set on the kit; a lane's soups are merged into one mesh a material. The shapes are the turner's
// (a profile turned about an axis: a spool, a thimble, a pin), the box, the extruded outline (a ribbon's swallowtail, a felt wedge) and
// the tube along a path (a thread, a coil).
//
// Prior art: the house's vertex-coloured soups (vfx/racewaypark.js Tris, vfx/sandbox/hall.js's kit mesh: one material, colours in the
// vertices, faceted and then smoothed by the presentation, render/present.js), three.js's LatheGeometry (the turned profile, here
// written out so each band keeps its own colour and its own soup).
//
//   const K = new PropKit(palette)   K.frame(matrix4 | null)   K.pal   K.matte / K.metal / K.gloss (a Soup)   K.empty
//   soup.add(geo, colour | (cx, cy, cz) -> colour)   soup.quad(a, b, c, d, colour)   soup.box(x0, x1, y0, y1, z0, z1, colour)   soup.geometry()
//   turned(K, profile [[r, y, colour, soupKey?], ...], segs, { kz, phase, at: (row, seg) -> colour, place })   extruded(points [[x, y]], depth, z0)
//   tube(points, r, radial)   frameOf(box) -> Matrix4   hash(n) -> 0..1   shade(hex, k) -> hex
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _c = new THREE.Color(), _v = new THREE.Vector3();

/** A repeatable 0..1 from a number (the props' small variety: a thread's colour, a sequin's tilt). */
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** A colour lightened (k > 1) or darkened (k < 1), as a hex. */
export const shade = (hex, k) => _c.set(hex).multiplyScalar(k).getHex();

/** One material's triangles, each vertex coloured; what is added is carried by the frame set on it. */
export class Soup {
  constructor() { this.pos = []; this.col = []; this.m = null; }
  get empty() { return this.pos.length === 0; }
  push(p, hex) { _v.copy(p); if (this.m) _v.applyMatrix4(this.m); this.pos.push(_v.x, _v.y, _v.z); _c.set(hex); this.col.push(_c.r, _c.g, _c.b); }
  tri(a, b, c, col) { this.push(a, col); this.push(b, col); this.push(c, col); return this; }
  /** a b c d counter-clockwise seen from outside. */
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); return this; }
  /** A geometry in the box's metres, painted one colour or by its triangle's middle (cx, cy, cz). The geometry is let go. */
  add(geo, col) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, fn = typeof col === 'function';
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      const hex = fn ? col((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3) : col;
      this.tri(a, b, c, hex);
    }
    if (g !== geo) g.dispose();
    geo.dispose();
    return this;
  }
  box(x0, x1, y0, y1, z0, z1, col) {
    return this.add(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), col);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

/** The three soups of a lane (or of one rider), the frame they are laid in, and the palette (WELL_LOOK.palette, look.js). */
export class PropKit {
  constructor(pal) { this.pal = pal; this.matte = new Soup(); this.metal = new Soup(); this.gloss = new Soup(); }
  frame(m) { this.matte.m = this.metal.m = this.gloss.m = m; return this; }
  get empty() { return this.matte.empty && this.metal.empty && this.gloss.empty; }
}

/** A box read back (vfx/strawmanwell/boxes.js) as the matrix from its own metres to the world. */
export function frameOf(B) { return new THREE.Matrix4().makeBasis(B.ax, B.ay, B.az).setPosition(B.c); }

/** A profile turned about +y: [[r, y, colour, soupKey?], ...] from the bottom, outward along the underside, up the side, inward along
 *  the top (so every face looks out); a band takes its first point's colour and soup (`matte` unless said), or `at(row, seg)`'s colour
 *  where given (a thimble's dimples). `kz` squashes it toward an oval (a spool on a box deeper or shallower than it is wide); `place`
 *  (a Matrix4) stands it elsewhere in the box (a cannon's barrel laid along x, a button wheel facing the stalls). */
export function turned(K, prof, segs, { kz = 1, phase = 0, at = null, place = null } = {}) {
  const P = (r, y, a) => { const v = new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a) * kz); return place ? v.applyMatrix4(place) : v; };
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0, c0, s0] = prof[i], [r1, y1] = prof[i + 1], S = K[s0 || 'matte'];
    if (r0 < 1e-6 && r1 < 1e-6) continue;
    for (let s = 0; s < segs; s++) {
      const a0 = phase + (s / segs) * Math.PI * 2, a1 = phase + ((s + 1) / segs) * Math.PI * 2, col = at ? (at(i, s) ?? c0) : c0;
      const A = P(r0, y0, a0), B = P(r0, y0, a1), C = P(r1, y1, a1), D = P(r1, y1, a0);
      if (r0 < 1e-6) S.tri(A, C, D, col);
      else if (r1 < 1e-6) S.tri(A, B, C, col);
      else S.quad(A, B, C, D, col);
    }
  }
}

/** An outline in x-y ([[x, y], ...], either winding) stood `depth` deep along z from z0: a flat cut-out with its edge (a card's thickness). */
export function extruded(points, depth, z0 = -depth / 2) {
  const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, z0);
}

/** A tube along a path of points (a thread, a coil), `radial` sides round. */
export function tube(points, r, radial = 5) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, Math.max(2, points.length * 2), r, radial, false);
}
