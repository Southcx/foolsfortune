// ---------------------------------------------------------------------------------------
// THE EFFECT SHAPES: the unit meshes a shape layer draws (vfx/shapes/layer.js), each built once and shared by every layer that names it
// (`form`). Their UVs are laid for scrolling: u runs ROUND a closed shape or ALONG an open one, 0..1, its seam a duplicated column so a
// whole-number tile in u is seamless; v runs OUT, UP or ACROSS, 0..1. Each carries the shared program's `color` attribute (vec4: white,
// its alpha baked where a shape naturally thins: a crescent's and a wave's tips, a spiral's two ends), a normal (for the rim), and
// defaults a layer may override: which way it faces (`face`), the axis it stands on (`axis`: 'y' up, or 'z' forward for the shapes that
// travel: the beam, the wave, the crescent), its soft edges (`edgeV`, `edgeU`: shares of v and u faded at each end) and its rim.
//
//   ring      a flat annulus on the ground, radius 0.55..1 (v inner to outer)      band     an open cylinder wall, radius 1, height 1 (v up)
//   hoop      a thin flat annulus on the ground, radius 0.955..1 (v inner to outer): a line drawn round, thin at any scale (a sonar's front)
//   dome      a hemisphere, radius 1 (v pole to rim)                               sphere   radius 1 (v south pole to north)
//   cone      open, base radius 1 on the ground, tip at 1 up (v base to tip)        disc     filled, radius 1 (polar UV: u angle, v radius)
//   quad      a 1 x 1 plane (a billboard: v up the screen)                         beam     a cylinder along +Z, length 1 from the origin, radius 0.5 (v along)
//   spiral    a helical ribbon, radius 1, two turns up a height of 1 (u along, v across)
//   crescent  an arc ribbon of 200 degrees on the ground, centred on +Z, radius 0.65..1, tapering to its tips (u along, v inner to outer)
//   pillar    a tall thin band, radius 0.15, height 1 (v up)                       wave     a curved wall a third of a circle wide, radius 1, height 1, centred on +Z (u along, v up)
//   spikes    a ring of 12 cones at radius 0.8 bursting up and a little out, heights 0.7..1 (u round each, v base to tip)
// Round shapes run their angle as x = sin, z = cos (u = 0 faces +Z, the camera's side, and u grows to the right as seen from there),
// so a pattern with a direction (the running hand) reads the right way round.
//
// Prior art: the effect mesh kit of every action game's VFX artist (the "ring / cylinder / dome / cone / slash" set Simon Trümpler and
// the Riot and Blizzard artists build every spell from, each UV-unwrapped to scroll; Mesh Create's own presets, scripts/meshflow.mjs).
//
//   shapeForm(name) -> { geo, face, axis, edgeV: [a, b], edgeU: [a, b], rim }   (an unknown name: the ring)   FORM_NAMES
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const TAU = Math.PI * 2;
/** A (nu + 1) x (nv + 1) grid of vertices from fn(u, v) -> [x, y, z, nx, ny, nz, alpha], two triangles a cell. */
function grid(nu, nv, fn, into) {
  const P = [], N = [], U = [], C = [], I = [], base = into ? into.P.length / 3 : 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv, [x, y, z, nx, ny, nz, a = 1] = fn(u, v), l = Math.hypot(nx, ny, nz) || 1;
    P.push(x, y, z); N.push(nx / l, ny / l, nz / l); U.push(u, v); C.push(1, 1, 1, a);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  if (into) { into.P.push(...P); into.N.push(...N); into.U.push(...U); into.C.push(...C); into.I.push(...I); return into; }
  return { P, N, U, C, I };
}
function geometry({ P, N, U, C, I }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 4));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}
const taper = (u, w = 0.12) => { const t = Math.min(1, Math.min(u, 1 - u) / w); return t * t * (3 - 2 * t); }; // (an open shape's tips thinned to nothing)

const BUILD = {
  ring: () => grid(64, 4, (u, v) => { const a = u * TAU, r = 0.55 + 0.45 * v; return [Math.sin(a) * r, 0, Math.cos(a) * r, 0, 1, 0]; }),
  hoop: () => grid(96, 2, (u, v) => { const a = u * TAU, r = 0.955 + 0.045 * v; return [Math.sin(a) * r, 0, Math.cos(a) * r, 0, 1, 0]; }),
  band: () => grid(64, 6, (u, v) => { const a = u * TAU; return [Math.sin(a), v, Math.cos(a), Math.sin(a), 0, Math.cos(a)]; }),
  dome: () => grid(48, 16, (u, v) => { const a = u * TAU, th = v * Math.PI * 0.5, s = Math.sin(th), c = Math.cos(th); return [Math.sin(a) * s, c, Math.cos(a) * s, Math.sin(a) * s, c, Math.cos(a) * s]; }),
  sphere: () => grid(48, 24, (u, v) => { const a = u * TAU, th = (1 - v) * Math.PI, s = Math.sin(th), c = Math.cos(th); return [Math.sin(a) * s, c, Math.cos(a) * s, Math.sin(a) * s, c, Math.cos(a) * s]; }),
  cone: () => grid(48, 8, (u, v) => { const a = u * TAU, r = 1 - v; return [Math.sin(a) * r, v, Math.cos(a) * r, Math.sin(a), 1, Math.cos(a)]; }),
  disc: () => grid(64, 12, (u, v) => { const a = u * TAU; return [Math.sin(a) * v, 0, Math.cos(a) * v, 0, 1, 0]; }),
  quad: () => grid(1, 1, (u, v) => [u - 0.5, 0, 0.5 - v, 0, 1, 0]),
  beam: () => grid(32, 8, (u, v) => { const a = u * TAU; return [Math.sin(a) * 0.5, Math.cos(a) * 0.5, v, Math.sin(a), Math.cos(a), 0]; }),
  spiral: () => grid(128, 3, (u, v) => { const a = u * 2 * TAU, w = 0.22, y = u * (1 - w) + v * w; return [Math.sin(a), y, Math.cos(a), Math.sin(a), 0, Math.cos(a), taper(u, 0.1)]; }),
  crescent: () => grid(48, 4, (u, v) => {
    const a = (u - 0.5) * (200 / 180) * Math.PI, half = 0.175 * Math.pow(Math.sin(Math.PI * u), 0.7), r = 0.825 + (v - 0.5) * 2 * half;
    return [Math.sin(a) * r, 0, Math.cos(a) * r, 0, 1, 0, taper(u, 0.18)];
  }),
  pillar: () => grid(24, 8, (u, v) => { const a = u * TAU; return [Math.sin(a) * 0.15, v, Math.cos(a) * 0.15, Math.sin(a), 0, Math.cos(a)]; }),
  wave: () => grid(40, 6, (u, v) => { const a = (u - 0.5) * (TAU / 3); return [Math.sin(a), v, Math.cos(a), Math.sin(a), 0, Math.cos(a), taper(u, 0.2)]; }),
  spikes: () => {
    const acc = { P: [], N: [], U: [], C: [], I: [] };
    for (let k = 0; k < 12; k++) {
      const b = (k / 12) * TAU + (k % 2) * 0.12, h = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(k * 2.39)), cx = Math.sin(b) * 0.8, cz = Math.cos(b) * 0.8, lean = 0.22;
      grid(10, 4, (u, v) => {
        const a = u * TAU, r = 0.12 * (1 - v), lx = Math.sin(a) * r, lz = Math.cos(a) * r;
        return [cx + lx + Math.sin(b) * lean * v * h, v * h, cz + lz + Math.cos(b) * lean * v * h, Math.sin(a), 0.5, Math.cos(a)];
      }, acc);
    }
    return acc;
  },
};
// (the defaults a shape brings: its facing, the axis it stands on, its soft edges, its rim: a layer's own fields win)
const DEFAULTS = {
  ring: { edgeV: [0.35, 0.35] }, hoop: { edgeV: [0.5, 0.5] }, band: { edgeV: [0.08, 0.6] }, dome: { edgeV: [0, 0.12], rim: 0.6 }, sphere: { rim: 0.7 },
  cone: { edgeV: [0.06, 0.4] }, disc: { edgeV: [0, 0.35] }, quad: { face: 'camera', edgeV: [0.3, 0.3], edgeU: [0.3, 0.3] },
  beam: { face: 'dir', axis: 'z', edgeV: [0.04, 0.25], rim: -0.7 }, spiral: { edgeV: [0.3, 0.3] }, crescent: { face: 'dir', axis: 'z', edgeV: [0.25, 0.3] },
  pillar: { edgeV: [0.04, 0.45], rim: -0.5 }, wave: { face: 'heading', axis: 'z', edgeV: [0.04, 0.55] }, spikes: { edgeV: [0, 0.3] },
};
export const FORM_NAMES = Object.keys(BUILD);

const made = {};
/** An effect shape by name, built the first time and shared after (never disposed: a layer lets go of its material only). */
export function shapeForm(name) {
  const n = BUILD[name] ? name : 'ring';
  return (made[n] ||= { name: n, geo: geometry(BUILD[n]()), face: 'ground', axis: 'y', edgeV: [0, 0], edgeU: [0, 0], rim: 0, ...DEFAULTS[n] });
}
