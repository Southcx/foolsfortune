// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD: its marks' atlas (part of vfx/sondelassguard.js). Every small mark the guard wears, drawn once at four texture
// pixels a dot (a line of the 480-line present) into one canvas, in the UI icons' hand: a light shape keylined dark, read by its shape
// before its colour. A mark drawn white takes its colour from the quad that wears it (the batch's tint: a notch's state, a window's film,
// a lure's feeling); a mark that is its own colour (a feeling's bead, the dark seat, the catch's pot) is drawn in it. Drawn once, never
// redrawn; the quads only choose a cell.
//
//   the beads       each feeling's paint motif's SILHOUETTE (vfx/paintmotifs.js read as shapes, the mock's featPath): Wonder a frost
//                   star, Mirth three dots, Desire a ripple fan, Fury a crack bolt, Gall a curd, Grief a tear, Dread a crescent; and an
//                   outline of each for the chosen one's film; the dark seat, a plain socket with a brass lip (a known unknown)
//   the notches     what a blow does to a body (the string row's pips, ui/cutlassstringrow.js): stagger a diamond, knock a big diamond
//                   with a dark core, launch a double chevron, guard break a cracked square; and each filled plain, for its glow
//   the windows     the guard's three openwork windows: a blade slit (the cutlass), a ring of beads (the rod), a hook claw (the hook),
//                   pale and keylined; and each filled plain, for the film when its form is in hand
//   the lures       the lure tied on, by its shape (lures.js): a ball (the clay bob, the black eye, the tin chime), a star (the star
//                   fly), a bent spoon (the ember spoon), a tear (the tear bead); filled grey so the feeling tints it
//   the rest        the pawl's tooth, an echo's pointer, a soft dot (glows), a feathered bar (every line), a disc, a glint star, a pot
//
// Prior art: the mock it is ported from (Calissa's board v9, r9-sondelass: bead, notch, winPath, lurePath, featPath), the sprite
// sheet and texture atlas (one texture, many marks: the 8- and 16-bit consoles' character ROM), the UI icons' hand (ui/icons/hand.js).
//
//   const A = guardAtlas()   A.tex (a THREE.CanvasTexture)   A.cell(name) -> [u0, v0, u1, v1]   CELL (dots a cell spans)
//   names: bead.<feeling>  beadLine.<feeling>  seat  notch.<effect>  notchFill.<effect>  win.<0..2>  winFill.<0..2>
//          lure.<ball|star|spoon|tear>  pawl  echo  dot  bar  disc  star  pot
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';

export const CELL = 20; // (dots a cell spans; a mark is drawn centred in its cell)
const K = 4, PX = CELL * K, COLS = 8, TAU = Math.PI * 2, D = Math.PI / 180;
const KEY = '#0b0710';
export const FEELINGS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread']; // (display order: progress/weather.js DISPLAY_ORDER)
export const EFFECTS = ['stagger', 'knock', 'launch', 'guardBreak'];

const hexA = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixH = (a, b, t) => { const A = hexA(a), B = hexA(b); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; };
const shade = (h, f) => (f > 0 ? mixH(h, '#ffffff', f) : mixH(h, '#000000', -f));
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

/** A feeling's bead as its paint motif's silhouette, radius r (dots). */
function featPath(x, id, r) {
  x.beginPath();
  if (id === 'wonder') { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, q = i % 2 ? r * 0.42 : r * 1.12; i ? x.lineTo(Math.cos(a) * q, Math.sin(a) * q) : x.moveTo(Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); }
  else if (id === 'mirth') { for (const a of [-90, 30, 150]) { const cx = Math.cos(a * D) * r * 0.52, cy = Math.sin(a * D) * r * 0.52; x.moveTo(cx + r * 0.52, cy); x.arc(cx, cy, r * 0.52, 0, TAU); } }
  else if (id === 'desire') { const cy = r * 0.7; x.moveTo(0, cy); x.arc(0, cy, r * 1.6, -Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8); x.closePath(); }
  else if (id === 'fury') { [[-0.2, -1.1], [0.62, -1.1], [0.18, -0.22], [0.68, -0.22], [-0.38, 1.12], [-0.06, 0.16], [-0.6, 0.16]].forEach(([u, v], i) => (i ? x.lineTo(u * r, v * r) : x.moveTo(u * r, v * r))); x.closePath(); }
  else if (id === 'gall') { const s = r * 0.84, c = r * 0.32; x.moveTo(-s + c, -s); x.arcTo(s, -s, s, s, c); x.arcTo(s, s, -s, s, c); x.arcTo(-s, s, -s, -s, c); x.arcTo(-s, -s, s, -s, c); x.closePath(); }
  else if (id === 'grief') { x.moveTo(0, -r * 1.15); x.bezierCurveTo(r * 0.25, -r * 0.6, r * 0.86, -r * 0.05, r * 0.86, r * 0.3); x.arc(0, r * 0.3, r * 0.86, 0, Math.PI); x.bezierCurveTo(-r * 0.86, -r * 0.05, -r * 0.25, -r * 0.6, 0, -r * 1.15); x.closePath(); }
  else if (id === 'dread') { x.arc(0, 0, r, 0.896, TAU - 0.896); x.arc(0.45 * r, 0, 0.8 * r, -1.35, 1.35, true); x.closePath(); }
  else x.arc(0, 0, r, 0, TAU);
}
/** A notch's shape (sz: its half size, dots). */
function notchPath(x, eff, sz) {
  x.beginPath();
  if (eff === 'stagger' || eff === 'knock') { x.moveTo(0, -sz); x.lineTo(sz, 0); x.lineTo(0, sz); x.lineTo(-sz, 0); x.closePath(); }
  else if (eff === 'guardBreak') x.rect(-sz * 0.9, -sz * 0.9, sz * 1.8, sz * 1.8);
  else for (const o of [-0.55, 0.45]) { x.moveTo(-sz, o * sz + sz * 0.5); x.lineTo(0, o * sz - sz * 0.25); x.lineTo(sz, o * sz + sz * 0.5); x.lineTo(sz, o * sz + sz * 0.95); x.lineTo(0, o * sz + sz * 0.2); x.lineTo(-sz, o * sz + sz * 0.95); x.closePath(); }
}
export const NOTCH_SZ = { stagger: 2.6, knock: 3.5, launch: 3.1, guardBreak: 2.8 }; // (each drawn at its own size; a quad of CELL dots shows it at 1x)
/** A window's shape: the blade slit, the ring of beads, the hook claw (about 8 dots). */
function winPath(x, j) {
  x.beginPath();
  if (j === 0) { x.moveTo(-3.9, 0.3); x.quadraticCurveTo(0, -2.6, 3.9, -0.4); x.quadraticCurveTo(0, 0.7, -3.9, 0.3); x.closePath(); }
  else if (j === 1) for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6, cx = Math.cos(a) * 2.4, cy = Math.sin(a) * 2.4; x.moveTo(cx + 0.95, cy); x.arc(cx, cy, 0.95, 0, TAU); }
  else { x.translate(-1.2, 0); x.moveTo(-0.6, -3.4); x.lineTo(0.6, -3.4); x.lineTo(0.6, 1); x.quadraticCurveTo(0.6, 2, 1.6, 2); x.quadraticCurveTo(2.3, 2, 2.4, 0.6); x.lineTo(2.7, -0.9); x.lineTo(3.4, 0.6); x.quadraticCurveTo(3.4, 3.4, 1.6, 3.4); x.quadraticCurveTo(-0.6, 3.4, -0.6, 1); x.closePath(); }
}
/** The lure tied on, by its shape (r: dots). */
function lurePath(x, kind, r) {
  x.beginPath();
  if (kind === 'star') { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, q = i % 2 ? r * 0.45 : r * 1.2; i ? x.lineTo(Math.cos(a) * q, Math.sin(a) * q) : x.moveTo(Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); }
  else if (kind === 'spoon') { x.moveTo(0, -r * 1.2); x.bezierCurveTo(r * 0.95, -r * 1.1, r * 1.0, r * 0.5, r * 0.15, r * 1.15); x.bezierCurveTo(-r * 0.3, r * 1.3, -r * 0.95, r * 0.6, -r * 0.75, -r * 0.2); x.bezierCurveTo(-r * 0.6, -r * 0.85, -r * 0.35, -r * 1.2, 0, -r * 1.2); x.closePath(); }
  else if (kind === 'tear') featPath(x, 'grief', r);
  else x.arc(0, 0, r, 0, TAU);
}

let ATLAS = null;
/** The one atlas (built on first ask). */
export function guardAtlas() {
  if (ATLAS) return ATLAS;
  const names = [];
  FEELINGS.forEach((f) => names.push(`bead.${f}`, `beadLine.${f}`));
  names.push('seat');
  EFFECTS.forEach((e) => names.push(`notch.${e}`, `notchFill.${e}`));
  for (let j = 0; j < 3; j++) names.push(`win.${j}`, `winFill.${j}`);
  names.push('lure.ball', 'lure.star', 'lure.spoon', 'lure.tear', 'pawl', 'echo', 'dot', 'bar', 'disc', 'star', 'pot');
  const rows = Math.ceil(names.length / COLS), c = document.createElement('canvas');
  c.width = COLS * PX; c.height = rows * PX;
  const x = c.getContext('2d'), cells = new Map();
  names.forEach((n, i) => {
    const cx = (i % COLS) * PX, cy = Math.floor(i / COLS) * PX;
    cells.set(n, [cx / c.width, 1 - (cy + PX) / c.height, (cx + PX) / c.width, 1 - cy / c.height]);
    x.save(); x.beginPath(); x.rect(cx, cy, PX, PX); x.clip(); x.translate(cx + PX / 2, cy + PX / 2); x.scale(K, K); x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x, n);
    x.restore();
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 1;
  ATLAS = { tex, canvas: c, cell: (n) => cells.get(n) || cells.get('dot') };
  return ATLAS;
}

/** One cell's mark, drawn round the origin in dots. */
function draw(x, n) {
  const [kind, id] = n.split('.');
  if (kind === 'bead') { // (a feeling's bead at radius 5, in its own colour: the mock's bead())
    const r = 5, base = hex(COLOR[id]), lift = id === 'dread' ? 0.42 : id === 'fury' ? 0.28 : id === 'gall' ? 0.22 : 0.12, col = shade(base, lift);
    featPath(x, id, r); x.lineWidth = Math.max(1.1, r * 0.34); x.strokeStyle = KEY; x.stroke();
    const g = x.createRadialGradient(-r * 0.35, -r * 0.4, 0.2, 0, 0, r * 1.1); g.addColorStop(0, shade(col, 0.55)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.25)); x.fillStyle = g; x.fill();
    x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(-r * 0.3, -r * 0.4, r * 0.22, r * 0.12, -0.6, 0, TAU); x.fill();
  } else if (kind === 'beadLine') { featPath(x, id, 6.4); x.lineWidth = 0.8; x.strokeStyle = '#fff'; x.stroke(); }
  else if (kind === 'seat') { // (an empty round socket on the hoop, its brass lip: no shape, no colour)
    const r = 5; x.beginPath(); x.arc(0, 0, r * 0.8, 0, TAU); x.lineWidth = 2; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#07050a'; x.fill();
    x.lineWidth = 0.7; x.strokeStyle = 'rgba(217,180,104,.85)'; x.beginPath(); x.arc(0, 0, r * 0.8, 0, TAU); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(r * 0.18, r * 0.22, r * 0.42, 0, TAU); x.fill();
  } else if (kind === 'notch' || kind === 'notchFill') {
    const sz = NOTCH_SZ[id];
    notchPath(x, id, sz);
    if (kind === 'notchFill') { x.fillStyle = '#fff'; x.fill(); return; }
    x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#fff'; x.fill();
    if (id === 'knock') { x.fillStyle = KEY; x.beginPath(); x.arc(0, 0, sz * 0.34, 0, TAU); x.fill(); }
    if (id === 'guardBreak') { x.beginPath(); x.moveTo(-sz * 0.35, -sz * 0.9); x.lineTo(sz * 0.1, -sz * 0.1); x.lineTo(-sz * 0.2, sz * 0.2); x.lineTo(sz * 0.25, sz * 0.9); x.lineWidth = 0.8; x.strokeStyle = KEY; x.stroke(); }
  } else if (kind === 'win' || kind === 'winFill') {
    const j = +id; winPath(x, j);
    if (kind === 'winFill') { x.fillStyle = '#fff'; x.fill(); return; }
    x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.fillStyle = mixH('#a9cfc0', '#ffffff', 0.25); x.fill();
  } else if (kind === 'lure') { // (grey, so the feeling tints it; its light from the upper left)
    const r = 6; lurePath(x, id, r); x.lineWidth = 1.6; x.strokeStyle = KEY; x.stroke();
    const g = x.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r * 1.25); g.addColorStop(0, '#ffffff'); g.addColorStop(0.65, '#d4d4d4'); g.addColorStop(1, '#7a7a7a'); x.fillStyle = g; x.fill();
    if (id === 'spoon') { x.beginPath(); x.ellipse(-r * 0.05, r * 0.05, r * 0.42, r * 0.7, -0.2, 0, TAU); x.fillStyle = 'rgba(0,0,0,.18)'; x.fill(); }
  } else if (n === 'pawl') { x.beginPath(); x.moveTo(0.9, -2.1); x.lineTo(-1.7, 0); x.lineTo(0.9, 2.1); x.lineTo(1.7, 0); x.closePath(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#fff'; x.fill(); }
  else if (n === 'echo') { x.beginPath(); x.moveTo(-2.4, 0); x.lineTo(1.6, -2.4); x.lineTo(1.6, 2.4); x.closePath(); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#fff'; x.fill(); }
  else if (n === 'dot') { const g = x.createRadialGradient(0, 0, 0, 0, 0, CELL / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-CELL / 2, -CELL / 2, CELL, CELL); }
  else if (n === 'bar') { const g = x.createLinearGradient(0, -CELL / 2, 0, CELL / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.18, '#fff'); g.addColorStop(0.82, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-CELL / 2, -CELL / 2, CELL, CELL); }
  else if (n === 'disc') { x.beginPath(); x.arc(0, 0, 8, 0, TAU); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke(); }
  else if (n === 'star') { x.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r = i % 2 ? 2 : 9; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(r, 0); } x.closePath(); x.fillStyle = '#fff'; x.fill(); }
  else if (n === 'pot') { x.fillStyle = '#a8643a'; x.strokeStyle = '#1a0c06'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(0, 0, 2.4, 2.1, 0, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#d79a68'; x.fillRect(-0.6, -2.9, 1.2, 1); }
}
