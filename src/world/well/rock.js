// ---------------------------------------------------------------------------------------
// ROCK: a cave's walls made rough. A wall or a pillar of the Well is built as a box (wellkit.js: its collider stays that box), drawn
// subdivided and pushed sideways by a smooth noise field sampled at each vertex's own place in the world, so the face bulges and
// hollows like cut stone. The field is horizontal only (tops stay level, the sand and the ceilings still meet them) and the same
// place always moves the same way, so the copies of a vertex at a box's edge, or where two pieces of a bent wall meet, stay together:
// the mesh does not open. Its amplitude (0.3 m) is about the capsule's radius: a Courier hugging the collider may graze a bulge, never stand inside a wall.
//
// Prior art: the displaced cave meshes of Deep Rock Galactic and Spelunky 2's backgrounds (a coarse solid for play, a noisy skin to look
// at), and value noise in octaves (Perlin's fractal sum; Inigo Quilez's notes on value noise).
//
//   roughen(geometry, { amp?, scale?, seed? }) -> geometry   (positions in world metres; moved in place; normals left to the caller)
//   segments(length, size?) -> how many pieces a face of that length is cut into for roughening
// ---------------------------------------------------------------------------------------

const AMP = 0.3, SCALE = 3, SEG = 2.5; // (SEG: a face is cut every 2.5 m; finer cost the Well 60,000 triangles a floor for bumps the eye does not resolve at 480 lines)

/** A hash of a lattice point to 0..1 (integer mixing, no tables). */
function hash(x, y, z, s) {
  let h = (Math.imul(x, 0x8da6b343) ^ Math.imul(y, 0xd8163841) ^ Math.imul(z, 0xcb1ab31f) ^ Math.imul(s, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
/** Smooth value noise in -1..1 at a point (lattice spacing 1). */
function noise(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz, s);
  const n = L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
  return n * 2 - 1;
}
/** Two octaves: the big bulges and the chisel marks on them. */
const fbm = (x, y, z, s) => noise(x, y, z, s) * 0.7 + noise(x * 2.3, y * 2.3, z * 2.3, s + 7) * 0.3;

export function roughen(geo, { amp = AMP, scale = SCALE, seed = 0 } = {}) {
  const p = geo.attributes.position, k = 1 / scale;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // (the field is stretched up and down: strata read as layers, not as blobs)
    p.setXYZ(i, x + amp * fbm(x * k, y * k * 0.6, z * k, seed), y, z + amp * fbm(x * k + 31.7, y * k * 0.6, z * k - 17.3, seed + 3));
  }
  p.needsUpdate = true;
  return geo;
}

export const segments = (length, size = SEG) => Math.max(1, Math.ceil(length / size));
