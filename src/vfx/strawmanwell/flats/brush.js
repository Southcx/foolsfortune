// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE BRUSH: the paint kit every flat's painter uses (vfx/strawmanwell/flats/*.js), drawing on a 2D
// canvas in metres, y up from the foot (vfx/strawmanwell/flats/build.js sets the transform: `px` is one texel in metres). A flat is a
// toy-theatre cut-out: its silhouette stroked in ink, the card's cut edge showing a few texels above it (the stalls see the tops of
// the cards), the face painted inside the silhouette in washes, soft dabs and short strokes, a print's hatching in its shade; the
// whole sheet then hazed toward the backdrop's air (the far flats paler and cooler) and grained like paper. Shapes that are unions of
// discs (a cloud, a haystack) are stroked whole and then filled whole, so no keyline is left inside them.
//
// Prior art: Pollock's and Webb's toy-theatre sheets (hand-coloured engravings: an ink line, flat washes, hatching in the shade),
// the cut-out card's white core showing at its edge (Paper Mario, Tearaway), the sign-painter's soft dab and the wet-on-dry wash;
// this house's canvas painters (vfx/sandbox/pitchlook.js, vfx/areacards.js).
//
//   css(hex, a)  mix(a, b, t)  shade(hex, k)   periodic(W, base, [[n, amp, phase]]) -> h(x)   band(h, x0, x1, step, foot) -> Path2D
//   cutOut(g, path, face, { px, key, edge, kw, lift })   dabs(g, R, o)   strokes(g, R, o)   hatch(g, x0, y0, x1, y1, o)   vwash(g, x, y0, w, y1, stops)
//   disc(path, x, y, r, ry)   poly(path, pts)   rect(path, x, y, w, h)   finish(g, w, h, { haze, hazeA, grain, R })   INK, CARD
// ---------------------------------------------------------------------------------------

/** The keyline's ink and the card's cut edge (its pale core). */
export const INK = 0x2a1a12, CARD = 0xf2e6c8;

/** A hex colour as CSS, with an alpha. */
export const css = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
/** Two colours mixed in sRGB, t from a (0) to b (1). */
export function mix(a, b, t) {
  const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
}
/** A colour lightened toward white (k > 0) or darkened toward black (k < 0). */
export const shade = (c, k) => (k >= 0 ? mix(c, 0xffffff, k) : mix(c, 0x000000, -k));

/** A profile that repeats every W metres (whole waves only): base + the sum of amp * sin(2 pi n x / W + phase). */
export function periodic(W, base, terms) {
  return (x) => { let h = base; for (const [n, a, p] of terms) h += a * Math.sin((2 * Math.PI * n * x) / W + p); return h; };
}
// Every shape here is wound one way (counter-clockwise, y up), so a union of them fills whole under the nonzero rule; a hole is
// wound the other way on purpose (a gear's bore).
/** The band from `foot` up to a profile, x0 to x1 (metres): a closed path. */
export function band(h, x0, x1, step = 0.25, foot = -1) {
  const p = new Path2D(); p.moveTo(x0, foot); p.lineTo(x1, foot);
  for (let x = x1; x > x0 - step; x -= step) p.lineTo(Math.max(x, x0), h(Math.max(x, x0)));
  p.closePath(); return p;
}
/** A disc or an ellipse added to a path. */
export function disc(p, x, y, r, ry = r) { p.moveTo(x + r, y); p.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); return p; }
/** A polygon added to a path, turned to the common winding whichever way its points were given. */
export function poly(p, pts) {
  let a = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  const q = a < 0 ? [...pts].reverse() : pts;
  p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]); p.closePath(); return p;
}
export function rect(p, x, y, w, h) { return poly(p, [[x, y], [x, y + h], [x + w, y + h], [x + w, y]]); }

/** A cut-out: the card's edge a few texels above the silhouette with its own keyline (the card's thickness), the silhouette's
 *  keyline, then `face(g)` painted clipped inside it. kw is the keyline's half width and lift the edge's rise, in texels. */
export function cutOut(g, path, face, { px, key = INK, edge = CARD, kw = 2.2, lift = 5 } = {}) {
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = kw * 2 * px; g.strokeStyle = css(key);
  if (lift > 0) { g.save(); g.translate(px * 1.5, lift * px); g.stroke(path); g.fillStyle = css(edge); g.fill(path); g.restore(); }
  g.stroke(path);
  g.save(); g.clip(path); face(g); g.restore();
  g.restore();
}

/** A vertical wash: a gradient from y0 to y1 over [x, x + w], stops as [t, hex, alpha?]. */
export function vwash(g, x, y0, w, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [t, c, a = 1] of stops) gr.addColorStop(t, css(c, a));
  g.fillStyle = gr; g.fillRect(x, Math.min(y0, y1), w, Math.abs(y1 - y0));
}
/** Soft dabs (a loaded brush pressed and lifted): n ellipses in the box, sizes r, colours from `cols`, alphas in `alpha`. */
export function dabs(g, R, { x, y, w, h, n, r = [0.2, 0.6], cols, alpha = [0.12, 0.3], squash = 0.6, tilt = null }) {
  for (let i = 0; i < n; i++) {
    const rr = r[0] + R() * (r[1] - r[0]);
    g.fillStyle = css(cols[(R() * cols.length) | 0], alpha[0] + R() * (alpha[1] - alpha[0]));
    g.beginPath(); g.ellipse(x + R() * w, y + R() * h, rr, rr * squash, tilt ?? R() * Math.PI, 0, Math.PI * 2); g.fill();
  }
}
/** Short strokes (straw, grass, a brush's hair): n of them, each `len` long, leaning by `lean` (radians off upright), `lw` wide. */
export function strokes(g, R, { x, y, w, h, n, len = [0.4, 1], lw = 0.06, cols, alpha = [0.5, 0.9], lean = 0.3, bend = 0.15 }) {
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x0 = x + R() * w, y0 = y + R() * h, L = len[0] + R() * (len[1] - len[0]), a = Math.PI / 2 + (R() * 2 - 1) * lean;
    const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L, b = (R() * 2 - 1) * bend * L;
    g.strokeStyle = css(cols[(R() * cols.length) | 0], alpha[0] + R() * (alpha[1] - alpha[0])); g.lineWidth = lw * (0.7 + R() * 0.6);
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + b, (y0 + y1) / 2, x1, y1); g.stroke();
  }
  g.restore();
}
/** An engraver's hatching across a box: parallel lines `gap` apart at `angle`, `lw` wide (keep them two texels or more). */
export function hatch(g, x0, y0, x1, y1, { gap = 0.25, angle = 0.8, lw = 0.05, col = INK, a = 0.18 } = {}) {
  const dx = Math.cos(angle), dy = Math.sin(angle), span = Math.hypot(x1 - x0, y1 - y0);
  g.save(); g.strokeStyle = css(col, a); g.lineWidth = lw; g.beginPath();
  for (let s = -span; s < span; s += gap) {
    const cx = (x0 + x1) / 2 - dy * s, cy = (y0 + y1) / 2 + dx * s;
    g.moveTo(cx - dx * span, cy - dy * span); g.lineTo(cx + dx * span, cy + dy * span);
  }
  g.stroke(); g.restore();
}

/** The paper's grain: a small tile of soft specks and fibres, light and dark, laid over what is painted (its alpha kept). */
function grainTile(R) {
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d'), im = g.createImageData(96, 96), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const v = R() < 0.5 ? 255 : 40; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = (R() * R()) * 34; }
  g.putImageData(im, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = R() < 0.5 ? 'rgba(255,248,230,0.10)' : 'rgba(40,24,12,0.08)'; g.lineWidth = 1 + R();
    const x = R() * 96, y = R() * 96, a = R() * Math.PI, l = 4 + R() * 10;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
/** The sheet finished, in texels (no transform): hazed toward the air (`haze` at `hazeA`) and grained, its alpha kept. */
export function finish(g, w, h, { haze = null, hazeA = 0, grain = 1, R }) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
  if (haze != null && hazeA > 0) { g.fillStyle = css(haze, hazeA); g.fillRect(0, 0, w, h); }
  if (grain > 0) { const t = grainTile(R); g.globalAlpha = grain; g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, w, h); t.width = t.height = 0; }
  g.restore();
}
