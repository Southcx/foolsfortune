// ---------------------------------------------------------------------------------------
// BLACK-FIGURE: the painter of the town that was's ware (Elpis, Espada's proposal), in the hand of the EYE CUP glaze. Flat black
// silhouettes on the red clay, their details scratched back through the black to the red, a groundline under them, and a touch of added
// white and added red. It paints a word's PICTURE (what the word does: the slip jellies and the town's folk at it), the MEANDER (the
// Greek key, for a word with no picture), the stele's FRIEZE (the folk and the slip jellies at work together) and the ornament a pot is
// zoned with (the TONGUES of a border band, the PALMETTE under a handle, a ROSETTE filler), as canvas paths sampled into points, so a figure
// can lean, squash and bend and still be crisp at any size.
//
// The black is what museums call black gloss; it is "the black" here, since a gloss is the Crib Sheet's (the English beside a word).
// A figure in front of another is parted from it by a scratched contour, as Exekias parts Achilles from Ajax.
//
// Prior art: Attic black-figure (Exekias's Achilles and Ajax at the board game and his Dionysos cup; Kleitias's Francois Vase, its small
// figures on groundlines in friezes), the Corinthian pinakes of Penteskouphia (potters at the potter's wheel and at a kiln, painted on clay
// plaques), the fountain-house hydriai (figures at the water under a portico), and the meander of the Geometric amphorae. The next four:
// the mourners of the prothesis (Exekias's funerary plaques: a figure bowed over the one laid out), the heraldic pair of the animal
// friezes (Corinthian goats and lions confronted, head to head), the pursuit on the Francois Vase (Troilos fleeing Achilles, the one
// running looking back), and for the melt, the set's own dashed line (the play's flight) round where the jelly stood.
//
// THE WHITE-GROUND HAND (the keepsake pot's: vfx/garden/lekythos.js): the same figures, the same strokes, turned inside out for the
// Athenian funerary lekythos of the fifth century BC: outlined on a white ground in a line (the dilute glaze), the black's place taken by
// a thin wash of colour, the incisions drawn as lines, added white kept by its outline (the Achilles Painter, the Bosanquet Painter,
// the Reed Painter: a figure beside a grave stele, ribbons tied round it, lekythoi set on its steps).
//
//   PICTURES[WORD] -> picture id (the word's English, for each word of Espada's OSTRACON_PICTURES, npc/neuralese.js, that a painter here paints)
//   paintPicture(g, id, x, y, w, h, span?) -> true | false (no such picture; span: [x0, x1], how far its groundline runs, in pixels)
//   paintMeander(g, x, y, w, h, style?)    paintFrieze(g, x, y, w, h)    paintTongues(g, x, y, w, h)    paintPalmette(g, cx, foot, s)    paintRosette(g, cx, cy, r)
//   paintLikeness(g, kind, x, y, w, h, { line, wash, ground, ribbon? })   paintStele(g, x, y, w, h, { line, ribbon, ground })   (white-ground)
//   WARE = { black, clay, white, red }   (g: a 2D canvas context; x, y, w, h: the zone in its pixels; the zone's red ground is the caller's)
// ---------------------------------------------------------------------------------------

import { OSTRACON_PICTURES, glossOf } from '../npc/neuralese.js';

/** The ware's colours: the black (EYE CUP's 0x1c1410), the Attic orange-red clay, added white and added red. */
export const WARE = { black: '#1c1410', clay: '#c8643a', white: '#efe2c6', red: '#7d2622' };

const INC = 0.55;
const GY = 5;
let M0 = null;

// ---- a path as points: each curve sampled, so any warp (a lean, a squash, a bend) bends it, and strokes keep their width
class Trace {
  constructor() { this.subs = []; this.cur = null; }
  M(x, y) { this.cur = [[x, y]]; this.subs.push(this.cur); return this; }
  L(x, y) { this.cur.push([x, y]); return this; }
  Q(cx, cy, x, y, n = 10) { const [x0, y0] = this.cur[this.cur.length - 1]; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; this.cur.push([u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y]); } return this; }
  C(ax, ay, bx, by, x, y, n = 14) { const [x0, y0] = this.cur[this.cur.length - 1]; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; this.cur.push([u * u * u * x0 + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x, u * u * u * y0 + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y]); } return this; }
  O(cx, cy, rx, ry = rx, n = 20) { this.M(cx + rx, cy); for (let i = 1; i <= n; i++) { const a = (i / n) * Math.PI * 2; this.L(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } return this.Z(); }
  Z() { this.cur.closed = true; return this; }
}
const tr = () => new Trace();
const ID = (x, y) => [x, y];

function trace(g, t, T = ID) {
  g.beginPath();
  for (const sub of t.subs) { sub.forEach(([x, y], i) => { const [X, Y] = T(x, y); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); if (sub.closed) g.closePath(); }
}
function lay(g, width, style) { g.save(); g.setTransform(M0); g.lineWidth = width; g.strokeStyle = style; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.restore(); }
/** A silhouette: a scratched contour round it (it parts it from what is behind), then the black. In the white-ground hand: its wash,
 *  and its contour drawn in the line. */
function solid(g, t, T, contour = true) {
  trace(g, t, T);
  if (OUTLINE) { if (OUTLINE.wash) { g.fillStyle = OUTLINE.wash; g.fill(); } lay(g, INC * 1.7, OUTLINE.line); return; }
  if (contour) lay(g, INC * 2.4, WARE.clay); g.fillStyle = WARE.black; g.fill();
}
/** An incision: scratched through the black to the red (in the white-ground hand, a line drawn in the dilute glaze). */
function cut(g, t, T, w = INC) { trace(g, t, T); lay(g, OUTLINE ? w * 1.1 : w, OUTLINE ? OUTLINE.line : WARE.clay); }
function paint(g, t, T, style) {
  trace(g, t, T); g.fillStyle = OUTLINE ? outlined(style) : style; g.fill();
  if (OUTLINE && style === WARE.white) lay(g, INC * 0.9, OUTLINE.line); // (added white on white: kept by its outline)
}
function line(g, t, T, w, style = WARE.black) { if (OUTLINE && style === WARE.white) return; trace(g, t, T); lay(g, OUTLINE ? Math.min(w, INC * 2) : w, OUTLINE ? OUTLINE.line : style); }
/** A limb: a thick black stroke, with its contour scratched round it where it crosses the black (white-ground: outlined, washed). */
function limb(g, t, T, w) {
  trace(g, t, T);
  if (OUTLINE) { lay(g, w + INC * 1.7, OUTLINE.line); lay(g, w, OUTLINE.wash || OUTLINE.ground); return; }
  lay(g, w + INC * 2.4, WARE.clay); lay(g, w, WARE.black);
}
// ---- the white-ground hand (paintLikeness, paintStele): the same figures, outlined on a white ground in a dilute line, washed in a colour
let OUTLINE = null;
function outlined(style) { return style === WARE.black ? OUTLINE.line : style === WARE.white || style === WARE.clay ? OUTLINE.ground : OUTLINE.wash || OUTLINE.ground; }

function frame(g, x, y, w, h, units = 100) { g.save(); g.translate(x, y + h); const s = w / units; g.scale(s, -s); M0 = g.getTransform(); return { W: units, H: h / s }; }
function groundSpan(g, u0, u1, y = GY) { line(g, tr().M(u0, y).L(u1, y), ID, 1.1); line(g, tr().M(u0, y - 1.9).L(u1, y - 1.9), ID, 0.5); }
function ground(g, W, y = GY) { groundSpan(g, 1, W - 1, y); }

// ---- the figures' transforms: local units (a slip jelly 20 tall, a folk 31), standing at (x, y), facing +1 right or -1 left
function place(x, y, s = 1, face = 1) { return (px, py) => [x + face * s * px, y + s * py]; }
/** A slip jelly's warp: squashed (its volume kept: lower and wider), then leaned (sheared, its base where it was). */
function jellyT(x, y, o) {
  const s = o.s ?? 1, f = o.face ?? 1, sq = o.squash ?? 1, lean = o.lean ?? 0, k = 1 / Math.sqrt(sq);
  return (px, py) => { const Y = py * sq; return [x + f * s * (px * k + lean * Y), y + s * Y]; };
}

// ---- the slip jelly (creatures/jelly/slipjelly.js: an egg of sloppy wet sand on four toes, always melting), in profile:
// an egg with a soft peak, slumping at its foot into the puddle it sits in, drips running down it, one big eye in added white
let JELLY = null;
function jellyShapes() {
  if (JELLY) return JELLY;
  const body = tr().M(-1.2, 21.6).C(2.6, 21.3, 8.6, 17.6, 8.8, 11.6).C(9.0, 7.6, 9.8, 5.0, 11.4, 3.0).Q(13.3, 1.2, 13.6, 0.2).L(14.6, 0).L(-14.2, 0)
    .Q(-13.4, 0.5, -12.0, 2.6).C(-10.2, 4.8, -9.3, 7.6, -9.3, 11.6).C(-9.3, 16.6, -6.2, 20.4, -3.6, 21.0).Q(-2.6, 22.8, -1.2, 21.6).Z();
  const curl = tr().M(-1.6, 18.6).C(4.4, 19.4, 9.8, 15.2, 9.8, 9.4).C(9.8, 3.8, 7.4, 0, 1.2, 0).L(-8.6, 0).C(-10.4, 2.4, -10.6, 6.6, -10.2, 9.6)
    .C(-9.6, 14.6, -6.2, 18.2, -3.4, 18.6).Q(-2.2, 20.6, 0.4, 20.4).Q(-0.4, 19.2, -1.6, 18.6).Z();
  const drips = tr().M(6.4, 16.2).Q(7.4, 12.4, 7.0, 9.4).O(7.0, 8.7, 0.7).M(-3.8, 19.0).Q(-6.6, 15, -6.2, 10.6).O(-6.2, 9.9, 0.7)
    .M(5.0, 0.4).Q(4.2, 2.2, 5.4, 3.6).M(-4.6, 0.4).Q(-3.8, 2.2, -5.0, 3.6);
  const tuck = tr().M(6.4, 2.6).Q(1.6, 6.2, -5.0, 3.4).M(-6.6, 14.6).Q(-8.0, 11, -7.6, 7.0);
  const sheen = tr().M(-1.4, 20.2).Q(-6.0, 19.0, -7.6, 14.6);
  return (JELLY = { body, curl, drips, tuck, sheen });
}
/** Its eye: 'open' (look: where the pupil sits), 'wide' (centred unless it looks), 'shut', 'glad', 'fierce' (its lid brought down to the front). */
function eye(g, kind, T, cx, cy, look) {
  if (kind === 'shut') { cut(g, tr().M(cx - 2.2, cy + 0.6).Q(cx, cy - 1.6, cx + 2.2, cy + 0.6).M(cx - 1.2, cy - 0.4).L(cx - 1.6, cy - 1.4).M(cx + 0.4, cy - 0.7).L(cx + 0.4, cy - 1.8), T); return; }
  if (kind === 'glad') { cut(g, tr().M(cx - 2.2, cy - 0.6).Q(cx, cy + 2.0, cx + 2.2, cy - 0.6), T, INC * 1.3); return; }
  if (kind === 'fierce') {
    paint(g, tr().O(cx, cy, 2.5), T, WARE.white); paint(g, tr().O(cx + 0.9, cy - 0.5, 1.1), T, WARE.black);
    paint(g, tr().M(cx - 3.2, cy + 3.4).L(cx + 3.2, cy + 3.4).L(cx + 3.2, cy + 0.2).L(cx - 3.2, cy + 2.0).Z(), T, WARE.black);
    cut(g, tr().M(cx - 2.6, cy + 1.85).L(cx + 2.7, cy + 0.35), T, INC * 1.2); return;
  }
  const wide = kind === 'wide', [lx, ly] = look ?? (wide ? [0, 0] : [0.6, 0]);
  paint(g, tr().O(cx, cy, wide ? 2.9 : 2.4), T, WARE.white); paint(g, tr().O(cx + lx, cy + ly, wide ? 0.8 : 1.1), T, WARE.black);
}
/** A slip jelly: o = { s, face, squash, lean, eye: 'open'|'wide'|'shut'|'glad', look, curl, mouth, arm: [[x, y], ...] (a pseudopod from its front), hand: 'open' }. Returns its transform. */
function jelly(g, x, y, o = {}) {
  const J = jellyShapes(), T = jellyT(x, y, o), s = o.s ?? 1;
  solid(g, o.curl ? J.curl : J.body, T, o.contour !== false);
  cut(g, o.curl ? J.tuck : J.drips, T);
  if (o.mouth) cut(g, tr().M(5.4, 9.8).Q(6.9, 8.8, 8.3, 9.7), T);
  if (o.arm) {
    const a = tr().M(...o.arm[0]); for (let i = 1; i < o.arm.length; i++) a.L(...o.arm[i]);
    limb(g, a, T, 2.2 * s);
    const [hx, hy] = o.arm[o.arm.length - 1], [px, py] = o.arm[o.arm.length - 2], d = Math.atan2(hy - py, hx - px);
    if (o.hand === 'open') { const f = tr(); for (const k of [-0.8, 0, 0.8]) f.M(hx, hy).L(hx + Math.cos(d + k) * 2.3, hy + Math.sin(d + k) * 2.3 + 0.5); limb(g, f, T, 0.9 * s); }
  }
  eye(g, o.eye ?? 'open', T, o.curl ? 5.2 : 4.2, o.curl ? 12.0 : 13.6, o.look);
  line(g, J.sheen, T, INC * 1.5 * s, WARE.white);
  return T;
}

// ---- the town's folk (npc/folk.js: a clapperjar grown up, a jar body with a lid for a head), in profile, the black-figure way
const ARMS = {
  down: [[1.6, -4.6], [2.4, -8.6]], reach: [[4.2, -2.0], [8.6, -1.4]], point: [[4.4, 0.2], [9.0, 2.4]], up: [[2.6, 4.0], [3.6, 8.0]],
  hold: [[3.8, -1.0], [6.4, 3.4]], rest: [[3.8, -3.6], [7.6, -6.8]], pole: [[3.6, -2.6], [7.0, -3.4]], carry: [[2.6, 2.8], [0.8, 6.0]],
  back: [[-2.2, -4.0], [-4.0, -7.4]], swing: [[2.0, -4.2], [4.6, -6.8]], wheel: [[4.6, -3.8], [8.4, -5.6]], raise: [[3.2, 4.6], [5.0, 9.4]],
};
const LEGS = {
  stand: [[[1.2, 7.4], [1.5, 4], [1.4, 1.2], [0.8, 0.6], [3.4, 0.6]], [[-1.2, 7.4], [-1.4, 4], [-1.3, 1.2], [-1.9, 0.6], [0.7, 0.6]]],
  walk: [[[1.4, 7.4], [3.2, 4.2], [4.6, 1.2], [4.0, 0.6], [6.6, 0.6]], [[-1.0, 7.4], [-2.4, 4.0], [-4.0, 1.5], [-4.8, 1.6], [-2.4, 0.5]]],
  sit: [[[1.5, 10.6], [6.6, 10.4], [7.0, 1.2], [6.4, 0.6], [9.0, 0.6]], [[0.5, 10.8], [5.6, 10.8], [5.4, 1.2], [4.8, 0.6], [7.4, 0.6]]],
};
function leg(g, pts, T, s) { limb(g, tr().M(...pts[0]).L(...pts[1]).L(...pts[2]), T, 2.3 * s); limb(g, tr().M(...pts[3]).L(...pts[4]), T, 1.5 * s); }
function arm(g, kind, sh, T, s, hand) {
  const [e, h] = ARMS[kind] || ARMS.down, E = [sh[0] + e[0], sh[1] + e[1]], H = [sh[0] + h[0], sh[1] + h[1]];
  limb(g, tr().M(...sh).L(...E).L(...H), T, 1.8 * s);
  const d = Math.atan2(H[1] - E[1], H[0] - E[0]);
  if (hand === 'open') { const f = tr(); for (const k of [-0.6, 0, 0.6]) f.M(...H).L(H[0] + Math.cos(d + k) * 1.9, H[1] + Math.sin(d + k) * 1.9); limb(g, f, T, 0.7 * s); }
  else if (hand === 'point') limb(g, tr().M(...H).L(H[0] + Math.cos(d) * 2.4, H[1] + Math.sin(d) * 2.4), T, 0.7 * s);
  else paint(g, tr().O(H[0], H[1], 1.05), T, WARE.black);
  return H;
}
/** One of the town's folk: o = { s, face, pose: 'stand'|'walk'|'sit', near, far (arm poses), hand, farHand }. Returns { T, hand } (its near hand, local). */
function folk(g, x, y, o = {}) {
  const s = o.s ?? 1, T = place(x, y, s, o.face ?? 1), pose = o.pose ?? 'stand', dy = pose === 'sit' ? 3.2 : 0, L = LEGS[pose] || LEGS.stand;
  if (pose === 'sit') { solid(g, tr().M(-6.4, 8.0).L(3.4, 8.0).L(3.4, 9.2).L(-6.4, 9.2).Z(), T); limb(g, tr().M(-5.4, 8).Q(-5.2, 4, -6.4, 0.3).M(2.4, 8).Q(2.2, 4, 3.4, 0.3).M(-5.6, 3.4).L(2.6, 3.4), T, 1.0 * s); }
  arm(g, o.far ?? 'down', [-0.8, 20.9 + dy], T, s, o.farHand);
  leg(g, L[1], T, s);
  const jar = tr().M(-2.8, 6.0 + dy).L(2.8, 6.0 + dy).C(5.5, 7.0 + dy, 7.4, 10.5 + dy, 7.2, 14.0 + dy).C(7.0, 18.0 + dy, 4.8, 20.6 + dy, 3.0, 21.6 + dy).L(2.6, 23.6 + dy)
    .L(-2.6, 23.6 + dy).L(-3.0, 21.6 + dy).C(-4.8, 20.6 + dy, -7.0, 18.0 + dy, -7.2, 14.0 + dy).C(-7.4, 10.5 + dy, -5.5, 7.0 + dy, -2.8, 6.0 + dy).Z();
  solid(g, jar, T);
  // its band in added red, between two scratched lines; the shoulder and the foot ring scratched
  g.save(); trace(g, jar, T); g.clip(); paint(g, tr().M(-8, 12.2 + dy).Q(0, 10.8 + dy, 8, 12.2 + dy).L(8, 14.6 + dy).Q(0, 13.2 + dy, -8, 14.6 + dy).Z(), T, WARE.red); g.restore();
  cut(g, tr().M(-7.4, 12.2 + dy).Q(0, 10.8 + dy, 7.4, 12.2 + dy).M(-7.4, 14.6 + dy).Q(0, 13.2 + dy, 7.4, 14.6 + dy).M(-5.4, 19.4 + dy).Q(0, 17.8 + dy, 5.4, 19.4 + dy).M(-3.6, 7.3 + dy).L(3.6, 7.3 + dy), T);
  leg(g, L[0], T, s);
  // the lid: its rim, its dome, its knob; an eye on its front
  solid(g, tr().M(-4.4, 23.5 + dy).L(4.8, 23.5 + dy).L(4.6, 24.8 + dy).L(-4.2, 24.8 + dy).Z(), T);
  solid(g, tr().M(-3.9, 24.6 + dy).C(-3.9, 28.6 + dy, -1.6, 30 + dy, 0, 30 + dy).C(1.8, 30 + dy, 4.1, 28.8 + dy, 4.1, 24.6 + dy).Z(), T);
  solid(g, tr().O(0, 31.3 + dy, 1.15).M(-0.5, 29.6 + dy).L(0.5, 29.6 + dy).L(0.5, 30.6 + dy).L(-0.5, 30.6 + dy).Z(), T);
  cut(g, tr().M(0.5, 27.2 + dy).Q(1.9, 28.5 + dy, 3.3, 27.3 + dy).Q(1.9, 26.2 + dy, 0.5, 27.2 + dy), T);
  paint(g, tr().O(2.0, 27.25 + dy, 0.42), T, WARE.clay);
  const hand = arm(g, o.near ?? 'down', [1.0, 20.6 + dy], T, s, o.hand);
  return { T, hand };
}

// ---- things in the pictures
function palm(g, x, y, s = 1, lean = -0.2) {
  const T = place(x, y, s), top = [lean * 30, 30], trunk = tr().M(-1.9, 0).Q(lean * 12 - 0.8, 15, top[0] - 0.9, top[1]).L(top[0] + 0.9, top[1]).Q(lean * 12 + 1.2, 15, 1.9, 0).Z();
  solid(g, trunk, T);
  const ch = tr(); for (let i = 1; i < 10; i++) { const t = i / 10, cx = lean * 30 * t * t + (1 - t) * 0, cy = 30 * t, w = 1.7 - 0.8 * t; ch.M(cx - w, cy + 0.9).L(cx, cy).L(cx + w, cy + 0.9); } cut(g, ch, T);
  for (const [a, L] of [[0.15, 15], [0.6, 14], [1.1, 11], [2.0, 11], [2.55, 14], [3.0, 15], [1.55, 9]]) {
    const leaf = tr(), mid = tr(), n = 12;
    const pt = (t, side) => { const ang = a - t * t * 0.9 * Math.cos(a) * (a < 1.57 ? 1 : -1), r = L * t, w = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 1.5 * side; return [top[0] + Math.cos(ang) * r - Math.sin(ang) * w, top[1] + Math.sin(ang) * r * 0.7 - t * t * 4 + Math.cos(ang) * w]; };
    leaf.M(...pt(0, 1)); for (let i = 1; i <= n; i++) leaf.L(...pt(i / n, 1)); for (let i = n; i >= 0; i--) leaf.L(...pt(i / n, -1)); leaf.Z();
    mid.M(...pt(0.05, 0)); for (let i = 1; i <= n; i++) mid.L(...pt(i / n * 0.95, 0));
    solid(g, leaf, T); cut(g, mid, T);
  }
  for (const [dx, dy] of [[-0.8, -1.2], [0.6, -1.6], [-0.1, -2.6], [1.2, -0.6]]) paint(g, tr().O(top[0] + dx, top[1] + dy, 0.8), T, WARE.red);
}
function basin(g, x0, x1, y = GY, depth = 6) {
  const m = (x0 + x1) / 2; solid(g, tr().M(x0, y).Q(m, y - depth * 2, x1, y).Z(), ID, false);
  const w = tr(); for (const [dy, a] of [[-1.4, 0.6], [-3.2, 0.5]]) { w.M(x0 + 3, y + dy); for (let x = x0 + 3; x <= x1 - 3; x += 1) w.L(x, y + dy + Math.sin(x * 0.9) * a); }
  line(g, w, ID, 0.5, WARE.white);
}
function reeds(g, x, y, s = 1) {
  const T = place(x, y, s), st = tr().M(0, 0).Q(-1, 12, -3, 22).M(1, 0).Q(1.5, 10, 3.5, 18).M(-0.5, 0).Q(0, 8, 0.5, 14);
  line(g, st, T, 0.8 * s); solid(g, tr().O(-3.2, 23.5, 0.9, 2.4).O(3.7, 19.5, 0.8, 2.1), T, false);
  limb(g, tr().M(0, 3).Q(-4, 6, -6, 5).M(0.6, 5).Q(4, 8, 6.5, 7), T, 0.7 * s);
}
function sun(g, x, y, r = 5) { const ray = tr(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ray.M(x + Math.cos(a) * (r + 1.2), y + Math.sin(a) * (r + 1.2)).L(x + Math.cos(a) * (r + 3.4), y + Math.sin(a) * (r + 3.4)); } line(g, ray, ID, 0.9); solid(g, tr().O(x, y, r), ID, false); cut(g, tr().O(x, y, r * 0.6), ID); }
function moon(g, x, y, r = 6) { paint(g, tr().O(x, y, r), ID, WARE.white); paint(g, tr().O(x + r * 0.45, y + r * 0.22, r * 0.86), ID, WARE.clay); }
function star(g, x, y, r = 1.4) { line(g, tr().M(x - r, y).L(x + r, y).M(x, y - r).L(x, y + r), ID, 0.55, WARE.white); }
function bauble(g, x, y, r = 2.8) { trace(g, tr().O(x, y, r)); lay(g, 0.8, WARE.black); g.fillStyle = WARE.white; g.fill(); paint(g, tr().O(x - r * 0.35, y + r * 0.35, r * 0.3), ID, WARE.red); }
function drops(g, pts, r = 0.7, style = WARE.white) { for (const [x, y] of pts) paint(g, tr().M(x, y + r * 2.2).Q(x + r * 1.2, y, x, y - r).Q(x - r * 1.2, y, x, y + r * 2.2).Z(), ID, style); }
/** A trace's outline in dashes (world units along it): where a thing was, as the play's flight is dashed. */
function dashed(t, T, on = 1.5, off = 1.1) {
  const d = tr();
  for (const sub of t.subs) {
    const pts = sub.map(([x, y]) => T(x, y)); if (sub.closed) pts.push(pts[0]);
    let pen = true, left = on; d.M(...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      let [x0, y0] = pts[i - 1], seg = Math.hypot(pts[i][0] - x0, pts[i][1] - y0);
      const [x1, y1] = pts[i];
      while (seg > left) { const k = left / seg; x0 += (x1 - x0) * k; y0 += (y1 - y0) * k; seg -= left; if (pen) d.L(x0, y0); else d.M(x0, y0); pen = !pen; left = pen ? on : off; }
      left -= seg; if (pen) d.L(x1, y1);
    }
  }
  return d;
}
/** A slip jelly burst: the pool it fell to, a mound in it where its eye lies shut, the crown of slip flung up and the drops raining back. */
function burstJelly(g, x, y, s = 1) {
  const T = place(x, y, s);
  solid(g, tr().M(-13.5, 0).Q(-12.6, 2.2, -10.4, 2.3).C(-6.4, 2.5, -4.6, 4.9, 0, 4.9).C(4.4, 4.9, 6.2, 2.5, 10.2, 2.3).Q(12.6, 2.2, 13.2, 0).Z(), T, false);
  for (const [bx, h, lean, w] of [[-8.4, 5.6, -0.55, 1.5], [-3.9, 8.4, -0.22, 1.7], [3.7, 9.0, 0.24, 1.7], [8.6, 5.4, 0.6, 1.4]]) {
    const tx = bx + lean * h;
    solid(g, tr().M(bx - w, 1.8).Q(bx - w * 0.25, h * 0.62, tx, h).Q(bx + w * 0.25, h * 0.62, bx + w, 1.8).Z().O(tx, h + 0.3, w * 0.48), T, false);
  }
  drops(g, [[-11.2, 9.6], [-6.4, 13.2], [0.6, 14.2], [6.8, 12.8], [12, 8.8]].map(([px, py]) => T(px, py)), 0.75 * s, WARE.black);
  cut(g, tr().M(-6.2, 2.0).Q(-8.6, 1.4, -10.6, 1.6).M(6.4, 2.0).Q(8.8, 1.3, 10.8, 1.6), T);
  eye(g, 'shut', T, 0, 3.2);
}
function fish(g, x, y, s = 1, a = 0) {
  const c = Math.cos(a), sn = Math.sin(a), T = (px, py) => [x + s * (px * c - py * sn), y + s * (px * sn + py * c)];
  const body = tr().M(10, 0).Q(4, 4.6, -5, 1.6).L(-9.4, 4.2).L(-8, 0).L(-9.4, -4.2).L(-5, -1.6).Q(4, -4.6, 10, 0).Z();
  solid(g, body, T); paint(g, tr().M(1.5, 3.3).L(-3.2, 5.8).L(-2.6, 2.4).Z(), T, WARE.red);
  cut(g, tr().M(6.2, 2.6).Q(5, 0, 6.2, -2.6).M(-3.5, 1.4).L(0.5, -2.2).M(-1.5, 2.2).L(2.5, -1.8).M(-3.5, -1.4).L(0.5, 2.2).M(-1.5, -2.2).L(2.5, 2.0), T);
  cut(g, tr().O(8, 0.7, 0.7), T);
}
function amphora(g, x, y, s = 1, a = 0) {
  const c = Math.cos(a), sn = Math.sin(a), T = (px, py) => [x + s * (px * c - py * sn), y + s * (px * sn + py * c)];
  solid(g, tr().M(-1.4, 0).L(1.4, 0).L(1.0, 1.2).C(4.6, 3, 5, 9, 3.2, 12).L(1.4, 13).L(1.4, 15.5).L(2.2, 16.2).L(-2.2, 16.2).L(-1.4, 15.5).L(-1.4, 13).L(-3.2, 12).C(-5, 9, -4.6, 3, -1.0, 1.2).Z(), T);
  limb(g, tr().M(1.5, 15).Q(4.2, 15.2, 3.4, 12).M(-1.5, 15).Q(-4.2, 15.2, -3.4, 12), T, 0.7 * s);
  cut(g, tr().M(-3.8, 7).Q(0, 6.2, 3.8, 7).M(-3.6, 8.4).Q(0, 7.6, 3.6, 8.4), T);
}
function motion(g, x, y, n = 3, len = 6, gap = 3.2, face = 1) { const m = tr(); for (let i = 0; i < n; i++) m.M(x, y + i * gap).L(x - face * (len - i * 1.2), y + i * gap); line(g, m, ID, 0.8); }

// ---- the twelve pictures (a panel 72 units wide and 54 tall, the groundline at GY): figures fill it, as on a cup's tondo
const SCENES = {
  drink(g) {
    basin(g, 37, 66, GY, 5); reeds(g, 67, GY, 0.7);
    jelly(g, 22, GY, { lean: 0.2, eye: 'shut', arm: [[9.0, 7.4], [13, 5.8], [16.2, 2.6], [17.6, -1.2]] });
    line(g, tr().M(36.5, GY + 0.5).Q(40, GY + 2.2, 43.5, GY + 0.5).M(34.6, GY + 1.0).Q(40, GY + 3.6, 45.4, GY + 1.0), ID, 0.5, WARE.white);
  },
  rest(g) {
    sun(g, 9, 44, 3.8); palm(g, 61, GY, 0.92, -0.35);
    jelly(g, 33, GY, { squash: 0.58, eye: 'shut' });
  },
  forage(g) {
    jelly(g, 21, GY, { lean: 0.28, eye: 'open', look: [0.8, -0.9], arm: [[9.0, 8.0], [13, 6.4], [16, 3.2], [17.4, 0.4]] });
    for (const [x, r] of [[41, 2.6], [47, 1.9], [51.5, 1.4]]) solid(g, tr().M(x - r * 1.8, GY).Q(x, GY + r * 2.2, x + r * 1.8, GY).Z(), ID, false);
    for (const [x, y, r] of [[39, 11, 0.7], [42, 14, 0.55], [45.5, 15.5, 0.6], [48.5, 13, 0.5], [36.5, 14.5, 0.45], [44, 10, 0.5]]) paint(g, tr().O(x, y, r), ID, WARE.black);
    bauble(g, 59, GY + 0.6, 2.2); paint(g, tr().M(55, GY - 0.1).L(63, GY - 0.1).L(63, GY - 3).L(55, GY - 3).Z(), ID, WARE.clay); ground(g, 72);
  },
  fish(g) {
    const waves = (style) => { const w = tr(); for (const y of [GY + 4, GY + 8.5]) { w.M(1, y); for (let x = 1; x <= 71; x += 0.8) w.L(x, y + Math.sin(x * 0.75) * 0.8); } line(g, w, ID, 0.6, style); };
    waves(WARE.black);
    const o = { lean: -0.06, eye: 'open', look: [0.6, 0.7], arm: [[8.4, 12.4], [12.4, 15.6], [15.2, 19.6]] };
    jelly(g, 21, GY, o); g.save(); trace(g, jellyShapes().body, jellyT(21, GY, o)); g.clip(); waves(WARE.white); g.restore();
    fish(g, 42, 29, 0.85, 0.55); drops(g, [[44, 18], [47.5, 15], [40.5, 21]], 0.6);
  },
  huddle(g) {
    jelly(g, 20, GY, { s: 0.84, lean: 0.16, eye: 'shut' });
    jelly(g, 52, GY, { s: 0.84, face: -1, lean: 0.16, eye: 'shut' });
    jelly(g, 36, GY, { s: 1.02, eye: 'glad' });
  },
  play(g) {
    const arc = (x0, y0, x1, y1, h) => { const a = tr(); for (let i = 0; i <= 14; i++) { const t = i / 14, p = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * h]; if (i % 2) a.L(...p); else a.M(...p); } line(g, a, ID, 0.7); };
    arc(25, 36, 33, 41, 3); arc(39, 41, 50, 23, 4);
    paint(g, tr().O(17, GY + 0.2, 6, 1.1), ID, WARE.black);
    jelly(g, 16, GY + 12, { s: 0.92, squash: 1.2, lean: 0.15, eye: 'glad' });
    jelly(g, 54, GY, { s: 0.85, squash: 0.72, face: -1, eye: 'glad' });
    line(g, tr().M(38.5, GY + 1).L(36.5, GY + 4).M(69.5, GY + 1).L(71, GY + 4), ID, 0.6);
    bauble(g, 36, 40, 3); cut(g, tr().M(33.4, 41.2).Q(36, 38.6, 38.6, 41.2), ID, 0.4);
  },
  home(g) {
    // a house: its wall in black with the courses scratched, a doorway left in the red, a pediment with a pot on its ridge
    const courses = (x0, x1) => { const c = tr(); for (const y of [11, 17, 23, 29]) c.M(x0 + 0.5, y).L(x1 - 0.5, y); for (const [x, y] of [[39.5, 11], [40.5, 23], [61, 11], [65, 17], [60, 23], [64, 29], [48, 29]]) if (x > x0 && x < x1) c.M(x, y).L(x, y + 6); return c; };
    solid(g, tr().M(36, GY).L(70, GY).L(70, 34).L(36, 34).Z(), ID, false);
    paint(g, tr().M(44, GY).L(57, GY).L(57, 25).Q(50.5, 29, 44, 25).Z(), ID, WARE.clay);
    cut(g, courses(36, 44), ID);
    solid(g, tr().M(34, 34).L(72, 34).L(72, 36).L(34, 36).Z(), ID); solid(g, tr().M(34, 36).L(72, 36).L(53, 45).Z(), ID); cut(g, tr().M(38, 37).L(68, 37).L(53, 43.6).Z(), ID);
    amphora(g, 53, 45.3, 0.34);
    motion(g, 34, GY + 5, 3, 6);
    jelly(g, 51, GY, { s: 0.85, eye: 'open', lean: 0.1 });
    solid(g, tr().M(57, GY).L(70, GY).L(70, 34).L(57, 34).Z(), ID); cut(g, courses(57, 70), ID);
  },
  fetch(g) {
    motion(g, 7, GY + 5, 3, 5);
    const T = jelly(g, 19, GY, { lean: 0.12, eye: 'open', arm: [[8.2, 12.6], [12.6, 14.6], [16.4, 17]] }), [bx, by] = T(18.6, 18.6);
    bauble(g, bx, by, 2.8);
    folk(g, 60, GY, { face: -1, near: 'reach', hand: 'open', far: 'down' });
  },
  follow(g) {
    motion(g, 5, GY + 5, 3, 4);
    jelly(g, 17, GY, { s: 0.9, lean: 0.16, eye: 'open' });
    for (const x of [33, 37, 41]) paint(g, tr().O(x, GY + 0.9, 1.1, 0.5), ID, WARE.black);
    folk(g, 52, GY, { pose: 'walk', near: 'swing', far: 'back' });
  },
  still(g) {
    const m = tr(); for (const y of [14, 20, 26]) m.M(4, y).L(21, y); line(g, m, ID, 1.0);
    line(g, tr().M(24.5, 11).L(24.5, 29), ID, 1.6);
    for (const [x, y, r] of [[29.5, 8, 1.7], [26.5, 7, 1.1], [32.5, 6.8, 1.0]]) line(g, tr().O(x, y, r), ID, 0.6);
    jelly(g, 47, GY, { squash: 1.22, eye: 'wide' });
    line(g, tr().M(39, 34).L(37, 37).M(46.5, 35.5).L(46.5, 39).M(54, 34).L(56, 37), ID, 0.8);
  },
  ease(g) {
    jelly(g, 21, GY, { squash: 0.6, eye: 'glad', arm: [[9.4, 3.2], [14.6, 2.2], [18.6, 3.0]], hand: 'open' });
    folk(g, 60, GY, { face: -1, pose: 'sit', near: 'rest', hand: 'open', far: 'down' });
  },
  hush(g) {
    moon(g, 55, 42, 6); for (const [x, y, r] of [[42, 48, 1.2], [66, 31, 1.0], [45, 35, 0.9], [67, 48, 1.2], [31, 44, 0.8]]) star(g, x, y, r);
    jelly(g, 28, GY, { curl: true, squash: 0.85, eye: 'shut' });
  },
  // ---- Espada's next four (npc/neuralese.js OSTRACON_PICTURES): melt, flee, mourn, rival
  melt(g) {
    // where it stood, dashed (as the play's flight), and the puddle it ran down into, spread flat, its eye still in it
    line(g, dashed(jellyShapes().body, jellyT(36, GY, {})), ID, 0.7);
    const fall = tr(); for (const [x, y] of [[18.6, 17], [16.4, 12.4], [53.4, 17], [55.6, 12.4]]) fall.M(x, y).L(x, y - 3.2); line(g, fall, ID, 0.7);
    solid(g, tr().M(7.5, GY).Q(8.4, GY + 2.5, 11.6, GY + 2.6).C(19, GY + 2.8, 25, GY + 3.1, 29.4, GY + 5.4).C(32.6, GY + 8.8, 41.4, GY + 9.2, 44.6, GY + 5.6)
      .C(48, GY + 2.9, 54, GY + 2.5, 60.4, GY + 2.5).Q(64, GY + 2.4, 65, GY).Z(), ID);
    solid(g, tr().O(68, GY + 0.8, 1.5, 0.8).O(4.6, GY + 0.7, 1.2, 0.7), ID, false);
    cut(g, tr().M(12.6, GY + 1.3).Q(20, GY + 1.9, 25.6, GY + 2.4).M(47.6, GY + 2.2).Q(53, GY + 1.5, 59.6, GY + 1.3).M(31.6, GY + 6.2).Q(30.6, GY + 3.8, 31.6, GY + 2.2), ID);
    cut(g, tr().O(31.6, GY + 1.7, 0.55), ID);
    eye(g, 'open', ID, 38.6, GY + 5.1, [0.3, 0.6]);
    line(g, tr().M(36.4, GY + 8.6).Q(32.6, GY + 8.0, 30.8, GY + 5.8), ID, INC * 1.5, WARE.white);
  },
  flee(g) {
    folk(g, 14, GY, { pose: 'walk', near: 'raise', hand: 'open', far: 'back' });
    motion(g, 41, GY + 8, 3, 6);
    paint(g, tr().O(54, GY + 0.2, 7.5, 1.1), ID, WARE.black);
    const T = jelly(g, 55, GY + 3.4, { s: 0.9, squash: 0.94, lean: 0.4, eye: 'wide', look: [-0.9, 0.3] });
    drops(g, [T(-6.6, 21.4), T(-9.6, 18.4)], 0.55);
    for (const [x, y, r] of [[40.6, GY + 1.6, 0.6], [38.2, GY + 3.2, 0.5], [36.4, GY + 1.3, 0.45]]) paint(g, tr().O(x, y, r), ID, WARE.black);
  },
  mourn(g) {
    burstJelly(g, 54, GY);
    const T = jelly(g, 21, GY, { lean: 0.58, squash: 0.78, eye: 'shut', arm: [[8.8, 6.6], [12.4, 5.4], [15.4, 3.2], [17.0, 0.9]], hand: 'open' });
    drops(g, [T(6.0, 10.4), T(6.6, 7.0)], 0.55);
  },
  rival(g) {
    motion(g, 9, GY + 6, 3, 5); motion(g, 63, GY + 6, 3, 5, 3.2, -1);
    jelly(g, 22.6, GY, { s: 0.9, lean: 0.5, eye: 'fierce' });
    jelly(g, 49.4, GY, { s: 0.9, face: -1, lean: 0.5, eye: 'fierce' });
    const star = tr(); for (const a of [0.35, 0.95, 1.57, 2.19, 2.79]) star.M(36 + Math.cos(a) * 3.4, 22 + Math.sin(a) * 3.4).L(36 + Math.cos(a) * 6.4, 22 + Math.sin(a) * 6.4); line(g, star, ID, 0.8);
    for (const [x, y, r] of [[34.2, GY + 1.2, 0.5], [37.8, GY + 1.2, 0.5], [36, GY + 2.4, 0.45]]) paint(g, tr().O(x, y, r), ID, WARE.black);
  },
};

/** Which words have a picture: each word Espada gives an ostracon scene (npc/neuralese.js, OSTRACON_PICTURES) that a painter here paints,
 *  the painter keyed by the word's English (its gloss: SIVA's is 'drink'). The rest draw the meander. */
export const PICTURES = Object.fromEntries(Object.keys(OSTRACON_PICTURES).map((w) => [w, glossOf(w)]).filter(([, id]) => SCENES[id]));

/** Paints the picture `id` into the panel (x, y, w, h); false if there is no such picture (the caller paints the meander). */
export function paintPicture(g, id, x, y, w, h, span) {
  const S = SCENES[id]; if (!S) return false;
  const F = frame(g, x, y, w, h, 72), s = w / 72;
  if (span) groundSpan(g, (span[0] - x) / s, (span[1] - x) / s); else ground(g, F.W);
  S(g, F); g.restore(); return true;
}

/** The tongue pattern: tongues hanging from a line, black and added red by turns (the border band over a pot's frieze). */
export function paintTongues(g, x, y, w, h) {
  g.fillStyle = WARE.clay; g.fillRect(x, y, w, h);
  const r = h * 0.2, step = r * 2.6, top = y + h * 0.14, L = h * 0.5;
  for (let i = 0, cx = x + r * 0.6; cx < x + w + r; i++, cx += step) {
    g.beginPath(); g.moveTo(cx - r, top); g.lineTo(cx - r, top + L); g.arc(cx, top + L, r, Math.PI, 0, true); g.lineTo(cx + r, top); g.closePath();
    g.fillStyle = i % 2 ? WARE.red : WARE.black; g.fill(); if (i % 2) { g.lineWidth = Math.max(1, h * 0.04); g.strokeStyle = WARE.black; g.stroke(); }
  }
  g.fillStyle = WARE.black; g.fillRect(x, y, w, h * 0.14); g.fillRect(x, y + h * 0.9, w, h * 0.1);
}

/** A palmette (the ornament under a pot's handle): petals fanned up from a heart over two volutes, black and added red by turns. foot: the groundline's y; s: its height. */
export function paintPalmette(g, cx, foot, s) {
  const hy = foot - s * 0.3, P = (lx, ly, side = 1) => [cx + side * lx, foot - ly];
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(...P(0, s * 0.3, side)); g.quadraticCurveTo(...P(s * 0.24, s * 0.3, side), ...P(s * 0.26, s * 0.12, side));
    for (let i = 1; i <= 30; i++) { const a = (-i / 30) * Math.PI * 2.2, r = s * 0.08 * (1 - (0.75 * i) / 30); g.lineTo(...P(s * 0.18 + Math.cos(a) * r, s * 0.12 + Math.sin(a) * r, side)); }
    g.lineWidth = s * 0.06; g.strokeStyle = WARE.black; g.stroke();
  }
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.36, dx = Math.sin(a), dy = -Math.cos(a), L = s * (0.66 - 0.05 * Math.abs(i)), w = s * 0.075, bx = cx + dx * s * 0.05, by = hy + dy * s * 0.05, tx = cx + dx * L, ty = hy + dy * L, mx = cx + dx * L * 0.62, my = hy + dy * L * 0.62;
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(mx - dy * w * 1.6, my + dx * w * 1.6, tx, ty); g.quadraticCurveTo(mx + dy * w * 1.6, my - dx * w * 1.6, bx, by); g.closePath();
    g.fillStyle = i % 2 ? WARE.red : WARE.black; g.fill(); if (i % 2) { g.lineWidth = Math.max(1, s * 0.012); g.strokeStyle = WARE.black; g.stroke(); }
  }
  g.beginPath(); g.arc(cx, hy, s * 0.075, 0, Math.PI * 2); g.fillStyle = WARE.black; g.fill();
}

/** A rosette (a filler in a frieze's empty ground): a dot ringed by eight. */
export function paintRosette(g, cx, cy, r) {
  g.fillStyle = WARE.black; g.beginPath(); g.arc(cx, cy, r * 0.32, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.2, 0, Math.PI * 2); g.fill(); }
}

/** The meander (the Greek key) across the panel's middle: what a word with no picture carries (style: its colour, the black unless
 *  said). It repeats every 17.6 units of a panel 54 tall: a border round a pot is seamless when its width is a whole number of them. */
export function paintMeander(g, x, y, w, h, style = WARE.black) {
  const F = frame(g, x, y, w, h, (54 * w) / h), u = 4.4, cell = 4 * u, n = Math.ceil(F.W / cell) + 1, x0 = -cell / 2, y0 = F.H / 2 - 2 * u;
  const k = tr();
  for (let i = 0; i < n; i++) { const X = x0 + i * cell; k.M(X, y0).L(X, y0 + 4 * u).L(X + 3 * u, y0 + 4 * u).L(X + 3 * u, y0 + u).L(X + u, y0 + u).L(X + u, y0 + 3 * u).L(X + 2 * u, y0 + 3 * u).L(X + 2 * u, y0 + 2 * u); }
  k.M(x0, y0 - u * 0.1).L(x0 + n * cell, y0 - u * 0.1);
  line(g, k, ID, u * 0.55, style);
  line(g, tr().M(x0 - 2, y0 - u * 1.3).L(x0 + n * cell + 2, y0 - u * 1.3).M(x0 - 2, y0 + 5.3 * u).L(x0 + n * cell + 2, y0 + 5.3 * u), ID, 0.9, style);
  g.restore();
}

// ---- the stele's frieze: the town's folk and the slip jellies at work together (a band about 4.2 times as wide as it is tall)
function beehiveKiln(g, x, y, s = 1) {
  const T = place(x, y, s);
  solid(g, tr().M(-9, 0).C(-9, 14, -4, 19, 0, 19).C(4, 19, 9, 14, 9, 0).Z(), T); solid(g, tr().M(-1.6, 18).L(1.6, 18).L(1.4, 22).L(-1.4, 22).Z(), T);
  paint(g, tr().M(-3.4, 0).L(-3.4, 4.6).Q(0, 8, 3.4, 4.6).L(3.4, 0).Z(), T, WARE.red);
  limb(g, tr().M(-2, 0.4).Q(-1.4, 3, -0.4, 4.6).M(0.8, 0.4).Q(1.6, 2.6, 1.2, 5.2), T, 0.8 * s);
  cut(g, tr().M(-8.2, 6).Q(0, 4.2, 8.2, 6).M(-7.6, 10).Q(0, 8.4, 7.6, 10).M(-6, 14).Q(0, 12.8, 6, 14).M(-4, 2).L(-4, 6).M(5, 6.5).L(5, 10.5).M(-2, 10).L(-2, 13.6).M(3, 14).L(3, 17), T);
  line(g, tr().M(0.4, 23.4).Q(-2.6, 26.4, 0.6, 29).Q(3, 31.2, 0.4, 34), T, 0.6 * s);
}
function potterWheel(g, x, y, s = 1) {
  const T = place(x, y, s);
  solid(g, tr().M(-0.9, 0).L(0.9, 0).L(0.9, 8.4).L(-0.9, 8.4).Z(), T); solid(g, tr().O(0, 9, 6.2, 1.1), T);
  solid(g, tr().M(-2.6, 10).C(-4.4, 12, -4.4, 15.6, -1.8, 17).L(-1.6, 18.8).L(1.6, 18.8).L(1.8, 17).C(4.4, 15.6, 4.4, 12, 2.6, 10).Z(), T);
  cut(g, tr().M(-3.6, 13.6).Q(0, 12.8, 3.6, 13.6).M(-5, 9).L(5, 9), T);
}
function trough(g, x0, x1, y, h = 4) { solid(g, tr().M(x0, y).L(x1, y).L(x1 + 1, y + h).L(x0 - 1, y + h).Z(), ID); const c = tr().M(x0, y + h * 0.5).L(x1, y + h * 0.5); for (let x = x0 + 4; x < x1; x += 5) c.M(x, y).L(x, y + h * 0.5); cut(g, c, ID); }

/** The stele's frieze in the panel (x, y, w, h): its red ground, its border lines, the folk and the slip jellies at work. */
export function paintFrieze(g, x, y, w, h) {
  g.fillStyle = WARE.clay; g.fillRect(x, y, w, h);
  const F = frame(g, x, y, w, h, (44 * w) / h), W = F.W, gy = 3.2, k = W / 170, fs = 0.84, js = 0.7;
  ground(g, W, gy); line(g, tr().M(0.6, F.H - 0.8).L(W - 0.6, F.H - 0.8), ID, 0.8);
  // a beehive kiln fired, a folk stoking it
  beehiveKiln(g, 13 * k, gy, 1.05); const st = folk(g, 33 * k, gy, { s: fs, face: -1, near: 'pole', far: 'down' }), [px, py] = st.T(...st.hand);
  line(g, tr().M(px + 1.2, py + 1.4).L(px - 8.2, py - 9.2), ID, 0.8);
  // a slip jelly carrying a jar on its crown
  const ct = jelly(g, 54 * k, gy, { s: js, lean: 0.1, eye: 'open' }), [cx, cy] = ct(-0.6, 21.2); amphora(g, cx, cy - 0.4, 0.5, -0.06);
  // a folk at the potter's wheel, a slip jelly bringing it slip in a jug
  folk(g, 77 * k, gy, { s: fs, pose: 'sit', near: 'wheel', far: 'wheel' }); potterWheel(g, 86.5 * k, gy, 0.88);
  const jt = jelly(g, 104 * k, gy, { s: js, face: -1, eye: 'open', arm: [[8.2, 13], [11.4, 17], [14, 19.4]] }), [jx, jy] = jt(15, 20);
  amphora(g, jx + 1.2, jy - 1.2, 0.34, 2.0);
  line(g, tr().M(jx - 3.6, jy - 2.4).Q(jx - 5.6, jy - 3.4, 86.5 * k + 1.2, gy + 17.6), ID, 0.6, WARE.white);
  // a folk holding up an ostracon to a slip jelly, who reads it
  const sh = folk(g, 123 * k, gy, { s: fs, near: 'hold', far: 'down' });
  const [hx, hy] = sh.T(...sh.hand); paint(g, tr().M(hx - 0.6, hy).L(hx + 2.6, hy + 0.8).L(hx + 3.4, hy + 4.2).L(hx + 0.4, hy + 4.6).L(hx - 1, hy + 2.4).Z(), ID, WARE.white);
  line(g, tr().M(hx + 0.4, hy + 1.4).L(hx + 2.2, hy + 3.2).M(hx + 2.2, hy + 1.6).L(hx + 0.6, hy + 3.4), ID, 0.35);
  jelly(g, 139 * k, gy, { s: js, face: -1, lean: 0.2, eye: 'wide' });
  // two slip jellies treading clay in a trough
  trough(g, 152 * k, 168 * k, gy, 3.4);
  jelly(g, 156 * k, gy + 3.4, { s: 0.46, squash: 0.74, eye: 'glad' }); jelly(g, 164 * k, gy + 3.4, { s: 0.46, squash: 0.9, face: -1, eye: 'glad' });
  g.restore();
}

// ---- the white-ground hand: the funerary lekythos's (vfx/garden/lekythos.js), its figures outlined in a line on the white ground and
// washed in a colour (the Achilles Painter's and the Reed Painter's lekythoi: a figure beside a grave stele, ribbons tied round it)
/** A sporeling (vfx/garden/sporeling.js): a cap for a head, spotted, its gills under it, a stem body with two eyes, a wave of a hypha. */
function sporelingFigure(g, x, y, s = 1) {
  const T = place(x, y, s);
  limb(g, tr().M(-2.2, 3).L(-3.2, 0.2).M(2.2, 3).L(3.2, 0.2), T, 1.3 * s);
  solid(g, tr().M(-4.8, 2.4).C(-6.6, 6, -5.4, 10.4, -3.8, 13).L(3.8, 13).C(5.4, 10.4, 6.6, 6, 4.8, 2.4).Q(0, 1.4, -4.8, 2.4).Z(), T);
  limb(g, tr().M(-4.9, 8.2).Q(-8.4, 7.2, -9.8, 4.2).M(4.9, 8.2).Q(8.4, 9.8, 9.8, 13.2), T, 1.1 * s);
  solid(g, tr().M(-11.4, 12.2).C(-11, 20, -5.4, 23.8, 0, 23.8).C(5.4, 23.8, 11, 20, 11.4, 12.2).Q(0, 10.2, -11.4, 12.2).Z(), T);
  const gills = tr(); for (let i = -4; i <= 4; i++) gills.M(i * 0.8, 12.6).L(i * 2.5, 11.4 + Math.abs(i) * 0.12);
  cut(g, gills, T, INC * 0.8);
  for (const [cx, cy, r] of [[-6, 17.4, 1.5], [0.4, 20.6, 1.8], [6.2, 16.8, 1.3], [-2.6, 15, 0.9], [3.4, 14.4, 0.8]]) paint(g, tr().O(cx, cy, r), T, WARE.white);
  eye(g, 'open', T, -2.1, 8.4, [0, -0.3]); eye(g, 'open', T, 2.1, 8.4, [0, -0.3]);
  cut(g, tr().M(-1, 5.4).Q(0, 4.6, 1, 5.4), T, INC * 0.9);
}
/** A ribbon (a taenia) hung in the field from a peg, looped, its two tails falling: (x, top) the peg, in the frame's units. */
function hungRibbon(g, x, top, colour) {
  const piece = (t) => { trace(g, t, ID); g.fillStyle = colour; g.fill(); lay(g, INC * 0.8, OUTLINE.line); };
  piece(tr().M(x - 3.4, top - 2.2).Q(x, top + 0.6, x + 3.4, top - 2.2).Q(x + 4.2, top - 5.4, x, top - 6.4).Q(x - 4.2, top - 5.4, x - 3.4, top - 2.2).Z());
  piece(tr().M(x - 1.2, top - 6).Q(x - 3.4, top - 12, x - 1.8, top - 19).L(x - 0.4, top - 18.6).Q(x - 1.8, top - 12, x + 0.2, top - 6.2).Z());
  piece(tr().M(x + 0.6, top - 6.2).Q(x + 2.6, top - 11, x + 2.2, top - 16).L(x + 3.6, top - 15.8).Q(x + 3.8, top - 11, x + 1.8, top - 6).Z());
  paint(g, tr().O(x, top - 0.4, 0.7), ID, WARE.black);
}
/** The spirit's likeness in the white-ground hand, standing on a groundline across the panel (x, y, w, h: the panel 60 units wide).
 *  kind: 'sporeling', or a slip jelly for anything else (most spirits were slip jellies); style: { line, wash, ground, ribbon? } as CSS
 *  colours (ribbon: a taenia hung in the field over it, in that colour, as the lekythoi hang one in the empty ground). */
export function paintLikeness(g, kind, x, y, w, h, style) {
  OUTLINE = { ground: '#efe8da', ...style };
  try {
    const F = frame(g, x, y, w, h, 60), cx = F.W / 2;
    groundSpan(g, 2, F.W - 2);
    if (kind === 'sporeling') sporelingFigure(g, cx, GY, Math.min(2.1, (F.H - GY - 3) / 24));
    else jelly(g, cx, GY, { s: Math.min(1.8, (F.H - GY - 3) / 22.8), face: -1, eye: 'open', look: [-0.5, 0.2] });
    if (OUTLINE.ribbon && F.H > 64) hungRibbon(g, F.W * 0.78, F.H - 4, OUTLINE.ribbon);
    g.restore();
  } finally { OUTLINE = null; }
}
/** A grave stele in the white-ground hand (x, y, w, h: its panel, 30 units wide): a tapered shaft on two steps, crowned with an
 *  anthemion, outlined on the white; a ribbon (a taenia) tied round it in `ribbon`, its ends hanging; a small lekythos on its step. */
export function paintStele(g, x, y, w, h, style) {
  OUTLINE = { ground: '#efe8da', ...style, wash: null };
  try {
    const F = frame(g, x, y, w, h, 30), c = 15, top = F.H - 9, ty = top - 7, rib = style.ribbon || OUTLINE.line;
    groundSpan(g, 0.5, 29.5);
    solid(g, tr().M(c - 12, GY).L(c + 12, GY).L(c + 12, GY + 3).L(c - 12, GY + 3).Z(), ID);
    solid(g, tr().M(c - 9, GY + 3).L(c + 9, GY + 3).L(c + 9, GY + 6).L(c - 9, GY + 6).Z(), ID);
    solid(g, tr().M(c - 6, GY + 6).L(c + 6, GY + 6).L(c + 5, top).L(c - 5, top).Z(), ID);
    solid(g, tr().M(c - 6, top).L(c + 6, top).L(c + 6, top + 1.4).L(c - 6, top + 1.4).Z(), ID);
    const anth = tr();
    for (let i = -3; i <= 3; i++) { const a = i * 0.38, L = 6.4 - 0.5 * Math.abs(i); anth.M(c, top + 2).Q(c + Math.sin(a) * L * 0.8 + 1.2 * Math.sign(i), top + 2 + Math.cos(a) * L * 0.6, c + Math.sin(a) * L, top + 2 + Math.cos(a) * L); }
    anth.M(c - 4.2, top + 2).Q(c - 6.8, top + 1.6, c - 6, top + 3.4).M(c + 4.2, top + 2).Q(c + 6.8, top + 1.6, c + 6, top + 3.4);
    line(g, anth, ID, INC * 1.6);
    const piece = (t) => { trace(g, t, ID); g.fillStyle = rib; g.fill(); lay(g, INC * 0.8, OUTLINE.line); };
    piece(tr().M(c - 5.6, ty).Q(c, ty - 1.6, c + 5.6, ty).L(c + 5.6, ty - 1.6).Q(c, ty - 3.2, c - 5.6, ty - 1.6).Z());
    for (const k of [-1, 1]) { const sx = c + k * 5.4; piece(tr().M(sx, ty - 1).Q(sx + k * 2.2, ty - 6, sx + k, ty - 11).L(sx + k * 2.2, ty - 11.4).Q(sx + k * 3.2, ty - 6, sx + k * 0.6, ty - 1.6).Z()); }
    const lx = c + 10.4, ly = GY + 3, ls = 0.42, P = [[-2, 0], [2, 0], [2.6, 9], [4, 10], [1, 11.4], [1, 13], [2, 15], [-2, 15], [-1, 13], [-1, 11.4], [-4, 10], [-2.6, 9]], lk = tr().M(lx - 2 * ls, ly);
    for (const [px, py] of P.slice(1)) lk.L(lx + px * ls, ly + py * ls);
    solid(g, lk.Z(), ID);
    g.restore();
  } finally { OUTLINE = null; }
}
