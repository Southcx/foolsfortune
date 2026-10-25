// ---------------------------------------------------------------------------------------
// THE SIGHT'S LOOK: the instrument top-right (docs/plans/OVERLAY.md 10.5c to 10.5f; the owner approved round 7's "the yoke plus the
// roiling liquid", 2026-10-18). A tilted glass globe between two clay discs (the anode above, the cathode below) joined behind on the
// right by a verdigris clay yoke; inside the globe the weather's liquid and the needle; round it a wadokei clock ring; under it the
// place plate, and hanging off the ring the bronze waypoint plate. Real meshes in the overlay's own scene (render/overlayscene.js), so
// it pixelates at the 480-line present as the world does. The waypoint is Dovina's (progress/sight.js, `game.sight.waypoint`); this
// only draws it.
//
// What each part reads:
//   the needle      `game.sight.waypoint` (polled 10 times a real second), its bearing from where the camera faces; null: it spins
//                   slowly (Dovina's ruling, OVERLAY.md 16: no default). Inside a Well it drifts. Drawn last, outlined dark: always crisp.
//   the waypoint plate  its name (Cinzel) and distance (the count face); none when null; a reel and a pulse when it is calibrated.
//   the liquid      the weather where the Courier stands (`game.weather.here`): its colour and height the aspect and strength; fair
//                   is clear and still. The Dissonance Level makes it roil (rings with a lit crest at 1 and 2, eddies round a centred
//                   vortex from 3, the labradorite film only at the eddies' edges at 4 and 5, the core bruised at 5).
//   the clock ring  the game hour: four sliding plates for night, dawn, daytime and dusk (phaseAt's hours) and a hand with a lit bead;
//                   dimmed inside a Well (no sky).
//   the yoke        the Dissonance Level (`game.rejection.level`, 0..5): an arc creeping down its outer edge from the anode, five
//                   studs lit one a level, flashing over into the cathode at 5.
//   the place plate the room (`place.enter`'s room) and its layer, and the weather's name in its colour, glazed in the window colour.
// Hidden with the HUD (F2: the overlay scene's own rule), on the title, in the god hand, on the rail's crossing and in a cinematic.
//
// On touch (ui/hudlayout.js, MOBILE.md 6.3) it stands in the HUD layout's box, inside the safe area at a phone's scale (su, not the height), and
// the place plate drops to its icon line: the weather's pip and the room, 14 CSS px the least.
//
// Prior art: the terrestrial globe's half-meridian stand and the armillary sphere's meridian ring (the yoke); a creeping discharge and
// its Lichtenberg figures (the arc); the wadokei, Japan's temporal-hour clock, with its sliding plates (the ring); the brass
// astrolabe's rete (the face); Jack Sparrow's compass and One Piece's Log Pose (the needle); a stirred glass and the Rankine vortex,
// Hokusai's eddies, a storm glass (the liquid); kintsugi (the yoke's gold joins); the inverted-hull outline of Wind Waker and Okami
// (the needle's line). Ported from Calissa's round-7 mock (three.js r128) to r170: colours given as the mock's raw values.
//
//   game.sightLook = new SightLook(game)   (added to game.overlayScene; it updates itself there)   .level  .hidden
//   .skinParts   the housing an instrument skin repaints (vfx/instrumentskins.js: the discs' atlas, the metal's palette, the hand, the glass's
//                tint, the tilt a garnish hangs on); .skinTick(dt) a skin's own motion, called each frame shown
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { T } from '../core/config.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DAY_MS, now as calNow } from '../core/calendar.js';
import { COLOR, phaseAt } from '../progress/weather.js';
import { FONT, THEMES, theme } from '../ui/theme.js';
import { overlayKind, overlayShader, overlayFlat, overlayStd, overlayEnv } from './lachrimetertube.js'; // (the overlay's one shader and its lit parts' set-ups)

const GAME_HOUR = DAY_MS / 24, LIN = THREE.LinearSRGBColorSpace;
const raw = (hex) => new THREE.Color().setHex(hex, LIN); // (the mock's r128 colours: taken as they were written)
const EL = 12 * Math.PI / 180, TILT = 23.44 * Math.PI / 180, RG = 1.0, RL = 0.965, DR = 0.66, DT = 0.30, DY = 1.75;
const PPU = 150 / 4.6; // (dots a unit at the 480-line present: round six's scale, the instrument about 150 lines tall)
const ORIGIN = [85.4, 76.5]; // (the globe's heart: dots left of the right edge, dots down from the top: the mock's real-size frame)
const RI = 1.10, RO = 1.46, PI0 = 1.15, PO = 1.335, TEXR = 1.5, TN = 1024, Q = 0.5; // (the dial; its canvases drawn at half the mock's)
// (THE RESOLUTION PASS, 2026-10-25, docs/plans/art/texture-budget.md: the instrument is about 150 lines tall, its dial about 98 across and
// a disc's face about 60, so the dial and the phase plates are drawn at a quarter of the mock (256 px, QD), the rete at a quarter, and
// the discs' atlas and bumps at half (a quarter on Low and Minimum: the tier's labelScale), each still above the lines it covers)
const QD = 0.25;
const discScale = () => 0.5 * Math.min(1, T.visual.labelScale ?? 1);
const PHASES = [{ id: 'night', a: 20, b: 29 }, { id: 'dawn', a: 5, b: 7 }, { id: 'day', a: 7, b: 18 }, { id: 'dusk', a: 18, b: 20 }];
const hookA = 12 - 3.2;
const COUNT = `'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
function filmArr(s, out = [0, 0, 0]) {
  s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, A = FILM[i], B = FILM[(i + 1) % 4], m = f * f * (3 - 2 * f);
  for (let k = 0; k < 3; k++) out[k] = A[k] + (B[k] - A[k]) * m; return out;
}
const filmRGB = (s, a) => { const c = filmArr(s); return `rgba(${c.map(Math.round).join(',')},${a})`; };
const GLSL_FILM = `vec3 film(float s){ s=fract(s)*4.0; float f=fract(s); f=f*f*(3.0-2.0*f);
 vec3 c0=vec3(.298,.059,.702),c1=vec3(.039,.549,.749),c2=vec3(.949,.722,.18),c3=vec3(.851,.102,.502);
 if(s<1.0) return mix(c0,c1,f); if(s<2.0) return mix(c1,c2,f); if(s<3.0) return mix(c2,c3,f); return mix(c3,c0,f);}`;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** A canvas at Q of the mock's size, its context scaled so the mock's drawing runs unchanged. */
const half = (w, h) => { const c = cv(Math.round(w * Q), Math.round(h * Q)), x = c.getContext('2d'); x.scale(Q, Q); return [c, x]; };
const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
const look = () => { const T = THEMES[theme.id] || THEMES.verdigris; return { ...T, midR: rgbOf(T.mid), hiR: rgbOf(T.hi), loR: rgbOf(T.lo) }; };
const phaseOf = (h) => { h = ((h % 24) + 24) % 24; return h < 5 || h >= 20 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : 'dusk'; };
const rot = (h) => (12 - h) / 24 * Math.PI * 2;
const P = (h, rr) => [-rr * Math.sin(rot(h)), rr * Math.cos(rot(h))];
const tp = (x, y) => [(x / (2 * TEXR) + 0.5) * TN, (0.5 - y / (2 * TEXR)) * TN];
const levelY = (f) => (2 * (0.5 - Math.sin(Math.asin(Math.max(-1, Math.min(1, 1 - 2 * f))) / 3)) - 1) * RL;

// ---- the clay faces (the round-5 hand on the discs is a placeholder: it spells nothing, as on the mock)
function handLetter(R, s) {
  const p = new Path2D(), w = s * 0.62, st = s * 0.32, bh = s * 0.5, place = Math.floor(R() * 3), two = place === 1 || R() < 0.25, L = -w / 2, Rr = w / 2;
  if (two) { p.moveTo(L, 0); p.lineTo(L, st); p.moveTo(Rr, 0); p.lineTo(Rr, st); } else { p.moveTo(Rr, 0); p.lineTo(Rr, st); }
  p.moveTo(Rr, st); p.lineTo(Rr, st + bh * 0.35); p.arc(0, st + bh * 0.35, w / 2, 0, Math.PI); if (two) p.lineTo(L, st); const hr = s * 0.09;
  if (place === 0) { p.moveTo(L + hr * 2, st + bh * 0.35); p.arc(L + hr, st + bh * 0.35, hr, 0, Math.PI * 2); }
  else if (place === 1) { const y = st + bh * 0.35 + w / 2; p.moveTo(hr, y); p.arc(0, y, hr, 0, Math.PI * 2); }
  else { p.moveTo(Rr + hr * 2.2, st * 0.6); p.arc(Rr + hr * 1.2, st * 0.6, hr, 0, Math.PI * 2); }
  const v = R(); if (v < 0.3) { p.moveTo(Rr, 0); p.lineTo(Rr, -s * 0.22); p.moveTo(Rr + hr, -s * 0.22 - hr); p.arc(Rr, -s * 0.22 - hr, hr, 0, Math.PI * 2); }
  else if (v < 0.5) { p.moveTo(0, 0); p.lineTo(-s * 0.18, -s * 0.18); }
  return p;
}
function incise(cx, bx, path, w, slip, groove) {
  cx.lineCap = bx.lineCap = 'round'; cx.lineJoin = bx.lineJoin = 'round';
  cx.strokeStyle = groove; cx.lineWidth = w + 3; cx.stroke(path); cx.strokeStyle = slip; cx.lineWidth = w; cx.stroke(path);
  bx.strokeStyle = '#000'; bx.lineWidth = w + 2; bx.stroke(path);
}
function sealPath(R, S) {
  const p = new Path2D(); p.moveTo(0, -S * 0.86); p.lineTo(0, S * 0.86);
  const term = (x, y, k) => { const r = S * 0.055; if (k === 0) { p.moveTo(x + r, y); p.arc(x, y, r, 0, 7); } else if (k === 1) { p.moveTo(x - r, y - r); p.lineTo(x + r, y + r); p.moveTo(x + r, y - r); p.lineTo(x - r, y + r); } else { p.moveTo(x, y); p.lineTo(x, y - r * 2.2); } };
  const bars = 2 + Math.floor(R() * 2);
  for (let i = 0; i < bars; i++) {
    const y = -S * 0.6 + i * S * 1.1 / bars + R() * S * 0.1, hw = S * (0.25 + R() * 0.45), k = Math.floor(R() * 3), jog = R() < 0.6;
    for (const sg of [1, -1]) { p.moveTo(0, y); if (jog) { const j = hw * 0.5; p.lineTo(sg * j, y); p.lineTo(sg * (j + S * 0.12), y + S * 0.12); p.lineTo(sg * hw, y + S * 0.12); term(sg * hw, y + S * 0.12, k); } else { p.lineTo(sg * hw, y); term(sg * hw, y, k); } }
  }
  const cy = -S * 0.86; p.moveTo(S * 0.22, cy + S * 0.02); p.arc(0, cy + S * 0.02, S * 0.22, 0, Math.PI, R() < 0.5);
  const r0 = S * (0.3 + R() * 0.15), y0 = S * (0.35 + R() * 0.2); p.moveTo(r0, y0); p.arc(0, y0, r0, 0, Math.PI);
  p.moveTo(S * 0.07, S * 0.86); p.arc(0, S * 0.86, S * 0.07, 0, 7); return p;
}
function discFace(kind) {
  const N = 1024, [c, x] = half(N, N), [b, y] = half(N, N), R = rng(kind === 'anode' ? 41 : 83), C = N / 2, an = kind === 'anode';
  const base = an ? ['#8a4426', '#6e321b', '#a5582f'] : ['#231a18', '#151010', '#3a2b26'], slip = an ? '#ecd6b2' : '#d6c3a0', groove = an ? '#2a1008' : '#070404';
  x.fillStyle = base[0]; x.fillRect(0, 0, N, N); y.fillStyle = '#808080'; y.fillRect(0, 0, N, N);
  for (let i = 0; i < 60; i++) { const px = R() * N, py = R() * N, r = 40 + R() * 160, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, R() < 0.5 ? base[1] : base[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.35; x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  x.globalAlpha = 1; for (let i = 0; i < 2500; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.25)' : 'rgba(255,230,200,.12)'; x.fillRect(R() * N, R() * N, 1.5, 1.5); }
  x.save(); x.translate(C, C); y.save(); y.translate(C, C);
  for (let row = 0; row < 4; row++) {
    const r = 412 + row * 15;
    for (let a = 0; a < Math.PI * 2; a += 0.022) {
      const sl = (row % 2 ? 1 : -1) * 0.5, px = Math.cos(a) * r, py = Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a);
      x.strokeStyle = 'rgba(0,0,0,.28)'; y.strokeStyle = 'rgba(30,30,30,.7)'; x.lineWidth = y.lineWidth = 2.5;
      for (const k of [x, y]) { k.beginPath(); k.moveTo(px - tx * 4 - Math.cos(a) * sl * 6, py - ty * 4 - Math.sin(a) * sl * 6); k.lineTo(px + tx * 4 + Math.cos(a) * sl * 6, py + ty * 4 + Math.sin(a) * sl * 6); k.stroke(); }
    }
  }
  let p = new Path2D(); p.arc(0, 0, 478, 0, 7); p.moveTo(496, 0); p.arc(0, 0, 496, 0, 7); incise(x, y, p, 3, slip, groove);
  const rr = 385, s = 58, Rh = rng(an ? 5 : 9); let a = -Math.PI / 2 + 0.05;
  while (a < Math.PI * 1.5 - 0.12) {
    const n = 2 + Math.floor(Rh() * 4), adv = s * 0.95 / rr, span = n * adv; if (a + span > Math.PI * 1.5 - 0.05) break;
    const rail = new Path2D(); rail.arc(0, 0, rr, a - adv * 0.45, a + span - adv * 0.55); incise(x, y, rail, 3, slip, groove);
    for (let k = 0; k < n; k++) {
      const ang = a + k * adv, lp = handLetter(Rh, s), ox = Math.cos(ang) * rr, oy = Math.sin(ang) * rr;
      const T = [-Math.sin(ang), Math.cos(ang), -Math.cos(ang), -Math.sin(ang), ox, oy];
      for (const k2 of [x, y]) { k2.save(); k2.transform(...T); } incise(x, y, lp, 3, slip, groove); x.restore(); y.restore();
    }
    a += span + adv * 0.7;
  }
  p = new Path2D(); p.arc(0, 0, 290, 0, 7); p.moveTo(276, 0); p.arc(0, 0, 276, 0, 7); incise(x, y, p, 3, slip, groove);
  x.save(); y.save(); const ro = an ? 0 : Math.PI * 0.1; x.rotate(ro); y.rotate(ro); incise(x, y, sealPath(rng(an ? 17 : 29), 250), 5, slip, groove); x.restore(); y.restore();
  p = new Path2D(); p.arc(0, 0, 74, 0, 7); incise(x, y, p, 4, slip, groove);
  const sa = an ? -Math.PI * 0.25 : Math.PI * 0.78, sr = 170;
  x.save(); x.translate(Math.cos(sa) * sr, Math.sin(sa) * sr); x.rotate(0.12); x.fillStyle = '#120604'; x.fillRect(-58, -58, 116, 116); x.fillStyle = '#a63a22'; x.fillRect(-54, -54, 108, 108);
  x.fillStyle = '#e8906a'; x.fillRect(-30, -8, 60, 16); if (an) x.fillRect(-8, -30, 16, 60); x.restore();
  x.restore(); y.restore(); return { c, b };
}
function rimTex(kind) {
  const w = 1024, h = 128, [c, x] = half(w, h), R = rng(kind === 'anode' ? 3 : 7), bands = kind === 'anode' ? ['#9a4e2a', '#2a1a14', '#d9b48c'] : ['#2a201c', '#5a2b1c', '#c9a37c'];
  x.fillStyle = bands[0]; x.fillRect(0, 0, w, 40); x.fillStyle = bands[1]; x.fillRect(0, 40, w, 58); x.fillStyle = bands[2]; x.fillRect(0, 98, w, 30);
  for (let i = 0; i < 1500; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.25)' : 'rgba(255,230,200,.15)'; x.fillRect(R() * w, R() * h, 1.5, 1.5); }
  x.lineWidth = 2.4;
  for (let i = 0; i < w / 32; i++) { const cx = i * 32 + 16, cy = 69, r = 12; x.strokeStyle = 'rgba(230,214,190,.55)'; x.beginPath(); for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 1.5; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  return c;
}
function reteTex() {
  const N = 1024, [c, x] = half(N, N), C = N / 2, R = rng(77); x.translate(C, C); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  const ring = (r, w) => { x.lineWidth = w; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); };
  ring(486, 14); ring(462, 5);
  x.save(); x.translate(0, -118); ring(300, 9); ring(274, 4);
  for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, l = i % 6 ? 10 : 22; x.lineWidth = 3; x.beginPath(); x.moveTo(Math.cos(a) * 274, Math.sin(a) * 274); x.lineTo(Math.cos(a) * (274 - l), Math.sin(a) * (274 - l)); x.stroke(); }
  x.restore();
  x.lineWidth = 9; x.beginPath(); x.moveTo(-462, 0); x.lineTo(462, 0); x.moveTo(0, 180); x.lineTo(0, 462); x.stroke();
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + R() * 0.15, r0 = 330 + R() * 60, len = 60 + R() * 70, dir = R() < 0.5 ? 1 : -1;
    const bx = Math.cos(a) * 462, by = Math.sin(a) * 462, mx = Math.cos(a + dir * 0.12) * r0, my = Math.sin(a + dir * 0.12) * r0;
    x.lineWidth = 6; x.beginPath(); x.moveTo(bx, by); x.bezierCurveTo(Math.cos(a) * 420, Math.sin(a) * 420, Math.cos(a - dir * 0.2) * r0, Math.sin(a - dir * 0.2) * r0, mx, my); x.stroke();
    const tx = Math.cos(a + dir * 0.25) * (r0 - len), ty = Math.sin(a + dir * 0.25) * (r0 - len);
    x.beginPath(); x.moveTo(mx + Math.cos(a + 1.57) * 14, my + Math.sin(a + 1.57) * 14);
    x.quadraticCurveTo(Math.cos(a + dir * 0.05) * (r0 - len * 0.4), Math.sin(a + dir * 0.05) * (r0 - len * 0.4), tx, ty);
    x.quadraticCurveTo(Math.cos(a + dir * 0.3) * (r0 - len * 0.5), Math.sin(a + dir * 0.3) * (r0 - len * 0.5), mx - Math.cos(a + 1.57) * 14, my - Math.sin(a + 1.57) * 14); x.fill();
    x.beginPath(); x.arc(tx, ty, 6, 0, 7); x.fill();
    const cx2 = Math.cos(a + 0.2) * 395, cy2 = Math.sin(a + 0.2) * 395; x.lineWidth = 5; x.beginPath(); x.arc(cx2, cy2, 22, a, a + 4.5); x.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const a = R() * Math.PI * 2, r0 = 150 + R() * 80; x.lineWidth = 5; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 - 118); x.lineTo(Math.cos(a) * (r0 + 90), Math.sin(a) * (r0 + 90) - 118 * 0.4); x.stroke();
    x.beginPath(); x.arc(Math.cos(a) * (r0 + 90), Math.sin(a) * (r0 + 90) - 118 * 0.4, 5, 0, 7); x.fill();
  }
  return c;
}
/** The dial's glazed band, in the window colour (the mock's verdigris is the verdigris window colour exactly). */
function dialTex(c, L) {
  const x = c.getContext('2d'), R = rng(31); x.setTransform(c.width / TN, 0, 0, c.width / TN, 0, 0); x.fillStyle = `rgb(${L.top})`; x.fillRect(0, 0, TN, TN);
  for (let i = 0; i < 70; i++) { const px = R() * TN, py = R() * TN, rr = 30 + R() * 120, g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, R() < 0.5 ? `rgba(${L.midR},.35)` : `rgba(${L.bot},.45)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, 2 * rr, 2 * rr); }
  for (let i = 0; i < 3000; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : `rgba(${L.hiR},.12)`; x.fillRect(R() * TN, R() * TN, 1.5, 1.5); }
  const ctr = TN / 2, u = TN / (2 * TEXR);
  for (const [rr, a] of [[RO - 0.015, 0.55], [RI + 0.012, 0.4]]) { x.strokeStyle = `rgba(${L.hiR},${a})`; x.lineWidth = 5; x.beginPath(); x.arc(ctr, ctr, rr * u, 0, 7); x.stroke(); }
  x.strokeStyle = `rgba(${L.loR},.85)`; x.lineWidth = 4; for (const rr of [PI0 - 0.012, PO + 0.012]) { x.beginPath(); x.arc(ctr, ctr, rr * u, 0, 7); x.stroke(); }
  x.lineCap = 'round';
  for (let i = 0; i < 48; i++) {
    const h = i / 2, maj = i % 2 === 0; if (i % 12 === 0) continue; const [a1, b1] = tp(...P(h, PO + 0.03)), [a2, b2] = tp(...P(h, maj ? RO - 0.04 : RO - 0.075));
    x.strokeStyle = maj ? 'rgba(236,224,200,.85)' : 'rgba(236,224,200,.45)'; x.lineWidth = maj ? 4 : 2.5; x.beginPath(); x.moveTo(a1, b1); x.lineTo(a2, b2); x.stroke();
  }
  x.font = `44px ${COUNT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const h of [0, 6, 12, 18]) { const [px, py] = tp(...P(h, (PO + RO) / 2 + 0.005)); x.save(); x.translate(px, py); x.rotate(-rot(h)); x.fillStyle = `rgba(${L.loR},.8)`; x.fillText(String(h), 0, 3); x.fillStyle = '#ecdcc0'; x.fillText(String(h), 0, 0); x.restore(); }
  x.strokeStyle = '#e8b84a'; x.lineWidth = 3; x.beginPath(); let [qx, qy] = tp(...P(15.3, RI)); x.moveTo(qx, qy);
  for (let k = 1; k <= 6; k++) { [qx, qy] = tp(...P(15.3 + k * 0.06 + (R() - 0.5) * 0.1, RI + (RO - RI) * k / 6)); x.lineTo(qx + (R() - 0.5) * 8, qy + (R() - 0.5) * 8); } x.stroke();
}
function emblem(x, id, s, gold) {
  x.lineWidth = s * 0.12; x.strokeStyle = gold; x.fillStyle = gold;
  if (id === 'night') { x.beginPath(); x.arc(0, 0, s * 0.7, 0, 7); x.arc(s * 0.32, -s * 0.18, s * 0.62, 0, 7, true); x.fill('evenodd'); for (const [a, b] of [[-0.9, -0.7], [1.0, 0.4], [0.6, -1.0]]) { x.beginPath(); x.arc(a * s, b * s, s * 0.09, 0, 7); x.fill(); } return; }
  const set = id === 'dusk', hz = id !== 'day', cy = hz ? s * 0.15 : 0;
  if (hz) { x.beginPath(); x.moveTo(-s, s * 0.15); x.lineTo(s, s * 0.15); x.stroke(); x.save(); x.beginPath(); x.rect(-s, -s, 2 * s, s * 1.15); x.clip(); }
  x.beginPath(); x.arc(0, cy, s * 0.45, 0, 7); x.fill();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; x.beginPath(); x.moveTo(Math.cos(a) * s * 0.62, cy + Math.sin(a) * s * 0.62); x.lineTo(Math.cos(a) * s * 0.85, cy + Math.sin(a) * s * 0.85); x.stroke(); }
  if (hz) {
    x.restore(); x.beginPath(); x.moveTo(0, s * 0.35 + (set ? 0 : s * 0.35)); x.lineTo(0, s * 0.35 + (set ? s * 0.35 : 0));
    x.moveTo(-s * 0.15, s * 0.35 + (set ? s * 0.2 : s * 0.15)); x.lineTo(0, s * 0.35 + (set ? s * 0.35 : 0)); x.lineTo(s * 0.15, s * 0.35 + (set ? s * 0.2 : s * 0.15));
    if (!set) { x.beginPath(); x.moveTo(-s * 0.15, s * 0.5); x.lineTo(0, s * 0.35); x.lineTo(s * 0.15, s * 0.5); x.moveTo(0, s * 0.35); x.lineTo(0, s * 0.7); }
    x.stroke();
  }
}
const PLATE_LOOK = { night: { a: '#141018', b: '#05040a', gold: '#e8bc56' }, dawn: { a: '#c98f86', b: '#8e5a52', gold: '#fff0d8' }, day: { a: '#efe6d4', b: '#c9bca4', gold: '#b8782e' }, dusk: { a: '#d9772e', b: '#8a3a14', gold: '#ffe0a0' } };
/** The four phase plates on one texture: redrawn when the phase or the sky changes, the current one rimmed in the film. */
function drawPlates(c, cur, sky, t) {
  const x = c.getContext('2d'), R = rng(13), u = TN / (2 * TEXR), ctr = TN / 2; x.setTransform(c.width / TN, 0, 0, c.width / TN, 0, 0); x.clearRect(0, 0, TN, TN);
  for (const ph of PHASES) {
    const L = PLATE_LOOK[ph.id], path = new Path2D(), n = 60;
    for (let i = 0; i <= n; i++) { const [px, py] = tp(...P(ph.a + (ph.b - ph.a) * i / n, PO + 0.02)); i ? path.lineTo(px, py) : path.moveTo(px, py); }
    for (let i = n; i >= 0; i--) { const [px, py] = tp(...P(ph.a + (ph.b - ph.a) * i / n, PI0 - 0.02)); path.lineTo(px, py); } path.closePath();
    const g = x.createRadialGradient(ctr, ctr, (PI0 - 0.02) * u, ctr, ctr, (PO + 0.02) * u); g.addColorStop(0, L.b); g.addColorStop(0.5, L.a); g.addColorStop(1, L.b); x.fillStyle = g; x.fill(path);
    x.save(); x.clip(path);
    for (let i = 0; i < 900; i++) { const nt = ph.id === 'night'; x.fillStyle = nt ? (R() < 0.08 ? 'rgba(232,188,86,.9)' : 'rgba(255,255,255,.05)') : R() < 0.6 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)'; x.fillRect(R() * TN, R() * TN, nt ? 2 : 1.5, nt ? 2 : 1.5); }
    if (ph.id === cur && sky) { x.strokeStyle = filmRGB(t * 0.05, 0.95); x.lineWidth = 7; x.stroke(path); }
    x.restore();
    const mid = (ph.a + ph.b) / 2, [ex, ey] = tp(...P(mid, (PI0 + PO) / 2));
    x.save(); x.translate(ex, ey); x.rotate(-rot(mid)); emblem(x, ph.id, 0.075 * u, L.gold); x.restore();
    if (ph.id === 'night' || ph.id === 'day') for (const off of [-2.6, 2.6]) {
      const [ax, ay] = tp(...P(mid + off, (PI0 + PO) / 2)); x.save(); x.translate(ax, ay); x.rotate(-rot(mid + off)); x.strokeStyle = L.gold; x.globalAlpha = 0.6; x.lineWidth = 3;
      x.translate(0, -14); x.stroke(handLetter(rng(Math.round(mid * 10 + off * 3)), 40)); x.restore();
    }
  }
}
/** The yoke's verdigris glaze (the window colour), crackled, with gold kintsugi seams across it. */
function glazeTubeTex(c, seed, seams, L) {
  const w = 1024, h = 128, x = c.getContext('2d'), R = rng(seed); x.setTransform(Q, 0, 0, Q, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgb(${L.bot})`); g.addColorStop(0.5, `rgb(${L.top})`); g.addColorStop(1, `rgb(${L.bot})`); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 80; i++) { const px = R() * w, py = R() * h, rr = 10 + R() * 50, gg = x.createRadialGradient(px, py, 0, px, py, rr); gg.addColorStop(0, R() < 0.5 ? `rgba(${L.midR},.6)` : `rgba(${L.bot},.6)`); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.35; x.fillStyle = gg; x.fillRect(px - rr, py - rr, 2 * rr, 2 * rr); }
  x.globalAlpha = 1; for (let i = 0; i < 2500; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : 'rgba(255,240,220,.12)'; x.fillRect(R() * w, R() * h, 1.5, 1.5); }
  x.strokeStyle = '#e8b84a'; x.lineWidth = 3; x.lineJoin = 'round';
  for (const u of seams) { x.beginPath(); let px = u * w, py = -4; x.moveTo(px, py); while (py < h + 4) { py += 6 + R() * 10; px += (R() - 0.5) * 16; x.lineTo(px, py); } x.stroke(); }
}
function envOf(renderer) {
  const c = cv(512, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3a2c24'); g.addColorStop(0.5, '#22201c'); g.addColorStop(1, '#100c0a'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.filter = 'blur(6px)'; x.fillStyle = '#fff1d6'; x.fillRect(130, 60, 46, 56); x.fillStyle = '#ff9a4a'; x.beginPath(); x.arc(370, 150, 26, 0, 7); x.fill(); x.fillStyle = '#7fdcff'; x.globalAlpha = 0.35; x.fillRect(250, 70, 60, 30);
  return overlayEnv(renderer, c);
}

// ---- the shaders (the mock's, with Calissa's notes: the churn read from level 1, the vortex centred, the film only at the eddies' edges),
// as kinds of the overlay's one shader (vfx/lachrimetertube.js `overlayKind`: one program for every instrument's look)
const SGLASS = overlayKind('sight.glass', { fdecl: `uniform float uTime,uBack;uniform vec4 uSgTint;${GLSL_FILM}`, fbody: `vec3 N=normalize(vN);if(uBack>.5)N=-N;vec3 V=normalize(vV);float fr=pow(1.0-clamp(abs(dot(N,V)),0.0,1.0),2.2);
  vec3 col=mix(vec3(.55,.74,.80),vec3(.93,1.0,1.0),fr);float a=.03+.6*fr;col=mix(col,film(vP.y*.3+uTime*.05+N.x*.25),fr*.45);col=mix(col,uSgTint.rgb*(.55+.6*fr),uSgTint.a*(.35+.65*fr));
  if(uBack<.5){float sh=smoothstep(.2,.0,length(vec2(N.x+.36,N.y-.48)))*.95;float s2=smoothstep(.05,.0,abs(length(vec2(N.x+.1,N.y-.1))-.82))*smoothstep(.0,.4,N.y+.2)*.45;
    float s3=smoothstep(.06,.0,length(vec2(N.x-.62,N.y+.5)))*.4;float hl=sh+s2+s3;col+=vec3(1.0,.98,.94)*hl;a+=hl*.8;}else{a*=.55;col*=.8;}
  gl_FragColor=vec4(col,clamp(a,0.0,1.0));` });
const LIQUID = overlayKind('sight.liquid', { fdecl: `uniform float uLevel,uTx,uTz,uAmp,uSpin,uAlpha,uStr,uRip,uEddy,uVort,uBoil,uBruise,uFunnel;uniform vec3 uCol;
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.55+vn(p*2.03+7.1)*.3+vn(p*4.1+3.3)*.15;}
vec2 swirl(vec2 q){float r=length(q),a=atan(q.y,q.x);a+=uVort*(2.2/(r+.18))+uTime*(.4+1.6*uVort)*smoothstep(1.2,.0,r);return vec2(cos(a),sin(a))*r;}
float churn(vec2 q){vec2 w=swirl(q);return fbm(w*3.2+vec2(uTime*.3,-uTime*.2)*(1.0+uBoil));}
float ring(vec2 xz){return sin(length(xz-vec2(-.35,.2))*26.0+uTime*8.0);}
`, fbody: `float h=uLevel+uTx*vP.x+uTz*vP.z+uAmp*(sin(vP.x*7.0+uTime*3.1)*.6+sin(vP.z*9.0-uTime*2.3)*.4+sin(vP.x*17.0-vP.z*13.0+uTime*5.0)*.35*uStr);
  h+=uRip*(ring(vP.xz)*.7+sin(length(vP.xz-vec2(.4,-.3))*19.0+uTime*6.3)*.5);
  h+=uBoil*.035*(vn(vP.xz*9.0+uTime*3.0)-.5)*2.0;h-=uFunnel*exp(-vP.x*vP.x*7.0)*(.6+.4*sin(uTime*1.7));h+=uFunnel*.25*smoothstep(.3,.9,abs(vP.x));
  if(vP.y>h)discard;vec3 deep=uCol*.28+vec3(.05,.03,.1);float fe=uBoil>0.0?.08:.05;
  if(gl_FrontFacing){vec3 N=normalize(vN),V=normalize(vV);float fr=pow(1.0-abs(dot(N,V)),1.5);float d=clamp((h-vP.y)/1.4,0.0,1.0);
    vec3 col=mix(uCol,deep,smoothstep(0.0,1.0,d));col=mix(col,film(vP.y*.4+N.x*.3+uTime*.03),fr*.35);
    // the vortex's centre: the middle of the liquid as it is seen (between the surface and the floor, a little up), not the floor
    vec2 q=vec2(vP.x,(vP.y-((h-.965)*.5+.12))*1.15);float r=length(q);
    // the rings' lit crest (levels 1 to 3): a bright edge riding just under the surface line where a ring peaks
    float crest=pow(max(0.0,ring(vP.xz)),3.0)*smoothstep(.16,.0,h-vP.y);col+=vec3(.95,.99,1.0)*min(1.0,uRip*32.0)*crest*.85;
    if(uEddy>0.0){float e=churn(q);col=mix(col,col*(.55+.9*e)+(e-.5)*.18,uEddy);
      float edge=1.0-smoothstep(.0,fe,abs(fract(e*3.0)-.5));col=mix(col,film(e*1.7+uTime*.1)*1.15,edge*min(uBoil,1.0)*.8);}
    col=mix(col,uCol*.16+vec3(.05,.0,.08),uBruise*exp(-r*r*5.5)*.9);
    col=mix(col,vec3(.92,.97,1.0),smoothstep(.04,.0,h-vP.y)*.8);gl_FragColor=vec4(col,uAlpha*(.75+.25*fr));
  }else{float an=atan(vP.z,vP.x)+uSpin;float rr=length(vP.xz);float s=rr*1.3+sin(an*2.0+rr*4.0)*.18+uTime*.05;
    vec3 col=mix(uCol,film(s),.4);col+=vec3(.9,.97,1.0)*min(1.0,uRip*28.0)*pow(max(0.0,ring(vP.xz)),4.0)*.6;
    if(uEddy>0.0){float e=churn(vP.xz*.9);col=mix(col,col*(.55+.9*e),uEddy);float edge=1.0-smoothstep(.0,fe,abs(fract(e*3.0)-.5));col=mix(col,film(e*1.7+uTime*.1),edge*min(uBoil,1.0)*.7);}
    col=mix(col,uCol*.16+vec3(.05,.0,.08),uBruise*exp(-rr*rr*6.0)*.9);
    col=mix(col,vec3(.95,1.0,1.0),smoothstep(.6,.98,rr/max(sqrt(max(.965*.965-h*h,.0001)),.01))*(.35+.4*uStr));
    gl_FragColor=vec4(col,min(1.0,uAlpha+.15));}` });
const MOTES = overlayKind('sight.motes', { vdecl: `attribute float speed,idx;uniform float uLevel,uTime,uStr,uPx,uBoil,uVort;
`, vbody: `float y0=-.85;float span=uLevel-y0;float y=y0+mod(position.y*3.0+uTime*speed*(1.0+2.5*uBoil),1.0)*max(span,.01);float rad=sqrt(max(.80-y*y,0.0))*.85;
  vA=(idx<min(1.0,uStr+.6*uBoil))&&span>.05?smoothstep(uLevel,uLevel-.15,y)*.8:0.0;float sa=uVort*uTime*speed*6.0;vec2 pxz=mat2(cos(sa),-sin(sa),sin(sa),cos(sa))*position.xz;
  vec4 mv=modelViewMatrix*vec4(pxz.x*rad,y,pxz.y*rad,1.0);gl_PointSize=(speed>.2?3.0:2.0)*uPx;gl_Position=projectionMatrix*mv;`, fbody: 'vec2 d=gl_PointCoord-.5;if(dot(d,d)>.25)discard;gl_FragColor=vec4(vec3(.9,.97,1.0)*vA,vA);' });
const RETE = overlayKind('sight.rete', { fdecl: 'uniform sampler2D uTex;uniform float uOp;', fbody: `float a=texture2D(uTex,vUv).r;vec2 d=vUv-.5;
  vec3 brass=vec3(.85,.66,.32);vec3 c=mix(brass,film(atan(d.y,d.x)*.16+length(d)*1.3+uTime*.04),.55);gl_FragColor=vec4(c*a*uOp,1.0);` });
const ARC = overlayKind('sight.arc', { vdecl: 'attribute float u;', vbody: 'vA=u;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);', fdecl: 'uniform float uA,uW;', fbody: `vec3 c=film(vA*1.5+uTime*.8);gl_FragColor=vec4(mix(c,vec3(1.0),uW)*uA,1.0);` });
// the roil a Dissonance Level gives the liquid: rings from 1 (bigger than the mock's, with their crest lit), eddies a little from 1
const ROIL = { rip: [0, 0.02, 0.03, 0.02, 0.012, 0.008], eddy: [0, 0.12, 0.3, 0.6, 0.8, 1], vort: [0, 0.08, 0.18, 0.4, 0.65, 1], boil: [0, 0, 0, 0, 1, 1.15], bruise: [0, 0, 0, 0, 0.15, 1], funnel: [0, 0, 0.02, 0.06, 0.1, 0.2] };
const REACH = [0, 0.155, 0.345, 0.535, 0.725, 1], SU = [0.12, 0.31, 0.5, 0.69, 0.88], SEAMS = [0.21, 0.5, 0.79], YS = 200, MAXQ = 96;

export class SightLook {
  /** True while this instrument stands in place of the old HUD piece (feedback/ gives way to it); false if switched off. */
  get standing() { return !this.off; }
  constructor(game) {
    this.game = game; this.t = 0; this.level = -1; this.hidden = true;
    this.k = 0; this.vh = 0; this.pr = 0; this.dot = 1;
    this.wx = { aspect: null, s: 0, poll: 0, col: new THREE.Color(0.82, 0.93, 0.97), lvl: levelY(0.3), alpha: 0.2 };
    this.roil = { rip: 0, eddy: 0, vort: 0, boil: 0, bruise: 0, funnel: 0 };
    this.nd = { a: 0, v: 0, poll: 0, wp: null, id: undefined, pos: new THREE.Vector3(), dist: -1, reel: null, pulse: 0 };
    this.room = ''; this.layer = ''; this.phase = null; this.sky = null; this.themeId = null; this.themeT = 0; this.c3 = [0, 0, 0];
    this.v3 = new THREE.Vector3(); this.f3 = new THREE.Vector3(); this.arcT = 0; this.R = rng(7);
    const S = game.overlayScene; if (!S || typeof document === 'undefined') return;
    this.env = envOf(S.r);
    this.build();
    this.slot = S.add(this.frame, { anchor: 'tr', x: 0, y: 0, z: 0, update: (dt, slot) => this.update(dt, slot) });
    game.events?.on?.('place.enter', (e) => { if (e?.room) { this.room = e.room; this.layer = e.layer || ''; this.platesDirty = true; } });
    // the Spirit Garden is entered at a Shrine, not through place.enter: the plate says the garden (your Inner Realm's name once given), and the room again on leaving
    const garden = () => { if (!this.away) this.away = { room: this.room, layer: this.layer }; this.room = game.realm?.name || 'Spirit Garden'; this.layer = ''; this.platesDirty = true; };
    game.events?.on?.('garden.enter', garden); game.events?.on?.('realm.name', () => { if (this.away) garden(); });
    game.events?.on?.('garden.leave', () => { if (this.away) { ({ room: this.room, layer: this.layer } = this.away); this.away = null; this.platesDirty = true; } });
    const fonts = ['600 14px Cinzel', '14px DotGothic16', "14px 'Jersey 15'"];
    Promise.all(fonts.map((f) => document.fonts?.load?.(f).catch(() => null))).then(() => { this.platesDirty = true; this.themeId = null; });
  }

  /** The materials a lit part wears: the mock's raw colours, the env map for the metal, never tone-mapped. */
  std(o, phys = false) { return overlayStd(this.env, o, phys); } // (one set-up each for every instrument: vfx/lachrimetertube.js)

  build() {
    const frame = this.frame = new THREE.Group(), view = this.view = new THREE.Group(), root = this.root = new THREE.Group();
    frame.add(view); view.add(root); view.rotation.x = EL; // (seen from twelve degrees above, as the mock's camera saw it)
    const tilt = this.tilt = new THREE.Group(); tilt.rotation.z = -TILT; root.add(tilt);
    const metal = []; // (every static metal part, baked into one mesh at the end: one draw call)
    const bronze = raw(0x9a7440), copper = raw(0xc06a3a), dark = raw(0x3a2616), gold = raw(0xe8b84a);
    const keep = (m, col, rough = 0.32, metal = 0.85, glow = null) => { m.userData.bake = { c: col, r: rough, m: metal, e: glow }; return m; }; // (baked: see bake below)
    // the glass
    const glassGeo = new THREE.SphereGeometry(RG, 40, 28);
    const tint = { value: new THREE.Vector4(0, 0, 0, 0) }; // (an instrument skin's tint of the glass: rgb, how much; 0 the stock)
    const glass = (back) => overlayShader(SGLASS, { uTime: { value: 0 }, uBack: { value: back ? 1 : 0 }, uSgTint: tint }, { cull: back ? 2 : 1, depthWrite: false });
    this.gBack = new THREE.Mesh(glassGeo, glass(1)); this.gBack.renderOrder = 1; this.gFront = new THREE.Mesh(glassGeo, glass(0)); this.gFront.renderOrder = 5; root.add(this.gBack, this.gFront);
    // the rete, faint, turning once a game day
    let rete0 = reteTex(); const reteMap = bakedCanvasTexture((g) => { g.drawImage(rete0 || reteTex(), 0, 0); rete0 = null; }, rete0.width, rete0.height, { scale: 0.5 }); // (drawn once: its pixels let go once on the GPU, render/bakedcanvas.js)
    this.reteMat = overlayShader(RETE, { uTex: { value: reteMap }, uTime: { value: 0 }, uOp: { value: 0.3 } }, { cull: 1, depthWrite: false, blending: THREE.AdditiveBlending });
    this.rete = new THREE.Mesh(new THREE.CircleGeometry(0.93, 64), this.reteMat); this.rete.position.z = -0.18; this.rete.renderOrder = 2;
    const reteHold = new THREE.Group(); reteHold.rotation.x = -EL; reteHold.add(this.rete); root.add(reteHold);
    // the liquid and its motes
    const U = (v) => ({ value: v });
    // (drawn as three.js draws a double-sided transparent: its back faces, then its front; two meshes, one set of uniforms)
    const LU = { uLevel: U(0), uTx: U(0), uTz: U(0), uTime: U(0), uAmp: U(0.002), uSpin: U(0), uAlpha: U(0.2), uStr: U(0), uRip: U(0), uEddy: U(0), uVort: U(0), uBoil: U(0), uBruise: U(0), uFunnel: U(0), uCol: U(new THREE.Color()) };
    this.liqMat = overlayShader(LIQUID, LU, { cull: 2, depthWrite: false });
    const liqG = new THREE.SphereGeometry(RL, 48, 36), liq = new THREE.Mesh(liqG, this.liqMat), liqF = new THREE.Mesh(liqG, overlayShader(LIQUID, LU, { cull: 1, depthWrite: false }));
    liq.renderOrder = 3; liqF.renderOrder = 3.01; root.add(liq, liqF);
    { const bp = [], bs = [], bi = [], RB = rng(5); for (let i = 0; i < 90; i++) { const a = RB() * 6.28, rr = Math.sqrt(RB()); bp.push(Math.cos(a) * rr, RB(), Math.sin(a) * rr); bs.push(0.08 + RB() * 0.18); bi.push(i / 90); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('speed', new THREE.Float32BufferAttribute(bs, 1)); bg.setAttribute('idx', new THREE.Float32BufferAttribute(bi, 1));
      this.moteMat = overlayShader(MOTES, { uLevel: U(0), uTime: U(0), uStr: U(0), uPx: U(1), uBoil: U(0), uVort: U(0) }, { depthTest: false, blending: THREE.AdditiveBlending });
      const motes = new THREE.Points(bg, this.moteMat); motes.renderOrder = 4; motes.frustumCulled = false; root.add(motes); }
    // the discs: the anode above, the cathode below
    const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); } return t; };
    // the two discs, one mesh on one atlas (their faces, their rims thrice round, their undersides; the faces' bumps beside): one draw
    const AW = 1024, AH = 656, AS = discScale(), atlas = cv(AW * AS, AH * AS), bumps = cv(AW * AS, AH * AS), ax = atlas.getContext('2d'), bx = bumps.getContext('2d'); ax.scale(AS, AS); bx.scale(AS, AS); bx.fillStyle = '#808080'; bx.fillRect(0, 0, AW, AH); // (drawn in AW x AH units at AS of it: discScale)
    const region = (g, [x0, y0, w, h], grp) => { const uv = g.attributes.uv, { start, count } = g.groups[grp], seen = new Set();
      for (let i = start; i < start + count; i++) { const v = g.index.getX(i); if (seen.has(v)) continue; seen.add(v); uv.setXY(v, (x0 + uv.getX(v) * w) / AW, 1 - (y0 + h) / AH + uv.getY(v) * h / AH); } };
    const discs = ['anode', 'cathode'].map((kind, k) => {
      const F = discFace(kind), an = kind === 'anode', rimC = rimTex(kind), g = new THREE.CylinderGeometry(DR, DR, DT, 48, 1), ry = 512 + 64 * k;
      ax.drawImage(F.c, 512 * k, 0, 512, 512); bx.drawImage(F.b, 512 * k, 0, 512, 512);
      for (let r = 0; r < 3; r++) ax.drawImage(rimC, AW / 3 * r, ry, AW / 3, 64);
      ax.fillStyle = `#${raw(an ? 0x5a2a16 : 0x1a1210).getHexString()}`; ax.fillRect(512 * k, 640, 512, 16);
      region(g, [0, ry, AW, 64], 0); region(g, an ? [0, 0, 512, 512] : [512 * k, 640, 512, 16], 1); region(g, an ? [512 * k, 640, 512, 16] : [512, 0, 512, 512], 2);
      g.clearGroups(); g.translate(0, an ? DY : -DY, 0);
      const holder = new THREE.Group(); holder.position.y = an ? DY : -DY; tilt.add(holder);
      for (const yy of [DT / 2, -DT / 2]) { const lip = keep(new THREE.Mesh(new THREE.TorusGeometry(DR, 0.022, 8, 48)), raw(an ? 0xb06a3c : 0x3a2b26), 0.7, 0); lip.rotation.x = Math.PI / 2; lip.position.y = yy; holder.add(lip); metal.push(lip); }
      const boss = keep(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.06, 24)), bronze); boss.position.y = (an ? 1 : -1) * (DT / 2 + 0.02); holder.add(boss); metal.push(boss);
      return g;
    });
    ax.setTransform(1, 0, 0, 1, 0, 0); bx.setTransform(1, 0, 0, 1, 0, 0); // (back to its own pixels: an instrument skin repaints the atlas pixel for pixel, vfx/instrumentskins.js)
    const discMap = tex(atlas), discMat = this.std({ map: discMap, bumpMap: new THREE.CanvasTexture(bumps), bumpScale: 0.018, roughness: 0.6, clearcoat: 0.33, clearcoatRoughness: 0.4 }, true);
    tilt.add(new THREE.Mesh(mergeGeometries(discs), discMat));
    discs.forEach((g) => g.dispose());
    // the axis rod (only from each disc to the glass), the copper coils and the collars
    { const L = DY - 0.97; for (const sg of [1, -1]) { const rod = keep(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, L, 10)), dark); rod.position.y = sg * (0.97 + L / 2); tilt.add(rod); metal.push(rod); } }
    for (const sg of [1, -1]) {
      for (let i = 0; i < 7; i++) { const t = keep(new THREE.Mesh(new THREE.TorusGeometry(0.085 + 0.012 * Math.sin(i / 6 * Math.PI), 0.019, 4, 16)), copper); t.rotation.x = Math.PI / 2; t.position.y = sg * (1.02 + i * 0.03); tilt.add(t); metal.push(t); }
      const col = keep(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.026, 8, 32)), bronze); col.rotation.x = Math.PI / 2; col.position.y = sg * 0.985; tilt.add(col); metal.push(col);
    }
    // the yoke: a verdigris clay C-meridian behind the globe's right side, gold at its joins; its studs; its arc
    const T3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const Y = new THREE.CatmullRomCurve3([[0.48, DY - 0.02, -0.44], [1.02, 1.64, -0.64], [1.6, 1.02, -0.72], [1.86, 0, -0.74], [1.6, -1.02, -0.72], [1.02, -1.64, -0.64], [0.48, -DY + 0.02, -0.44]].map((p) => T3(...p)), false, 'centripetal');
    this.ys = new Float32Array((YS + 1) * 3); for (let i = 0; i <= YS; i++) { const p = Y.getPointAt(i / YS); this.ys.set([p.x, p.y, p.z], i * 3); }
    this.yokeC = cv(512, 64); this.yokeMap = tex(this.yokeC); this.yokeMap.wrapS = THREE.RepeatWrapping;
    tilt.add(new THREE.Mesh(new THREE.TubeGeometry(Y, 96, 0.085, 8, false), this.std({ map: this.yokeMap, roughness: 0.4, clearcoat: 0.75, clearcoatRoughness: 0.2 }, true)));
    for (const u of SEAMS) { const m = keep(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 24)), gold); m.position.copy(Y.getPointAt(u)); m.quaternion.setFromUnitVectors(T3(0, 0, 1), Y.getTangentAt(u)); tilt.add(m); metal.push(m); }
    for (const u of [0, 1]) { const m = keep(new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10)), bronze); m.position.copy(Y.getPointAt(u)); tilt.add(m); metal.push(m); }
    // the five studs in one geometry, the first lit; two meshes over it, each drawing its stretch (no instancing: one program fewer)
    const studAt = SU.map((u) => { const p = Y.getPointAt(u), n = T3(p.x, p.y, 0).normalize(); return T3(p.x + n.x * 0.05, p.y + n.y * 0.05, p.z + 0.07); });
    const studG = mergeGeometries(studAt.map((p) => new THREE.SphereGeometry(0.042, 12, 8).translate(p.x, p.y, p.z)));
    this.studN = studG.index.count / 5;
    this.studOnMat = overlayFlat({ cull: 1 }); this.studOn = new THREE.Mesh(studG, this.studOnMat); this.studOn.frustumCulled = false; tilt.add(this.studOn);
    const studsOff = studAt.slice().reverse().map((p) => { const m = keep(new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8)), raw(0x3a2a1a), 0.5, 0.7); m.position.copy(p); tilt.add(m); return m; }); // (baked last, reversed: the lit are the first k)
    this.arcCore = this.arcStrip(1, 0.35); this.arcGlow = this.arcStrip(0.28, 0.2); tilt.add(this.arcGlow.mesh, this.arcCore.mesh);
    // the needle: level on its pivot, drawn last with its dark outline (an inverted hull), so the churn never crosses it
    const needle = this.needle = new THREE.Group(); root.add(needle);
    const lozenge = (L, w, front) => { const s = new THREE.Shape(); if (front) { s.moveTo(0, L); s.lineTo(w, 0); s.lineTo(-w, 0); } else { s.moveTo(w, 0); s.lineTo(0, -L); s.lineTo(-w, 0); } s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }); g.translate(0, 0, -0.0125); g.rotateX(-Math.PI / 2); return g; };
    const NF = lozenge(0.9, 0.13, true), NT = lozenge(0.66, 0.12, false), last = { transparent: true, depthWrite: true };
    this.needleGold = this.std({ color: raw(0xffd56a), metalness: 1, roughness: 0.16, emissive: 0x000000, ...last });
    needle.add(new THREE.Mesh(NF, this.needleGold)); const needleParts = [keep(new THREE.Mesh(NT.clone()), raw(0x2d4fb8), 0.22, 0.75, raw(0x0c1650))]; needleParts.forEach((m) => needle.add(m));
    const hull = (G, sx, sz, oz) => { const g = G.clone(); g.applyMatrix4(new THREE.Matrix4().compose(T3(0, 0, oz), new THREE.Quaternion(), T3(sx, 2.2, sz))); return g; };
    const line = new THREE.Mesh(mergeGeometries([hull(NF, 1.32, 1.06, -0.012), hull(NT, 1.32, 1.07, 0.012)]), overlayFlat({ color: 0x0a0610, cull: 2, opacity: 0.92, depthWrite: false }));
    line.renderOrder = 5.9; needle.add(line);
    { const capG = new THREE.SphereGeometry(0.07, 14, 10); capG.translate(0, 0.03, 0); const ringG = new THREE.TorusGeometry(0.11, 0.014, 6, 28); ringG.rotateX(Math.PI / 2);
      const capM = keep(new THREE.Mesh(mergeGeometries([capG, ringG])), bronze); needle.add(capM); needleParts.push(capM);
      const jewel = keep(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8)), raw(0xd91a80), 0.1, 0.2, raw(0x400820)); jewel.position.y = 0.075; needle.add(jewel); needleParts.push(jewel);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), overlayFlat({ color: raw(0xfff2c0), cull: 1 })); tip.position.set(0, 0.01, -0.86); needle.add(tip);
      const gc = cv(64, 64), gx = gc.getContext('2d'), gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gg.addColorStop(0, 'rgba(255,248,220,1)'); gg.addColorStop(0.18, 'rgba(255,226,150,.55)'); gg.addColorStop(1, 'rgba(255,200,90,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
      gx.fillStyle = 'rgba(255,250,230,.95)'; gx.beginPath(); gx.moveTo(32, 0); gx.lineTo(34.5, 29.5); gx.lineTo(64, 32); gx.lineTo(34.5, 34.5); gx.lineTo(32, 64); gx.lineTo(29.5, 34.5); gx.lineTo(0, 32); gx.lineTo(29.5, 29.5); gx.closePath(); gx.fill();
      const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace; // (a quad turned to the eye each frame, as a sprite would be)
      const glint = this.glint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: gt, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      glint.scale.setScalar(0.34); glint.position.set(0, 0.03, -0.86); glint.renderOrder = 7; needle.add(glint); }
    this.needleParts = needleParts;
    // the set pulse: a ring flaring round the pivot when a waypoint is calibrated
    this.pulseMat = overlayFlat({ opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.pulse = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 48), this.pulseMat); this.pulse.rotation.x = -Math.PI / 2; this.pulse.renderOrder = 4; this.pulse.visible = false; root.add(this.pulse);
    // the clock ring: a wadokei dial face to the eye, its four phase plates and the hand
    const ringGrp = this.ringGrp = new THREE.Group(); ringGrp.rotation.x = -EL; root.add(ringGrp);
    const planarUV = (g) => { const p = g.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / (2 * TEXR) + 0.5; uv[i * 2 + 1] = p.getY(i) / (2 * TEXR) + 0.5; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; };
    { const s = new THREE.Shape(); s.absarc(0, 0, RO, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, RI, 0, Math.PI * 2, true); s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1, curveSegments: 72 }); g.translate(0, 0, -0.04);
      this.dialC = cv(TN * QD, TN * QD); this.dialMap = tex(this.dialC); this.dialMat = this.std({ map: this.dialMap, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.2 }, true);
      ringGrp.add(new THREE.Mesh(planarUV(g), this.dialMat)); }
    for (const rr of [RO + 0.012, RI - 0.012]) { const t = keep(new THREE.Mesh(new THREE.TorusGeometry(rr, 0.02, 5, 80)), bronze); ringGrp.add(t); metal.push(t); }
    this.plateC = cv(TN * QD, TN * QD); this.plateMap = tex(this.plateC);
    this.plateMat = this.std({ map: this.plateMap, emissiveMap: this.plateMap, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.35, clearcoat: 0.85, clearcoatRoughness: 0.15 }, true);
    { const GAP = 0.06, sector = (h0, h1) => { const s = new THREE.Shape(), n = Math.max(8, Math.ceil((h1 - h0) * 6)); for (let i = 0; i <= n; i++) { const [x, y] = P(h0 + (h1 - h0) * i / n, PO); i ? s.lineTo(x, y) : s.moveTo(x, y); } for (let i = n; i >= 0; i--) { const [x, y] = P(h0 + (h1 - h0) * i / n, PI0); s.lineTo(x, y); } s.closePath(); return s; };
      const gs = PHASES.map((ph) => { const g = new THREE.ExtrudeGeometry(sector(ph.a + GAP, ph.b - GAP), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 1 }); g.translate(0, 0, 0.045); return planarUV(g); });
      ringGrp.add(new THREE.Mesh(mergeGeometries(gs), this.plateMat)); }
    for (const h of [5, 7, 18, 20]) { const [x, y] = P(h, (PI0 + PO) / 2); const pin = keep(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 10)), bronze); pin.rotation.x = Math.PI / 2; pin.position.set(x, y, 0.08); ringGrp.add(pin); metal.push(pin); }
    { const [x, y] = P(hookA, RO + 0.03); const eye = keep(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 16)), bronze); eye.position.set(x, y, 0); ringGrp.add(eye); metal.push(eye); }
    const hand = this.hand = new THREE.Group(); ringGrp.add(hand);
    { const cl = new THREE.BoxGeometry(0.13, 0.12, 0.16); cl.translate(0, RO + 0.04, 0); const pt = new THREE.ConeGeometry(0.055, 0.2, 4); pt.rotateZ(Math.PI); pt.scale(1, 1, 0.35); pt.translate(0, PO + 0.03, 0.1);
      cl.deleteAttribute('uv'); pt.deleteAttribute('uv'); this.handMat = this.std({ color: bronze, metalness: 0.85, roughness: 0.32 }); hand.add(new THREE.Mesh(mergeGeometries([cl.toNonIndexed(), pt.toNonIndexed()]), this.handMat)); }
    this.beadMat = overlayFlat({ cull: 1 }); const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), this.beadMat); bead.position.set(0, RO + 0.14, 0.02); hand.add(bead);
    this.halo = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), overlayFlat({ opacity: 0.25, cull: 1, depthWrite: false, blending: THREE.AdditiveBlending })); this.halo.position.set(0, RO + 0.14, 0.03); hand.add(this.halo);
    // bake the static metal into one mesh (root space: the tilt and the ring are fixed turns of it), and the discs' lips into another
    // bake parts into one mesh in `into`'s space: each part's colour, roughness and metalness, and glow, a texel of three little palettes
    // its uvs all point at (maps, not vertex colours or a material a part: the lit parts' one program, and one draw)
    const bake = (list, into) => {
      into.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(into.matrixWorld).invert(), M = new THREE.Matrix4();
      const key = (b) => `${b.c.getHex(LIN)}|${b.r}|${b.m}|${b.e ? b.e.getHex(LIN) : 0}`, keys = [...new Set(list.map((m) => key(m.userData.bake)))], W = keys.length;
      // (one image of three rows, colour, roughness and metalness, glow; three textures over it, each its row: one upload)
      const px = new Uint8Array(W * 12), b8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
      for (const m of list) { const b = m.userData.bake, i = keys.indexOf(key(b)) * 4, e = b.e || { r: 0, g: 0, b: 0 };
        px.set([b8(b.c.r), b8(b.c.g), b8(b.c.b), 255], i); px.set([255, b8(b.r), b8(b.m), 255], W * 4 + i); px.set([b8(e.r), b8(e.g), b8(e.b), 255], W * 8 + i); }
      const col = new THREE.DataTexture(px, W, 3); col.magFilter = col.minFilter = THREE.NearestFilter; col.needsUpdate = true;
      const looks = keys.map((k) => list.find((m) => key(m.userData.bake) === k).userData.bake); // (each texel's part as built: an instrument skin repaints by it)
      const row = (t, k) => { t.repeat.set(1, 1 / 3); t.offset.set(0, k / 3); return t; }, orm = row(col.clone(), 1), glow = row(col.clone(), 2); row(col, 0);
      const gs = list.map((m) => { const g = m.geometry.clone(); g.applyMatrix4(M.multiplyMatrices(inv, m.matrixWorld)); const u = (keys.indexOf(key(m.userData.bake)) + 0.5) / W, n = g.attributes.position.count, a = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { a[i * 2] = u; a[i * 2 + 1] = 0.5; } g.setAttribute('uv', new THREE.BufferAttribute(a, 2)); m.parent.remove(m); m.geometry.dispose(); return g; });
      const flat = gs.some((g) => !g.index), all = flat ? gs.map((g) => (g.index ? g.toNonIndexed() : g)) : gs; // (merged all indexed, or none)
      const mesh = new THREE.Mesh(mergeGeometries(all), this.std({ map: col, roughnessMap: orm, metalnessMap: orm, emissiveMap: glow, emissive: 0xffffff, roughness: 1, metalness: 1 }));
      mesh.userData.palette = { px, W, looks, tex: [col, orm, glow] }; into.add(mesh); return mesh;
    };
    this.metalM = bake([...metal, ...studsOff], root); this.metalN = this.metalM.geometry.index.count; // (the static metal, the discs' lips, the unlit studs last)
    this.skinParts = { discAtlas: atlas, discMap, discMat, palette: this.metalM.userData.palette, handMat: this.handMat, glassTint: tint.value, tilt, root, env: this.env, yoke: this.ys, DY, DR, DT };
    const nb = bake(this.needleParts, needle); nb.renderOrder = 6; needle.children.forEach((o) => { if (o.isMesh && o !== line && o !== this.glint) o.renderOrder = 6; });
    // the plates' words: two canvases drawn at the present's dots, on quads in front of everything
    this.wpQuad = this.textQuad(); this.placeQuad = this.textQuad(); frame.add(this.wpQuad.mesh, this.placeQuad.mesh);
  }

  /** A ribbon of quads for the arc (core or glow), its buffers allocated once and rewritten at 14 Hz. */
  arcStrip(a, w) {
    const pos = new Float32Array(MAXQ * 12), u = new Float32Array(MAXQ * 4), idx = new Uint16Array(MAXQ * 6);
    for (let q = 0; q < MAXQ; q++) idx.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3], q * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('u', new THREE.BufferAttribute(u, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setDrawRange(0, 0);
    const mat = overlayShader(ARC, { uTime: { value: 0 }, uA: { value: a }, uW: { value: w } }, { depthWrite: false, blending: THREE.AdditiveBlending }); // (additive: one pass, both sides)
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4.5;
    return { mesh, mat, pos, u, n: 0, quad(ax, ay, az, bx, by, bz, wa, ua, ub) {
      if (this.n >= MAXQ) return; let nx = -(by - ay), ny = bx - ax; const l = Math.hypot(nx, ny) || 1; nx *= wa / l; ny *= wa / l; const o = this.n * 12;
      pos[o] = ax - nx; pos[o + 1] = ay - ny; pos[o + 2] = az; pos[o + 3] = ax + nx; pos[o + 4] = ay + ny; pos[o + 5] = az;
      pos[o + 6] = bx - nx; pos[o + 7] = by - ny; pos[o + 8] = bz; pos[o + 9] = bx + nx; pos[o + 10] = by + ny; pos[o + 11] = bz;
      const v = this.n * 4; u[v] = u[v + 1] = ua; u[v + 2] = u[v + 3] = ub; this.n++;
    }, done() { g.attributes.position.needsUpdate = true; g.attributes.u.needsUpdate = true; g.setDrawRange(0, this.n * 6); } };
  }

  textQuad() {
    const mat = overlayFlat({ cull: 1, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); mesh.renderOrder = 10; mesh.position.z = 400; mesh.visible = false;
    return { mesh, mat, c: null, tex: null };
  }

  /** The canvas a plate is drawn on: kept at a fixed size for the present's scale (k render pixels a dot), cropped by its UVs. */
  quadCanvas(Qd, W, H) {
    if (Qd.c && Qd.c.width === W * this.k) return Qd.c.getContext('2d');
    Qd.tex?.dispose(); Qd.c = cv(W * this.k, H * this.k); Qd.tex = new THREE.CanvasTexture(Qd.c); Qd.tex.colorSpace = THREE.SRGBColorSpace;
    Qd.tex.magFilter = Qd.tex.minFilter = THREE.NearestFilter; Qd.tex.generateMipmaps = false; Qd.mat.uniforms.uMap.value = Qd.tex;
    return Qd.c.getContext('2d');
  }
  /** Show a drawn region [x0, y0, x1, y1] (canvas px) of a quad's canvas with its anchor point at (ax, ay) CSS px of the frame. */
  showQuad(Qd, [x0, y0, x1, y1], ax, ay, ox, oy) {
    const c = Qd.c, pr = this.pr, w = x1 - x0, h = y1 - y0, snap = (v) => Math.round(v * pr) / pr;
    Qd.mat.uniforms.uUvT.value.set(0, 1 - h / c.height, w / c.width, h / c.height); Qd.tex.needsUpdate = true; // (the drawn region: the one shader's uv offset and repeat)
    Qd.mesh.scale.set(w / pr, h / pr, 1);
    Qd.mesh.position.x = snap(ax + (x0 - ox) / pr) + w / pr / 2; Qd.mesh.position.y = -(snap(ay + (y0 - oy) / pr) + h / pr / 2);
    Qd.mesh.visible = true;
  }

  /** The instrument's size and place for this view (on a resize, or the present's resolution changing); `dot` CSS px a dot (the
   *  480-line present's on the desk; the HUD layout's on touch, keyed to the safe area's shorter side: ui/hudlayout.js). */
  layout(view, dot = view.h / 480) {
    const pr = this.game.overlayScene.r.getPixelRatio(), k = Math.max(1, Math.round(pr * dot)), snap = (v) => Math.round(v * pr) / pr;
    this.vh = view.h; this.vw = view.w; this.pr = pr; this.dot = dot; if (k !== this.k) { this.k = k; this.platesDirty = true; }
    this.view.scale.setScalar(PPU * dot); this.view.position.set(snap(-ORIGIN[0] * dot), snap(-ORIGIN[1] * dot), 0);
    this.frame.position.set(0, 0, 0); this.frame.updateMatrixWorld(true);
    const cb = this.v3.set(0, -DY - DT * 0.6, 0).applyMatrix4(this.tilt.matrixWorld); this.placeAt = [this.view.position.x, -cb.y + 8 * dot];
    const [hx, hy] = P(hookA, RO + 0.03), hk = this.v3.set(hx, hy, 0).applyMatrix4(this.ringGrp.matrixWorld); this.hookAt = [hk.x, -hk.y];
    this.platesDirty = true;
  }

  update(dt, slot) {
    const g = this.game, B = document.body.classList;
    const hide = !!(g.title?.active || g.god?.controlling || g.emocean?.stage?.active || B.contains('cine'));
    this.frame.userData.overlayHidden = this.hidden = hide; if (hide) return;
    // where it stands: the top-right corner on the desk; on touch the HUD layout's box, inside the safe area at a phone's scale
    const L = g.hudLayout, touch = !!L?.touch, P = touch ? L.place('sight') : null, dot = P ? P.scale : slot.view.h / 480;
    slot.x = P ? P.x + P.w - slot.view.w : 0; slot.y = P ? P.y : 0;
    if (touch !== this.compact) { this.compact = touch; this.platesDirty = true; } // (on touch the place plate drops to its icon line)
    if (slot.view.h !== this.vh || slot.view.w !== this.vw || dot !== this.dot || g.overlayScene.r.getPixelRatio() !== this.pr) this.layout(slot.view, dot);
    this.t += dt; const t = this.t;
    if ((this.themeT -= dt) <= 0) { this.themeT = 1; if (theme.id !== this.themeId) { this.themeId = theme.id; const L = look(); dialTex(this.dialC, L); this.dialMap.needsUpdate = true; glazeTubeTex(this.yokeC, 57, SEAMS, L); this.yokeMap.needsUpdate = true; this.platesDirty = true; } }
    this.gBack.material.uniforms.uTime.value = this.gFront.material.uniforms.uTime.value = t;
    this.weather(dt, t); this.clock(t); this.dissonance(dt, t); this.steer(dt, t); this.skinTick?.(dt);
    if (this.platesDirty) { this.platesDirty = false; this.drawWaypointPlate(); this.drawPlacePlate(); }
  }

  /** The liquid: the weather where the Courier stands, eased; fair is clear and still. */
  weather(dt, t) {
    const g = this.game, W = this.wx;
    if ((W.poll -= dt) <= 0) { W.poll = 0.5; const w = g.player?.pos ? g.weather?.here?.(g.player.pos) : null; const a = w?.aspect || null, s = a ? w.strength || 0 : 0; if (a !== W.aspect) this.platesDirty = true; W.aspect = a; W.s = s; }
    const e = 1 - Math.exp(-dt * 1.5), a = W.aspect, s = W.s;
    if (a) { const h = COLOR[a] ?? 0xcfe8ff; W.col.r += (((h >> 16) & 255) / 255 - W.col.r) * e; W.col.g += (((h >> 8) & 255) / 255 - W.col.g) * e; W.col.b += ((h & 255) / 255 - W.col.b) * e; }
    else { W.col.r += (0.82 - W.col.r) * e; W.col.g += (0.93 - W.col.g) * e; W.col.b += (0.97 - W.col.b) * e; }
    W.lvl += (levelY(a ? 0.3 + 0.6 * s : 0.3) - W.lvl) * e; W.alpha += ((a ? 0.9 : 0.2) - W.alpha) * e;
    const U = this.liqMat.uniforms, M = this.moteMat.uniforms, R = this.roil;
    U.uLevel.value = M.uLevel.value = W.lvl; U.uTime.value = M.uTime.value = t; U.uStr.value = s; U.uSpin.value = t * 0.08;
    U.uTx.value = a ? 0.22 * s * Math.sin(1.7 * t - 1.0) : 0; U.uTz.value = a ? 0.12 * s * Math.sin(1.3 * t + 1) : 0; U.uAmp.value = a ? 0.006 + 0.045 * s : 0.002;
    U.uCol.value.copy(W.col); U.uAlpha.value = W.alpha;
    U.uRip.value = R.rip; U.uEddy.value = R.eddy; U.uVort.value = R.vort; U.uBoil.value = M.uBoil.value = R.boil; U.uBruise.value = R.bruise; U.uFunnel.value = R.funnel; M.uVort.value = R.vort;
    M.uStr.value = a ? 0.15 + 0.85 * s : 0; M.uPx.value = this.k;
  }

  /** The clock ring: the game hour's hand, the rete turning once a game day, the plates redrawn at a change of phase; dim in a Well. */
  clock(t) {
    const ms = calNow(), hour = (((ms / GAME_HOUR) % 24) + 24) % 24, sky = !this.game.well?.active, ph = phaseAt(ms);
    this.hand.rotation.z = rot(hour); this.rete.rotation.z = rot(hour); this.reteMat.uniforms.uTime.value = t;
    if (ph !== this.phase || sky !== this.sky) {
      this.phase = ph; this.sky = sky; drawPlates(this.plateC, phaseOf(hour), sky, t); this.plateMap.needsUpdate = true;
      const d = sky ? 1 : 0.32; this.dialMat.color.setScalar(d); this.plateMat.color.setScalar(d); this.plateMat.emissiveIntensity = sky ? 0.12 : 0;
      this.reteMat.uniforms.uOp.value = sky ? 0.3 : 0.42; this.halo.visible = sky; this.platesDirty = true;
    }
    const c = filmArr(t * 0.05, this.c3);
    if (sky) this.beadMat.color.setRGB(Math.min(1, c[0] / 255 * 1.3 + 0.15), Math.min(1, c[1] / 255 * 1.3 + 0.15), Math.min(1, c[2] / 255 * 1.3 + 0.15), LIN); else this.beadMat.color.setRGB(0.18, 0.16, 0.2, LIN);
  }

  /** The yoke: the Dissonance Level's studs and its creeping arc; the liquid's roil eased toward the level's. */
  dissonance(dt, t) {
    const k = Math.max(0, Math.min(5, this.game.rejection?.level | 0));
    if (k !== this.level) {
      this.level = k; this.arcT = 0;
      const n = this.studN; this.studOn.geometry.setDrawRange(0, k * n); this.studOn.visible = k > 0; this.metalM.geometry.setDrawRange(0, this.metalN - k * n); // (the unlit studs: the metal's last stretch)
      this.arcGlow.mat.uniforms.uA.value = 0.12 + 0.07 * k; this.arcCore.mat.uniforms.uW.value = 0.35 + 0.07 * k;
      if (!k) { this.arcCore.n = this.arcGlow.n = 0; this.arcCore.done(); this.arcGlow.done(); }
    }
    const e = 1 - Math.exp(-dt * 2); for (const key in this.roil) this.roil[key] += (ROIL[key][k] - this.roil[key]) * e;
    const c = filmArr(t * 0.05 + 0.5, this.c3); this.studOnMat.color.setRGB(c[0] / 255 * 0.6 + 0.4, c[1] / 255 * 0.6 + 0.4, c[2] / 255 * 0.6 + 0.4, LIN);
    this.arcCore.mat.uniforms.uTime.value = this.arcGlow.mat.uniforms.uTime.value = t;
    if (k && (this.arcT -= dt) <= 0) { this.arcT = 1 / 14; this.arc(k); }
  }

  /** The arc's path along the yoke's outer edge, re-struck 14 times a real second (the mock's seed did the same). */
  arc(k) {
    const C = this.arcCore, G = this.arcGlow, R = this.R, ys = this.ys, dpu = PPU * this.dot * this.pr; C.n = G.n = 0;
    const wc = Math.max(0.006 + 0.003 * k, 0.65 / dpu), wg = Math.max(0.03 + 0.012 * k, 2 / dpu), j = 0.02 + 0.022 * k, uE = REACH[k], N = Math.max(5, Math.round(34 * uE));
    const pts = this.pts ??= new Float32Array(40 * 3), at = (u, o) => { const f = Math.min(1, Math.max(0, u)) * YS, i = Math.min(YS - 1, Math.floor(f)), r = f - i; for (let a = 0; a < 3; a++) o[a] = ys[i * 3 + a] + (ys[i * 3 + 3 + a] - ys[i * 3 + a]) * r; return o; };
    const p = this.c3;
    for (let i = 0; i <= N; i++) {
      const u = 0.005 + (uE - 0.01) * i / N; at(Math.min(0.995, u), p); const l = Math.hypot(p[0], p[1]) || 1, end = k === 5 ? Math.min(1, u / 0.05, (1 - u) / 0.05) : Math.min(1, u / 0.05);
      let x = p[0] + p[0] / l * 0.17 * end, y = p[1] + p[1] / l * 0.17 * end, z = p[2] + 0.12 * end;
      if (i > 0 && (i < N || k < 5)) { x += (R() - 0.5) * j; y += (R() - 0.5) * j; z += (R() - 0.5) * j * 0.6; }
      pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] = z;
    }
    for (let i = 0; i < N; i++) { const a = i * 3, b = a + 3, ua = i / N, ub = (i + 1) / N; C.quad(pts[a], pts[a + 1], pts[a + 2], pts[b], pts[b + 1], pts[b + 2], wc / 2, ua, ub); G.quad(pts[a], pts[a + 1], pts[a + 2], pts[b], pts[b + 1], pts[b + 2], wg / 2, ua, ub); }
    const nb = [0, 0, 1, 2, 4, 7][k], bw = Math.max(0.004 + 0.002 * k, 0.55 / dpu), bg = Math.max(0.02 + 0.006 * k, 1.6 / dpu);
    for (let b = 0; b < nb; b++) {
      const kk = 1 + Math.floor(R() * (N - 1)); let x = pts[kk * 3], y = pts[kk * 3 + 1], z = pts[kk * 3 + 2]; const l = Math.hypot(x, y) || 1, nx = x / l, ny = y / l, steps = 3 + Math.floor(R() * 3);
      for (let s = 0; s < steps; s++) { const m = 0.06 + R() * 0.07, x2 = x + nx * m + (R() - 0.5) * 0.12, y2 = y + ny * m + (R() - 0.5) * 0.12, z2 = z + (R() - 0.2) * 0.08; C.quad(x, y, z, x2, y2, z2, bw / 2, 0.3, 0.5); G.quad(x, y, z, x2, y2, z2, bg / 2, 0.3, 0.5); x = x2; y = y2; z = z2; }
    }
    const spark = (i, r) => { const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2], rr = Math.max(r, 1.2 / dpu); C.quad(x - rr, y, z, x + rr, y, z, rr, 0.5, 0.5); G.quad(x - rr * 2, y, z, x + rr * 2, y, z, rr * 2, 0.5, 0.5); };
    if (k < 5) spark(N, 0.03 + 0.008 * k); else { spark(0, 0.07); spark(N, 0.07); }
    C.done(); G.done();
  }

  /** The needle: toward the waypoint from where the camera faces, on a damped spring; spinning slowly with none; drifting in a Well. */
  steer(dt, t) {
    const g = this.game, N = this.nd;
    if ((N.poll -= dt) <= 0) {
      N.poll = 0.1; const wp = g.sight?.waypoint ?? null, id = wp ? `${wp.from}:${wp.id}` : null;
      if (id !== N.id) { if (N.id !== undefined) { N.reel = { from: N.wp?.name || '', to: wp?.name || '', p: 0 }; if (wp) N.pulse = 1; } N.id = id; this.platesDirty = true; }
      N.wp = wp; if (wp) N.pos.copy(wp.pos);
      const P0 = g.player?.pos, d = wp && P0 ? Math.hypot(N.pos.x - P0.x, N.pos.z - P0.z) : -1, dq = d < 0 ? -1 : d < 100 ? Math.round(d) : d < 1000 ? Math.round(d / 10) * 10 : Math.round(d / 100) * 100;
      if (dq !== N.dist) { N.dist = dq; this.platesDirty = true; }
    }
    const well = !!g.well?.active, cam = g.camera;
    if (N.wp && cam) {
      const f = cam.getWorldDirection(this.f3), C = cam.position, dx = N.pos.x - C.x, dz = N.pos.z - C.z;
      let target = Math.atan2(f.x * dz - f.z * dx, f.x * dx + f.z * dz);
      if (well) target += Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1) * 0.25; // (a Well bends the Sight: the needle wanders round the truth)
      const err = Math.atan2(Math.sin(target - N.a), Math.cos(target - N.a)); N.v += (err * 30 - N.v * 6) * dt; N.a += N.v * dt;
    } else { N.v += (0.55 - N.v) * Math.min(1, dt * 2); N.a += N.v * dt; } // (no waypoint: it spins slowly, the compass when you do not know what you want)
    this.needle.rotation.set(0, -N.a, 0); this.needle.updateWorldMatrix(true, false); this.needle.getWorldQuaternion(this.glint.quaternion).invert();
    const c = filmArr(t * 0.07 + 0.3, this.c3); this.needleGold.emissive.setRGB(0.42 + c[0] / 255 * 0.18, 0.30 + c[1] / 255 * 0.18, 0.08 + c[2] / 255 * 0.18, LIN);
    if (N.pulse > 0) { N.pulse = Math.max(0, N.pulse - dt / 0.6); this.pulse.visible = N.pulse > 0; this.pulseMat.opacity = N.pulse; this.pulse.scale.setScalar(1 + (1 - N.pulse) * 2.5); }
    if (N.reel) { N.reel.p = Math.min(1, N.reel.p + dt / 0.45); this.platesDirty = true; if (N.reel.p >= 1) N.reel = null; }
  }

  // ---- the plates' words (2D, on whole dots: the mock's drawing at k render pixels a dot)
  drawWaypointPlate() {
    const Qd = this.wpQuad, N = this.nd, k = this.k, wp = N.wp, reel = N.reel; if (!this.hookAt) return;
    if (!wp && !reel?.from) { Qd.mesh.visible = false; return; } // (none when null: Dovina's ruling)
    const x = this.quadCanvas(Qd, 260, 48), o = Math.max(1, Math.round(k)), fN = this.type(14), fC = this.type(14), up = (s) => String(s || '').toUpperCase();
    const name = up(reel ? reel.to || reel.from : wp.name), from = reel ? up(reel.from) : '';
    const cnt = N.dist < 0 ? '' : N.dist < 1000 ? `${N.dist} m` : `${(N.dist / 1000).toFixed(1)} km`;
    x.font = `600 ${fN}px ${FONT.title}`; const wN = Math.max(x.measureText(name).width, reel ? x.measureText(from).width : 0); x.font = `${fC}px ${COUNT}`; const wC = x.measureText(cnt).width;
    const pad = Math.round(7 * k), w = Math.round(Math.max(wN, wC) + 2 * pad), h = Math.round(fN + fC + 8 * k);
    const ox = w + Math.round(14 * k) + 2, oy = Math.round(4 * k) + 2, X = ox - w - Math.round(14 * k), Y = oy - Math.round(4 * k), hx = ox, hy = oy; // (the hook at (ox, oy))
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, Qd.c.width, Qd.c.height);
    x.fillStyle = 'rgba(176,134,70,.95)'; for (let i = 0; i < 5; i++) { const f = i / 4, px = Math.round(hx + (X + w - hx) * f), py = Math.round(hy + (Y + Math.round(5 * k) - hy) * f); x.fillRect(px - o, py - o, 2 * o, 2 * o); }
    const chamfer = (X0, Y0, w0, h0, c) => { x.beginPath(); x.moveTo(X0 + c, Y0); x.lineTo(X0 + w0, Y0); x.lineTo(X0 + w0, Y0 + h0 - c); x.lineTo(X0 + w0 - c, Y0 + h0); x.lineTo(X0, Y0 + h0); x.lineTo(X0, Y0 + c); x.closePath(); };
    const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, '#d2ad5c'); g.addColorStop(0.5, '#a17a36'); g.addColorStop(1, '#5e4218'); x.fillStyle = g; chamfer(X, Y, w, h, Math.round(4 * k)); x.fill();
    x.strokeStyle = 'rgba(255,236,180,.55)'; x.lineWidth = o; x.beginPath(); x.moveTo(X + Math.round(4 * k), Y + 0.5 * o); x.lineTo(X + w, Y + 0.5 * o); x.stroke();
    x.strokeStyle = 'rgba(40,24,6,.8)'; x.beginPath(); x.moveTo(X + w - 0.5 * o, Y); x.lineTo(X + w - 0.5 * o, Y + h); x.lineTo(X, Y + h - 0.5 * o); x.stroke();
    x.fillStyle = 'rgba(95,160,140,.55)'; x.fillRect(X + w - 3 * o, Y + h - 3 * o, 2 * o, 2 * o); x.fillRect(X + o, Y + h - 2 * o, 2 * o, o);
    const eng = (txt, px, py, font) => { x.font = font; x.fillStyle = 'rgba(255,236,180,.7)'; x.fillText(txt, px, py + o); x.fillStyle = '#2a1806'; x.fillText(txt, px, py); };
    x.textAlign = 'left'; x.textBaseline = 'alphabetic'; const ty = Math.round(Y + pad * 0.4 + fN * 0.95);
    if (reel) {
      x.save(); x.beginPath(); x.rect(X + o, Y + o, w - 2 * o, Math.round(fN * 1.2 + pad * 0.4)); x.clip(); const dy = Math.round(reel.p * fN * 1.3);
      eng(from, Math.round(X + pad), ty - dy, `600 ${fN}px ${FONT.title}`); eng(name, Math.round(X + pad), ty - dy + Math.round(fN * 1.3), `600 ${fN}px ${FONT.title}`); x.restore();
      x.fillStyle = filmRGB(this.t * 0.1, 0.85); x.fillRect(X + o, ty + Math.round(3 * k), w - 2 * o, o); eng('— — —', Math.round(X + pad), Math.round(ty + fC), `${fC}px ${COUNT}`);
    } else { eng(name, Math.round(X + pad), ty, `600 ${fN}px ${FONT.title}`); if (cnt) eng(cnt, Math.round(X + pad), Math.round(ty + fC), `${fC}px ${COUNT}`); }
    this.showQuad(Qd, [X - 1, 0, ox + 2 * o + 1, Y + h + 1], this.hookAt[0], this.hookAt[1], ox, oy);
  }

  /** Type `n` dots tall, in the quad's pixels. On touch it is sized in CSS px, never under 14 (MOBILE.md 6.3: the least type on a
   *  phone): `k` is floored at a whole pixel a dot, which upright (the present's ratio about 0.57) drew the plate near 25 CSS px. */
  type(n) { return this.compact ? Math.ceil(Math.max(14, n * this.dot) * this.pr) : Math.round(n * this.k); }

  drawPlacePlate() {
    const Qd = this.placeQuad, k = this.k; if (!this.placeAt || !this.room) { Qd.mesh.visible = false; return; }
    if (this.compact) { this.drawPlaceLine(); return; }
    const x = this.quadCanvas(Qd, 260, 52), L = look(), R = rng(9), a = this.wx.aspect, o = Math.max(1, Math.round(k)), sky = this.sky !== false;
    const name = this.room.toUpperCase(), sub1 = this.layer ? `${this.layer} · ` : '', sub2 = a ? a[0].toUpperCase() + a.slice(1) : 'fair';
    const fN = Math.round(14 * k), fS = Math.round(14 * k); x.font = `600 ${fN}px ${FONT.title}`; const wN = x.measureText(name).width; x.font = `${fS}px ${FONT.sys}`; const wS = x.measureText(sub1 + sub2).width;
    const pad = Math.round(9 * k), w = Math.round(Math.max(wN, wS) + 2 * pad), h = Math.round(fN + fS + 12 * k), c = Math.max(3, Math.round(5 * k));
    const cx = Math.round(w / 2) + 2, top = Math.round(7 * k) + 2, X = cx - Math.round(w / 2), Y = top; // (the anchor: the top centre, under the cathode)
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, Qd.c.width, Qd.c.height);
    x.fillStyle = 'rgba(154,116,64,.9)'; x.fillRect(X + Math.round(w * 0.3), Y - Math.round(7 * k), o, Math.round(7 * k)); x.fillRect(X + Math.round(w * 0.7), Y - Math.round(7 * k), o, Math.round(7 * k));
    const chamfer = (X0, Y0, w0, h0, c0) => { x.beginPath(); x.moveTo(X0 + c0, Y0); x.lineTo(X0 + w0, Y0); x.lineTo(X0 + w0, Y0 + h0 - c0); x.lineTo(X0 + w0 - c0, Y0 + h0); x.lineTo(X0, Y0 + h0); x.lineTo(X0, Y0 + c0); x.closePath(); };
    chamfer(X, Y, w, h, c); const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, `rgb(${L.top})`); g.addColorStop(1, `rgb(${L.bot})`); x.fillStyle = sky ? g : `rgb(${L.bot})`; x.fill();
    x.save(); x.clip(); for (let i = 0; i < w * h / 30; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : `rgba(${L.hiR},.1)`; x.fillRect(X + R() * w | 0, Y + R() * h | 0, o, o); } x.restore();
    x.strokeStyle = `rgba(${L.midR},.55)`; x.lineWidth = o; chamfer(X + 2.5 * o, Y + 2.5 * o, w - 5 * o, h - 5 * o, c - o); x.stroke();
    const lg = x.createLinearGradient(X, Y, X + w, Y + h); [0, 0.33, 0.66, 1].forEach((p, i) => lg.addColorStop(p, filmRGB(i / 4 + this.t * 0.05, 1))); x.strokeStyle = lg; chamfer(X + 0.5 * o, Y + 0.5 * o, w - o, h - o, c); x.stroke();
    x.fillStyle = `rgba(${L.hiR},.55)`; x.beginPath(); x.moveTo(X + w - c - o, Y + o); x.lineTo(X + w - o, Y + o); x.lineTo(X + w - o, Y + c + o); x.closePath(); x.fill();
    x.fillStyle = filmRGB(0.62, 1); x.fillRect(X + 3 * o, Y + h - 5 * o, 2 * o, 2 * o);
    x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.font = `600 ${fN}px ${FONT.title}`; const ty = Y + Math.round(pad * 0.55 + fN * 0.95);
    x.fillStyle = L.lo; x.fillText(name, Math.round(cx - wN / 2), ty + o); x.fillStyle = sky ? L.hi : L.mid; x.fillText(name, Math.round(cx - wN / 2), ty);
    x.font = `${fS}px ${FONT.sys}`; const sy = ty + Math.round(fS * 1.15), sx0 = Math.round(cx - wS / 2), w1 = x.measureText(sub1).width;
    x.fillStyle = L.lo; x.fillText(sub1, sx0, sy + o); x.fillStyle = L.mid; x.fillText(sub1, sx0, sy);
    x.fillStyle = L.lo; x.fillText(sub2, sx0 + w1, sy + o); x.fillStyle = a === 'dread' ? '#7fae8a' : a ? `#${(COLOR[a] ?? 0xcfe8f0).toString(16).padStart(6, '0')}` : '#cfe8f0'; x.fillText(sub2, Math.round(sx0 + w1), sy);
    this.showQuad(Qd, [X - 1, Y - Math.round(7 * k) - 1, X + w + 1, Y + h + 1], this.placeAt[0], this.placeAt[1], cx, top);
  }

  /** The place plate's icon line (on touch): one line, the weather's pip (its colour, a diamond; fair a clear one) and the room. */
  drawPlaceLine() {
    const Qd = this.placeQuad, k = this.k, u = Math.max(0.5, this.pr * this.dot), L = look(), a = this.wx.aspect, o = 1, sky = this.sky !== false; // (u: the quad's pixels a dot, unrounded)
    const name = this.room.toUpperCase(), fN = this.type(14);
    let x = this.quadCanvas(Qd, 260, 52); x.font = `600 ${fN}px ${FONT.title}`; const wN = x.measureText(name).width;
    const pip = Math.round(fN * 0.62), pad = Math.max(3, Math.round(7 * u)), gap = Math.max(2, Math.round(5 * u)), w = Math.round(pip + gap + wN + 2 * pad), h = Math.round(fN * 1.5), c = Math.max(3, Math.round(4 * u));
    if (w + 4 > Qd.c.width || h + 4 > Qd.c.height) { Qd.c = null; x = this.quadCanvas(Qd, Math.ceil((w + 8) / k), Math.ceil((h + 8) / k)); x.font = `600 ${fN}px ${FONT.title}`; } // (the floor's type can outgrow the desk's canvas)
    const X = 2, Y = 2, cx = X + Math.round(w / 2); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, Qd.c.width, Qd.c.height);
    const chamfer = (X0, Y0, w0, h0, c0) => { x.beginPath(); x.moveTo(X0 + c0, Y0); x.lineTo(X0 + w0, Y0); x.lineTo(X0 + w0, Y0 + h0 - c0); x.lineTo(X0 + w0 - c0, Y0 + h0); x.lineTo(X0, Y0 + h0); x.lineTo(X0, Y0 + c0); x.closePath(); };
    chamfer(X, Y, w, h, c); const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, `rgb(${L.top})`); g.addColorStop(1, `rgb(${L.bot})`); x.fillStyle = sky ? g : `rgb(${L.bot})`; x.fill();
    const lg = x.createLinearGradient(X, Y, X + w, Y + h); [0, 0.33, 0.66, 1].forEach((p, i) => lg.addColorStop(p, filmRGB(i / 4 + this.t * 0.05, 1))); x.strokeStyle = lg; x.lineWidth = o; chamfer(X + 0.5 * o, Y + 0.5 * o, w - o, h - o, c); x.stroke();
    const px = X + pad + pip / 2, py = Y + h / 2, tone = a === 'dread' ? '#7fae8a' : a ? `#${(COLOR[a] ?? 0xcfe8f0).toString(16).padStart(6, '0')}` : '#cfe8f0';
    x.beginPath(); x.moveTo(px, py - pip / 2); x.lineTo(px + pip / 2, py); x.lineTo(px, py + pip / 2); x.lineTo(px - pip / 2, py); x.closePath();
    if (a) { x.fillStyle = tone; x.fill(); } else { x.strokeStyle = tone; x.lineWidth = Math.max(1, o * 1.5); x.stroke(); }
    x.font = `600 ${fN}px ${FONT.title}`; x.textBaseline = 'middle'; x.textAlign = 'left'; const tx = Math.round(X + pad + pip + gap), ty = Math.round(py + o);
    x.fillStyle = L.lo; x.fillText(name, tx, ty + o); x.fillStyle = sky ? L.hi : L.mid; x.fillText(name, tx, ty);
    this.showQuad(Qd, [X - 1, Y - 1, X + w + 1, Y + h + 1], this.placeAt[0], this.placeAt[1], cx, Y);
  }
}
