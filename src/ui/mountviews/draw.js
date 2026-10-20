// ---------------------------------------------------------------------------------------
// A MOUNT'S VIEWS, THE DRAWING: the three projections of a mount's loop (ui/mountviews/sims.js) onto a card's little canvases, and the
// timeline under them. TOP: the water from above, z to the right, x down. SIDE: a side-on shmup box, z to the right, y up, the
// waterline across it (the card's own picture, not the crossing's side act). CHASE: a camera behind and above the ship, down the lane.
// Each draws the crude (its oil film flowing astern: the rail's frame, the sea moves and the ship keeps its place), the shapes, the
// ship (the sloop: the Pneuka Jar on its side, its mouth glowing aft) and its hurtbox (T.ship.hurt, as vfx/railshots.js draws it), and the
// things: a shot (RAIL_SHOT.radius; your colour or the other; an outlined one ringed in the film), a fish, a boarder, a cask, a
// creature, a weak point, pops and splashes. Ported from the mount views mock (2026-10-20).
//
// Prior art: a top-down shmup's and a side-scroller's frames side by side (Ikaruga's and R-Type's screens), Star Fox 64's chase camera,
// a video editor's timeline with its markers and playhead.
//
//   const V = makeView('top' | 'side' | 'chase', W, H)   drawPane(g, V, run, ctx)   (ctx: { t, col, you, count })
//   drawScrub(g, W, H, sim, col, t, count)   drawLegendMark(g, kind, ctx)   LEGEND
// ---------------------------------------------------------------------------------------
import { T } from '../../core/config.js';
import { RAIL_SHOT } from '../../vfx/railshots.js';
import { FILM as FILM_RGB } from '../../vfx/oxidation.js';
import { LOOP, S, WARN_COLOR, waterRing, clamp, lerp, add, sub, mul, dot, norm, frac } from './sims.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
export function makeView(kind, W, H) {
  const s = W / 30, z0 = -9, ui = W / 210;
  if (kind === 'top') return { kind, W, H, s, ui, P: (p) => [(p[2] - z0) * s, H / 2 + p[0] * s, s] };
  if (kind === 'side') { const wy = H * 0.64; return { kind, W, H, s, ui, wy, P: (p) => [(p[2] - z0) * s, wy - p[1] * s, s] }; }
  const C = [0, 3.0, -6.2], Tg = [0, 0.6, 12], f = norm(sub(Tg, C)), r = [1, 0, 0], up = [0, 1, 0], u = norm(sub(up, mul(f, dot(up, f)))), F = H / 2 / Math.tan(26 * D2R);
  const P = (p) => { const d = sub(p, C), zc = dot(d, f); if (zc < 0.25) return null; return [W / 2 + (dot(d, r) / zc) * F, H / 2 - (dot(d, u) / zc) * F, F / zc]; };
  const hz = P([0, 0, 4000]);
  return { kind, W, H, s: F / 10, ui, P, hy: hz[1] };
}
const shown = (V, o) => !o.only || o.only.split(' ').includes(V.kind);
const FILM = FILM_RGB.map((c) => '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')); // (the oil film's four colours, vfx/oxidation.js)
const filmAt = (u) => { u = frac(u) * FILM.length; const i = Math.floor(u), k = u - i, a = hexRgb(FILM[i]), b = hexRgb(FILM[(i + 1) % FILM.length]); return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], k))).join(',')})`; };
function hexRgb(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };

function drawWater(g, V, t) {
  const { W, H } = V, flow = (t / LOOP) * 30;
  if (V.kind === 'side') {
    let gr = g.createLinearGradient(0, 0, 0, V.wy); gr.addColorStop(0, '#08060e'); gr.addColorStop(1, '#1a1129'); g.fillStyle = gr; g.fillRect(0, 0, W, V.wy);
    gr = g.createLinearGradient(0, V.wy, 0, H); gr.addColorStop(0, '#2e1a52'); gr.addColorStop(0.35, '#1a0f30'); gr.addColorStop(1, '#06040a'); g.fillStyle = gr; g.fillRect(0, V.wy, W, H - V.wy);
    for (let i = 0; i < 4; i++) { g.strokeStyle = rgba(FILM[i], 0.1); g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= W; x += 3) { const z = x / V.s - 9; const y = V.wy + (6 + i * 9) * V.ui + 2 * Math.sin(TAU * (z + flow) / 15 + i * 2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.lineWidth = 1.6 * V.ui; for (let x = 0; x < W; x += 2) { const z = x / V.s - 9, y = V.wy + 0.9 * Math.sin(TAU * (z + flow) / 7.5); g.strokeStyle = filmAt((z + flow) / 30 + 0.1); g.globalAlpha = 0.55 + 0.35 * Math.sin(TAU * (z + flow) / 10); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2.2, y); g.stroke(); }
    g.globalAlpha = 1; return;
  }
  if (V.kind === 'top') { const gr = g.createRadialGradient(W * 0.3, H / 2, 10, W * 0.4, H / 2, W * 0.7); gr.addColorStop(0, '#1d1233'); gr.addColorStop(1, '#08050e'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  else { let gr = g.createLinearGradient(0, 0, 0, V.hy); gr.addColorStop(0, '#07050c'); gr.addColorStop(1, '#22163a'); g.fillStyle = gr; g.fillRect(0, 0, W, V.hy);
    gr = g.createLinearGradient(0, V.hy, 0, H); gr.addColorStop(0, '#2a1a45'); gr.addColorStop(0.25, '#140c24'); gr.addColorStop(1, '#07040b'); g.fillStyle = gr; g.fillRect(0, V.hy, W, H - V.hy);
    g.strokeStyle = rgba('#a48cf2', 0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(0, V.hy); g.lineTo(W, V.hy); g.stroke(); }
  // the crude's oil film: broken streaks flowing astern (the rail's frame: the sea moves, the ship keeps its place)
  const zEnd = V.kind === 'top' ? 22 : 70;
  for (let i = 0; i < 18; i++) {
    const x0 = -12 + i * 1.4 + 0.3 * Math.sin(i * 2.1);
    let open = false; g.lineWidth = (V.kind === 'top' ? 1.3 : 1.1) * V.ui;
    for (let z = -10; z <= zEnd; z += V.kind === 'top' ? 0.5 : 0.8) {
      const vis = Math.sin(TAU * (z + flow) / 10 + i * 1.7) > 0.25, x = x0 + 0.35 * Math.sin(TAU * (z + flow) / 15 + i * 1.3);
      const q = V.P([x, 0, z]); if (!q || !vis) { if (open) { g.stroke(); open = false; } continue; }
      if (!open) { g.strokeStyle = rgba(FILM[i % 4], V.kind === 'chase' ? 0.22 * clamp(1 - z / zEnd) : 0.2); g.beginPath(); g.moveTo(q[0], q[1]); open = true; } else g.lineTo(q[0], q[1]);
    }
    if (open) g.stroke();
  }
  // slick blooms of film
  for (let j = 0; j < 4; j++) { const z = ((j * 7.5 + 3 - flow) % 30 + 30) % 30 - 9, x = [-5, 3, -1.5, 6][j]; const q = V.P([x, 0, z]); if (!q) continue; const r = 1.8 * q[2];
    const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); gr.addColorStop(0, rgba(FILM[(j + 1) % 4], 0.13)); gr.addColorStop(1, rgba(FILM[(j + 1) % 4], 0)); g.fillStyle = gr;
    g.save(); g.translate(q[0], q[1]); g.scale(1, V.kind === 'chase' ? 0.35 : 1); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.restore(); g.fill(); }
}

function strokePoly(g, V, o) {
  if (!shown(V, o)) return;
  const pts = o.pts.map((p) => V.P(p));
  g.save(); g.globalAlpha *= o.a ?? 1;
  if (o.fill) { g.fillStyle = o.col; g.beginPath(); let st = false; for (const q of pts) { if (!q) continue; st ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); st = true; } g.fill(); g.restore(); return; }
  g.strokeStyle = o.col; g.lineWidth = (o.w ?? 1.5) * V.ui; g.lineCap = 'round'; g.lineJoin = 'round'; if (o.dash) g.setLineDash(o.dash.map((d) => d * V.ui));
  g.beginPath(); let st = false; for (const q of pts) { if (!q) { st = false; continue; } st ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); st = true; } g.stroke();
  g.restore();
}

// the ship: the sloop, the Pneuka Jar laid on its side, its base the bow and its mouth glowing aft
const JAR = [[0.85, 0], [0.8, 0.22], [0.65, 0.4], [0.4, 0.5], [0.1, 0.5], [-0.2, 0.42], [-0.45, 0.25], [-0.6, 0.17], [-0.75, 0.19], [-0.85, 0.23]];
function drawShip(g, V) {
  const outline = (plane) => { const a = JAR.map(([z, r]) => (plane === 'h' ? [S[0] + r, S[1], z] : [S[0], S[1] + r, z])), b = JAR.slice().reverse().map(([z, r]) => (plane === 'h' ? [S[0] - r, S[1], z] : [S[0], S[1] - r, z])); return [...a, ...b].map((p) => V.P(p)); };
  const pts = outline(V.kind === 'side' ? 'v' : 'h'), c = V.P(S);
  const mouth = V.P([0, S[1], -0.85]), k = c[2];
  const glow = g.createRadialGradient(mouth[0], mouth[1], 0, mouth[0], mouth[1], 1.4 * k); glow.addColorStop(0, 'rgba(127,220,255,.75)'); glow.addColorStop(1, 'rgba(127,220,255,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(mouth[0], mouth[1], 1.4 * k, 0, TAU); g.fill();
  const gr = g.createLinearGradient(c[0], c[1] - 0.5 * k, c[0], c[1] + 0.5 * k); gr.addColorStop(0, '#e2a882'); gr.addColorStop(0.55, '#a8603f'); gr.addColorStop(1, '#5a2c1b');
  g.fillStyle = gr; g.strokeStyle = '#1c0d08'; g.lineWidth = Math.max(1, 0.9 * V.ui);
  g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); g.stroke();
  if (V.kind === 'side') { g.save(); g.beginPath(); g.rect(0, V.wy, V.W, V.H); g.clip(); g.fillStyle = 'rgba(46,26,82,.55)'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.fill(); g.restore(); }
  // the mouth, aft: a lip of Lachryma light
  const r = 0.2 * k; g.fillStyle = '#bff0ff'; g.strokeStyle = '#7fdcff';
  if (V.kind === 'chase') { g.beginPath(); g.ellipse(mouth[0], mouth[1], r * 1.1, r, 0, 0, TAU); g.fill(); }
  else { g.lineWidth = Math.max(1.5, 0.12 * k); g.beginPath(); g.moveTo(mouth[0], mouth[1] - (V.kind === 'side' ? r : 0) - (V.kind === 'top' ? 0 : 0)); const m2 = V.kind === 'side' ? [mouth[0], mouth[1] + r] : [mouth[0], mouth[1]]; if (V.kind === 'top') { const a = V.P([-0.2, S[1], -0.85]), b = V.P([0.2, S[1], -0.85]); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } else g.lineTo(m2[0], m2[1]); g.stroke(); }
  // the hurtbox: a pale core and a dark ring whose outer edge is its radius (vfx/railshots.js), over the hull
  const hr = Math.max(2.4 * V.ui, T.ship.hurt * k);
  g.fillStyle = '#120a18'; g.beginPath(); g.arc(c[0], c[1], hr, 0, TAU); g.fill();
  g.fillStyle = '#f6efe4'; g.beginPath(); g.arc(c[0], c[1], hr * 0.55, 0, TAU); g.fill();
}

function halo(g, x, y, r, col, a = 0.85) { g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.restore(); }
function heading(V, p, v) { const a = V.P(p), b = V.P(add(p, mul(norm(v), 0.6))); if (!a || !b) return Math.PI / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; return Math.hypot(dx, dy) < 0.4 ? Math.PI / 2 : Math.atan2(dy, dx); }

export function drawItem(g, V, o, ctx) {
  const t = ctx.t, mc = ctx.col;
  if (o.type === 'poly') return strokePoly(g, V, o);
  if (o.type === 'tint') { g.save(); g.globalAlpha = o.a; g.fillStyle = o.col; g.fillRect(0, 0, V.W, V.H); g.restore(); return; }
  if (o.type === 'needle') { const a = V.P(o.a), b = V.P(o.b); if (!a || !b) return; g.save(); g.strokeStyle = o.col; g.lineWidth = 1.8 * V.ui; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 0.7 * V.ui; g.stroke(); g.restore(); return; }
  const q = o.p && V.P(o.p); if (!q) return;
  const [x, y, k] = q;
  g.save(); g.globalAlpha *= o.a ?? 1;
  const under = o.p[1] < -0.05; if (under) g.globalAlpha *= V.kind === 'side' ? 0.6 : 0.3;
  if (o.lit === false) g.globalAlpha *= 0.32;
  switch (o.type) {
    case 'dot': g.fillStyle = o.col; g.beginPath(); g.arc(x, y, Math.max(1.5, o.r * k), 0, TAU); g.fill(); break;
    case 'shot': {
      const r = Math.max(2.4 * V.ui, RAIL_SHOT.radius * k), you = o.kind === 'mine';
      const h = heading(V, o.p, o.v), tl = r * 2.6;
      g.strokeStyle = you ? rgba(ctx.you, 0.55) : 'rgba(214,200,255,.45)'; g.lineWidth = r * 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(h) * tl, y - Math.sin(h) * tl); g.stroke();
      g.fillStyle = '#0b0710'; g.beginPath(); g.arc(x, y, r + 0.8, 0, TAU); g.fill();
      g.fillStyle = you ? ctx.you : '#d6c8ff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = you ? '#fff6d6' : '#120b1c'; g.beginPath(); g.arc(x, y, r * 0.5, 0, TAU); g.fill();
      if (o.outlined) { g.lineWidth = Math.max(1.4, r * 0.45); g.strokeStyle = filmAt(t * 0.4 + 0.25); g.beginPath(); g.arc(x, y, r * 1.85, 0, TAU); g.stroke(); g.strokeStyle = '#ff7ad9'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2); g.lineTo(x + Math.cos(a) * r * 2.8, y + Math.sin(a) * r * 2.8); g.stroke(); } }
      if (o.lit === true) halo(g, x, y, r * (o.outlined ? 3.2 : 2.3), mc);
      break; }
    case 'fish': {
      const L = Math.max(6 * V.ui, (o.size ?? 0.9) * k), h = heading(V, o.p, o.v || [0, 0, -1]);
      g.translate(x, y); g.rotate(h);
      g.fillStyle = o.lit === true ? '#effcff' : '#d8d0e4'; g.strokeStyle = '#0b0710'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(0, 0, L / 2, L * 0.24, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-L * 0.42, 0); g.lineTo(-L * 0.75, -L * 0.24); g.lineTo(-L * 0.75, L * 0.24); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#0b0710'; g.beginPath(); g.arc(L * 0.22, -L * 0.04, Math.max(0.8, L * 0.06), 0, TAU); g.fill();
      g.rotate(-h); if (o.lit === true) halo(g, 0, 0, L * 0.75, mc, 0.7);
      break; }
    case 'boarder': {
      const hgt = Math.max(9 * V.ui, 1.0 * k); g.translate(x, y); g.rotate(o.spin || 0);
      if (V.kind === 'top') { g.fillStyle = '#1b1226'; g.strokeStyle = '#c9b8ff'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, hgt * 0.3, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-hgt * 0.5, -hgt * 0.15); g.lineTo(hgt * 0.5, -hgt * 0.15); g.stroke(); }
      else { g.fillStyle = '#1b1226'; g.strokeStyle = '#c9b8ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(-hgt * 0.25, 0); g.lineTo(hgt * 0.25, 0); g.lineTo(hgt * 0.18, -hgt * 0.65); g.lineTo(-hgt * 0.18, -hgt * 0.65); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.arc(0, -hgt * 0.8, hgt * 0.16, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-hgt * 0.2, -hgt * 0.55); g.lineTo(-hgt * 0.45, -hgt * 0.9); g.moveTo(hgt * 0.2, -hgt * 0.55); g.lineTo(hgt * 0.45, -hgt * 0.9); g.stroke();
        g.fillStyle = '#ff7a4a'; g.fillRect(-hgt * 0.07, -hgt * 0.84, hgt * 0.05, hgt * 0.05); g.fillRect(hgt * 0.03, -hgt * 0.84, hgt * 0.05, hgt * 0.05); }
      if (o.lit === true) halo(g, 0, V.kind === 'top' ? 0 : -hgt * 0.45, hgt * 0.75, mc);
      break; }
    case 'cask': {
      const w = Math.max(6 * V.ui, 0.75 * k), hh = w * 0.7; g.fillStyle = '#a8692b'; g.strokeStyle = '#1c0d08'; g.lineWidth = 1;
      g.beginPath(); g.roundRect(x - w / 2, y - hh / 2, w, hh, hh * 0.35); g.fill(); g.stroke();
      g.strokeStyle = '#3a2208'; g.beginPath(); g.moveTo(x - w * 0.22, y - hh / 2); g.lineTo(x - w * 0.22, y + hh / 2); g.moveTo(x + w * 0.22, y - hh / 2); g.lineTo(x + w * 0.22, y + hh / 2); g.stroke();
      if (o.lit === true) halo(g, x, y, w * 0.95, mc);
      break; }
    case 'creature': {
      const r = o.R * k; g.fillStyle = '#1c1230'; g.strokeStyle = 'rgba(201,184,255,.55)'; g.lineWidth = 1.2;
      if (V.kind === 'side') { g.save(); g.beginPath(); g.rect(0, 0, V.W, V.wy); g.clip(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.restore(); g.save(); g.beginPath(); g.rect(0, V.wy, V.W, V.H); g.clip(); g.globalAlpha *= 0.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.restore(); }
      else if (V.kind === 'top') { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); }
      else { const top = V.P(add(o.p, [0, o.R, 0])); g.beginPath(); g.ellipse(x, y, r, Math.max(2, y - (top ? top[1] : y - r)), 0, Math.PI, TAU); g.fill(); g.stroke(); if (under) { g.beginPath(); g.ellipse(x, y, r, r * 0.3, 0, 0, TAU); g.fill(); } }
      if (o.lit === true) { g.globalAlpha = (o.a ?? 1) * 0.95; halo(g, x, y - (V.kind === 'side' ? 0 : 0), r * 1.15, WARN_COLOR); }
      break; }
    case 'weak': {
      const r = Math.max(3.4 * V.ui, 0.42 * k);
      g.fillStyle = o.open ? '#fffaf0' : '#3b2c4d'; g.strokeStyle = o.open ? mc : '#7c6a92'; g.lineWidth = 1.2;
      if (o.open) { const gl = g.createRadialGradient(x, y, 0, x, y, r * 3); gl.addColorStop(0, rgba(mc, 0.6)); gl.addColorStop(1, rgba(mc, 0)); g.save(); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3, 0, TAU); g.fill(); g.restore(); }
      g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.75, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.75, y); g.closePath(); g.fill(); g.stroke();
      if (o.open) { g.strokeStyle = mc; g.lineWidth = 1.6 * V.ui; g.beginPath(); g.arc(x, y, r * 1.8, -Math.PI / 2, -Math.PI / 2 + TAU * o.open); g.stroke(); }
      break; }
    case 'pop': { const f = clamp(o.f), r = Math.max(3, (0.3 + 1.1 * f) * (o.size ?? 1) * k); g.globalAlpha *= 1 - f; g.strokeStyle = o.col; g.lineWidth = 1.5 * V.ui; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
      g.fillStyle = o.col; for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.4; g.fillRect(x + Math.cos(a) * r * 1.3 - 1, y + Math.sin(a) * r * 1.3 - 1, 2, 2); } break; }
    case 'slash': { const f = clamp(o.f), r = Math.max(5, 0.9 * k); g.globalAlpha *= 1 - f; g.strokeStyle = '#ffffff'; g.lineWidth = 1.6 * V.ui; g.beginPath(); g.moveTo(x - r, y + r * 0.6); g.lineTo(x + r, y - r * 0.6); g.stroke(); break; }
    case 'splash': { const f = clamp(o.f); g.globalAlpha *= 1 - f; g.restore(); for (const m of [0.6, 1]) strokePoly(g, V, waterRing(o.p, (o.big ? 2.6 : 1) * (0.4 + 1.6 * f * m), { col: '#cfe9ff', a: 0.8 * (1 - f), w: 1.2 }));
      if (V.kind !== 'top') { g.save(); g.fillStyle = '#cfe9ff'; g.globalAlpha = 1 - f; for (let i = 0; i < 5; i++) { const dx = (i - 2) * 0.35 * k * (o.big ? 2 : 1), dy = Math.sin(Math.PI * f) * (0.8 + (i % 2) * 0.5) * k * (o.big ? 1.8 : 1); g.fillRect(x + dx - 1, y - dy - 1, 2, 2); } g.restore(); }
      return; }
    case 'lock': { const s = Math.max(7 * V.ui, 0.95 * k) * (1.6 - 0.6 * o.f), a = s * 0.35; g.strokeStyle = o.col; g.lineWidth = 1.5 * V.ui;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.beginPath(); g.moveTo(x + sx * s, y + sy * (s - a)); g.lineTo(x + sx * s, y + sy * s); g.lineTo(x + sx * (s - a), y + sy * s); g.stroke(); } break; }
    case 'leader': { const r = Math.max(7 * V.ui, 0.9 * k); g.strokeStyle = o.col; g.lineWidth = 1.4 * V.ui; g.setLineDash([3 * V.ui, 2 * V.ui]); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.setLineDash([]);
      g.fillStyle = o.col; g.beginPath(); g.moveTo(x, y - r - 2 * V.ui); g.lineTo(x - 3.5 * V.ui, y - r - 7 * V.ui); g.lineTo(x + 3.5 * V.ui, y - r - 7 * V.ui); g.closePath(); g.fill(); break; }
    case 'bang': { const r = Math.max(6 * V.ui, 0.6 * k) * (0.6 + 0.4 * o.f), px = x + (V.kind === 'top' ? 9 * V.ui : 0), py = y - (V.kind === 'top' ? 9 * V.ui : 0); g.fillStyle = o.col; g.strokeStyle = '#17111f'; g.lineWidth = 1;
      g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r * 0.5 : r; g.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); break; }
    case 'hook': { const r = Math.max(3, 0.3 * k); g.strokeStyle = o.col; g.lineWidth = 1.6 * V.ui; g.beginPath(); g.arc(x, y, r, Math.PI * 0.1, Math.PI * 1.1); g.stroke(); break; }
    case 'num': g.font = `${Math.round(15 * V.ui)}px ${ctx.count}`; g.fillStyle = o.col; g.strokeStyle = '#0b0710'; g.lineWidth = 3; g.textAlign = 'center'; g.strokeText(o.text, x, y); g.fillText(o.text, x, y); break;
  }
  g.restore();
}

/** One view of one moment: the crude, the shapes, the creatures under the ship, the ship, the rest (far to near in the chase), the tints. */
export function drawPane(g, V, R, ctx) {
  drawWater(g, V, ctx.t);
  const polys = R.it.filter((o) => o.type === 'poly' || o.type === 'tint'), rest = R.it.filter((o) => o.type !== 'poly' && o.type !== 'tint');
  for (const o of polys) if (o.type === 'poly') drawItem(g, V, o, ctx);
  for (const o of rest) if (o.type === 'creature') drawItem(g, V, o, ctx);
  drawShip(g, V);
  const others = rest.filter((o) => o.type !== 'creature');
  if (V.kind === 'chase') others.sort((a, b) => (b.p ? b.p[2] : 0) - (a.p ? a.p[2] : 0)); // (a near thing over a far one)
  for (const o of others) drawItem(g, V, o, ctx);
  for (const o of polys) if (o.type === 'tint') drawItem(g, V, o, ctx);
}

/** The timeline under the views: the loop's seconds, its events as diamonds (a ghost one hollow: the warning the vane's lead beat), the
 *  span a mount is open (its duration), and the playhead. W and H in CSS pixels; the transform is the caller's. */
export function drawScrub(g, W, H, sim, col, t, count) {
  g.clearRect(0, 0, W, H);
  const x = (s) => 4 + (s / LOOP) * (W - 8), y = 7;
  g.strokeStyle = 'rgba(241,210,176,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x(0), y); g.lineTo(x(LOOP), y); g.stroke();
  if (sim.A) { g.strokeStyle = col; g.globalAlpha = 0.5; g.lineWidth = 4; g.beginPath(); g.moveTo(x(sim.A[0]), y); g.lineTo(x(sim.A[1]), y); g.stroke(); g.globalAlpha = 1; }
  for (const [s, kind] of sim.ticks) {
    const px = x(s), ghost = kind === 'ghost'; g.fillStyle = col; g.strokeStyle = ghost ? '#b3a08c' : '#17111f'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(px, y - 4); g.lineTo(px + 3, y); g.lineTo(px, y + 4); g.lineTo(px - 3, y); g.closePath(); if (!ghost) g.fill(); g.stroke();
  }
  g.font = `11px ${count}`; g.fillStyle = '#9d8a78'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (let s = 0; s <= LOOP; s++) g.fillText(`${s}`, x(s), H - 1);
  g.fillStyle = '#ffffff'; g.fillRect(x(t) - 1, 0, 2, 14);
}

/** The legend's marks: what a view's things mean, each drawn as the views draw it. */
export const LEGEND = [
  ['a shot of your colour', { type: 'shot', p: [0, 0, 0], v: [0, 0, -1], kind: 'mine' }],
  ['a shot of the other colour', { type: 'shot', p: [0, 0, 0], v: [0, 0, -1], kind: 'other' }],
  ['an outlined shot: only the parry', { type: 'shot', p: [0, 0, 0], v: [0, 0, -1], kind: 'mine', outlined: true }],
  ['a small fish', { type: 'fish', p: [0, 0, 0], v: [0, 0, 1] }],
  ['taken: lit, ringed', { type: 'fish', p: [0, 0, 0], v: [0, 0, 1], lit: true }],
  ['ignored: dim', { type: 'fish', p: [0, 0, 0], v: [0, 0, 1], lit: false }],
  ['the hurtbox', { type: 'hurt' }],
];
/** One legend mark into a 22 x 22 CSS-pixel box (the transform is the caller's). */
export function drawLegendMark(g, o, ctx) {
  const V = { kind: 'top', W: 22, H: 22, ui: 1, P: () => [11, 11, 9] };
  if (o.type === 'hurt') { g.fillStyle = '#120a18'; g.beginPath(); g.arc(11, 11, 5, 0, TAU); g.fill(); g.fillStyle = '#f6efe4'; g.beginPath(); g.arc(11, 11, 2.7, 0, TAU); g.fill(); return; }
  drawItem(g, V, o, ctx);
}
