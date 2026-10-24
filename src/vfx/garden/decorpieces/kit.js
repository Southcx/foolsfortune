// ---------------------------------------------------------------------------------------
// THE DECOR KIT: the little builder every decor piece is made with (docs/plans/GARDEN-COZY.md D; Calissa's, for the god hand's pieces).
// A piece is a few soft primitives merged into one non-indexed geometry that carries four attributes: position, normal, a vertex colour
// (the BODY white, so the instance's set colour x tint paints it; an ACCENT in its own colour), `tintk` (0..1: how much of the instance
// colour an accent takes; the body 1, a fixed accent 0) and `glowk` (0..1: a lamp's face, lit at dusk by the material's patch in
// decorpieces.js), and `motion` (vec4: a part's motion kind, then its pivot: MOTION below; 0 for a part that keeps still, as the
// generic attribute default reads for a geometry without one). Rounded boxes are a box of two segments pushed out to a sphere's corner
// (the Chao Garden's pillow forms).
//
// Prior art: three.js's RoundedBoxGeometry (the clamp-and-inflate trick, here at 2 segments), Animal Crossing's and the Chao Garden's toy
// furniture (few shapes, round edges), the cave abode vocabulary of vfx/garden/features.js.
//
//   const p = new Piece();  p.box(w, h, d, o)  p.slab  p.cyl(rTop, rBottom, h, o, seg)  p.cone  p.ball(r, o)  p.ring(R, tube, o)  p.lathe(points, o)  p.geo(g, o)
//   p.done() -> BufferGeometry     o: { at:[x,y,z], rot:[x,y,z], sc: n | [x,y,z], c: hex (an accent), t: tint 0..1, g: glow 0..1, sit: true,
//   m: [kind, px, py, pz] (a moving part: MOTION's kind about the pivot, in the piece's own frame) }   K (the accent palette)   body = no `c`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The accents' colours (the stone, the wood, the paper and the lamp are the garden's handled materials). */
export const K = {
  stone: 0x9c978e, stoneD: 0x6f6b66, stoneL: 0xc9c4b8, wood: 0x8b5e3c, woodD: 0x5a3a28, woodL: 0xc29a66, paper: 0xf3e9d0, lamp: 0xf6d27a,
  moss: 0x6f9a48, leaf: 0x5f8f4a, leafD: 0x3f6a3a, soil: 0x4a3426, iron: 0x3f3d42, water: 0x4f8c96, waterD: 0x2f5a62, rope: 0xc3a572,
  bamboo: 0xb7ad62, brass: 0xc89a46, pink: 0xf0b8c4, red: 0xb8453a, white: 0xf2f0ea, clay: 0xb8673f, thorn: 0x3a2f1c, snow: 0xf4f7fb,
  koi: 0xe8742e, ember: 0xd0642a, gold: 0xe0b04a, black: 0x2a2a2e, mist: 0xdfe8ea,
};

/** A moving part's kinds (drawn in the vertex shader by decorMaterial, decorpieces.js; the pivot in the piece's frame): TURN about +Y (a
 *  potter's wheel head), TIP about +X in a filling-and-knocking cycle (the shishi-odoshi's pipe), POLAR about the axis tilted 40 degrees
 *  from +Y toward +Z (an armillary sphere's inner rings), FLICKER (no motion: the part's lamp glow wavers, a kiln's fire). */
export const MOTION = { still: 0, turn: 1, tip: 2, polar: 3, flicker: 4 };

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

/** A box of two segments with its edges pushed out round: soft, chunky, 48 triangles. */
export function softBox(w, h, d, r = Math.min(w, h, d) * 0.28) {
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2), P = g.attributes.position, N = g.attributes.normal;
  const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), cx = Math.max(-ix, Math.min(ix, x)), cy = Math.max(-iy, Math.min(iy, y)), cz = Math.max(-iz, Math.min(iz, z));
    const dx = x - cx, dy = y - cy, dz = z - cz, l = Math.hypot(dx, dy, dz); if (l < 1e-6) continue;
    P.setXYZ(i, cx + (dx / l) * r, cy + (dy / l) * r, cz + (dz / l) * r); N.setXYZ(i, dx / l, dy / l, dz / l);
  }
  return g;
}

export class Piece {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.tint = []; this.glow = []; this.mot = []; }
  /** Any geometry, placed and coloured. */
  geo(g, o = {}) {
    const q = g.index ? g.toNonIndexed() : g.clone();
    if (o.sit) { q.computeBoundingBox(); q.translate(0, -q.boundingBox.min.y, 0); }
    const [x, y, z] = o.at || [0, 0, 0], [rx, ry, rz] = o.rot || [0, 0, 0], sc = o.sc ?? 1;
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), Array.isArray(sc) ? _s.set(sc[0], sc[1], sc[2]) : _s.set(sc, sc, sc));
    q.applyMatrix4(_m);
    const body = o.c == null, t = o.t ?? (body ? 1 : 0), gl = o.g ?? 0, mv = o.m || [0, 0, 0, 0]; _c.set(body ? 0xffffff : o.c);
    const n = q.attributes.position.count;
    for (let i = 0; i < n; i++) {
      this.pos.push(q.attributes.position.getX(i), q.attributes.position.getY(i), q.attributes.position.getZ(i));
      this.nor.push(q.attributes.normal.getX(i), q.attributes.normal.getY(i), q.attributes.normal.getZ(i));
      this.col.push(_c.r, _c.g, _c.b); this.tint.push(t); this.glow.push(gl); this.mot.push(mv[0], mv[1], mv[2], mv[3]);
    }
    return this;
  }
  box(w, h, d, o, r) { return this.geo(softBox(w, h, d, r), o); }
  slab(w, h, d, o) { return this.geo(new THREE.BoxGeometry(w, h, d), o); }
  cyl(rt, rb, h, o, seg = 8) { return this.geo(new THREE.CylinderGeometry(rt, rb, h, seg, 1), o); }
  cone(r, h, o, seg = 8) { return this.geo(new THREE.ConeGeometry(r, h, seg, 1), o); }
  ball(r, o, w = 8, h = 6) { return this.geo(new THREE.SphereGeometry(r, w, h), o); }
  /** A torus lying flat. */
  ring(R, tube, o, seg = 12, tubeSeg = 5) { return this.geo(new THREE.TorusGeometry(R, tube, tubeSeg, seg).rotateX(Math.PI / 2), o); }
  /** A torus arc standing in the XY plane (a handle, an arch's curve). */
  arc(R, tube, o, arc = Math.PI, seg = 10) { return this.geo(new THREE.TorusGeometry(R, tube, 4, seg, arc), o); }
  /** A solid of revolution: points [[radius, y], ...]. */
  lathe(points, o, seg = 10) { return this.geo(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg), o); }
  /** A thin rod between two points (a cane, a string, a leg). */
  rod(a, b, r, o, seg = 5) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(), mid = A.clone().add(B).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    return this.geo(new THREE.CylinderGeometry(r, r, len, seg, 1), { ...o, at: mid.toArray(), rot: [e.x, e.y, e.z] });
  }
  done() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setAttribute('tintk', new THREE.Float32BufferAttribute(this.tint, 1)); g.setAttribute('glowk', new THREE.Float32BufferAttribute(this.glow, 1));
    g.setAttribute('motion', new THREE.Float32BufferAttribute(this.mot, 4));
    return g;
  }
}
