// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, ITS KIT: what the theatre's frame (vfx/strawmanwell/theatre.js) is drawn with. One atlas canvas of the toy
// theatre's printed stock (maple planks with Pip's tailor's chalk on some, walnut, linen, burlap, a tape measure's strip, velvet's pleats,
// satin ribbon, gold braid, a stage door's printed face), one soft glow for the light, a sheet that gathers coloured, atlas-mapped
// triangles into one geometry a lane (merged: one draw a material), and the cut-out card (a silhouette with its card edge and its dark
// printed keyline behind). Detail that would be thinner than a line at 480 lines (the chalk, the seams, the ticks) is painted into the
// atlas, so the texture's filtering keeps it from crawling; geometry carries only what reads as a shape.
//
// Prior art: Pollock's Toy Theatres (the printed sheets: every piece a cut-out with a keyline, its card edge showing), the Sandbox hall's
// vertex-coloured kit (vfx/racewaypark.js Tris), a texture atlas of trim sheets (the games' trim sheet: one texture, regions mapped by uv).
//
//   atlasTexture(palette) -> CanvasTexture   glowTexture() -> CanvasTexture   uvOf(region, fu0, fv0, fu1, fv1) -> [u0, v0, u1, v1]   WHITE
//   rgb(hex, k) -> [r, g, b] (linear)   const S = new Sheet()   S.quad(a, b, c, d, col | [4 cols], uv)   S.tri(...)   S.add(geo, col)
//   S.geometry()   box(S, x0, x1, y0, y1, z0, z1, col, faces, uv)   card(S, pts, z, { thick, face, edge, ink, keyline, uv })   hash(n)   V(x, y, z)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const ATLAS = 512;
/** The atlas's regions, in px (x, y, w, h; y down the canvas). The planks are PLANKS strips of 32 px, each a board 0.32 m wide. */
export const REG = {
  planks: [0, 0, 256, 256], walnut: [256, 0, 256, 128], linen: [256, 128, 128, 128], burlap: [384, 128, 128, 128],
  tape: [0, 256, 512, 32], velvet: [0, 288, 512, 64], ribbon: [0, 352, 256, 32], braid: [256, 352, 256, 32],
  door: [0, 384, 80, 128], white: [448, 448, 64, 64],
};
export const PLANKS = 8;
/** The plank strips that carry Pip's chalk: a dash across the board, and the dash with an X (a spike mark, where a body stands). */
export const CHALK = { dash: 6, spike: 7 };

export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A region's uv rect, or a part of it: [u0, v0, u1, v1] (v0 its bottom), the parts fractions of the region (fv from its bottom). */
export function uvOf(name, fu0 = 0, fv0 = 0, fu1 = 1, fv1 = 1) {
  const [x, y, w, h] = REG[name], e = 0.5;
  const u = (f) => (x + e + (w - 2 * e) * f) / ATLAS, v = (f) => 1 - (y + h - e - (h - 2 * e) * f) / ATLAS;
  return [u(fu0), v(fv0), u(fu1), v(fv1)];
}
/** The white texel's rect: a face that is its vertex colour alone. */
export const WHITE = uvOf('white', 0.5, 0.5, 0.5, 0.5);

const _c = new THREE.Color();
/** A colour as linear rgb, shaded by k. */
export const rgb = (hex, k = 1) => { _c.set(hex); return [_c.r * k, _c.g * k, _c.b * k]; };

/** Coloured, uv-mapped triangles gathered for one geometry (non-indexed: each face its own normal, the paper theatre's flat cards). */
export class Sheet {
  constructor() { this.p = []; this.c = []; this.t = []; }
  get empty() { return this.p.length === 0; }
  vert(v, col, u, w) { this.p.push(v.x, v.y, v.z); this.c.push(col[0], col[1], col[2]); this.t.push(u, w); }
  tri(a, b, c, ca, cb = ca, cc = ca, ta = WHITE, tb = WHITE, tc = WHITE) {
    this.vert(a, ca, ta[0], ta[1]); this.vert(b, cb, tb[0], tb[1]); this.vert(c, cc, tc[0], tc[1]);
  }
  /** a b c d counter-clockwise seen from the side it faces; `col` one rgb or four (a b c d); `uv` a rect laid a(u0 v0) b(u1 v0) c(u1 v1) d(u0 v1). */
  quad(a, b, c, d, col, uv = WHITE) {
    const [ca, cb, cc, cd] = Array.isArray(col[0]) ? col : [col, col, col, col], [u0, v0, u1, v1] = uv;
    this.vert(a, ca, u0, v0); this.vert(b, cb, u1, v0); this.vert(c, cc, u1, v1);
    this.vert(a, ca, u0, v0); this.vert(c, cc, u1, v1); this.vert(d, cd, u0, v1);
  }
  /** A geometry shaped elsewhere (a cylinder, a lathe), its colour `col` (rgb, or a function of the vertex and its normal), on the white texel. */
  add(geo, col) {
    const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, N = g.attributes.normal, p = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i); if (N) n.fromBufferAttribute(N, i);
      this.vert(p, typeof col === 'function' ? col(p, n) : col, WHITE[0], WHITE[1]);
    }
    if (g !== geo) g.dispose();
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

/** An axis-aligned box's faces into a sheet: `faces` the ones wanted ('f' +z, 'b' -z, 't' top, 'u' under, 'l' -x, 'r' +x), `col` an rgb
 *  or a function (face) -> rgb, `uv` a rect or a function (face) -> rect. */
export function box(S, x0, x1, y0, y1, z0, z1, col, faces = 'ftlr', uv = WHITE) {
  const C = (f) => (typeof col === 'function' ? col(f) : col), U = (f) => (typeof uv === 'function' ? uv(f) : uv);
  if (faces.includes('f')) S.quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), C('f'), U('f'));
  if (faces.includes('b')) S.quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), C('b'), U('b'));
  if (faces.includes('t')) S.quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), C('t'), U('t'));
  if (faces.includes('u')) S.quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), C('u'), U('u'));
  if (faces.includes('l')) S.quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), C('l'), U('l'));
  if (faces.includes('r')) S.quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), C('r'), U('r'));
}

/** A cut-out card standing in the plane z (facing +z): its face (the polygon `pts`, [x, y] counter-clockwise), its card edge `thick` deep
 *  in `edge`'s colour, and behind it the printed keyline (the same silhouette grown by `keyline` m, in `ink`). `face` an rgb or a function
 *  (x, y) -> rgb; `uv` a function (x, y) -> [u, v] (else the white texel). */
export function card(S, pts, z, { thick = 0.05, face, edge, ink, keyline = 0.05, uv = null }) {
  const P = pts.map(([x, y]) => new THREE.Vector2(x, y)), tris = THREE.ShapeUtils.triangulateShape(P, []);
  const zf = z + thick / 2, zb = z - thick / 2, F = (x, y) => (typeof face === 'function' ? face(x, y) : face), T = (x, y) => (uv ? uv(x, y) : WHITE);
  for (const [i, j, k] of tris) {
    const a = P[i], b = P[j], c = P[k];
    S.tri(V(a.x, a.y, zf), V(b.x, b.y, zf), V(c.x, c.y, zf), F(a.x, a.y), F(b.x, b.y), F(c.x, c.y), T(a.x, a.y), T(b.x, b.y), T(c.x, c.y));
  }
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    S.quad(V(a.x, a.y, zb), V(b.x, b.y, zb), V(b.x, b.y, zf), V(a.x, a.y, zf), edge);
  }
  if (!keyline || !ink) return;
  const grown = P.map((p, i) => {
    const a = P[(i + P.length - 1) % P.length], b = P[(i + 1) % P.length];
    const n1 = new THREE.Vector2(p.y - a.y, a.x - p.x).normalize(), n2 = new THREE.Vector2(b.y - p.y, p.x - b.x).normalize();
    const m = n1.clone().add(n2), l = m.length(); if (l < 1e-4) return p.clone().addScaledVector(n1, keyline);
    m.divideScalar(l); const k = Math.min(3, 1 / Math.max(0.35, m.dot(n1)));
    return p.clone().addScaledVector(m, keyline * k);
  });
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(grown, [])) S.tri(V(grown[i].x, grown[i].y, zb - 0.01), V(grown[j].x, grown[j].y, zb - 0.01), V(grown[k].x, grown[k].y, zb - 0.01), ink);
}

// ---------------------------------------------------------------- the atlas, painted once
const css = (hex, k = 1, a = 1) => `rgba(${Math.min(255, Math.round(((hex >> 16) & 255) * k))},${Math.min(255, Math.round(((hex >> 8) & 255) * k))},${Math.min(255, Math.round((hex & 255) * k))},${a})`;

/** The plank strips: maple boards along v (the board's length, back to front), their seams dark at the strip's sides, grain and a nail
 *  at each end; strip 6 with a chalk dash across it, strip 7 the dash and an X (the spike mark). */
function paintPlanks(g, P) {
  for (let i = 0; i < PLANKS; i++) {
    const x0 = i * 32, tone = [0.94, 1.02, 0.88, 0.98, 1.06, 0.91, 0.97, 1.0][i];
    g.fillStyle = css(P.maple, tone); g.fillRect(x0, 0, 32, 256);
    for (let s = 0; s < 10; s++) {
      const gx = x0 + 3 + hash(i * 13 + s) * 26, w = 0.6 + hash(i * 7 + s * 3) * 1.4;
      g.strokeStyle = s % 3 === 0 ? css(P.chalk, 1, 0.12) : css(P.walnut, 1, 0.12 + 0.14 * hash(i + s * 5)); g.lineWidth = w;
      g.beginPath(); for (let y = 0; y <= 256; y += 8) { const x = gx + Math.sin(y * 0.025 + s * 1.7 + i) * 1.8; if (y === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
    }
    if (hash(i * 31) > 0.45) { const ky = 40 + hash(i * 17) * 170, kx = x0 + 8 + hash(i * 19) * 16; g.fillStyle = css(P.walnut, 0.9, 0.55); g.beginPath(); g.ellipse(kx, ky, 2.4, 5, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = css(P.ink, 1, 0.9); g.fillRect(x0, 0, 2, 256); g.fillRect(x0 + 31, 0, 1, 256);
    g.fillStyle = css(P.walnut, 0.6, 0.8); for (const y of [6, 250]) { g.fillRect(x0 + 8, y, 2, 2); g.fillRect(x0 + 22, y, 2, 2); }
    // Pip's tailor's chalk, toward the board's front end (the canvas's foot is the front: a board is laid with v 0 at the apron), so
    // it lies downstage of where a body stands
    if (i === CHALK.dash || i === CHALK.spike) { g.fillStyle = css(P.chalk, 1, 0.85); g.fillRect(x0, 182, 32, 8); }
    if (i === CHALK.spike) {
      g.strokeStyle = css(P.chalk, 1, 0.9); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0 + 6, 162); g.lineTo(x0 + 26, 210); g.moveTo(x0 + 26, 162); g.lineTo(x0 + 6, 210); g.stroke();
    }
    if (i === 5) { g.fillStyle = css(P.rose, 1.1, 0.7); g.beginPath(); g.moveTo(x0 + 10, 120); g.lineTo(x0 + 24, 126); g.lineTo(x0 + 10, 132); g.fill(); }
    if (i === 2) { g.fillStyle = css(P.sky, 1.05, 0.6); g.fillRect(x0 + 4, 140, 24, 5); }
  }
}

/** The whole atlas: every region in its own stock (the planks, walnut, linen, burlap, the tape and the braid in their colours; the velvet
 *  and the ribbon in grey, tinted by the vertex colour). */
export function atlasTexture(P) {
  const cv = document.createElement('canvas'); cv.width = cv.height = ATLAS;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(...REG.white);
  paintPlanks(g, P);
  // walnut: its grain along u
  { const [x0, y0, w, h] = REG.walnut; g.fillStyle = css(P.walnut); g.fillRect(x0, y0, w, h);
    for (let s = 0; s < 34; s++) {
      const gy = y0 + 2 + hash(s * 3.3) * (h - 4); g.strokeStyle = s % 4 === 0 ? css(P.maple, 0.9, 0.16) : css(P.ink, 1, 0.1 + 0.16 * hash(s)); g.lineWidth = 0.8 + hash(s * 5) * 2;
      g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = gy + Math.sin(x * 0.03 + s) * 2.2 + Math.sin(x * 0.11 + s * 2) * 0.6; if (x === 0) g.moveTo(x0 + x, y); else g.lineTo(x0 + x, y); } g.stroke();
    } }
  // linen: a fine plain weave, a slub or two
  { const [x0, y0, w, h] = REG.linen; g.fillStyle = css(P.linen); g.fillRect(x0, y0, w, h);
    for (let i = 0; i < w; i += 2) { g.fillStyle = css(P.burlapDark, 1, 0.05 + 0.04 * hash(i)); g.fillRect(x0 + i, y0, 1, h); g.fillStyle = css(P.chalk, 1, 0.06); g.fillRect(x0, y0 + i, w, 1); }
    for (let s = 0; s < 6; s++) { g.fillStyle = css(P.burlapDark, 1, 0.12); g.fillRect(x0 + hash(s) * w, y0 + hash(s * 9) * h, 10 + hash(s * 4) * 18, 1.5); } }
  // burlap: a coarse open weave
  { const [x0, y0, w, h] = REG.burlap; g.fillStyle = css(P.burlap); g.fillRect(x0, y0, w, h);
    for (let i = 0; i < w; i += 4) for (let j = 0; j < h; j += 4) { g.fillStyle = (i + j) % 8 === 0 ? css(P.burlapDark, 1, 0.35) : css(P.linen, 1, 0.14); g.fillRect(x0 + i, y0 + j, 3, 3); } }
  // the tape measure: mustard, ticks on both edges (a half and a whole), a rose diamond each fifth (no numerals: no words in the world)
  { const [x0, y0, w, h] = REG.tape; g.fillStyle = css(P.mustard); g.fillRect(x0, y0, w, h);
    g.fillStyle = css(P.ink, 1, 0.85);
    for (let i = 0; i <= 40; i++) { const x = x0 + i * 12.8, l = i % 5 === 0 ? 13 : i % 2 === 0 ? 9 : 5; g.fillRect(x - 0.8, y0, 1.6, l); g.fillRect(x - 0.8, y0 + h - l, 1.6, l); }
    g.fillStyle = css(P.rose, 0.9); for (let i = 0; i < 4; i++) { const x = x0 + 64 + i * 128, y = y0 + h / 2; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.fill(); }
    g.fillStyle = css(P.ink, 1, 0.5); g.fillRect(x0, y0, w, 1); g.fillRect(x0, y0 + h - 1, w, 1); }
  // velvet: grey pleats across u (the vertex colour dyes them), a soft nap
  { const [x0, y0, w, h] = REG.velvet;
    for (let i = 0; i < w; i++) { const c = Math.cos((i / 32) * Math.PI * 2), L = 0.34 + 0.66 * Math.pow(0.5 + 0.5 * c, 1.5) + 0.04 * (hash(i) - 0.5); g.fillStyle = `rgb(${Math.round(L * 255)},${Math.round(L * 248)},${Math.round(L * 248)})`; g.fillRect(x0 + i, y0, 1, h); } }
  // ribbon: grey satin, a sheen down its middle and a selvedge at each edge
  { const [x0, y0, w, h] = REG.ribbon;
    for (let j = 0; j < h; j++) { const t = Math.abs(j - h / 2) / (h / 2), L = j === 2 || j === h - 3 ? 0.95 : 0.62 + 0.38 * Math.pow(1 - t, 3); g.fillStyle = `rgb(${Math.round(L * 255)},${Math.round(L * 255)},${Math.round(L * 255)})`; g.fillRect(x0, y0 + j, w, 1); } }
  // gold braid: a twist in two golds, a dark keyline at each edge
  { const [x0, y0, w, h] = REG.braid; g.fillStyle = css(P.gold, 0.8); g.fillRect(x0, y0, w, h);
    for (let i = -h; i < w; i += 10) { g.fillStyle = css(P.gold, 1.15); g.beginPath(); g.moveTo(x0 + i, y0 + h); g.lineTo(x0 + i + 5, y0 + h); g.lineTo(x0 + i + 5 + h * 0.6, y0); g.lineTo(x0 + i + h * 0.6, y0); g.fill(); }
    g.fillStyle = css(P.ink, 1, 0.8); g.fillRect(x0, y0, w, 2); g.fillRect(x0, y0 + h - 2, w, 2); }
  // a stage door's printed face: walnut, four raised panels, a brass knob and kick plate, keylined
  { const [x0, y0, w, h] = REG.door; g.fillStyle = css(P.walnut, 0.9); g.fillRect(x0, y0, w, h);
    for (const [px, py, pw, ph] of [[10, 12, 26, 44], [44, 12, 26, 44], [10, 66, 26, 44], [44, 66, 26, 44]]) {
      g.fillStyle = css(P.walnut, 1.25); g.fillRect(x0 + px, y0 + py, pw, ph);
      g.fillStyle = css(P.maple, 0.95, 0.75); g.fillRect(x0 + px, y0 + py, pw, 2); g.fillRect(x0 + px, y0 + py, 2, ph);
      g.fillStyle = css(P.ink, 1, 0.75); g.fillRect(x0 + px, y0 + py + ph - 2, pw, 2); g.fillRect(x0 + px + pw - 2, y0 + py, 2, ph);
    }
    g.fillStyle = css(P.brass, 1.05); g.beginPath(); g.arc(x0 + 66, y0 + 62, 3.5, 0, Math.PI * 2); g.fill(); g.fillRect(x0 + 6, y0 + 116, w - 12, 7);
    g.strokeStyle = css(P.ink); g.lineWidth = 3; g.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
  return t;
}

/** The light's one soft spot: white at its heart to black at its rim (the additive material adds it, so black is nothing). */
export function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.22, 'rgba(255,246,232,0.7)'); r.addColorStop(0.55, 'rgba(255,236,210,0.22)'); r.addColorStop(1, 'rgba(255,230,200,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
