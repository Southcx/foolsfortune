// ---------------------------------------------------------------------------------------
// THE DECOR GRID: where a garden piece may stand on a planetoid, as cells of a cube-sphere (docs/plans/GARDEN-COZY.md D1, Petra's
// placement research, 2026-10-22). Each planetoid's six cube faces are cut into N x N cells of about a metre (N from its radius); a piece
// stands on a half-cell point (Animal Crossing's half-tile), turned in YAW steps. The equal-angle mapping keeps the cells within 1.41 : 1
// at the faces' corners (the plain projection is 2 : 1); the clay's own latitude-longitude grid stays the ground's (its cells shrink to
// nothing at the poles, so decor never snaps to it). Pure maths on plain arrays, no three.js, so scripts can measure it.
//
// Prior art: the cube-sphere of planet renderers, its equal-angle (gnomonic, tangent-warped) variant, Townscaper's grid on any quad mesh
// (Sylves' MeshGrid), Animal Crossing's half-tile placement, and Petra's measurements of it for this garden.
//
//   DECOR_GRID   cellsOf(radius) -> N   cellAt(dir, N) -> { face, iu, iv }   dirAt(face, iu, iv, N) -> [x, y, z] (unit)
//   regionOf(face, iu, iv, N) -> 'face.quarter'   regionCells(N) -> cells a region   tangentAt(face, iu, iv, N) -> [x, y, z] (the face's v)
// ---------------------------------------------------------------------------------------

/** About a metre a cell (`cell`, metres of arc), never fewer than `min` a face's edge; YAW steps a turn (15 degrees each). */
export const DECOR_GRID = { cell: 1, min: 8, yaw: 24 };
// the six faces: the axis (0 x, 1 y, 2 z), its sign, and the two axes the face's u and v run along
const FACES = [[0, 1, 2, 1], [0, -1, 1, 2], [1, 1, 2, 0], [1, -1, 0, 2], [2, 1, 0, 1], [2, -1, 1, 0]].map(([ax, s, ua, va]) => ({ ax, s, ua, va }));
const Q = Math.PI / 4;

/** A face's edge in cells for a planetoid's radius (its quarter-circumference over the cell). */
export const cellsOf = (radius = 10) => Math.max(DECOR_GRID.min, Math.round((radius * Math.PI) / 2 / DECOR_GRID.cell));

/** The half-cell point nearest a unit direction (from the planetoid's centre). */
export function cellAt(d, N) {
  const a = [Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])], ax = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2, s = d[ax] >= 0 ? 1 : -1;
  const face = FACES.findIndex((F) => F.ax === ax && F.s === s), F = FACES[face], m = Math.abs(d[ax]) || 1;
  const u = Math.atan(d[F.ua] / m) / Q, v = Math.atan(d[F.va] / m) / Q; // (-1 .. 1, equal-angle)
  const h = (x) => Math.max(0, Math.min(2 * N, Math.round((x + 1) * N)));
  return { face, iu: h(u), iv: h(v) };
}
/** The unit direction of a half-cell point. */
export function dirAt(face, iu, iv, N) {
  const F = FACES[face], u = iu / N - 1, v = iv / N - 1, p = [0, 0, 0];
  p[F.ax] = F.s; p[F.ua] = Math.tan(u * Q); p[F.va] = Math.tan(v * Q);
  const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l];
}
/** The face's v direction at a point, made tangent: a piece's "north" (so yaw steps agree across a face). */
export function tangentAt(face, iu, iv, N) {
  const a = dirAt(face, iu, Math.min(2 * N, iv + 1), N), b = dirAt(face, iu, Math.max(0, iv - 1), N), n = dirAt(face, iu, iv, N);
  const t = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], k = t[0] * n[0] + t[1] * n[1] + t[2] * n[2];
  const r = [t[0] - k * n[0], t[1] - k * n[1], t[2] - k * n[2]], l = Math.hypot(r[0], r[1], r[2]) || 1; return [r[0] / l, r[1] / l, r[2] / l];
}
/** The rating's region: a quarter of a face (progress/decor.js rating). */
export const regionOf = (face, iu, iv, N) => `${face}.${(iu >= N ? 1 : 0) + (iv >= N ? 2 : 0)}`;
/** Cells in a region: a quarter of a face's N x N. */
export const regionCells = (N) => Math.max(1, Math.round((N * N) / 4));
