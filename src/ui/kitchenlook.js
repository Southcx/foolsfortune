// ---------------------------------------------------------------------------------------
// THE COOKING STATION'S WINDOW, DRESSED (plain name; Dovina's window world/garden/kitchen.js, its `ck-*` classes and its canvas): the
// hearth's page in the Clay dress, and its drawing painted as the food itself, so the tell is the interface (SPIRIT-COOKING.md 4: no
// number until the dish is served). Only looks: every step, button, word and rule stay the window's; its three drawings are laid over
// the placeholder's (Kitchen.prototype.drawDough, drawProof, drawLoaf) and read the same state.
//   THE PAGE      the buttons as glazed clay tiles (KNEAD, the oven's big ones in ember), the tell in italic on a slip of washi, the
//                 canvas framed as a hinoki worktop under a window's light
//   THE KNEAD     the dough on a floured board: shaggy and lumpy, flour clinging, while gluten is short; smoothing to a satin dome with a
//                 sheen as it builds; tight and torn past it. The beat as a pulse of the hearth's ember in the corner, swelling on
//                 the beat, flashing on a hit. The windowpane: a stretched piece held up to the window between two thumbs, the light
//                 coming through it once thin enough, torn ragged when not
//   THE PROOF     a celadon bowl under a linen cloth folded back, the dough's dome rising in it (doubling at the heart), bubbles
//                 on its skin past it, sunk and wrinkled when it sighs; the poke's dent, springing back fast, slowly, or staying
//   THE BAKE      the oven's mouth (a brick arch round the fire's glow), the loaf on the peel inside: pale, golden, the deep brown
//                 of a hollow knock, scorched at its edges, black; its score opening into an ear once steamed, steam rolling off
//                 it early; served, the loaf on a cooling rack by the window
//
// Prior art: Cooking Mama's food drawn big and plain, Ghibli's food close-ups (Howl's breakfast, Kiki's bakery: the steam, the shine),
// the windowpane and poke tests and the ear of a scored loaf (Hamelman 2004, Forkish 2012), a Japanese kitchen's hinoki and celadon.
//
//   installKitchenLook()   (once, at boot: the style and the drawings; nothing is drawn until the window opens)   KITCHEN_LOOK
// ---------------------------------------------------------------------------------------
import { Kitchen } from '../world/garden/kitchen.js';
import { MOVES } from '../progress/cooking/moves.js';
import { INGREDIENTS } from '../progress/cooking/flavour.js';
import { COLOR } from '../progress/weather.js';

/** The colours (sRGB): the board, the dough's flour and its glaze, the celadon bowl, the oven's brick and fire, the crust's ramp. */
export const KITCHEN_LOOK = {
  board: ['#c79a62', '#a87a46'], grain: 'rgba(90,50,20,.18)', window: 'rgba(255,240,200,.16)',
  dough: '#f2e4c8', doughShade: '#d9c39c', flour: 'rgba(255,255,248,.85)',
  celadon: ['#a9cdb9', '#6e9e8a'], linen: '#efe8d8', linenShade: '#d4c8ae',
  brick: ['#8a3e26', '#5c2616'], fire: ['#ffd36a', '#ff7a30', '#6a1808'],
  crust: [[0, '#efe0c4'], [0.4, '#d8a860'], [0.62, '#a8622a'], [0.85, '#5a2a10'], [1, '#140a06']],
  ember: '#ffb04a', gold: '#ffd36a',
};
const K = KITCHEN_LOOK;

const CSS = `
body .ck{gap:10px}
body .ck .ck-canvas{background:#2a1810;border:0;border-radius:6px;box-shadow:0 0 0 2px #2a140c,0 0 0 4px rgba(212,165,60,.5),inset 0 0 20px rgba(0,0,0,.5),0 10px 22px rgba(0,0,0,.5)}
body .ck .ck-tell{font:italic 15px/1.35 Georgia,serif;color:#3a2416;background:linear-gradient(180deg,#f3ead6,#e4d6b8);padding:8px 12px;border-radius:3px;
  box-shadow:inset 0 0 0 1px rgba(90,60,30,.35),0 3px 8px rgba(0,0,0,.35);min-height:2.7em}
body .ck .ck-tell:empty{display:none}
body .ck .ck-line{color:#e6cfaa;font:13px/1.35 Georgia,serif}
body .ck .ck-b{border:0;border-radius:6px;font:700 12px/1.1 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:#2a140c;
  background:linear-gradient(180deg,#e9d6bc,#c9a882);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -3px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 3px 6px rgba(0,0,0,.4)}
body .ck .ck-b:hover{filter:brightness(1.08)}
body .ck .ck-b:active{transform:translateY(1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -1px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c}
body .ck .ck-b.on{background:linear-gradient(180deg,#ffe6a8,${K.gold});box-shadow:inset 0 1px 0 #fff8,0 0 0 1px #2a140c,0 0 10px rgba(255,211,106,.5)}
body .ck .ck-b.big{color:#fff3e0;background:linear-gradient(180deg,#d8763a,#9a3e1e);box-shadow:inset 0 1px 0 rgba(255,220,180,.5),inset 0 -3px 0 rgba(0,0,0,.3),0 0 0 1px #2a140c,0 0 12px rgba(255,140,60,.35)}
body .ck .ck-done{font:700 22px/1.2 Georgia,serif;color:${K.gold};letter-spacing:.08em;text-shadow:0 2px 0 #2a140c,0 0 12px rgba(255,211,106,.4)}
`;

// ------------------------------------------------------------------ painting helpers
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, k) { const A = rgb(a), B = rgb(b), t = clamp(k); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
function ramp(stops, v) {
  for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (v - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops.at(-1)[1];
}
/** A seeded scatter (the same specks every frame: no shimmer). */
const R = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const feelingHex = (f) => `#${(COLOR[f] ?? 0xefe0c4).toString(16).padStart(6, '0')}`;

/** The worktop under the window: hinoki planks, their grain, the window's light falling across. */
function worktop(x, oven = false) {
  const g = x.createLinearGradient(0, 0, 0, 234); g.addColorStop(0, oven ? '#1c0f0a' : '#3a2416'); g.addColorStop(0.62, oven ? '#2a140c' : '#4a2e1c'); g.addColorStop(0.63, K.board[0]); g.addColorStop(1, K.board[1]);
  x.fillStyle = g; x.fillRect(0, 0, 560, 234);
  if (!oven) { // (the window: a paper shoji's light on the wall)
    x.fillStyle = 'rgba(255,236,200,.08)'; x.fillRect(360, 14, 170, 110);
    x.strokeStyle = 'rgba(30,16,8,.5)'; x.lineWidth = 3; for (let i = 0; i <= 3; i++) { x.beginPath(); x.moveTo(360 + i * 56.6, 14); x.lineTo(360 + i * 56.6, 124); x.stroke(); }
    for (let j = 0; j <= 2; j++) { x.beginPath(); x.moveTo(360, 14 + j * 55); x.lineTo(530, 14 + j * 55); x.stroke(); }
    const L = x.createLinearGradient(360, 0, 200, 234); L.addColorStop(0, K.window); L.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = L; x.beginPath(); x.moveTo(360, 124); x.lineTo(530, 124); x.lineTo(420, 234); x.lineTo(120, 234); x.closePath(); x.fill();
  }
  x.strokeStyle = K.grain; x.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const y = 150 + i * 9.5; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= 560; px += 40) x.lineTo(px, y + Math.sin(px * 0.02 + i) * 1.6); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 146, 560, 2);
}
/** A dough's dome at (cx, base) of half-width w, height h: lumps by `rough`, its sheen by `satin`, tinted by an add-in's feeling. */
function dome(x, cx, base, w, h, { rough = 0, satin = 0, tint = null, torn = 0, t = 0 } = {}) {
  const body = tint ? mix(K.dough, feelingHex(tint), 0.2) : K.dough, shade = tint ? mix(K.doughShade, feelingHex(tint), 0.25) : K.doughShade;
  x.save();
  x.beginPath(); x.moveTo(cx - w, base);
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 - i / 40), j = rough * (6 * Math.sin(i * 2.7 + 1) + 4 * Math.sin(i * 5.3)); x.lineTo(cx + Math.cos(a) * (w + j * 0.5), base - Math.sin(a) * (h + j)); }
  x.closePath();
  const g = x.createRadialGradient(cx - w * 0.3, base - h * 0.75, 4, cx, base - h * 0.3, w * 1.1); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.45, body); g.addColorStop(1, shade);
  x.fillStyle = g; x.fill(); x.clip();
  if (rough > 0.05) for (let i = 0; i < 70 * rough; i++) { x.fillStyle = K.flour; x.globalAlpha = 0.5 * rough; x.beginPath(); x.arc(cx - w + R(i) * 2 * w, base - R(i + 9) * h, 1 + R(i + 3) * 3, 0, 7); x.fill(); } // (flour clinging)
  if (rough > 0.2) { x.globalAlpha = rough * 0.6; x.strokeStyle = shade; x.lineWidth = 2; for (let i = 0; i < 6; i++) { const px = cx - w * 0.7 + R(i + 40) * w * 1.4, py = base - h * (0.2 + R(i + 50) * 0.6); x.beginPath(); x.arc(px, py, 8 + R(i) * 10, 0.3, 2.4); x.stroke(); } } // (shaggy folds)
  if (satin > 0) { x.globalAlpha = satin * 0.55; const s = x.createRadialGradient(cx - w * 0.25, base - h * 0.78, 2, cx - w * 0.25, base - h * 0.78, w * 0.45); s.addColorStop(0, '#ffffff'); s.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = s; x.fillRect(cx - w, base - h * 1.4, w * 2, h * 1.4); } // (the sheen of a dough come together)
  if (torn > 0) { x.globalAlpha = torn; x.strokeStyle = shade; x.lineWidth = 2.5; for (let i = 0; i < 5; i++) { const px = cx - w * 0.5 + R(i + 70) * w; x.beginPath(); x.moveTo(px, base - h * 0.9); x.lineTo(px + 6, base - h * 0.5); x.lineTo(px - 3, base - h * 0.2); x.stroke(); } } // (tight: torn where it fights back)
  x.restore();
}

// ------------------------------------------------------------------ the three drawings, over the placeholder's
function drawDough(v, beat) {
  const x = this.ctx(); if (!x) return;
  const S = this.st || {}, M = MOVES.knead, tint = this.addin || S.addin, over = v >= M.tells[3][0];
  worktop(x);
  x.fillStyle = 'rgba(255,255,248,.35)'; for (let i = 0; i < 120; i++) { x.globalAlpha = 0.35 * R(i + 200); x.fillRect(150 + R(i) * 260, 175 + R(i + 1) * 45, 2, 1); } x.globalAlpha = 1; // (the floured board)
  const f = S.flash || 0, squash = f * 0.12;
  dome(x, 280, 192, 112 * (1 + squash), 62 * (1 - squash), { rough: clamp(1 - v / 0.62), satin: clamp((v - 0.45) / 0.35) * (over ? 0.4 : 1), tint, torn: over ? clamp((v - M.tells[3][0]) / 0.1) : 0 });
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(280, 194, 118, 8, 0, 0, 7); x.fill();
  if (beat) { // (the beat: the hearth's ember in the corner, swelling on the beat, flared on a hit)
    const ph = ((S.beatT || 0) % M.beat) / M.beat, on = Math.pow(1 - Math.min(ph, 1 - ph) * 2, 3);
    const r = 12 + 10 * on + 6 * f, g = x.createRadialGradient(56, 52, 1, 56, 52, r * 2);
    g.addColorStop(0, '#fff6d8'); g.addColorStop(0.3, K.ember); g.addColorStop(1, 'rgba(255,90,30,0)'); x.fillStyle = g; x.beginPath(); x.arc(56, 52, r * 2, 0, 7); x.fill();
    x.strokeStyle = `rgba(255,211,106,${0.25 + 0.6 * f})`; x.lineWidth = 2; x.beginPath(); x.arc(56, 52, 30 + 14 * ph, 0, 7); x.stroke();
  }
  if (this.stretched > 0) { // (the windowpane: a piece stretched between two thumbs and held up to the window's light)
    const ok = v >= M.tells[2][0] && !over, thin = clamp((v - 0.3) / 0.4), k = clamp(this.stretched / 0.3);
    x.save(); x.globalAlpha = k;
    x.fillStyle = 'rgba(255,240,200,.25)'; x.beginPath(); x.arc(445, 72, 70, 0, 7); x.fill();
    x.beginPath(); x.moveTo(390, 70); for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2; x.lineTo(445 + Math.cos(a) * (52 + 3 * Math.sin(i * 3)), 72 + Math.sin(a) * (40 + 3 * Math.cos(i * 2))); } x.closePath();
    x.fillStyle = ok ? 'rgba(255,246,220,.55)' : `rgba(236,220,190,${0.95 - thin * 0.3})`; x.fill();
    if (ok) { const L = x.createRadialGradient(445, 72, 2, 445, 72, 48); L.addColorStop(0, 'rgba(255,255,240,.9)'); L.addColorStop(1, 'rgba(255,255,240,0)'); x.fillStyle = L; x.fill(); } // (the light coming through)
    if (!ok) { x.strokeStyle = '#2a1810'; x.lineWidth = 3; x.beginPath(); x.moveTo(425, 50); x.lineTo(445, 74); x.lineTo(432, 98); x.moveTo(445, 74); x.lineTo(468, 66); x.stroke(); } // (it tears)
    x.fillStyle = '#d9a37a'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(445 + s * 58, 76, 14, 20, s * 0.4, 0, 7); x.fill(); } // (the thumbs)
    x.restore();
  }
}

function drawProof(v) {
  const x = this.ctx(); if (!x) return;
  const S = this.st || {}, tint = this.addin || S.addin || this.C?.proofing?.addin;
  worktop(x);
  const rise = clamp(v / 0.5), sink = v > 0.85 ? clamp((v - 0.85) / 0.15) : 0, h = 26 + rise * 56 - sink * 40 - (v > 0.62 ? (v - 0.62) * 30 : 0);
  // the bowl's back rim, the dough, the bowl's front
  x.fillStyle = K.celadon[1]; x.beginPath(); x.ellipse(280, 128, 132, 18, 0, Math.PI, 0); x.fill();
  dome(x, 280, 132, 120, Math.max(10, h), { satin: 0.5 - sink * 0.4, tint, rough: sink * 0.6 });
  if (v > 0.55) { x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 10 * clamp((v - 0.55) / 0.3); i++) { x.beginPath(); x.arc(200 + R(i + 300) * 160, 132 - h * (0.3 + R(i + 310) * 0.5), 2 + R(i) * 3, 0, 7); x.fill(); } } // (bubbles on its skin)
  const g = x.createLinearGradient(148, 0, 412, 0); g.addColorStop(0, K.celadon[1]); g.addColorStop(0.35, K.celadon[0]); g.addColorStop(1, K.celadon[1]);
  x.fillStyle = g; x.beginPath(); x.moveTo(148, 128); x.quadraticCurveTo(160, 205, 280, 208); x.quadraticCurveTo(400, 205, 412, 128); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(40,70,60,.35)'; x.lineWidth = 1; for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(165 + i * 17, 140); x.lineTo(160 + i * 17 + R(i) * 8, 190); x.stroke(); } // (the glaze's crackle)
  x.fillStyle = '#c9a882'; x.fillRect(240, 205, 80, 8); // (the foot)
  // the linen folded back over the bowl's right
  x.fillStyle = K.linen; x.beginPath(); x.moveTo(380, 120); x.quadraticCurveTo(470, 100, 520, 150); x.lineTo(500, 200); x.quadraticCurveTo(450, 170, 400, 160); x.closePath(); x.fill();
  x.strokeStyle = K.linenShade; x.lineWidth = 2; x.beginPath(); x.moveTo(400, 135); x.quadraticCurveTo(460, 125, 505, 165); x.stroke();
  if (this.poked > 0) { // (the poke: the dent springs back fast, slowly, or stays)
    const back = v < 0.38 ? 1 : v < 0.62 ? 0.5 : 0, k = clamp((1.2 - this.poked) * 2), r = 9 * (1 - back * k), cy = 132 - h * 0.62;
    x.fillStyle = 'rgba(120,90,60,.45)'; x.beginPath(); x.ellipse(282, cy, Math.max(1, r), Math.max(1, r * 0.7), 0, 0, 7); x.fill();
    if (this.poked > 0.9) { x.fillStyle = '#d9a37a'; x.beginPath(); x.ellipse(284, cy - 20, 9, 22, -0.2, 0, 7); x.fill(); } // (the finger, a moment)
  }
}

function drawLoaf(v, steamed, still = false) {
  const x = this.ctx(); if (!x) return;
  const c = ramp(K.crust, v), rise = steamed ? 66 : 50, ear = steamed ? 1 : 0.35;
  if (!still) { // (the oven's mouth: a brick arch round the fire's glow, the loaf on the peel inside)
    worktop(x, true);
    const fl = 0.85 + 0.15 * Math.sin(performance.now() / 120);
    const g = x.createRadialGradient(280, 200, 10, 280, 160, 260); g.addColorStop(0, K.fire[0]); g.addColorStop(0.35, K.fire[1]); g.addColorStop(1, K.fire[2]);
    x.globalAlpha = 0.55 * fl; x.fillStyle = g; x.beginPath(); x.moveTo(90, 222); x.lineTo(90, 110); x.arc(280, 110, 190, Math.PI, 0); x.lineTo(470, 222); x.closePath(); x.fill(); x.globalAlpha = 1;
    x.strokeStyle = K.brick[0]; x.lineWidth = 22; x.beginPath(); x.moveTo(80, 234); x.lineTo(80, 110); x.arc(280, 110, 200, Math.PI, 0); x.lineTo(480, 234); x.stroke();
    x.strokeStyle = K.brick[1]; x.lineWidth = 2; for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; x.beginPath(); x.moveTo(280 + Math.cos(a) * 189, 110 + Math.sin(a) * 189); x.lineTo(280 + Math.cos(a) * 211, 110 + Math.sin(a) * 211); x.stroke(); }
    x.fillStyle = '#7a4a2a'; x.fillRect(120, 200, 320, 12); // (the peel)
  } else { // (out: on the cooling rack by the window)
    worktop(x);
    x.strokeStyle = '#3a3438'; x.lineWidth = 2; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(130 + i * 27, 196); x.lineTo(130 + i * 27, 204); x.stroke(); } x.beginPath(); x.moveTo(120, 196); x.lineTo(440, 196); x.stroke();
  }
  // the loaf: a boule, its crust by the ramp, darker at the base and edges as it goes, the score opening into an ear
  x.save(); x.beginPath(); x.ellipse(280, 196, 128, rise, 0, Math.PI, 0); x.closePath();
  const g = x.createRadialGradient(260, 196 - rise * 0.8, 6, 280, 196 - rise * 0.3, 150); g.addColorStop(0, ramp(K.crust, Math.max(0, v - 0.15))); g.addColorStop(0.55, c); g.addColorStop(1, ramp(K.crust, Math.min(1, v + 0.2)));
  x.fillStyle = g; x.fill(); x.clip();
  if (steamed && v > 0.3) { x.fillStyle = 'rgba(255,230,190,.35)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(170 + R(i + 400) * 220, 196 - R(i + 410) * rise, 1.5, 0, 7); x.fill(); } } // (the blisters of a steamed crust)
  x.restore();
  const sx0 = 215, sx1 = 345, sy = 196 - rise * 0.78;
  x.fillStyle = mix('#f2e4c8', '#c88a40', clamp(v * 1.2)); x.beginPath(); x.moveTo(sx0, sy + 4); x.quadraticCurveTo(280, sy - 10 - ear * 10, sx1, sy - 2); x.quadraticCurveTo(280, sy + 4 + ear * 8, sx0, sy + 4); x.fill(); // (the score's open crumb)
  x.strokeStyle = ramp(K.crust, Math.min(1, v + 0.25)); x.lineWidth = 3; x.beginPath(); x.moveTo(sx0, sy + 4); x.quadraticCurveTo(280, sy - 10 - ear * 12, sx1, sy - 2); x.stroke(); // (its ear)
  const steam = still ? 0.6 : steamed ? clamp(1 - v / 0.4) : 0.25; // (steam: rolling off it early in a steamed oven, curling off it out on the rack)
  if (steam > 0) { const t = performance.now() / 1000; x.strokeStyle = `rgba(255,255,255,${0.22 * steam})`; x.lineWidth = 6; x.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const bx = 220 + i * 40, y0 = 196 - rise - 6; x.beginPath(); x.moveTo(bx, y0); for (let k = 1; k <= 8; k++) x.lineTo(bx + Math.sin(t * 2 + i + k * 0.8) * 8, y0 - k * 9 - ((t * 20 + i * 13) % 12)); x.stroke(); } x.lineCap = 'butt'; }
  if (v > 0.85 && !still) { x.fillStyle = `rgba(60,50,50,${clamp((v - 0.85) / 0.15) * 0.5})`; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(250 + i * 15 + Math.sin(performance.now() / 300 + i) * 6, 110 - i * 12, 14 + i * 3, 0, 7); x.fill(); } } // (scorch smoke)
}

let installed = false;
export function installKitchenLook() {
  if (installed) return; installed = true;
  const s = document.createElement('style'); s.id = 'kitchen-look'; s.textContent = CSS; document.head.appendChild(s);
  Object.assign(Kitchen.prototype, { drawDough, drawProof, drawLoaf });
}
