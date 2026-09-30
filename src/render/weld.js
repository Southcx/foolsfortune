// ---------------------------------------------------------------------------------------
// WELD: which vertices of a triangle soup sit at the same place. Both outlines (smoothed normals for the inverted hull) and smooth
// shading (creased normals) need it for every procedural mesh, and it was done with a string key per vertex ("x,y,z"), which was the
// single largest cost of building the level. This is the same thing with integers: each position quantised to a tenth of a millimetre,
// hashed (the spatial hash of Teschner et al., 2003: three large primes, xor), and compared exactly inside its bucket.
//
//   const { rep, start, list } = weld(positionAttribute)
//     rep[i]   the first vertex at vertex i's position (its group's name)
//     the members of the group named r are list[start[r] .. start[r + 1]) (start indexed by representative; other entries unused)
// ---------------------------------------------------------------------------------------
const CACHE = new WeakMap(); // (position attribute -> { version, result }: outlines and shading weld the same buffer)

export function weld(pos, q = 1e4) {
  const hit = CACHE.get(pos);
  if (hit && hit.v === pos.version) return hit.r;
  const r = weldNow(pos, q);
  CACHE.set(pos, { v: pos.version, r });
  return r;
}

function weldNow(pos, q) {
  const n = pos.count, a = pos.array, stride = pos.itemSize ?? 3;
  const isInterleaved = !!pos.isInterleavedBufferAttribute;
  const qx = new Int32Array(n), qy = new Int32Array(n), qz = new Int32Array(n), rep = new Int32Array(n);
  const buckets = new Map();
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (isInterleaved) { x = pos.getX(i); y = pos.getY(i); z = pos.getZ(i); } else { const o = i * stride; x = a[o]; y = a[o + 1]; z = a[o + 2]; }
    const ix = Math.round(x * q), iy = Math.round(y * q), iz = Math.round(z * q);
    qx[i] = ix; qy[i] = iy; qz[i] = iz;
    const h = (Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(iz, 83492791)) | 0;
    let b = buckets.get(h), r = -1;
    if (b === undefined) buckets.set(h, (b = []));
    else for (const j of b) if (qx[j] === ix && qy[j] === iy && qz[j] === iz) { r = j; break; }
    if (r < 0) { b.push(i); r = i; }
    rep[i] = r;
  }
  // members of each group, contiguous (a counting sort by representative)
  const count = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) count[rep[i] + 1]++;
  const start = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) start[i + 1] = start[i] + count[i + 1];
  const fill = start.slice(0, n), list = new Int32Array(n);
  for (let i = 0; i < n; i++) list[fill[rep[i]]++] = i;
  return { rep, start, list };
}
