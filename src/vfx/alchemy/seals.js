// ---------------------------------------------------------------------------------------
// AN ATTRIBUTE'S SEAL (docs/plans/SOUL-ALCHEMY.md 4.6 and 4.24; the names Espada's to confirm): the potter's chop of each of Soul
// Alchemy's seven attributes, as a 16 px drawing (Calissa's first pass, for the maker to redraw at 1x) and as the 64 px carving cut into
// the kerb round the bath and filled with the tile's glaze. Every pair of tiles whose glazes fall together for some colour vision (4.15) has the
// most unlike seals: solid against hollow, point up against point down, round against ribbed, straight against necked.
//
//   the Peak (Willpower)        a solid triangle, the only solid seal
//   the Still Point (Focus)     a closed ring round a dot, the only closed round figure
//   the Fan (Charisma)          a sensu opened downward, ribbed, the only seal pointing down
//   the Gaze (Perception)       a lashed almond, the only seal twice as wide as tall
//   the Swift (Dexterity)       a banked bird, the only diagonal, many-pointed seal
//   the Finder (Visualization)  two right-angle brackets, the only hollow straight-cornered seal
//   the Tumbler (Resilience)    a leaning gourd with a mended seam, the only two-lobed seal
//
// The 64 px carving is the 16 px drawing scaled twice by EPX (Eric Johnston's 2x, as Scale2x: a diagonal stays a diagonal, a corner
// stays sharp, nothing is blurred), then cut: each texel knows whether it is in the cut (R), which wall of the cut it is on (G: the
// north wall in shadow, the south wall catching the light, for a light standing at the press), and how deep the glaze pools there (B:
// thicker away from the walls, so the glaze reads darker in the cut, as Yaozhou's carved celadon does). Its mipmaps fall back to the
// 16 px drawing at 16 px: the box filter of a 4 x 4 block is the pixel it was scaled from.
//
// Prior art: the potter's chop and the Japanese kamon (crests drawn to read as silhouettes at any size), Yaozhou carved celadon
// (Northern Song), EPX (LucasArts, 1992) and Scale2x (Andrea Mazzoleni, 2001), and the seals' own sources in 4.26.
//
//   SEAL_IDS (the attributes, in order)   SEALS[id] = { name, rows: [16 strings, '#' the cut] }   sealMask(id, scale = 4) -> { w, h, px }
//   sealAtlas() -> THREE.DataTexture (512 x 64: cell i is SEAL_IDS[i]; built once, shared, mipmapped)   SEAL_CELL (64)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SEAL_IDS = ['willpower', 'focus', 'charisma', 'perception', 'dexterity', 'visualization', 'resilience'];
export const SEAL_CELL = 64;
const _ = '................';
export const SEALS = {
  willpower: { name: 'the Peak', rows: [_, _, '.......##.......', '......####......', '......####......', '.....######.....', '.....######.....', '....########....', '....########....', '...##########...', '...##########...', '..############..', '..############..', '.##############.', '.##############.', _] },
  focus: { name: 'the Still Point', rows: [_, '.....######.....', '...##########...', '..###......###..', '..##........##..', '.##..........##.', '.##....##....##.', '.##...####...##.', '.##...####...##.', '.##....##....##.', '.##..........##.', '..##........##..', '..###......###..', '...##########...', '.....######.....', _] },
  charisma: { name: 'the Fan', rows: [_, _, '.....######.....', '..###.####.###..', '.####..##..####.', '#..###.##.###..#', '##.###.##.###.##', '###.##.##.##.###', '###..#.##.#..###', '####.#....#.####', '..###.####.###..', '....########....', '.....######.....', '.......##.......', '.......##.......', _] },
  perception: { name: 'the Gaze', rows: [_, _, _, '....#..##..#....', '....########....', '..###......###..', '.##....##....##.', '##....####....##', '##....####....##', '.##....##....##.', '..###......###..', '....########....', _, _, _, _] },
  dexterity: { name: 'the Swift', rows: [_, '...........###..', '..........####..', '.........####...', '........####....', '###....#######..', '.####.#######.##', '..###########...', '....#######.....', '....#####.......', '...####.........', '..###.##........', '.##....#........', '##..............', _, _] },
  visualization: { name: 'the Finder', rows: [_, '.#######........', '.#######........', '.##.............', '.##.............', '.##.............', '.##.............', '.##.............', '.............##.', '.............##.', '.............##.', '.............##.', '.............##.', '........#######.', '........#######.', _] },
  resilience: { name: 'the Tumbler', rows: [_, '...........##...', '..........##....', '.........####...', '........######..', '........######..', '.........####...', '........######..', '......#########.', '.....##########.', '....###########.', '....#.#.#.#.##..', '....##.#.#.#.#..', '....##########..', '.....########...', '.......####.....'] },
};

/** EPX: one pixel into four, each corner taking a neighbour's value where two neighbours agree and the other two do not. */
function epx(src, w, h) {
  const out = new Uint8Array(w * h * 4), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1), o = (2 * y) * (2 * w) + 2 * x;
    out[o] = C === A && C !== D && A !== B ? A : P; out[o + 1] = A === B && A !== C && B !== D ? B : P;
    out[o + 2 * w] = D === C && D !== B && C !== A ? C : P; out[o + 2 * w + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return out;
}
/** A seal's cut as a mask (1 the cut), at 16 px times `scale` (1, 2 or 4: EPX each doubling). */
export function sealMask(id, scale = 4) {
  const rows = SEALS[id].rows; let w = 16, h = 16, px = new Uint8Array(w * h);
  rows.forEach((r, y) => { for (let x = 0; x < 16; x++) px[y * 16 + x] = r[x] === '#' ? 1 : 0; });
  for (let s = 1; s < scale; s *= 2) { px = epx(px, w, h); w *= 2; h *= 2; }
  return { w, h, px };
}

let atlas = null;
/** The seven carvings in one texture, 64 px a cell (R the cut, G the wall's light: 0.5 level, B the glaze's depth). Built once. */
export function sealAtlas() {
  if (atlas) return atlas;
  const N = SEAL_CELL, W = N * 8, data = new Uint8Array(W * N * 4);
  for (let i = 0; i < W * N; i++) { data[i * 4 + 1] = 128; data[i * 4 + 3] = 255; }
  SEAL_IDS.forEach((id, c) => {
    const { px } = sealMask(id, 4), cut = (x, y) => x >= 0 && y >= 0 && x < N && y < N && px[y * N + x] === 1;
    // the depth: how far each texel of the cut lies from its nearest wall (a two-pass chamfer distance)
    const dist = new Float32Array(N * N).fill(99);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!cut(x, y)) dist[y * N + x] = 0;
    const relax = (x, y, dx, dy, k) => { const X = x + dx, Y = y + dy; const d = X < 0 || Y < 0 || X >= N || Y >= N ? 0 : dist[Y * N + X]; if (d + k < dist[y * N + x]) dist[y * N + x] = d + k; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { relax(x, y, -1, 0, 1); relax(x, y, 0, -1, 1); relax(x, y, -1, -1, 1.414); relax(x, y, 1, -1, 1.414); }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { relax(x, y, 1, 0, 1); relax(x, y, 0, 1, 1); relax(x, y, 1, 1, 1.414); relax(x, y, -1, 1, 1.414); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!cut(x, y)) continue;
      const o = (y * W + c * N + x) * 4, north = !cut(x, y - 1) || !cut(x, y - 2), south = !cut(x, y + 1) || !cut(x, y + 2);
      data[o] = 255; data[o + 1] = north && !south ? 40 : south && !north ? 230 : 128; data[o + 2] = Math.round(255 * Math.min(1, (dist[y * N + x] - 1) / 5));
    }
  });
  const t = new THREE.DataTexture(data, W, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4;
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; t.name = 'seal-atlas'; t.userData.shared = true;
  return (atlas = t);
}
