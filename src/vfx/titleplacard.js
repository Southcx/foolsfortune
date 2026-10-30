// ---------------------------------------------------------------------------------------
// THE TITLE PLACARD: the one pop-up (CLAUDE.md, Feedback: "One toast: a title"). When an achievement awards a title, the System hands
// it down as a Jōmon clay placard out of a shaft of light (docs/plans/OVERLAY.md 10.5b, 10.5c, 10.5e, 10.5f; the owner approved round
// six's core and round seven's tiers and dresses, 2026-10-18). Ported from Calissa's mocks (overlay/r6-placard, the core: the slab, the
// cord marks, the cockscomb lugs, the dark labradorite inlay's slow flash, the kintsugi seam, the motion and the recomb; overlay/
// r7-placard, the tiers and the dresses) from three.js r128 to r170: lights as the mock's raw colours, their intensities times pi (r128's
// legacy lights), the spot's decay 0 (r128 ignored it at distance 0). Its canvases are drawn at half the mock's size (Q), their contexts
// scaled so the mock's drawing runs unchanged; the field is about 310 dots wide at the 480-line present, so nothing is lost.
//
// The ware climbs with the achievement tier (achievement.unlock's `tier`): 1 Easy, earthenware, one lug; 2 Medium, stoneware with a
// fire flash; 3 Hard, porcelain with cobalt lines; 4 Elite, celadon; 5 Master, Raku crackle with copper flash; 6 Grandmaster, the full
// cockscomb slab mended in kintsugi gold, lit from inside. The dress follows the island the Courier stands on, read from the render
// zone the ground is (`game.zones.whole`): 'margarite' Nacre, 'emocean' (or a crossing under way) Brine, 'entropolis' Glass (no such
// zone yet), anything else Clay. A dress swaps the ware's matter (clay, finish, cut, inlay) and keeps the tier's shape (lugs, bands,
// coils, crest, spirals, foot, the Grandmaster's gold).
//
// The beats (real seconds from the start; round six's table): the hush (0), the descent from the light (0.4, turning to face you),
// contact (2.8), ma (0.8 of nothing but the inlay's schiller), the title written in the running hand (3.6 to 5.0; ui/runninghand.js,
// final) from TITLES (npc/neuraleseroots.js, the compound split at its hyphens, head first), held, combed by a curl-noise flow field
// (5.4) into the English title cut rough in Cinzel and gilded (arriving 6.5 to 7.4), settled (8.0), the System's hanko burned in the
// window colour (8.4), held, the exit up into the light (11.0). A title not in TITLES skips the writing and the comb: the cut sweeps in
// on its own. Any key dismisses it once settled (to the exit). One at a time: the rest wait in a queue, and nothing starts on the title
// screen, in a cinematic or in a live moment (`game.liveMoment()`: one up then leaves at once, and comes again if unsettled). It never
// pauses play and adds no log line (the log already says the title: tracking.js).
//
// Events, for Wanda's sound: `placard.beat { k, tier, title, id }` (id the achievement's), k one of descend, contact, write, comb,
// settle, seal, exit (write and comb only when written; a beat a dismissal skips is not sent; one re-queued beats again from descend).
//
// How it is drawn: the placard is its own little scene (its lights, an environment for the glazes and the gold, the mock's perspective
// camera) rendered into a target the size of the 480-line present, and a glow pass of its lit parts at half that; one full-view quad in
// the overlay's scene (render/overlayscene.js) lays the two over the frame, between the hush, the shaft of light behind and in front, the
// shaft's motes and the letterbox. Built over a few frames when it is due (its canvases, chunked), never at boot; freed when it leaves.
//
// Prior art: Jōmon flame-style vessels (kaen-doki, the Umataka style; Sasayama's No. 1, Tokamachi) and their cord marking; Bizen and
// Shigaraki wood-fired ware (hi-iro); sometsuke porcelain; Longquan celadon; Raku (Chōjirō; the Western post-firing reduction); kintsugi;
// Worley's cellular texture (SIGGRAPH 1996: the crackle, the tesserae); Bridson, Hourihan and Nordenstam's curl noise (SIGGRAPH 2007: the
// comb); the Trajan capitals' V cut (Cinzel's ancestor); Ryukyuan raden (Nacre); acid-etched glass (Glass); silvered driftwood and
// Stockholm tar (Brine); Dark Souls' slow banners and Zelda's item-get light from above; the hanko as signature.
//
//   game.titlePlacard = new TitlePlacard(game)   (listens to achievement.unlock; added to game.overlayScene)
//   .show({ title, tier, id, ach })   queues one by hand (QAIS, a preset)     .active   .queue   .dismiss()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runningHand } from '../ui/runninghand.js';
import { cellsOf } from '../npc/neuralesespelling.js';
import { TITLES } from '../npc/neuraleseroots.js';
import { FONT, THEMES, theme } from '../ui/theme.js';
import { drawSealFace } from './sealface.js';

const Q = 0.5, PI = Math.PI, D2R = PI / 180;
const NAME = 'SISTEM'; // placeholder: the System's seal name, not canon (Espada's)
const CINZEL = (s, w = 600) => `${w} ${s}px ${FONT.title}`, READ = (s) => `${s}px ${FONT.sys}`;
const COUNT = (s) => `${s}px 'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const filmArr = (s, o) => { s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, A = FILM[i], B = FILM[(i + 1) % 4], m = f * f * (3 - 2 * f); for (let k = 0; k < 3; k++) o[k] = A[k] + (B[k] - A[k]) * m; return o; };
const _f = [0, 0, 0];
const filmRGB = (s, a) => { filmArr(s, _f); return `rgba(${Math.round(_f[0])},${Math.round(_f[1])},${Math.round(_f[2])},${a})`; };
const raw = (hex) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
const lin = (hex) => new THREE.Color(hex); // (the mock's convertSRGBToLinear: r170 converts on its own)
const sm = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
const cl = (t) => Math.min(1, Math.max(0, t));
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
/** A canvas at Q of the mock's size, its context scaled so the mock's drawing runs unchanged. */
const half = (w, h) => { const c = cv(w * Q, h * Q), x = c.getContext('2d', { willReadFrequently: true }); x.scale(Q, Q); return [c, x]; };
/** A whole canvas drawn pixel for pixel (or offset by mock units) onto a scaled context. */
const put = (x, img, dx = 0, dy = 0) => { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(img, dx * Q, dy * Q); x.restore(); };
const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
function vnoise(G, seed) {
  const R = rng(seed), N = 64, v = new Float32Array(N * N); for (let i = 0; i < N * N; i++) v[i] = R();
  return (px, py) => { const gx = px / G, gy = py / G, ix = Math.floor(gx), iy = Math.floor(gy), tx = gx - ix, ty = gy - iy, s = (t) => t * t * (3 - 2 * t); const at = (a, b) => v[((b % N + N) % N) * N + ((a % N + N) % N)];
    const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1); return (a + (b - a) * s(tx)) * (1 - s(ty)) + (c + (d - c) * s(tx)) * s(ty); };
}
// Worley: the F2 - F1 distance (cell units) and the cell's id: crackle lines and tesserae (the pair reused: read it before the next call)
function voro(cell, seed) {
  const R = rng(seed), N = 64, P = new Float32Array(N * N * 2), out = [0, 0]; for (let i = 0; i < N * N; i++) { P[2 * i] = R(); P[2 * i + 1] = R(); }
  return (px, py) => { const gx = px / cell, gy = py / cell, ix = Math.floor(gx), iy = Math.floor(gy); let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = ix + i, cy = iy + j, k = ((cy % N + N) % N) * N + ((cx % N + N) % N), dx = cx + P[2 * k] - gx, dy = cy + P[2 * k + 1] - gy, d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; id = k; } else if (d < d2) d2 = d; }
    out[0] = Math.sqrt(d2) - Math.sqrt(d1); out[1] = id; return out; };
}

/* ===================== the wares (round seven's ladder) and the islands' dresses ===================== */
const LUGS4 = [['A', -1.06, 0.92, 1, 0.09, 11], ['B', -0.3, 0.6, 1, -0.05, 12], ['A', 0.48, 0.76, -1, -0.07, 13], ['B', 1.16, 0.52, -1, 0.14, 14]];
const R6CLAY = { base: '#6c4332', grey: '104,98,92', red: '132,66,38', flashN: 16, clouds: 1, dent: '26,16,12', dentHi: '176,150,128', speck: ['#4a2e22', '#9a8070', '#22140e'],
  band: ['#24140e', '#7a4a36', 'rgba(200,170,150,.2)'], field: ['#6b4636', '#573a2c', '#3c271e'], streak: ['190,170,150', '40,26,20'], fspeck: ['#4c3022', '#8f7666', '#2c1a12'],
  groove: '#160c08', grooveHi: 'rgba(190,165,145,.4)', floor: ['#2e1b12', '#30190f'], wall: '#160a06', hl: 'rgba(205,180,160,.5)', lugTint: 0xe4d8d0, wallTint: 0xc8bcb4, coil: 0x74503f, cord: 0x5e4134 };
const CUT6 = { wall: [74, 48, 36], fresh: [128, 102, 86], gold: [255, 196, 84], thr: 0.28 };
const WARES = [null,
  { scale: 0.72, lugs: [['A', 0.02, 0.98, 1, 0.02, 11]], bands: 0, coils: 0, crest: 0, spirals: 0, foot: 0, finish: 'none',
    clay: { ...R6CLAY, base: '#7e5038', flashN: 5, clouds: 0.35, field: ['#7a4e3a', '#664332', '#4a2e22'] }, cut: { ...CUT6, wall: [86, 56, 40], thr: 0.5 }, inlay: { r: 0.007, bright: 0.42 } },
  { scale: 0.8, lugs: [['B', -0.66, 0.86, 1, 0.07, 12], ['B', 0.66, 0.86, -1, -0.07, 15]], bands: 1, coils: 1, crest: 0, spirals: 0, foot: 1, finish: 'none',
    clay: { ...R6CLAY, base: '#6a5c50', grey: '96,94,90', red: '178,84,40', flashN: 10, hiiro: 1, clouds: 0.55, band: ['#2a221c', '#77665a', 'rgba(200,190,180,.2)'], field: ['#6e6054', '#5c5046', '#3e352e'],
      fspeck: ['#3e342c', '#9a8a7a', '#24201c'], speck: ['#3e342c', '#9a8a7a', '#24201c'], coil: 0x6e6056, cord: 0x5a4c42, lugTint: 0xd8d2cc }, cut: { ...CUT6, wall: [70, 60, 52], fresh: [140, 128, 116], thr: 0.4 }, inlay: { r: 0.008, bright: 0.48 } },
  { scale: 0.86, lugs: [['B', -0.92, 0.62, 1, 0.08, 12], ['A', -0.02, 0.88, 1, 0.02, 11], ['B', 0.92, 0.62, -1, -0.08, 14]], bands: 2, coils: 1, crest: 1, spirals: 1, foot: 1, finish: 'porcelain', cobalt: 1,
    clay: { ...R6CLAY, base: '#e2dbcf', grey: '190,186,180', red: '214,196,170', flashN: 4, clouds: 0, dent: '120,112,104', dentHi: '255,250,240', speck: ['#c8c0b4', '#f4f0e8', '#a8a094'], band: ['#a49c90', '#f0ebe2', 'rgba(255,255,255,.4)'],
      field: ['#efeae1', '#e0d9cd', '#c9c0b2'], streak: ['255,255,255', '150,140,130'], fspeck: ['#cfc7bb', '#f6f2ea', '#b4ac9f'], groove: '#4a4640', grooveHi: 'rgba(255,255,255,.6)', floor: ['#b8ae9f', '#bdb3a4'], wall: '#6e665c', hl: 'rgba(255,255,255,.7)',
      lugTint: 0xffffff, wallTint: 0xf2eee8, coil: 0xe8e2d8, cord: 0xd8d0c4 }, cut: { ...CUT6, wall: [150, 142, 132], fresh: [236, 232, 224], thr: 0.34 }, inlay: { r: 0.009, bright: 0.55 } },
  { scale: 0.92, lugs: LUGS4, bands: 2, coils: 1, crest: 1, spirals: 1, foot: 1, finish: 'celadon', clay: { ...R6CLAY, coil: 0x6f8f78, cord: 0x5d7a66 }, cut: { ...CUT6, thr: 0.26 }, inlay: { r: 0.011, bright: 0.85 }, glossy: 1 },
  { scale: 0.96, lugs: LUGS4, bands: 2, coils: 1, crest: 1, spirals: 1, foot: 1, finish: 'raku', clay: { ...R6CLAY, clouds: 0.2, coil: 0xd8d0c2, cord: 0x2a2420 }, cut: { ...CUT6, wall: [60, 52, 48], fresh: [200, 194, 184], thr: 0.22 }, inlay: { r: 0.022, bright: 0.8 }, glossy: 1 },
  { scale: 1, lugs: LUGS4, bands: 2, coils: 1, crest: 1, spirals: 1, foot: 1, finish: 'gm', seam: 1, kintsugi: 1, clay: { ...R6CLAY }, cut: { ...CUT6, thr: 0.1, gold: [255, 216, 124], gain: 2.1, shade: 0.55, soot: 0 }, inlay: { r: 0.011, bright: 0.8, second: 1 } },
];
const DRESSES = {
  nacre: { finish: 'nacre', clay: { ...R6CLAY, base: '#3a2c26', grey: '60,54,50', red: '80,52,40', flashN: 8, clouds: 0.5, band: ['#140c0a', '#5a4a40', 'rgba(220,200,180,.25)'], field: ['#46362e', '#382a24', '#241a16'], fspeck: ['#2a1e18', '#6a5a50', '#140e0a'], speck: ['#2a1e18', '#6a5a50', '#140e0a'],
    groove: '#0c0806', lugTint: 0x9a8a80, wallTint: 0x8a7a72, coil: 0xb8893a, cord: 0xa87c34, brass: 1 }, cut: { ...CUT6, wall: [56, 42, 36], fresh: [110, 94, 84], gold: [236, 198, 120], thr: 0.26 }, inlay: { r: 0.011, bright: 0.85 } },
  glass: { finish: 'glass', clay: { ...R6CLAY, base: '#9a92b0', flashN: 0, clouds: 0, field: ['#c6c0d6', '#b2aac6', '#958ca8'], streak: ['255,255,255', '120,110,150'], fspeck: ['#d8d2e6', '#a49cba', '#eae6f2'], speck: ['#d8d2e6', '#a49cba', '#eae6f2'],
    groove: '#2a1438', grooveHi: 'rgba(255,255,255,.5)', floor: ['#8a82a0', '#8e86a4'], wall: '#4a4060', hl: 'rgba(255,255,255,.6)', lugTint: 0xffffff, wallTint: 0xffffff, coil: 0xd8d0ee, cord: 0xc8c0e0, glass: 1 },
    cut: { ...CUT6, wall: [110, 100, 136], fresh: [220, 214, 236], thr: 0.26 }, inlay: { r: 0.011, bright: 0.85, stone: 0x1c0a2a, amethyst: 1 } },
  brine: { finish: 'brine', clay: { ...R6CLAY, base: '#8a8274', flashN: 0, clouds: 0.3, field: ['#948c7e', '#80786a', '#5e584e'], streak: ['220,214,200', '40,36,30'], fspeck: ['#5a544a', '#b8b0a0', '#2a2620'], speck: ['#5a544a', '#b8b0a0', '#2a2620'],
    groove: '#0a0806', floor: ['#3a342c', '#3a342c'], wall: '#14100c', lugTint: 0xd8d0c4, wallTint: 0xc8c0b4, coil: 0xa88e64, cord: 0x9a8058, rope: 1 }, cut: { ...CUT6, wall: [70, 64, 56], fresh: [176, 168, 150], thr: 0.28 }, inlay: { r: 0.011, bright: 0.85 } },
};
const DRESS_OF_ZONE = { margarite: 'nacre', emocean: 'brine', entropolis: 'glass' };
/** One placard's spec: the tier's ware, the island's dress over it (its matter; the tier's shape and the Grandmaster's gold kept). */
function specOf(tier, dress) {
  const W = WARES[Math.min(6, Math.max(1, tier | 0))], D = DRESSES[dress];
  if (!D) return { ...W, tier };
  const gold = W.kintsugi ? { gold: W.cut.gold, gain: W.cut.gain, shade: W.cut.shade, soot: W.cut.soot, thr: W.cut.thr } : {};
  return { ...W, tier, finish: D.finish, cobalt: 0, glossy: 0, clay: D.clay, cut: { ...D.cut, ...gold }, inlay: { ...D.inlay, r: Math.max(D.inlay.r, W.inlay.r), bright: W.inlay.bright, second: W.inlay.second } };
}

/* ===================== the cartouche and the field's frame (round five's) ===================== */
function cartouche(a, b, n, k, wob, seed) {
  n = n || 4.5; k = k == null ? 0.09 : k; const P = [], N = 160, R = rng(seed || 3), ph = [R() * 6, R() * 6, R() * 6];
  for (let i = 0; i < N; i++) {
    const t = i / N * PI * 2, c = Math.cos(t), s = Math.sin(t);
    const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    let d = 1; for (const tc of [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4]) { let dt = Math.abs(t - tc); dt = Math.min(dt, PI * 2 - dt); d -= k * Math.exp(-Math.pow(dt / 0.07, 2)); }
    if (wob) d *= 1 + wob * (0.5 * Math.sin(t * 3 + ph[0]) + 0.3 * Math.sin(t * 7 + ph[1]) + 0.2 * Math.sin(t * 13 + ph[2]));
    P.push([x * d, y * d]);
  }
  return P;
}
const shapeOf = (P) => { const s = new THREE.Shape(); s.moveTo(...P[0]); for (const p of P.slice(1)) s.lineTo(...p); s.closePath(); return s; };
const pathOf = (P) => new THREE.Path(P.map((p) => new THREE.Vector2(...p)));
const SA = 1.86, SB = 1.16, ytop = (x) => SB * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x / SA), 4.5)), 1 / 4.5);
const MID = cartouche(1.62, 0.982, 4.5, 0.1).map((p, i) => { const w = 0.016 * Math.sin(i / 160 * PI * 2 * 9 + 0.7); return [p[0] * (1 + w), p[1] * (1 + w * 1.4)]; });
const FA = 1.42, FB = 0.84, BX = 4, BY = 2.56, BW = 1024, BH = 656, bx = (u) => (u + BX / 2) / BX * BW, by = (v) => (BY / 2 - v) / BY * BH;
const p2d = (P, closed) => { const p = new Path2D(); P.forEach((v, i) => (i ? p.lineTo(bx(v[0]), by(v[1])) : p.moveTo(bx(v[0]), by(v[1])))); if (closed) p.closePath(); return p; };
const FW = 1024, FH = Math.round(1024 * FB / FA), W2 = FW * Q, H2 = Math.round(FH * Q);
const fx = (u) => (u + FA) / (2 * FA) * FW, fy = (v) => (FB - v) / (2 * FB) * FH;
const GROOVE = cartouche(1.3, 0.74, 4.5, 0.08), TY = 245;
const gp = () => { const p = new Path2D(); GROOVE.forEach((v, i) => (i ? p.lineTo(fx(v[0]), fy(v[1])) : p.moveTo(fx(v[0]), fy(v[1])))); p.closePath(); return p; };
function textMask(font, txt, x0, y0, track) {
  const [c, x] = half(FW, FH); x.font = font; x.textBaseline = 'alphabetic'; x.fillStyle = '#fff';
  let w = 0; for (const ch of txt) w += x.measureText(ch).width + track; w -= track; let px = x0 - w / 2; for (const ch of txt) { x.fillText(ch, px, y0); px += x.measureText(ch).width + track; } return c;
}
const SEAM = (() => { const R = rng(9), pts = []; let x = fx(0.22), y = 0; pts.push([x, y]); while (y < FH) { y += 14 + R() * 22; x += (R() - 0.5) * 34 - (y > FH * 0.5 ? 6 : -2); pts.push([x, Math.min(y, FH)]); } return pts; })();
const T_ARR0 = 6.5, T_ARRD = 0.9, T_W0 = 3.6, T_W1 = 5.0, T_D0 = 5.4, T_DD = 0.6, NP = 2600, T_SEAL = 8.4, T_EXIT = 11.0, T_SETTLE = T_ARR0 + T_ARRD + 0.6, T_END = T_EXIT + 1.7;

/* ===================== the painters (round six's, given the ware's colours) ===================== */
function speck(x, S, n, cols, seed) { const R = rng(seed); for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; const r = 0.6 + R() * 1.6; x.fillRect(R() * S, R() * S, r, r); } }
function cordRolled(x, y, Wd, Ht, seed, o, C) {
  const R = rng(seed), ext = Math.hypot(Wd, Ht) / 2 + 24, k = o.beads || 3, slope = o.slope || 0.7;
  for (const c of [x, y]) { c.save(); c.translate(Wd / 2, Ht / 2); c.rotate(o.ang); }
  for (let b = -ext, row = 0; b < ext; b += o.bw + o.gap, row++) {
    const dir = row % 2 ? 1 : -1, ph = R() * o.pitch, wob = R() * 9, dx = dir * o.bw * slope, ang = Math.atan2(o.bw, dx), segL = Math.hypot(dx, o.bw) / k;
    for (let u = -ext + ph; u < ext; u += o.pitch * (0.93 + R() * 0.14)) {
      if (R() < 0.035) continue; const v0 = b + Math.sin(u * 0.012 + wob) * 1.4;
      for (let j = 0; j < k; j++) {
        const f = (j + 0.5) / k, cx = u + dx * (f - 0.5) + (R() - 0.5) * 0.6, cy = v0 + o.bw * f, L = segL * 0.4 * (0.85 + R() * 0.3), Wb = o.wid * (0.8 + R() * 0.4);
        x.fillStyle = `rgba(${C.dentHi},${0.10 + R() * 0.08})`; x.beginPath(); x.ellipse(cx + 0.3, cy + Wb * 0.75, L * 0.9, Wb * 0.6, ang, 0, 7); x.fill();
        x.fillStyle = `rgba(${C.dent},${0.45 + R() * 0.2})`; x.beginPath(); x.ellipse(cx, cy, L, Wb, ang, 0, 7); x.fill();
        y.fillStyle = 'rgba(18,18,18,.8)'; y.beginPath(); y.ellipse(cx, cy, L, Wb, ang, 0, 7); y.fill();
      }
    }
  }
  for (const c of [x, y]) c.restore();
}
function fireFlash(x, Wd, Ht, seed, n, C) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { const px = R() * Wd, py = R() * Ht, r = (0.12 + R() * 0.25) * Wd, g = x.createRadialGradient(px, py, 0, px, py, r), grey = R() < 0.55;
    g.addColorStop(0, grey ? `rgba(${C.grey},${0.35 + R() * 0.2})` : `rgba(${C.red},${0.3 + R() * 0.2})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  if (C.hiiro) for (let i = 0; i < 2; i++) { const px = Wd * (0.25 + 0.5 * i) + R() * Wd * 0.1, py = Ht * (0.3 + R() * 0.4), r = Wd * (0.3 + R() * 0.1), g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(196,92,40,.62)'); g.addColorStop(0.5, 'rgba(170,80,40,.3)'); g.addColorStop(1, 'rgba(150,70,40,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
}
function fireClouds(x, Wd, Ht, seed, n, str) {
  if (str <= 0) return; const R = rng(seed); x.save(); x.globalCompositeOperation = 'multiply';
  for (let c = 0; c < n; c++) { const cx = R() * Wd, cy = R() * Ht, rad = (0.1 + R() * 0.18) * Wd;
    for (let i = 0; i < 28; i++) { const px = cx + (R() - 0.5) * rad * 1.5, py = cy + (R() - 0.5) * rad, r = rad * (0.12 + R() * 0.32), a = str * (0.25 + R() * 0.35);
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(30,26,24,${a})`); g.addColorStop(0.6, `rgba(52,46,42,${a * 0.5})`); g.addColorStop(1, 'rgba(52,46,42,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); } }
  x.restore();
}
/* the finish: a pass per pixel over a colour, bump and ORM canvas, by the ware (green = roughness, blue = metalness); a generator,
   yielding every few rows so a build spreads over frames. Pixels are the half-size canvas's; the noise is asked at the mock's place. */
function* finishPass(S, c, b, o, seed, kind) {
  const F = S.finish, w = c.width, h = c.height; if (!F || F === 'none' || F === 'gm') return;
  const X = c.getContext('2d'), Y = b.getContext('2d'), Z = o.getContext('2d');
  const ci = X.getImageData(0, 0, w, h), bi = Y.getImageData(0, 0, w, h), oi = Z.getImageData(0, 0, w, h), C = ci.data, B = bi.data, O = oi.data;
  const n1 = vnoise(90, seed), n2 = vnoise(22, seed + 1), n3 = vnoise(7, seed + 2), n4 = vnoise(260, seed + 3);
  const crk = voro(kind === 'field' ? 26 : 20, seed + 4), tes = voro(kind === 'field' ? 14 : 9, seed + 5), grain = vnoise(3, seed + 6);
  const czA = voro(kind === 'field' ? 38 : 30, seed + 7), czB = voro(kind === 'field' ? 13 : 10, seed + 8); // (Raku's craze: a coarse net and a fine one inside it)
  for (let yy = 0; yy < h; yy++) {
    if (yy % 24 === 23) yield;
    for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4; if (C[i + 3] === 0) continue; const xm = xx / Q, ym = yy / Q;
      const base = [C[i], C[i + 1], C[i + 2]], bh = B[i] / 255, recess = cl((0.56 - bh) * 2.6), raised = cl((bh - 0.62) * 6), lum = (base[0] * 0.3 + base[1] * 0.59 + base[2] * 0.11) / 255;
      let col = base, rough = O[i + 1], metal = O[i + 2], bump = B[i];
      if (F === 'porcelain') rough = 150;
      else if (F === 'celadon') { const t = cl(0.3 + recess * 0.75 + (n2(xm, ym) - 0.5) * 0.25); col = mix3([170, 192, 162].map((v) => v * (0.78 + 0.3 * lum)), [46, 86, 70], t);
        col = mix3(col, base.map((v) => v * 1.05), raised * 0.55); const cz = crk(xm, ym)[0]; if (cz < 0.035 && n1(xm, ym) > 0.45) col = col.map((v) => v * 0.82); rough = 45 + raised * 60; bump = bump * 0.55 + 140 * 0.45; }
      else if (F === 'raku') {
        // bare clay, smoked black in the reduction: only on the lugs' edges (kind 'bare') and along the foot (the face's bottom)
        const bare = () => { col = [34, 30, 28].map((v) => v * (0.75 + 0.55 * n2(xm, ym)) * (0.9 + 0.2 * grain(xm, ym))); rough = 235; metal = 0; };
        const foot = kind === 'face' ? sm(0.875, 0.94, yy / h + (n2(xm, ym) - 0.5) * 0.05) : 0;
        if (kind === 'bare') bare();
        else {
          col = [236, 230, 216].map((v) => v * (0.88 + 0.12 * n2(xm, ym)) * (1 - 0.22 * recess)); rough = 60; metal = 0;
          // copper flash: patches of metallic red-copper turning green, gold where it thins
          const cu = sm(0.6, 0.8, n4(xm, ym) * 0.65 + n1(xm, ym) * 0.35);
          if (cu > 0) { const ph = n3(xm, ym) * 2.4 + n2(xm, ym) * 1.6, k = Math.floor(ph) % 3, f = ph - Math.floor(ph);
            const CU = [[168, 62, 36], [54, 128, 92], [196, 140, 64]], cc = mix3(CU[k], CU[(k + 1) % 3], f * f * (3 - 2 * f)); col = mix3(col, cc, cu * 0.8); metal = Math.round(170 * cu); rough = Math.round(60 + 20 * (1 - cu)); }
          // the craze: fine dark lines, a smoky halo either side of the coarse ones
          const a = czA(xm, ym)[0], bb = czB(xm, ym)[0], la = 1 - sm(0.018, 0.05, a), lb = (1 - sm(0.012, 0.04, bb)) * 0.7, halo = (1 - sm(0.05, 0.16, a)) * 0.18, ln = Math.max(la, lb);
          col = mix3(col, [150, 140, 128], halo * (1 - cu * 0.5)); col = mix3(col, [24, 20, 20], ln * 0.9); bump = bump * 0.6 + 150 * 0.4 - 34 * ln;
          if (foot > 0) { const c0 = col; bare(); col = mix3(c0, col, foot); rough = Math.round(60 + 175 * foot); }
        }
      } else if (F === 'nacre') {
        if (raised > 0.2 && kind !== 'tile') { const T = tes(xm, ym), e = T[0], id = T[1], R = ((id * 2654435761) >>> 0) % 1000 / 1000;
          if (e < 0.07) { col = [28, 20, 18]; rough = 200; }
          else { const ph = (R * 4 + n3(xm, ym) * 1.5 + xm * 0.002) % 4, k = Math.floor(ph), f = ph - k, NC = [[240, 218, 226], [208, 234, 222], [206, 220, 242], [242, 232, 204]];
            col = mix3(NC[k], NC[(k + 1) % 4], f).map((v) => v * (0.82 + 0.22 * R)); rough = 55; metal = 70; bump = bump + 8; } }
        else { col = base.map((v) => v * (0.9 + 0.2 * n2(xm, ym))); rough = 150; }
      } else if (F === 'glass') { const frost = cl(recess * 1.4 + (kind === 'field' ? 0.25 : 0)), clear = raised;
        col = mix3([160, 150, 188], [226, 222, 238], frost * 0.85); col = mix3(col, [96, 76, 140], clear * 0.8); col = col.map((v) => v * (0.92 + 0.1 * grain(xm, ym))); rough = Math.round(30 + 180 * frost * (1 - clear)); metal = 0; }
      else if (F === 'brine') { const gn = Math.sin(ym * 0.21 + n1(xm, ym) * 14 + n2(xm * 0.2, ym) * 3) * 0.5 + 0.5, silver = [164, 156, 142].map((v) => v * (0.78 + 0.3 * gn) * (0.9 + 0.15 * n4(xm, ym)));
        col = silver; if (gn < 0.12) col = col.map((v) => v * 0.7);
        const tar = cl(recess * 1.6 - 0.15); col = mix3(col, [18, 15, 13], tar); rough = Math.round(220 - 170 * tar);
        const salt = sm(0.62, 0.8, n3(xm, ym) * 0.6 + n1(xm, ym) * 0.4) * cl(recess * 1.2 + 0.25) * (grain(xm, ym) > 0.45 ? 1 : 0.3); col = mix3(col, [236, 234, 226], salt * 0.85); if (salt > 0.3) rough = 250; }
      C[i] = Math.min(255, col[0]); C[i + 1] = Math.min(255, col[1]); C[i + 2] = Math.min(255, col[2]); O[i + 1] = Math.max(0, Math.min(255, rough)); O[i + 2] = Math.max(0, Math.min(255, metal)); B[i] = B[i + 1] = B[i + 2] = Math.max(0, Math.min(255, bump));
    }
  }
  X.putImageData(ci, 0, 0); Y.putImageData(bi, 0, 0); Z.putImageData(oi, 0, 0);
}

/* ===================== the System's seal: the burned print, in the window colour ===================== */
function bitsOf(str, n) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } const R = rng(h >>> 0), o = []; for (let i = 0; i < n; i++) o.push(R() < 0.5); return o; }
let SEAL_FACE_DRAWS = null; // (sealface.js draws the name in the Comb once it is built; until then the Comb's star stands in its circle)
function sealMarks(x, S, col) {
  const R = S * 0.47; x.save(); x.translate(S / 2, S / 2); x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
  x.lineWidth = S * 0.02; x.beginPath(); x.arc(0, 0, R * 0.93, 0, 7); x.stroke();
  const bits = bitsOf(NAME, 40);
  for (let i = 0; i < 40; i++) { if (i % 10 === 0) continue; const a = i / 40 * PI * 2, w = bits[i] ? S * 0.026 : S * 0.011; x.save(); x.rotate(a); x.fillRect(R * 0.75, -w / 2, R * 0.11, w); x.restore(); }
  for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * PI / 2); x.translate(R * 0.805, 0); x.lineWidth = S * 0.008; const f = S * 0.02;
    x.strokeRect(-f, -f, 2 * f, 2 * f); x.beginPath(); x.moveTo(-f * 1.5, 0); x.lineTo(f * 1.5, 0); x.moveTo(0, -f * 1.5); x.lineTo(0, f * 1.5); x.stroke(); x.restore(); }
  const rc = R * 0.68; x.lineWidth = S * 0.011; x.beginPath(); x.arc(0, 0, rc, 0, 7); x.stroke();
  for (let k = 0; k < 4; k++) { x.save(); x.rotate(PI / 4 + k * PI / 2); x.lineWidth = S * 0.008; x.beginPath(); x.moveTo(rc, 0); x.lineTo(R * 0.74, 0); x.stroke(); x.beginPath(); x.arc(R * 0.72, 0, S * 0.01, 0, 7); x.stroke(); x.restore(); }
  // the name in the Comb (sealface.js), or the Comb's star while that is a stub
  if (SEAL_FACE_DRAWS === null) { const [t, tx] = half(64, 64); try { drawSealFace(tx, { name: NAME, outline: 'maru', carving: 'shubun' }, { size: 64, ink: '#fff' }); } catch { /* a stub */ } SEAL_FACE_DRAWS = tx.getImageData(0, 0, t.width, t.height).data.some((v, i) => i % 4 === 3 && v > 0); }
  const sz = rc * 1.3;
  if (SEAL_FACE_DRAWS) { x.save(); x.translate(-sz / 2, -sz / 2); try { drawSealFace(x, { name: NAME, outline: 'maru', carving: 'shubun' }, { size: sz, ink: col }); } catch { /* a stub */ } x.restore(); }
  else { const r = rc * 0.5; x.lineWidth = S * 0.014; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); for (let k = 0; k < 6; k++) { const a = (k * 60 - 90) * D2R; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.33, Math.sin(a) * r * 0.33); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.stroke(); } }
  x.restore();
}
// the burned print: lit (the beat) or dim (left behind). The scorch is a soft ring of soot round it.
function sealBurn(S, mode, L) {
  const [c, x] = half(S, S), r0 = S * 0.47;
  const sc = x.createRadialGradient(S / 2, S / 2, r0 * 0.2, S / 2, S / 2, r0 * 1.04); sc.addColorStop(0, 'rgba(8,10,9,.18)'); sc.addColorStop(0.85, 'rgba(6,8,7,.42)'); sc.addColorStop(1, 'rgba(6,8,7,0)');
  x.fillStyle = sc; x.beginPath(); x.arc(S / 2, S / 2, r0 * 1.04, 0, 7); x.fill();
  if (mode === 'lit') { x.save(); x.filter = `blur(${5 * Q}px)`; x.globalAlpha = 0.9; sealMarks(x, S, L.glow); x.restore(); x.save(); x.filter = `blur(${1.5 * Q}px)`; sealMarks(x, S, `rgb(${L.sel})`); x.restore(); sealMarks(x, S, L.hi); }
  else { x.save(); x.filter = `blur(${2 * Q}px)`; x.globalAlpha = 0.5; sealMarks(x, S, `rgb(${L.sel})`); x.restore(); x.globalAlpha = 0.62; sealMarks(x, S, L.mid); x.globalAlpha = 1;
    const R = rng(64); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,${0.2 + R() * 0.4})`; x.beginPath(); x.arc(S * 0.1 + R() * S * 0.8, S * 0.1 + R() * S * 0.8, 2 + R() * 7, 0, 7); x.fill(); } x.globalCompositeOperation = 'source-over'; }
  return c;
}
/** The window colour as the seal wears it (ui/theme.js): its tint, frame middle and light, and a glow pushed brighter and purer. */
function sealLook() {
  const T = THEMES[theme.id] || THEMES.verdigris, s = T.sel.split(',').map(Number), m = (s[0] + s[1] + s[2]) / 3, k = 230 / Math.max(...s);
  const g = s.map((v) => Math.round(Math.min(255, Math.max(0, (m + (v - m) * 1.4) * k))));
  return { sel: T.sel, mid: T.mid, hi: T.hi, glow: `rgba(${g.join(',')},1)` };
}

/* ===================== one placard, built from its spec over several frames ===================== */
function* buildVariant(S, info, env) {
  const C = S.clay, seedB = S.tier * 101 + S.finish.length * 7, V = { S, glowList: [], swap: [] };
  // ---- the clay tile (lugs and walls)
  function* tileOf(kind, out) {
    const Sz = 512, [c, x] = half(Sz, Sz), [b, y] = half(Sz, Sz), [o, z] = half(Sz, Sz);
    x.fillStyle = C.base; x.fillRect(0, 0, Sz, Sz); fireFlash(x, Sz, Sz, 70, Math.round(C.flashN * 0.6), C); y.fillStyle = '#8a8a8a'; y.fillRect(0, 0, Sz, Sz); z.fillStyle = 'rgb(0,242,0)'; z.fillRect(0, 0, Sz, Sz);
    cordRolled(x, y, Sz, Sz, 72, { ang: 0.35, bw: 17, gap: 4, pitch: 7.5, wid: 1.8 }, C); fireClouds(x, Sz, Sz, 73, 2, 0.8 * C.clouds); speck(x, Sz, 2500, C.speck, 2); yield;
    yield* finishPass(S, c, b, o, seedB + 1, kind);
    const t = [tex(c, 1), tex(b), tex(o)]; for (const k of t) { k.wrapS = k.wrapT = THREE.RepeatWrapping; k.repeat.set(0.9, 0.9); } out.push(...t);
  }
  const tile = [], bareTile = S.finish === 'raku' ? [] : null; yield* tileOf('tile', tile); if (bareTile) yield* tileOf('bare', bareTile);
  // ---- the body face (the rim and its band)
  const face = {}; {
    const [c, x] = half(BW, BH), [b, y] = half(BW, BH), [o, z] = half(BW, BH), [cm, cmx] = half(BW, BH), [cb, cbx] = half(BW, BH);
    cmx.fillStyle = C.base; cmx.fillRect(0, 0, BW, BH); fireFlash(cmx, BW, BH, 311, C.flashN, C); cbx.fillStyle = '#8a8a8a'; cbx.fillRect(0, 0, BW, BH);
    cordRolled(cmx, cbx, BW, BH, 17, { ang: -0.22, bw: 15, gap: 3.5, pitch: 6.5, wid: 1.6 }, C); yield;
    put(x, cm); put(y, cb); z.fillStyle = 'rgb(0,242,0)'; z.fillRect(0, 0, BW, BH);
    const ring = new Path2D(); ring.addPath(p2d(cartouche(1.8, 1.1, 4.5, 0.1), 1)); ring.addPath(p2d(cartouche(FA, FB, 4.5, 0.09), 1));
    for (const cx of [x, y]) { cx.save(); cx.clip(ring, 'evenodd'); cx.lineCap = 'round'; cx.lineJoin = 'round'; }
    const band = (path, wg, wb) => { if (S.cobalt) { x.strokeStyle = '#23479a'; x.lineWidth = wg + 7; x.stroke(path); }
      x.strokeStyle = C.band[0]; x.lineWidth = wg; x.stroke(path); x.strokeStyle = C.band[1]; x.lineWidth = wb; x.stroke(path);
      x.strokeStyle = C.band[2]; x.lineWidth = Math.max(1, wb * 0.25); x.save(); x.translate(0, -wb * 0.18); x.stroke(path); x.restore();
      if (S.cobalt) { x.strokeStyle = '#2d58b0'; x.lineWidth = 1.6; x.stroke(path); }
      y.strokeStyle = '#262626'; y.lineWidth = wg; y.stroke(path); y.strokeStyle = '#b8b8b8'; y.lineWidth = wb; y.stroke(path); };
    if (S.bands >= 1) band(p2d(MID, 1), 25, 16);
    if (S.bands >= 2) { const RS = rng(808);
      for (const i of [9, 33, 61, 79, 104, 127, 150]) { const cxp = bx(MID[i][0]), cyp = by(MID[i][1]), r0 = 25 + RS() * 4, dir = RS() < 0.5 ? 1 : -1, a0 = RS() * 7;
        for (const [cx, src] of [[x, cm], [y, cb]]) { cx.save(); cx.beginPath(); cx.arc(cxp, cyp, r0 + 3, 0, 7); cx.clip(); put(cx, src); cx.restore(); }
        const sp = new Path2D(); for (let k = 0; k <= 96; k++) { const a = a0 + dir * k / 96 * PI * 2 * 2.1, r = r0 - (r0 - 4) * k / 96; k ? sp.lineTo(cxp + Math.cos(a) * r, cyp + Math.sin(a) * r) : sp.moveTo(cxp + Math.cos(a) * r, cyp + Math.sin(a) * r); }
        band(sp, 9, 4.5); }
      x.strokeStyle = S.cobalt ? '#2a50a6' : 'rgba(30,18,12,.85)'; y.strokeStyle = '#2a2a2a';
      for (const i of [20, 46, 70, 92, 116, 139, 157]) { const p = MID[i], q = MID[(i + 1) % 160], tx = q[0] - p[0], ty = q[1] - p[1], l = Math.hypot(tx, ty), nx = -ty / l, ny = tx / l;
        for (let k = -1; k <= 1; k++) { const ox = p[0] + tx / l * k * 0.03, oy = p[1] + ty / l * k * 0.03; for (const cx of [x, y]) { cx.lineWidth = 3; cx.beginPath(); cx.moveTo(bx(ox + nx * 0.1), by(oy + ny * 0.1)); cx.lineTo(bx(ox - nx * 0.1), by(oy - ny * 0.1)); cx.stroke(); } } } }
    for (const cx of [x, y]) cx.restore();
    fireClouds(x, BW, BH, 41, 4, C.clouds); speck(x, BW, 6000, C.speck, 7); yield;
    yield* finishPass(S, c, b, o, seedB + 2, 'face');
    // kintsugi on the rim (Grandmaster): gold seams, and open cracks with the light behind them (drawn into L)
    let L = null;
    if (S.kintsugi) { const [Lc, l] = half(BW, BH), R = rng(3131); L = Lc;
      const walk = (x0, y0, ang, n, step) => { const P = [[x0, y0]]; let a = ang, px = x0, py = y0; for (let i = 0; i < n; i++) { a += (R() - 0.5) * 0.9; px += Math.cos(a) * step * (0.7 + R() * 0.6); py += Math.sin(a) * step * (0.7 + R() * 0.6); P.push([px, py]); } return P; };
      const stroke = (cx, P, col, lw) => { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineJoin = 'round'; cx.lineCap = 'round'; cx.beginPath(); P.forEach((p, i) => (i ? cx.lineTo(...p) : cx.moveTo(...p))); cx.stroke(); };
      for (const P of [walk(bx(-1.5), by(0.98), 0.9, 9, 12), walk(bx(1.62), by(0.55), 2.6, 8, 12), walk(bx(0.4), by(-1.08), -1.4, 6, 11)]) { stroke(x, P, '#2a140a', 7); stroke(x, P, '#d4a03e', 4); stroke(x, P, 'rgba(255,238,180,.8)', 1.3); stroke(y, P, '#e0e0e0', 5); stroke(z, P, 'rgb(0,70,255)', 5); }
      for (const P of [walk(bx(-1.62), by(-0.5), 0.2, 7, 10), walk(bx(1.5), by(-0.9), -2.4, 6, 10)]) { stroke(x, P, '#0c0604', 4.5); stroke(y, P, '#101010', 4);
        stroke(l, P, 'rgba(255,200,120,.35)', 14); stroke(l, P, 'rgba(140,110,255,.35)', 8); stroke(l, P, 'rgba(255,236,200,.95)', 2.2); } }
    face.t = [tex(c, 1), tex(b), tex(o)]; for (const k of face.t) { k.repeat.set(1 / BX, 1 / BY); k.offset.set(0.5, 0.5); }
    face.LT = null; if (L) { face.LT = tex(L, 1); face.LT.repeat.set(1 / BX, 1 / BY); face.LT.offset.set(0.5, 0.5); }
  }
  yield;
  // ---- the field's base (the title not yet cut)
  const [s1, s1x] = half(FW, FH), [s2, s2x] = half(FW, FH), [s3, s3x] = half(FW, FH), [s4, s4x] = half(FW, FH); // (scratch for the carving)
  const clear = (x) => { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W2, H2); x.restore(); x.globalCompositeOperation = 'source-over'; };
  const BASE = {}; {
    const [c, x] = half(FW, FH), [b, y] = half(FW, FH), [o, z] = half(FW, FH), [e, q] = half(FW, FH), R = rng(23);
    const g = x.createRadialGradient(FW / 2, FH * 0.42, 40, FW / 2, FH / 2, FW * 0.6); g.addColorStop(0, C.field[0]); g.addColorStop(0.6, C.field[1]); g.addColorStop(1, C.field[2]); x.fillStyle = g; x.fillRect(0, 0, FW, FH);
    fireFlash(x, FW, FH, 97, Math.round(C.flashN * 0.56), C);
    for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(${R() < 0.5 ? C.streak[0] : C.streak[1]},${0.02 + R() * 0.035})`; x.lineWidth = 1 + R() * 3; const yy = R() * FH, xx = R() * FW; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 60 + R() * 160, yy + (R() - 0.5) * 6); x.stroke(); }
    speck(x, FW, 7000, C.fspeck, 4);
    y.fillStyle = '#c8c8c8'; y.fillRect(0, 0, FW, FH); z.fillStyle = 'rgb(0,240,0)'; z.fillRect(0, 0, FW, FH); q.fillStyle = '#000'; q.fillRect(0, 0, FW, FH);
    cordRolled(s1x, s2x, FW, FH, 29, { ang: 0.18, bw: 11, gap: 2.5, pitch: 5, wid: 1.25 }, C);
    for (const [cx, src] of [[x, s1], [y, s2]]) { cx.save(); const clip = new Path2D(); clip.rect(0, 0, FW, FH); clip.addPath(gp()); cx.clip(clip, 'evenodd'); put(cx, src); cx.restore(); }
    yield;
    const gw = Math.max(13, Math.round(S.inlay.r / 0.009 * 13));
    for (const [cx, col, lw] of [[x, C.groove, gw], [y, '#0c0c0c', gw + 1]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.stroke(gp()); }
    x.strokeStyle = C.grooveHi; x.lineWidth = 2; x.save(); x.translate(0, gw * 0.46); x.stroke(gp()); x.restore();
    if (S.cobalt) { x.strokeStyle = '#2650a8'; x.lineWidth = 2.4; x.save(); x.translate(FW / 2, FH / 2); x.scale(0.93, 0.9); x.translate(-FW / 2, -FH / 2); x.stroke(gp()); x.restore(); }
    const carve = (m, depth, floor) => {
      clear(s1x); put(s1x, m); s1x.globalCompositeOperation = 'source-in'; s1x.fillStyle = floor; s1x.fillRect(0, 0, FW, FH); s1x.globalCompositeOperation = 'source-over';
      clear(s2x); put(s2x, m); s2x.globalCompositeOperation = 'source-in'; s2x.fillStyle = C.wall; s2x.fillRect(0, 0, FW, FH);
      s2x.globalCompositeOperation = 'destination-out'; put(s2x, m, depth * 0.4, depth * 1.3); s2x.globalCompositeOperation = 'source-over'; put(x, s1); put(x, s2);
      clear(s3x); put(s3x, m); s3x.globalCompositeOperation = 'source-in'; s3x.fillStyle = C.hl; s3x.fillRect(0, 0, FW, FH);
      s3x.globalCompositeOperation = 'destination-out'; put(s3x, m, 0, -1.5); s3x.globalCompositeOperation = 'source-over'; put(x, s3, 0, 1.5);
      clear(s4x); put(s4x, m); s4x.globalCompositeOperation = 'source-in'; s4x.fillStyle = '#202020'; s4x.fillRect(0, 0, FW, FH); s4x.globalCompositeOperation = 'source-over';
      y.save(); y.filter = `blur(${Math.max(1, depth * 0.5) * Q}px)`; put(y, s4); y.restore();
    };
    carve(textMask(CINZEL(30), 'TITLE', FW / 2, 96, 10), 2, C.floor[0]);
    const [rl, rx] = half(FW, FH); rx.strokeStyle = '#fff'; rx.fillStyle = '#fff'; rx.lineWidth = 3;
    for (const s of [-1, 1]) { const a = FW / 2 + s * 70, bb = FW / 2 + s * 230; rx.beginPath(); rx.moveTo(a, 86); rx.lineTo(bb, 86); rx.stroke(); rx.beginPath(); rx.arc(bb + s * 8, 86, 7, 0, 7); rx.stroke(); rx.beginPath(); rx.arc(bb + s * 8, 86, 2.5, 0, 7); rx.fill(); }
    carve(rl, 2, C.floor[0]);
    if (info.line2) { carve(textMask(READ(44), info.line1, FW / 2, 388, 0), 2, C.floor[1]); carve(textMask(READ(44), info.line2, FW / 2, 436, 0), 2, C.floor[1]); }
    else carve(textMask(READ(44), info.line1, FW / 2, 410, 0), 2, C.floor[1]);
    { const t = cv(10, 10).getContext('2d'); t.font = COUNT(46); let w = 0; for (const ch of info.rows) w += t.measureText(ch).width + 2; carve(textMask(COUNT(46), info.rows, Math.min(440, 790 - w / 2), 508, 2), 2, C.floor[1]); } // (kept clear of the seal)
    fireClouds(x, FW, FH, 57, 2, 0.7 * C.clouds); yield;
    yield* finishPass(S, c, b, o, seedB + 3, 'field');
    Object.assign(BASE, { x: c, y: b, z: o, q: e });
  }
  // ---- the kintsugi seam over the title (Grandmaster only), drawn last
  const SEAMS = S.seam ? (() => { const L = { x: half(FW, FH), y: half(FW, FH), z: half(FW, FH), q: half(FW, FH) };
    const seam = (cx, col, lw) => { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineJoin = 'round'; cx.beginPath(); SEAM.forEach((p, i) => (i ? cx.lineTo(...p) : cx.moveTo(...p))); cx.stroke();
      cx.beginPath(); const k = Math.floor(SEAM.length * 0.62); cx.moveTo(...SEAM[k]); cx.lineTo(SEAM[k][0] + 60, SEAM[k][1] + 24); cx.lineTo(SEAM[k][0] + 96, SEAM[k][1] + 19); cx.stroke(); };
    seam(L.x[1], '#24100a', 7); seam(L.x[1], '#d9a441', 3.5); seam(L.x[1], 'rgba(255,240,190,.75)', 1.2); seam(L.y[1], '#e8e8e8', 5); seam(L.z[1], 'rgb(0,60,255)', 5); seam(L.q[1], '#3a2a08', 4);
    return { x: L.x[0], y: L.y[0], z: L.z[0], q: L.q[0] }; })() : null;
  // an open crack in the field with the light behind it (Grandmaster)
  let FCRACK = null;
  if (S.kintsugi) { const R = rng(4242), P = [[fx(-1.32), fy(0.3)]]; let a = 0.25; for (let i = 0; i < 9; i++) { a += (R() - 0.5) * 0.8; const p = P[P.length - 1]; P.push([p[0] + Math.cos(a) * 16, p[1] + Math.sin(a) * 16]); }
    const [L, l] = half(FW, FH); const st = (cx, col, lw) => { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.beginPath(); P.forEach((p, i) => (i ? cx.lineTo(...p) : cx.moveTo(...p))); cx.stroke(); };
    const bxx = BASE.x.getContext('2d'), byy = BASE.y.getContext('2d'); st(bxx, '#0c0604', 5); st(byy, '#101010', 5);
    st(l, 'rgba(255,200,120,.3)', 18); st(l, 'rgba(140,110,255,.35)', 10); st(l, 'rgba(255,236,200,.95)', 2.6); FCRACK = L; }
  yield;
  // ---- the title's rough cut (round six), in the ware's colours
  const CUT = {}; {
    const txt = info.title.toUpperCase(), blurPx = 4, seed = 501 + S.tier, K = S.cut;
    const t = cv(10, 10).getContext('2d'); let ts = 160; t.font = CINZEL(ts); let w = 0; for (const ch of txt) w += t.measureText(ch).width + 6; if (w > 720) ts = Math.floor(ts * 720 / w);
    t.font = CINZEL(ts); const capH = t.measureText('H').actualBoundingBoxAscent || ts * 0.7;
    const mask = textMask(CINZEL(ts), txt, FW / 2, Math.round(TY + capH / 2), 6);
    const R = rng(seed), Od = mask.getContext('2d').getImageData(0, 0, W2, H2).data;
    const [chips, cx] = half(FW, FH); put(cx, mask); cx.fillStyle = '#fff';
    for (let yy = 1; yy < H2 - 1; yy++) for (let xx = 1; xx < W2 - 1; xx++) { const i = (yy * W2 + xx) * 4 + 3;
      if (Od[i] > 128 && (Od[i - 4] < 128 || Od[i + 4] < 128 || Od[i - W2 * 4] < 128 || Od[i + W2 * 4] < 128) && R() < 0.03 / Q) {
        const r = 1.2 + R() * R() * 6, n = 5 + (R() * 3 | 0); cx.beginPath(); for (let j = 0; j < n; j++) { const a = j / n * 6.283 + R() * 0.6, rr = r * (0.5 + R() * 0.8), px = xx / Q + Math.cos(a) * rr, py = yy / Q + Math.sin(a) * rr; j ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.fill(); } }
    const [bl, blx] = half(FW, FH); blx.filter = `blur(${blurPx * Q}px)`; put(blx, chips);
    const M = cx.getImageData(0, 0, W2, H2).data, B = blx.getImageData(0, 0, W2, H2).data;
    const mk = () => { const c = cv(W2, H2), g = c.getContext('2d'); return [c, g, g.createImageData(W2, H2)]; };
    const [mapC, mapCx, mapCi] = mk(), [mapG, mapGx, mapGi] = mk(), [bmp, bmpx, bmpi] = mk(), [ormC, ormCx, ormCi] = mk(), [ormG, ormGx, ormGi] = mk(), [emG, emGx, emGi] = mk();
    const wear = vnoise(9, seed + 1), wear2 = vnoise(3.5, seed + 2), grain = vnoise(26, seed + 3);
    let Lx = -0.4, Ly = -0.7, Lz = 0.6; const ll = Math.hypot(Lx, Ly, Lz); Lx /= ll; Ly /= ll; Lz /= ll;
    let x0 = W2, x1 = 0, y0 = H2, y1 = 0;
    yield;
    for (let yy = 1; yy < H2 - 1; yy++) {
      if (yy % 40 === 39) yield;
      for (let xx = 1; xx < W2 - 1; xx++) { const p = yy * W2 + xx, i = p * 4; if (M[i + 3] < 100) continue; const xm = xx / Q, ym = yy / Q;
        if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
        const d = B[i + 3] / 255, gx = (B[i + 7] - B[i - 1]) / 510 * Q, gy = (B[i + W2 * 4 + 3] - B[i - W2 * 4 + 3]) / 510 * Q;
        let nx = gx * 9, ny = gy * 9, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const lam = Math.max(0, nx * Lx + ny * Ly + nz * Lz), fresh = Od[i + 3] < 128, gn = 0.85 + 0.3 * grain(xm, ym);
        let r, g2, b2;
        if (fresh) { r = K.fresh[0] * (0.6 + 0.55 * lam); g2 = K.fresh[1] * (0.6 + 0.55 * lam); b2 = K.fresh[2] * (0.6 + 0.55 * lam); }
        else { const k = (0.35 + 0.95 * lam) * gn * (1 - 0.35 * d); r = K.wall[0] * k; g2 = K.wall[1] * k; b2 = K.wall[2] * k; }
        const gold = fresh ? 0 : sm(0.42, 0.66, d) * (wear(xm, ym) * 0.7 + wear2(xm, ym) * 0.3 > K.thr ? 1 : 0) * (0.85 + 0.15 * wear2(xm, ym));
        const lg = Math.max(0, -nx * Lx - ny * Ly + nz * Lz), hl = Math.pow(lg, 7), sh = 1 - sm(0.25, 0.75, lg), gq = 0.9 + 0.2 * grain(xm * 2, ym * 2);
        const shk = sh * (K.shade == null ? 1 : K.shade), gk = K.gain || 1;
        const G0 = Math.min(255, (K.gold[0] * (0.62 + 0.5 * lg) * (1 - 0.55 * shk) + 70 * hl) * gq), G1 = Math.min(255, (K.gold[1] * (0.62 + 0.5 * lg) * (1 - 0.6 * shk) + 60 * hl) * gq), G2 = Math.min(255, (K.gold[2] * (0.62 + 0.5 * lg) * (1 - 0.7 * shk) + 90 * hl) * gq);
        const A = mapCi.data, Gd = mapGi.data; A[i] = r; A[i + 1] = g2; A[i + 2] = b2; A[i + 3] = 255; Gd[i] = r + (G0 - r) * gold; Gd[i + 1] = g2 + (G1 - g2) * gold; Gd[i + 2] = b2 + (G2 - b2) * gold; Gd[i + 3] = 255;
        const bv = 200 - d * 185; bmpi.data[i] = bmpi.data[i + 1] = bmpi.data[i + 2] = bv; bmpi.data[i + 3] = 255;
        ormCi.data[i + 1] = 245; ormCi.data[i + 3] = 255; ormGi.data[i + 1] = 245 - gold * 200; ormGi.data[i + 2] = gold * 255; ormGi.data[i + 3] = 255;
        const ge = (gold * (0.35 + 0.65 * lg) * (1 - 0.6 * shk) + gold * hl * 0.6) * gk; emGi.data[i] = Math.min(255, 175 * ge); emGi.data[i + 1] = Math.min(255, 122 * ge); emGi.data[i + 2] = Math.min(255, 38 * ge); emGi.data[i + 3] = 255; }
    }
    mapCx.putImageData(mapCi, 0, 0); mapGx.putImageData(mapGi, 0, 0); bmpx.putImageData(bmpi, 0, 0); ormCx.putImageData(ormCi, 0, 0); ormGx.putImageData(ormGi, 0, 0); emGx.putImageData(emGi, 0, 0);
    if (C.clouds > 0) for (const [g, k] of [[mapCx, 0.7], [mapGx, 0.25 * (K.soot == null ? 1 : K.soot)]]) { g.setTransform(Q, 0, 0, Q, 0, 0); fireClouds(g, FW, FH, 57, 2, k * C.clouds); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(chips, 0, 0); g.globalCompositeOperation = 'source-over'; }
    Object.assign(CUT, { mask: chips, mapC, mapG, bmp, ormC, ormG, emG, box: [x0, y0, x1, y1] });
  }
  yield;
  const ARR = new Float32Array(W2 * H2).fill(1e9); {
    const [x0, y0, x1, y1] = CUT.box, Md = CUT.mask.getContext('2d').getImageData(0, 0, W2, H2).data, n = vnoise(14, 77);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const p = yy * W2 + xx; if (Md[p * 4 + 3] < 100) continue; ARR[p] = T_ARR0 + T_ARRD * (xx - x0) / (x1 - x0) + (n(xx / Q, yy / Q) - 0.5) * 0.22; }
  }
  // ---- the composed field (base, the cut as it arrives, the seam)
  const FMAP = cv(W2, H2), FBUMP = cv(W2, H2), FORM = cv(W2, H2), FEM = cv(W2, H2), TMP = cv(W2, H2), MC = cv(W2, H2), MG = cv(W2, H2);
  const FT = { map: tex(FMAP, 1), bump: tex(FBUMP), orm: tex(FORM), em: tex(FEM, 1) };
  const [bx0, by0, bx1, by1] = CUT.box, BWd = bx1 - bx0 + 1, BHd = by1 - by0 + 1, MCid = MC.getContext('2d').createImageData(BWd, BHd), MGid = MG.getContext('2d').createImageData(BWd, BHd);
  function thresholdMask(dst, id, t, lag) { const d = id.data;
    for (let yy = by0; yy <= by1; yy++) for (let xx = bx0; xx <= bx1; xx++) { const p = yy * W2 + xx, j = ((yy - by0) * BWd + (xx - bx0)) * 4, a = cl((t - ARR[p] - lag) / 0.12); d[j] = d[j + 1] = d[j + 2] = 255; d[j + 3] = a * 255; }
    dst.getContext('2d').putImageData(id, bx0, by0); }
  V.compose = (t) => { // t: the arrival's moment; null: the cut whole; -1: the base alone
    const full = t == null; if (!full && t >= 0) { thresholdMask(MC, MCid, t, 0); thresholdMask(MG, MGid, t, 0.35); }
    const lay = (dst, src, mask) => { const tg = TMP.getContext('2d'); tg.globalCompositeOperation = 'copy'; tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask, 0, 0); tg.globalCompositeOperation = 'source-over'; dst.getContext('2d').drawImage(TMP, 0, 0); };
    for (const [dst, base, cC, cG, sm2] of [[FMAP, BASE.x, CUT.mapC, CUT.mapG, SEAMS?.x], [FBUMP, BASE.y, CUT.bmp, CUT.bmp, SEAMS?.y], [FORM, BASE.z, CUT.ormC, CUT.ormG, SEAMS?.z], [FEM, BASE.q, null, CUT.emG, SEAMS?.q]]) {
      const g = dst.getContext('2d'); g.globalCompositeOperation = 'copy'; g.drawImage(base, 0, 0); g.globalCompositeOperation = 'source-over';
      if (full) { if (cC) g.drawImage(cC, 0, 0); g.drawImage(cG, 0, 0); } else if (t > T_ARR0 - 0.2) { if (cC) lay(dst, cC, MC); lay(dst, cG, MG); }
      if (sm2) g.drawImage(sm2, 0, 0);
    }
    for (const k in FT) FT[k].needsUpdate = true;
  };
  V.compose(-1); yield;
  // ---- the running hand on the field, and the motes (round six's)
  V.hand = !!info.words;
  const HANDM = half(FW, FH), HANDLIT = half(FW, FH); let HB = null, HS = 1, HOY = TY, HX0 = FW / 2 - 200, HX1 = FW / 2 + 200;
  if (V.hand) {
    const m = runningHand(null, info.words, { scale: 1 }); HB = { x0: m.x0, y0: m.y0, w: m.width, h: m.height };
    HS = Math.min(620 / HB.w, 200 / HB.h); const HOX = FW / 2 - (HB.x0 + HB.w / 2) * HS; HOY = TY - (HB.y0 + HB.h / 2) * HS; HX0 = HOX + HB.x0 * HS; HX1 = HOX + (HB.x0 + HB.w) * HS;
    runningHand(HANDM[1], info.words, { x: HOX, y: HOY, scale: HS, ink: '#fff', lw: HS * 0.95 });
    const g = HANDLIT[1]; g.filter = `blur(${5 * Q}px)`; g.globalAlpha = 0.8; put(g, HANDM[0]); g.filter = 'none'; g.globalAlpha = 1; put(g, HANDM[0]);
    g.globalCompositeOperation = 'source-in'; const gr = g.createLinearGradient(HX0, 0, HX1, 0); for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, filmRGB(0.15 + i / 8 * 1.1, 1)); g.fillStyle = gr; g.fillRect(0, 0, FW, FH);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55; put(g, HANDM[0]); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  const sample = (c, n, seed) => { const d = c.getContext('2d').getImageData(0, 0, W2, H2).data, pts = []; for (let i = 0; i < W2 * H2; i++) if (d[i * 4 + 3] > 140) pts.push(i);
    const R = rng(seed), o = []; for (let k = 0; k < n; k++) { const p = pts[Math.floor(R() * pts.length)] || 0; o.push([(p % W2 + R() - 0.5) / Q, (Math.floor(p / W2) + R() - 0.5) / Q]); } return o.sort((a, b) => a[0] - b[0]); };
  const [cbx0, , cbx1] = CUT.box.map((v) => v / Q);
  if (V.hand) {
    const SRC = sample(HANDM[0], NP, 61), TGT = sample(CUT.mask, NP, 62);
    V.mote = { SRC, TGT, td: new Float32Array(NP), ta: new Float32Array(NP), hue: new Float32Array(NP), u: new Float32Array(NP), x: new Float32Array(NP), y: new Float32Array(NP), hx: new Float32Array(NP * 4), hy: new Float32Array(NP * 4), n: new Uint32Array(NP) };
    SRC.forEach((s, i) => { const R = rng(900 + i), M = V.mote; M.td[i] = T_D0 + T_DD * (s[0] - HX0) / (HX1 - HX0) + R() * 0.06; M.ta[i] = T_ARR0 + T_ARRD * (TGT[i][0] - cbx0) / (cbx1 - cbx0) + (R() - 0.5) * 0.1; M.hue[i] = R(); M.u[i] = M.td[i]; M.x[i] = s[0]; M.y[i] = s[1]; });
  }
  yield;
  // ---- the overlay canvas on the field: the hand as it is written and taken, the cut's arrival glow
  const [OV, ovx] = half(FW, FH), OVT = tex(OV, 1), GLOWID = ovx.createImageData(BWd, BHd);
  const [PEN, px_] = half(140, 220); { const gr = px_.createRadialGradient(70, 110, 0, 70, 110, 70); gr.addColorStop(0, 'rgba(255,240,210,.55)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); px_.fillStyle = gr; px_.fillRect(0, 0, 140, 220); }
  const [EDGE, ex_] = half(36, 2); { const gr = ex_.createLinearGradient(0, 0, 36, 0); gr.addColorStop(0, 'rgba(255,230,190,0)'); gr.addColorStop(1, 'rgba(255,230,190,.35)'); ex_.fillStyle = gr; ex_.fillRect(0, 0, 36, 2); }
  let ovDirty = false;
  V.paintOverlay = (t) => {
    const live = (V.hand && t >= T_W0 && t < T_D0 + T_DD + 0.05) || (t > T_ARR0 - 0.1 && t < T_ARR0 + T_ARRD + 1.1);
    if (!live) { if (ovDirty) { clear(ovx); OVT.needsUpdate = true; ovDirty = false; } return; }
    clear(ovx); ovDirty = true;
    if (V.hand && t >= T_W0) { const pen = HX0 + (HX1 - HX0) * cl((t - T_W0) / (T_W1 - T_W0)), gone = t < T_D0 ? HX0 - 20 : HX0 + (HX1 - HX0) * cl((t - T_D0) / T_DD);
      if (pen > gone) { const a = Math.max(0, gone), b = Math.min(FW, pen); if (b > a) ovx.drawImage(HANDLIT[0], a * Q, 0, (b - a) * Q, H2, a, 0, b - a, FH); }
      const top = HOY + HB.y0 * HS, hh = HB.h * HS;
      if (t < T_W1 + 0.05) { ovx.drawImage(PEN, pen - 70, TY - 110, 140, 220); ovx.fillStyle = 'rgba(255,250,235,.9)'; ovx.fillRect(pen - 1.5, top - 6, 3, hh + 12); }
      if (t >= T_D0 && gone < HX1) ovx.drawImage(EDGE, gone - 30, top - 10, 36, hh + 20); }
    if (t > T_ARR0 - 0.1 && t < T_ARR0 + T_ARRD + 1.1) { const d = GLOWID.data;
      for (let yy = by0; yy <= by1; yy++) for (let xx = bx0; xx <= bx1; xx++) { const a = t - ARR[yy * W2 + xx], j = ((yy - by0) * BWd + (xx - bx0)) * 4;
        if (a < 0 || a > 0.9) { d[j + 3] = 0; continue; } const k = Math.pow(1 - a / 0.9, 2) * 0.75; d[j] = 255 * k; d[j + 1] = 200 * k; d[j + 2] = 110 * k; d[j + 3] = 255 * k; }
      ovx.putImageData(GLOWID, bx0, by0); }
    OVT.needsUpdate = true;
  };
  yield;

  // ---- the meshes (round six's placard, given the ware's matter)
  const V3 = THREE.Vector3, glass = !!C.glass, glassOpts = glass ? { transparent: true, opacity: 0.62, depthWrite: false } : {}, mats = [];
  const M = (o) => { const m = new THREE.MeshStandardMaterial(o); mats.push(m); return m; };
  const faceM = M({ map: face.t[0], bumpMap: face.t[1], bumpScale: 0.03, roughnessMap: face.t[2], metalnessMap: face.t[2], roughness: 1, metalness: 1, envMapIntensity: glass ? 1.4 : S.glossy || C.brass ? 0.6 : 0.22, ...glassOpts });
  const wallM = M({ map: tile[0], bumpMap: tile[1], bumpScale: 0.025, roughnessMap: tile[2], metalnessMap: tile[2], roughness: 1, metalness: 1, color: lin(C.wallTint), envMapIntensity: glass ? 1.4 : 0.25, ...glassOpts });
  const lugWallM = bareTile ? M({ map: bareTile[0], bumpMap: bareTile[1], bumpScale: 0.025, roughnessMap: bareTile[2], metalnessMap: bareTile[2], roughness: 1, metalness: 1, envMapIntensity: 0.15 }) : wallM;
  const lugM = M({ map: tile[0], bumpMap: tile[1], bumpScale: 0.025, roughnessMap: tile[2], metalnessMap: tile[2], roughness: 1, metalness: 1, color: lin(C.lugTint), envMapIntensity: glass ? 1.4 : S.glossy ? 0.5 : 0.25, ...glassOpts });
  let ropeT = null;
  if (C.rope) { const [c, x] = half(64, 64); x.fillStyle = '#a08860'; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#5a4830'; x.lineWidth = 5;
    for (let k = -64; k < 128; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 64, 64); x.stroke(); } x.strokeStyle = 'rgba(240,236,224,.5)'; x.lineWidth = 1.5; for (let k = -64; k < 128; k += 16) { x.beginPath(); x.moveTo(k + 6, 0); x.lineTo(k + 70, 64); x.stroke(); }
    ropeT = tex(c, 1); ropeT.wrapS = ropeT.wrapT = THREE.RepeatWrapping; ropeT.repeat.set(60, 2); }
  const tubeMat = (col) => (C.brass ? M({ color: lin(col), roughness: 0.32, metalness: 0.95, envMapIntensity: 1.1 })
    : glass ? M({ color: lin(col), roughness: 0.06, metalness: 0, envMapIntensity: 1.6, transparent: true, opacity: 0.7, depthWrite: false })
      : ropeT ? M({ map: ropeT, color: lin(0xffffff), roughness: 0.95, envMapIntensity: 0.15 }) : M({ color: lin(col), roughness: S.glossy ? 0.35 : 0.9, envMapIntensity: S.glossy ? 0.6 : 0.22 }));
  const coilM = tubeMat(C.coil), cordM = tubeMat(C.cord);
  function lugOutline(ctrl, teeth) {
    const cur = new THREE.CatmullRomCurve3(ctrl.map((p) => new V3(p[0], p[1], 0)), true, 'centripetal');
    const N = 260, P = cur.getSpacedPoints(N).slice(0, N).map((v) => [v.x, v.y]); let A = 0; for (let i = 0; i < N; i++) { const p = P[i], q = P[(i + 1) % N]; A += p[0] * q[1] - q[0] * p[1]; }
    if (A < 0) P.reverse();
    const near = (c) => { let bi = 0, bd = 1e9; P.forEach((p, i) => { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; bi = i; } }); return bi; };
    const L = cur.getLength() / N, out = P.map((p, i) => { const q = P[(i + 1) % N], r = P[(i + N - 1) % N], tx = q[0] - r[0], ty = q[1] - r[1], l = Math.hypot(tx, ty) || 1; return { p, n: [ty / l, -tx / l] }; });
    const T = P.map((p) => p.slice());
    if (teeth) { let i0 = near(teeth.from), i1 = near(teeth.to); if (i1 < i0) [i0, i1] = [i1, i0];
      for (let i = i0; i <= i1; i++) { const s = (i - i0) * L / teeth.period, f = s - Math.floor(s), e = Math.min(1, (i - i0) / 6, (i1 - i) / 6), h = teeth.amp * f * e; T[i] = [P[i][0] + out[i].n[0] * h, P[i][1] + out[i].n[1] * h]; } }
    return { P, T, out };
  }
  function lugGeo(o) { const s = shapeOf(o.T); for (const h of o.holes) s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: o.depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 }); g.translate(0, 0, -o.depth / 2); return g; }
  const holeC = (x, y, r) => { const h = new THREE.Path(); h.absarc(x, y, r, 0, PI * 2, true); return h; }, holeE = (x, y, a, b) => { const h = new THREE.Path(); h.absellipse(x, y, a, b, 0, PI * 2, true); return h; };
  function edgeCoil(o, inset, ymin) { const pts = o.P.map((p, i) => [p[0] - o.out[i].n[0] * inset, p[1] - o.out[i].n[1] * inset]), runs = []; let cur = [];
    pts.forEach((p) => { if (p[1] > ymin) cur.push(p); else { if (cur.length) runs.push(cur); cur = []; } }); if (cur.length) runs.push(cur);
    if (runs.length > 1 && pts[0][1] > ymin && pts[pts.length - 1][1] > ymin) { const last = runs.pop(); runs[0] = last.concat(runs[0]); }
    runs.sort((a, b) => b.length - a.length); return runs[0]; }
  const LUG_A = (R) => { const j = () => (R() - 0.5) * 0.06; return [[0.38, -0.14], [0.34 + j(), 0.16], [0.2 + j(), 0.3], [0.3, 0.42 + j()], [0.47 + j(), 0.52], [0.52, 0.71 + j()], [0.42 + j(), 0.87], [0.18, 0.97 + j()], [-0.08 + j(), 0.96], [-0.3, 0.85 + j()], [-0.45 + j(), 0.62], [-0.47, 0.36 + j()], [-0.4, 0.12], [-0.42, -0.14]]; };
  const LUG_B = (R) => { const j = () => (R() - 0.5) * 0.05; return [[0.3, -0.14], [0.33 + j(), 0.18], [0.27, 0.42 + j()], [0.12 + j(), 0.58], [-0.06, 0.63 + j()], [-0.25 + j(), 0.52], [-0.35, 0.3 + j()], [-0.3, 0.06], [-0.32, -0.14]]; };
  const tube = (pts, n, r, rs, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, rs, false), m);
  function makeLug(kind, seed) {
    const R = rng(seed), grp = new THREE.Group();
    if (kind === 'A') { const ctrl = LUG_A(R), o = lugOutline(ctrl, { from: ctrl[5], to: ctrl[10], period: 0.072 + R() * 0.02, amp: 0.06 + R() * 0.02 });
      o.holes = [holeC(-0.18, 0.56, 0.1), holeE(0.06, 0.4, 0.065, 0.085), holeC(-0.24, 0.19, 0.05)]; o.depth = 0.24; grp.add(new THREE.Mesh(lugGeo(o), [lugM, lugWallM]));
      if (S.coils) { const ec = edgeCoil(o, 0.085, 0.04); grp.add(tube(ec.map((p) => new V3(p[0], p[1], 0.15)), ec.length, 0.024, 7, coilM));
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.026, 8, 40), coilM); rim.position.set(-0.18, 0.56, 0.15); grp.add(rim);
        const sp = []; for (let i = 0; i <= 40; i++) { const a = -0.6 + i / 40 * PI * 2 * 1.2, r = 0.07 * Math.exp(-0.25 * (a + 0.6)); sp.push(new V3(0.06 + 0.11 * Math.cos(a) * r / 0.07, 0.4 + 0.13 * Math.sin(a) * r / 0.07, 0.15)); }
        grp.add(tube(sp, 60, 0.018, 6, coilM)); } }
    else { const ctrl = LUG_B(R), o = lugOutline(ctrl, { from: ctrl[2], to: ctrl[6], period: 0.06, amp: 0.04 });
      o.holes = [holeC(-0.05, 0.31, 0.13)]; o.depth = 0.22; grp.add(new THREE.Mesh(lugGeo(o), [lugM, lugWallM]));
      if (S.coils) { const ec = edgeCoil(o, 0.07, 0.04); grp.add(tube(ec.map((p) => new V3(p[0], p[1], 0.14)), ec.length, 0.02, 7, coilM));
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 8, 40), coilM); rim.position.set(-0.05, 0.31, 0.14); grp.add(rim); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.032, 10, 36), lugM); ring.position.set(0.02, 0.71, 0); ring.rotation.z = 0.25; grp.add(ring); }
    return grp;
  }
  const root = new THREE.Group(), P = new THREE.Group(); root.add(P); P.scale.setScalar(S.scale); V.root = root; V.P = P;
  const D = 0.4, BV = 0.07, FZ = D / 2 + BV; V.FZ = FZ;
  const slabG = new THREE.ExtrudeGeometry(shapeOf(cartouche(SA, SB, 4.5, 0.11, 0.01, 4)), { depth: D, bevelEnabled: true, bevelThickness: BV, bevelSize: 0.06, bevelSegments: 3, curveSegments: 4 });
  slabG.translate(0, 0, -D / 2); P.add(new THREE.Mesh(slabG, [faceM, wallM]));
  const ringS = shapeOf(cartouche(1.8, 1.1, 4.5, 0.1, 0.008, 6)); ringS.holes.push(pathOf(cartouche(FA + 0.02, FB + 0.02, 4.5, 0.09).reverse()));
  const ringG = new THREE.ExtrudeGeometry(ringS, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 4 }); ringG.translate(0, 0, FZ - 0.03);
  P.add(new THREE.Mesh(ringG, [faceM, wallM]));
  const glowOf = (m) => { m.userData.glow = true; V.glowList.push(m); return m; };
  const basic = (o) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); mats.push(m); return m; };
  if (face.LT) { const lm = glowOf(new THREE.Mesh(new THREE.ShapeGeometry(ringS), basic({ map: face.LT, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 }))); lm.position.z = FZ + 0.052; P.add(lm); }
  const fieldG = new THREE.ShapeGeometry(shapeOf(cartouche(FA, FB, 4.5, 0.09))); { const p = fieldG.attributes.position; fieldG.computeBoundingBox(); const b = fieldG.boundingBox, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { uv[2 * i] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x); uv[2 * i + 1] = (p.getY(i) - b.min.y) / (b.max.y - b.min.y); } fieldG.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  const field = new THREE.Mesh(fieldG, M({ map: FT.map, bumpMap: FT.bump, bumpScale: 0.04, roughnessMap: FT.orm, metalnessMap: FT.orm, roughness: 1, metalness: 1, emissive: 0xffffff, emissiveMap: FT.em, emissiveIntensity: 1, envMapIntensity: glass ? 1.2 : 0.6, ...(glass ? { transparent: true, opacity: 0.86 } : {}) }));
  field.position.z = FZ + 0.002; P.add(field);
  const ov = glowOf(new THREE.Mesh(fieldG, basic({ map: OVT, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 }))); ov.position.z = FZ + 0.006; P.add(ov);
  if (FCRACK) { V.crackM = basic({ map: tex(FCRACK, 1), blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, opacity: 0 }); const cm = glowOf(new THREE.Mesh(fieldG, V.crackM)); cm.position.z = FZ + 0.005; P.add(cm); }
  const tubeOf = (pts, r, z) => { const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], z)), true), 320, r, 6, true);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); P.add(glowOf(new THREE.Mesh(g, basic({ vertexColors: true, transparent: false, depthWrite: true })))); return g; };
  const gt = tubeOf(GROOVE.filter((_, i) => i % 2 === 0), S.inlay.r, FZ - 0.004 + Math.max(0, S.inlay.r - 0.009)), gt2 = S.inlay.second ? tubeOf(MID.filter((_, i) => i % 2 === 0), 0.012, FZ + 0.046) : null;
  if (S.crest) { const pts = [], N = 120; for (let i = 0; i <= N; i++) { const u = -1.36 + 2.72 * i / N; pts.push([u, ytop(u) - 0.12]); }
    for (let i = N; i >= 0; i--) { const u = -1.36 + 2.72 * i / N, s = (u + 1.36) / 0.085, f = s - Math.floor(s), e = Math.min(1, (u + 1.36) / 0.15, (1.36 - u) / 0.15); pts.push([u, ytop(u) + 0.02 + 0.055 * f * e]); }
    const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: 0.26, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1 }); g.translate(0, 0, -0.13); P.add(new THREE.Mesh(g, [lugM, wallM])); }
  for (const [kind, x, sc, fl, lean, seed] of S.lugs) { const m = makeLug(kind, seed); m.position.set(x, ytop(x) - 0.1, 0.03); m.scale.set(sc * fl, sc, 1); m.rotation.z = lean; P.add(m); }
  const spiral = (cx, cy, z, r0, turns, dir, k) => { const pts = []; for (let i = 0; i <= turns * 24; i++) { const a = i / 24 * PI * 2, r = r0 * Math.exp(-(k || 0.35) * a); pts.push(new V3(cx + Math.cos(a * dir) * r, cy + Math.sin(a * dir) * r, z)); } return pts; };
  if (S.spirals) { P.add(tube(spiral(-1.62, -0.1, FZ + 0.07, 0.12, 1.7, 1, 0.33), 60, 0.022, 7, coilM)); P.add(tube(spiral(1.6, -0.6, FZ + 0.07, 0.09, 1.4, -1, 0.38), 50, 0.019, 7, coilM)); }
  if (S.foot) for (const ph of [0, PI]) { const pts = []; for (let i = 0; i <= 220; i++) { const u = -1.3 + 2.6 * i / 220, a = u * 34 + ph, sag = -0.015 * Math.cos(u / 1.3 * PI / 2); pts.push(new V3(u, -1.13 + sag + Math.cos(a) * 0.035, FZ - 0.04 + Math.sin(a) * 0.035)); }
    P.add(tube(pts, 440, 0.034, 8, cordM)); }
  yield;
  // the seal, burned in the window colour; and its flash ring
  const L = sealLook(), BURNLIT = tex(sealBurn(512, 'lit', L), 1), BURNDIM = tex(sealBurn(512, 'dim', L), 1), sealG = new THREE.PlaneGeometry(0.44, 0.44);
  V.sealM = M({ map: BURNDIM, transparent: true, roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false });
  V.seal = new THREE.Mesh(sealG, V.sealM); V.seal.position.set(1.03, -0.5, FZ + 0.007); V.seal.rotation.z = -0.1; P.add(V.seal);
  V.litM = basic({ map: BURNLIT, polygonOffset: true, polygonOffsetFactor: -5 }); V.lit = glowOf(new THREE.Mesh(sealG, V.litM)); V.lit.position.copy(V.seal.position); V.lit.position.z += 0.002; V.lit.rotation.z = -0.1; P.add(V.lit);
  V.flashM = basic({ color: new THREE.Color(`rgb(${L.sel})`), side: THREE.DoubleSide, depthWrite: true }); V.flash = glowOf(new THREE.Mesh(new THREE.RingGeometry(0.2, 0.228, 64), V.flashM)); V.flash.position.copy(V.seal.position); V.flash.position.z += 0.004; P.add(V.flash);
  // the motes of the comb, as lines on the field (one draw): from where each was a beat ago to where it is
  if (V.hand) { const g = new THREE.BufferGeometry(); V.mote.pos = new Float32Array(NP * 6); V.mote.col = new Float32Array(NP * 8);
    g.setAttribute('position', new THREE.BufferAttribute(V.mote.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(V.mote.col, 4).setUsage(THREE.DynamicDrawUsage)); g.setDrawRange(0, 0);
    const lm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); mats.push(lm);
    V.mote.lines = glowOf(new THREE.LineSegments(g, lm)); V.mote.lines.frustumCulled = false; V.mote.lines.position.z = FZ + 0.007; P.add(V.mote.lines); }
  // labradorite (amethyst on Glass): dark stone, a slow schiller flash walking along it
  const STONE = lin(S.inlay.stone || 0x0a0b0e), SCH_B = lin(0x2f6fd0), SCH_G = lin(0xc99a3a), SCH_M = lin(0x9a3f8c), AM = lin(0x7a3fb0), cc = new THREE.Color();
  function inlayOne(g, t, ph) { const a = g.attributes.color, n = a.count, E = S.inlay.bright;
    for (let i = 0; i < n; i++) { const s = Math.floor(i / 7) / 320; let r = STONE.r + 0.004, gg = STONE.g + 0.006, b = STONE.b + 0.012 * (0.5 + 0.5 * Math.sin(s * 40 + t * 0.4));
      if (S.inlay.amethyst) { const k = 0.18 + 0.1 * Math.sin(s * 30 + t * 0.3); r += AM.r * k; gg += AM.g * k; b += AM.b * k; }
      for (let o = 0; o < 2; o++) { const off = o * 0.53, d = ((s + off + ph - t * 0.03) % 1 + 1) % 1, Wd = 0.16; if (d > Wd) continue; const u = 1 - d / Wd, e = Math.pow(Math.sin(PI * u), 2) * E;
        if (u < 0.5) cc.copy(SCH_B).lerp(SCH_G, u / 0.5); else cc.copy(SCH_G).lerp(SCH_M, (u - 0.5) / 0.5 * 0.55); r += cc.r * e; gg += cc.g * e; b += cc.b * e; }
      a.setXYZ(i, r, gg, b); }
    a.needsUpdate = true; }
  V.inlay = (t) => { inlayOne(gt, t, 0); if (gt2) inlayOne(gt2, t, 0.27); };
  // the glow pass: everything not lit drawn black (the swap list made once)
  root.traverse((o) => { if ((o.isMesh || o.isLineSegments) && !o.userData.glow) V.swap.push([o, o.material]); });
  V.dispose = () => { root.traverse((o) => o.geometry?.dispose?.()); for (const m of mats) { for (const k of ['map', 'bumpMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) if (m[k] && !m[k].__gone) { m[k].dispose(); m[k].__gone = true; } m.dispose(); } };
  V.env = env;
  return V;
}

/* ===================== the timeline (real seconds from the start; round six's) ===================== */
const eOut = (t) => 1 - Math.pow(1 - t, 3), eIn = (t) => t * t * t, eSine = (t) => (1 - Math.cos(PI * t)) / 2;
function state(t, s) {
  s.hush = sm(0, 0.4, t) * (1 - sm(T_EXIT + 0.2, T_EXIT + 1.2, t));
  s.y = t < 0.4 ? 4.6 : t < 2.8 ? 4.6 - (4.6 - 0.06) * eOut((t - 0.4) / 2.4) : t < T_EXIT ? 0.06 : 0.06 + (4.6 - 0.06) * eIn(cl((t - T_EXIT) / 1.2));
  s.rotY = t < 0.4 ? -PI : t < 2.6 ? -PI * (1 - eSine((t - 0.4) / 2.2)) : 0;
  s.tilt = 0.02 + 0.05 * sm(2.0, 3.0, t);
  s.beam = sm(0.05, 0.5, t) * (1 - 0.5 * sm(2.8, 3.8, t) + 0.5 * sm(T_EXIT - 0.2, T_EXIT + 0.4, t)) * (1 - sm(T_EXIT + 0.9, T_EXIT + 1.6, t));
  s.wb = 1 - 0.35 * sm(2.8, 3.8, t) + 0.35 * sm(T_EXIT - 0.2, T_EXIT + 0.4, t);
  s.sealP = sm(T_SEAL, T_SEAL + 0.15, t); s.flash = t < T_SEAL ? 0 : Math.max(0, 1 - (t - T_SEAL) / 0.8); s.burn = s.sealP * (1 - 0.65 * sm(T_SEAL + 0.3, T_SEAL + 2.3, t));
  return s;
}
const BEATS = [['descend', 0.4], ['contact', 2.8], ['write', T_W0], ['comb', T_D0], ['settle', T_SETTLE], ['seal', T_SEAL], ['exit', T_EXIT]];

/* the shaft of light (drawn in the overlay, in the mock's 854 x 480 dots, centred and scaled to the view's height) */
const BEAM_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const BEAM_FS = `varying vec2 vUv; uniform vec2 uView; uniform float uBeam, uWb, uFront;
float trap(vec2 p, float wt, float wbt){ float f = (p.y + 10.0) / 490.0, hw = mix(wt, wbt, f); return step(abs(p.x - 431.0), hw) * step(-10.0, p.y); }
void main(){
  vec2 p = vec2((vUv.x - 0.5) * uView.x * 480.0 / uView.y + 427.0, (0.5 - vUv.y) * 480.0 + 240.0);
  float f = clamp((p.y + 10.0) / 490.0, 0.0, 1.0);
  vec3 g = f < 0.55 ? mix(vec3(255.,240.,215.) / 255. * 1.6, vec3(255.,232.,196.) / 255., f / 0.55) : vec3(255.,232.,196.) / 255. * (1.0 - (f - 0.55) / 0.45);
  vec3 c = vec3(0.0);
  if (uFront > 0.5) c += g * trap(p, 70.0, 170.0 * uWb) * uBeam * 0.08;
  else { for (int k = 0; k < 3; k++) { float sp = 1.0 + float(k) * 0.45; c += g * trap(p, 95.0 * sp, 250.0 * uWb * sp) * uBeam * 0.14 / sp; }
    float r = length(p - vec2(431.0, 0.0)) / 260.0; c += vec3(255.,244.,224.) / 255. * 0.4 * uBeam * max(0.0, 1.0 - r) * step(p.y, 300.0); }
  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
}`;
const MOTE_VS = 'attribute float aA; uniform float uDot; varying float vA; void main(){ vA = aA; gl_PointSize = uDot * (aA > 1.5 ? 2.0 : 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const MOTE_FS = 'varying float vA; void main(){ gl_FragColor = vec4(vec3(255.,236.,206.) / 255. * fract(vA), 1.0); }';
/* the placard's two targets laid over the frame: its picture, and its lit parts blurred and added (the mock's 2 and 8 dot glows) */
const COMP_FS = `varying vec2 vUv; uniform sampler2D tMain, tGlow; uniform vec2 uTexel;
void main(){
  vec4 m = texture2D(tMain, vUv); vec3 a = texture2D(tGlow, vUv).rgb * 0.25, b = vec3(0.0);
  for (int i = 0; i < 8; i++) { float ang = float(i) * 0.7853982; vec2 d = vec2(cos(ang), sin(ang));
    a += texture2D(tGlow, vUv + d * uTexel * 2.0).rgb * 0.09375; b += texture2D(tGlow, vUv + d * uTexel * 5.0).rgb * 0.0625 + texture2D(tGlow, vUv + d * uTexel * 10.0).rgb * 0.0625; }
  gl_FragColor = vec4(m.rgb + a * 0.55 + b * 0.4, m.a);
  #include <colorspace_fragment>
}`;

export class TitlePlacard {
  constructor(game) {
    this.game = game; this.queue = []; this.active = null; this.building = null; this.pending = null; this.t = 0; this.age = 0; this.st = {}; this.env = null; this.size = [0, 0];
    this.R = rng(404); this.moteSeed = new Float32Array(170 * 4); for (let i = 0; i < 170 * 4; i++) this.moteSeed[i] = this.R();
    game.events?.on?.('achievement.unlock', (e) => { if (e?.title) this.show(e); });
    if (typeof addEventListener === 'function') addEventListener('keydown', () => this.dismiss(), true);
    const S = game.overlayScene; if (!S || typeof document === 'undefined') return;
    this.r = S.r; this.S = S; this.frame = new THREE.Group(); this.slot = S.add(this.frame, { anchor: 'c', x: 0, y: 0, z: 0, update: (dt, slot) => this.update(dt, slot) }); // (empty until the first title: its layers' programs are made then, not at boot)
    this.frame.userData.overlayHidden = true;
  }
  /** One title to hand down (achievement.unlock's payload, or one by hand): it waits its turn. */
  show(e) { if (!e?.title) return; this.queue.push({ title: String(e.title), tier: e.tier || 1, id: e.id || null, ach: e.ach || null, tierName: e.tierName || null, points: e.points || null }); }
  dismiss() { if (this.active && this.t >= T_SETTLE && this.t < T_EXIT) { this.t = T_EXIT; this.beat = BEATS.findIndex((b) => b[0] === 'exit'); } }

  /** The overlay's layers (made at the first title): the hush, the shaft behind, the placard's quad, the shaft in front, motes, letterbox. */
  buildStage() {
    if (this.staged) return; this.staged = true;
    const F = this.frame, plane = new THREE.PlaneGeometry(1, 1);
    const flat = (o, order) => { const m = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false, ...o })); m.renderOrder = order; F.add(m); return m; };
    this.hush = flat({ color: 0x000000, opacity: 0 }, 900);
    const beam = (front, order) => { const m = new THREE.Mesh(plane, new THREE.ShaderMaterial({ vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uView: { value: new THREE.Vector2(1, 1) }, uBeam: { value: 0 }, uWb: { value: 1 }, uFront: { value: front } } })); m.renderOrder = order; F.add(m); return m; };
    this.back = beam(0, 901);
    this.comp = new THREE.Mesh(plane, new THREE.ShaderMaterial({ vertexShader: BEAM_VS, fragmentShader: COMP_FS, transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { tMain: { value: null }, tGlow: { value: null }, uTexel: { value: new THREE.Vector2() } } }));
    this.comp.renderOrder = 902; F.add(this.comp);
    this.front = beam(1, 903);
    const mg = new THREE.BufferGeometry(); this.motePos = new Float32Array(170 * 3); this.moteA = new Float32Array(170);
    mg.setAttribute('position', new THREE.BufferAttribute(this.motePos, 3).setUsage(THREE.DynamicDrawUsage)); mg.setAttribute('aA', new THREE.BufferAttribute(this.moteA, 1).setUsage(THREE.DynamicDrawUsage));
    this.motes = new THREE.Points(mg, new THREE.ShaderMaterial({ vertexShader: MOTE_VS, fragmentShader: MOTE_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { uDot: { value: 1 } } }));
    this.motes.frustumCulled = false; this.motes.renderOrder = 904; F.add(this.motes);
    this.barT = flat({ color: 0x050307, opacity: 1 }, 905); this.barB = flat({ color: 0x050307, opacity: 1 }, 905);
    // the placard's own scene: the mock's lights (raw colours; r128's legacy intensities times pi), the camera of the game's framing
    const sc = this.scene = new THREE.Scene();
    this.hemi = new THREE.HemisphereLight(raw(0xf2e8de), raw(0x140c0a), 0.35 * PI);
    this.key = new THREE.SpotLight(raw(0xfff4ea), 1.7 * PI, 0, 0.42, 0.7, 0); this.key.position.set(0.1, 7.4, 2.9); this.key.target.position.set(0, 0.3, 0);
    const dl = (c, i, x, y, z) => { const l = new THREE.DirectionalLight(raw(c), i * PI); l.position.set(x, y, z); return l; };
    sc.add(this.hemi, this.key, this.key.target, dl(0xfff0e0, 0.45, 0.2, 6, 0.6), dl(0xd8c0ac, 0.14, -3, -1, 4), dl(0xb8c0d0, 0.18, 2, 3, -3));
    this.cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 60); this.cam.position.set(0, 0.55, 8.1); this.cam.lookAt(0, 0.5, 0);
    this.black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  }

  /** The environment the glazes and the gold reflect: a warm room with a window and the kiln (the mock's), made at the first placard. */
  envOf() {
    if (this.env) return this.env;
    const c = cv(512, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3a2418'); g.addColorStop(0.5, '#2a150d'); g.addColorStop(1, '#120806'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.filter = 'blur(6px)'; x.fillStyle = '#fff1d6'; x.fillRect(130, 60, 46, 56); x.fillStyle = '#ff9a4a'; x.beginPath(); x.arc(370, 150, 26, 0, 7); x.fill(); x.fillStyle = '#7fdcff'; x.globalAlpha = 0.35; x.fillRect(250, 70, 60, 30);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(this.r); this.env = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose(); return this.env;
  }
  /** The island's dress where the Courier stands (see the header); Clay when the game cannot tell. */
  dressHere() { const g = this.game; if (g.rail?.stage?.active) return 'brine'; return DRESS_OF_ZONE[g.zones?.whole] || 'clay'; }

  /** What the field carries: the title, its achievement's line (two at most), the ledger row, the running hand's words. */
  infoOf(e) {
    const A = this.game.achievements, a = A?.list?.find?.((x) => x.id === e.id), desc = a?.desc || e.ach || '';
    let line1 = desc, line2 = '';
    if (desc.length > 30) { const mid = desc.length / 2; let k = -1; for (let i = 0; i < desc.length; i++) if (desc[i] === ' ' && (k < 0 || Math.abs(i - mid) < Math.abs(k - mid))) k = i; if (k > 0) { line1 = desc.slice(0, k); line2 = desc.slice(k + 1); } }
    const tierName = (e.tierName || ['', 'Easy', 'Medium', 'Hard', 'Elite', 'Master', 'Grandmaster'][e.tier] || '').toUpperCase(), pts = e.points ?? e.tier;
    const at = A?.L?.done?.[e.id]; const clock = at !== undefined ? `  ·  FIRST AT ${Math.floor(at / 60)}:${String(Math.floor(at % 60)).padStart(2, '0')}` : '';
    const rows = `${tierName}  ·  ${pts} PT${pts === 1 ? '' : 'S'}${clock}`;
    const key = Object.hasOwn(TITLES, e.title) ? e.title : Object.keys(TITLES).find((k) => k.toLowerCase() === e.title.toLowerCase());
    let words = null;
    if (key) { try { words = TITLES[key].neuralese.split('-').map((w, i) => ({ cells: cellsOf(w), mod: i > 0 })); } catch { words = null; } }
    return { title: e.title, line1, line2, rows, words };
  }

  /** The next title's placard, built a slice a frame (its canvases are the cost: about 6 ms a frame until done). */
  begin(e) {
    this.buildStage(); const info = this.infoOf(e), S = specOf(e.tier, this.dressHere());
    this.building = { e, it: null, ready: false };
    const fonts = [CINZEL(30), READ(44), COUNT(46)].map((f) => document.fonts?.load?.(f).catch(() => null));
    Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 1500))]).then(() => { if (this.building) this.building.it = buildVariant(S, info, this.envOf()); });
  }

  update(dt, slot) {
    const g = this.game, B = document.body.classList, busy = !!(g.title?.active || B.contains('cine') || g.liveMoment?.()); // (a race, a trial, a crossing, a duel, a FOE under way: core/livemoment.js; the owner, v296: never mid-race)
    if (!this.active && !this.building && !this.pending) { if (!this.queue.length || busy) { this.frame.userData.overlayHidden = true; return; } this.begin(this.queue.shift()); }
    if (this.building) {
      const b = this.building; this.frame.userData.overlayHidden = true;
      if (busy || !b.it) return; // (its slices wait out a live moment too)
      const t0 = performance.now(); let r; do r = b.it.next(); while (!r.done && performance.now() - t0 < 6);
      if (!r.done) return;
      // its programs compiled against its own target (not the canvas: a target is drawn linear and untoned), then it begins
      const V = r.value; V.tier = b.e.tier; V.title = b.e.title; V.id = b.e.id; this.scene.environment = V.env; this.scene.add(V.root); this.targets(slot); this.building = null; this.pending = V;
      const rr = this.r, was = rr.getRenderTarget(); rr.setRenderTarget(this.rt);
      const go = () => { if (this.pending !== V) return; this.pending = null; this.active = V; this.activeE = b.e; this.t = 0; this.age = 0; this.beat = 0; };
      const asy = (sc, cam, into) => (rr.compileAsync ? rr.compileAsync(sc, cam, into) : (rr.compile(sc, cam, into), null)); // (and the stage's layers, against the canvas)
      try { const p = asy(this.scene, this.cam); rr.setRenderTarget(null); Promise.all([p, asy(this.frame, this.S.camera, this.S.scene)]).then(go, go); } catch { go(); }
      rr.setRenderTarget(was);
    }
    if (this.pending) { this.frame.userData.overlayHidden = true; return; }
    const V = this.active; if (!V) return;
    if (busy && this.t < T_EXIT) { if (this.t < T_SETTLE && this.activeE) this.queue.unshift(this.activeE); this.t = T_EXIT; this.beat = BEATS.findIndex((b) => b[0] === 'exit'); } // (a live moment began under it)
    this.frame.userData.overlayHidden = false;
    this.t += dt; this.age += dt;
    if (!V.hand && this.t >= T_W0 && this.t < T_ARR0 - 0.3) this.t = T_ARR0 - 0.3; // (no running hand: no writing, no comb)
    const t = this.t;
    while (this.beat < BEATS.length && t >= BEATS[this.beat][1]) { const [k] = BEATS[this.beat++]; if ((k === 'write' || k === 'comb') && !V.hand) continue; g.events?.emit?.('placard.beat', { k, tier: V.tier, title: V.title, id: V.id }); }
    if (t >= T_END) { this.scene.remove(V.root); V.dispose(); this.active = null; this.frame.userData.overlayHidden = true; return; }
    this.frame_(V, t, dt, slot);
  }

  /** One frame: the placard posed and drawn into its targets, the overlay's layers set to the view. */
  frame_(V, t, dt, slot) {
    const s = state(t, this.st), { w, h } = slot.view, r = this.r, pr = r.getPixelRatio(), dot = h / 480;
    this.targets(slot);
    // pose (the mock's renderAt)
    V.root.position.y = s.y; V.P.rotation.y = s.rotY; V.root.rotation.x = s.tilt;
    if (t > T_ARR0 - 0.2 && t < T_SETTLE) V.compose(t); else if (t >= T_SETTLE && !V.whole) { V.compose(null); V.whole = true; }
    V.paintOverlay(t); if (V.mote) this.motesOn(V, t);
    if (V.crackM) V.crackM.opacity = t > 2.8 ? sm(2.8, 3.6, t) * (0.85 + 0.15 * Math.sin(t * 1.3)) : 0;
    V.seal.visible = s.sealP > 0; V.sealM.opacity = s.sealP; V.seal.scale.setScalar(1 + 0.05 * (1 - s.sealP));
    V.lit.visible = s.burn > 0.01; V.litM.opacity = s.burn; V.lit.scale.copy(V.seal.scale);
    V.flash.visible = s.flash > 0; V.flashM.opacity = s.flash; V.flash.scale.setScalar(1 + 0.5 * (1 - s.flash));
    V.inlay(this.age); this.key.intensity = (0.9 + 1.3 * s.beam) * PI; this.hemi.intensity = (0.2 + 0.15 * (1 - s.hush)) * PI;
    // draw: the picture, then the lit parts alone (the rest black)
    const was = r.getRenderTarget(), cc = r.getClearColor(this._cc ||= new THREE.Color()), ca = r.getClearAlpha(), auto = r.autoClear;
    r.autoClear = true; r.setRenderTarget(this.rt); r.setClearColor(0x000000, 0); r.clear(); r.render(this.scene, this.cam);
    for (const [o] of V.swap) o.material = this.black; r.setRenderTarget(this.glow); r.setClearColor(0x000000, 1); r.clear(); r.render(this.scene, this.cam); for (const [o, m] of V.swap) o.material = m;
    r.setRenderTarget(was); r.setClearColor(cc, ca); r.autoClear = auto;
    // the overlay's layers, in the view's CSS pixels about its centre
    for (const m of [this.hush, this.back, this.comp, this.front]) m.scale.set(w, h, 1);
    this.hush.material.opacity = s.hush * 0.58;
    for (const m of [this.back, this.front]) { const U = m.material.uniforms; U.uView.value.set(w, h); U.uBeam.value = s.beam; U.uWb.value = s.wb; }
    const lb = Math.round(26 * s.hush * dot); this.barT.visible = this.barB.visible = lb > 0;
    this.barT.scale.set(w, lb, 1); this.barB.scale.set(w, lb, 1); this.barT.position.y = h / 2 - lb / 2; this.barB.position.y = -h / 2 + lb / 2;
    this.beamMotes(s, t, w, h, dot, pr);
  }

  /** The targets: the present's own size (the buffer under the view), its height capped at 720 lines; the glow's at half. */
  targets(slot) {
    const { w, h } = slot.view, pr = this.r.getPixelRatio(), k = Math.min(1, 720 / (h * pr)), W = Math.max(2, Math.round(w * pr * k)), H = Math.max(2, Math.round(h * pr * k));
    if (W === this.size[0] && H === this.size[1]) return;
    this.size = [W, H]; this.rt?.dispose(); this.glow?.dispose();
    this.rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, colorSpace: THREE.SRGBColorSpace }); this.glow = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { colorSpace: THREE.SRGBColorSpace });
    this.cam.aspect = W / H; this.cam.updateProjectionMatrix();
    const U = this.comp.material.uniforms; U.tMain.value = this.rt.texture; U.tGlow.value = this.glow.texture; U.uTexel.value.set(H / (480 * W), 1 / 480); // (a dot of the 480-line frame, in the targets' uv)
  }

  /** The comb's motes: each carried by the curl field from its place in the hand, then drawn home onto its grain of the cut. */
  motesOn(V, t) {
    const M = V.mote, dt = 1 / 60; let n = 0;
    if (t < T_D0 || t >= T_ARR0 + T_ARRD + 0.5) { M.lines.geometry.setDrawRange(0, 0); return; }
    const psi = (x, y, u) => { const X = x / 150, Y = y / 150; return Math.sin(X * 1.3 + u * 0.7) * Math.cos(Y * 1.7 - u * 0.5) + 0.6 * Math.sin(X * 2.9 - Y * 1.1 + u * 1.1) + 0.35 * Math.cos(X * 4.3 + Y * 3.7 - u * 0.9); };
    const kx = 2 * FA / FW, ky = 2 * FB / FH;
    for (let i = 0; i < NP; i++) {
      if (t < M.td[i]) continue;
      while (M.u[i] < t) { const x = M.x[i], y = M.y[i], u = M.u[i], ramp = sm(M.td[i], M.td[i] + 0.25, u);
        const vx = (psi(x, y + 1, u) - psi(x, y - 1, u)) / 2 * 150 * 0.9 + 28, vy = -(psi(x + 1, y, u) - psi(x - 1, y, u)) / 2 * 150 * 0.9 - 14;
        const j = (M.n[i] % 4) + i * 4; M.hx[j] = x; M.hy[j] = y; M.n[i]++; M.x[i] = x + vx * dt * ramp; M.y[i] = y + vy * dt * ramp; M.u[i] = u + dt; }
      const fade = 1 - sm(M.ta[i], M.ta[i] + 0.25, t); if (fade <= 0) continue;
      const kh = Math.pow(sm(M.ta[i] - 0.95, M.ta[i], t), 1.4), kt = Math.pow(sm(M.ta[i] - 0.95, M.ta[i], t - 0.045), 1.4), T = M.TGT[i];
      const back = M.n[i] >= 3 ? (M.n[i] - 3) % 4 + i * 4 : -1, tx0 = back >= 0 ? M.hx[back] : M.x[i], ty0 = back >= 0 ? M.hy[back] : M.y[i];
      const hx = M.x[i] + (T[0] - M.x[i]) * kh, hy = M.y[i] + (T[1] - M.y[i]) * kh, tx = tx0 + (T[0] - tx0) * kt, ty = ty0 + (T[1] - ty0) * kt;
      const p = n * 6; M.pos[p] = (tx * kx - FA); M.pos[p + 1] = (FB - ty * ky); M.pos[p + 2] = 0; M.pos[p + 3] = (hx * kx - FA) + 0.0001; M.pos[p + 4] = (FB - hy * ky); M.pos[p + 5] = 0;
      filmArr(M.hue[i] + t * 0.15, _f); const cr = Math.pow((_f[0] / 255) * (1 - kh) + kh, 2.2), cg = Math.pow((_f[1] / 255) * (1 - kh) + 0.82 * kh, 2.2), cb = Math.pow((_f[2] / 255) * (1 - kh) + 0.45 * kh, 2.2), a = 0.9 * fade;
      const q = n * 8; M.col[q] = M.col[q + 4] = cr; M.col[q + 1] = M.col[q + 5] = cg; M.col[q + 2] = M.col[q + 6] = cb; M.col[q + 3] = M.col[q + 7] = a; n++;
    }
    const G = M.lines.geometry; G.setDrawRange(0, n * 2); G.attributes.position.needsUpdate = true; G.attributes.color.needsUpdate = true;
  }

  /** The motes in the shaft (the mock's 170, in dots about the shaft's line), laid in the view's CSS pixels. */
  beamMotes(s, t, w, h, dot, pr) {
    const R = this.moteSeed; this.motes.material.uniforms.uDot.value = Math.max(1, Math.round(pr * dot));
    for (let i = 0; i < 170; i++) {
      const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2], r3 = R[i * 4 + 3], sp = 0.25 + r0 * 0.5, dir = r2 < 0.3 ? -1 : 1;
      const yy = (((r1 * 480 + t * 12 * sp * dir) % 480) + 480) % 480, spread = 95 + (250 - 95) * (yy / 480), xx = 431 + (r3 * 2 - 1) * spread * 0.9 + Math.sin(t * 0.6 + i) * 4;
      const a = s.beam * (0.25 + ((r0 * 7.31 + r3) % 1) * 0.55) * (1 - Math.abs(xx - 431) / spread);
      this.motePos[i * 3] = Math.round(xx - 427) * dot; this.motePos[i * 3 + 1] = -(Math.round(yy) - 240) * dot; this.motePos[i * 3 + 2] = 0;
      this.moteA[i] = a <= 0.02 ? 0 : Math.min(0.999, a) + ((r1 * 13.7) % 1 < 0.15 ? 2 : 0);
    }
    const G = this.motes.geometry; G.attributes.position.needsUpdate = true; G.attributes.aA.needsUpdate = true;
  }
}
