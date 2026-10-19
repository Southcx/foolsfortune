// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S RELIQUARY: the coffin, its Possibilikeys and its chain, drawn (part of vfx/lockheartreliquary.js), in the coffin's own
// units (the mock's: the bail at the origin, the coffin hanging down +y to its foot ring at 45.6), on a 2D canvas the piece scales:
//   THE COFFIN    six-sided, wide at the shoulders, lacquered in its kind's colour with a brass trim keyline, hung by a bail at its head;
//                 the lid swings open on its left hinge (the Opening), snaps (the gulp), lifts a hair (the hoover); full and shut, its
//                 seam is lit with its load
//   THE GHOST     the lid's emblem sitting in its odds: this coffin's table with the ring's Possibilikeys done to it, best last
//   THE PADLOCK   the coffin's own iron, turning gold and springing its shackle only when every reason to open holds
//   THE WINDOW    a lancet of glass graduated empty to twice full, the brass measure line at half; the hoover's vortex in it
//   A POSSIBILIKEY its bow a light shape keylined dark (brass a ring, INVERTED a triangle, EVEN a bar, LOADED a die, TWIN two rings, WIDE
//                 a bar with its arrows out, ECHO a ring in a ring), a hairline crack a seventh of its chance to break next time
//   THE CHAIN     eleven links from the hand, the flail's string as three of them (a diamond: stagger; a double chevron: lift; a big
//                 diamond with a dark core: knock), the next gold, a struck blow's light running down to its link
//
// Prior art: the mock (Calissa's board v10, r10-lockheart: coffin(), glass(), padlock(), drawKey(), chain()), ported whole; the reliquary
// and the monstrance (a window of glass in a made case), the 19th century's hexagonal coffin and Castlevania's, the padlock and open
// shackle of every interface's locked and unlocked, the split keyring and the skeleton key's bow and bit, Kintsugi and crazed glaze for
// cracks that read as age, Castlevania's Vampire Killer for the chain as the string.
//
//   drawCoffin(x, S, t)   drawKey(x, shape, colour, used, { ch, glint })   drawChain(x, phi, S, t, alpha)
//   WIN_M (the measure's height)   CH_L (the chain's length)   keyCh(id, uses) (its chance to break at its next Opening)
// ---------------------------------------------------------------------------------------
import { TAU, C01, sm, oB, lerp, KEY, film, rgba, mixH, shade, hsh, rng, OUT } from './look.js';
import { keyBreakChance } from '../../tools/lockheart/table.js';

export const WIN_T = 25.4, WIN_B = 41.5, WIN_M = (WIN_T + WIN_B) / 2, CH_L = 24;
/** The chance a Possibilikey that has turned `uses` times breaks at its next Opening (table.js keyBreakChance, this one counted). */
export const keyCh = (id, uses) => keyBreakChance(id, (uses | 0) + 1);

function coffinPath(x) { x.beginPath(); x.moveTo(-5.5, 2); x.lineTo(5.5, 2); x.lineTo(9, 12); x.lineTo(6, 44); x.lineTo(-6, 44); x.lineTo(-9, 12); x.closePath(); }
function trimPath(x) { x.beginPath(); x.moveTo(-4.4, 3.4); x.lineTo(4.4, 3.4); x.lineTo(7.5, 12.2); x.lineTo(4.9, 42.6); x.lineTo(-4.9, 42.6); x.lineTo(-7.5, 12.2); x.closePath(); }
function winPath(x) { x.beginPath(); x.moveTo(-3.6, 41.5); x.lineTo(-3.6, 29.4); x.quadraticCurveTo(-3.4, 26.6, 0, 25.4); x.quadraticCurveTo(3.4, 26.6, 3.6, 29.4); x.lineTo(3.6, 41.5); x.closePath(); }

/** The lid's emblem at radius r, in its trim, keylined. */
export function emblem(x, kind, r, col) {
  x.save(); x.lineJoin = 'round'; x.beginPath();
  if (kind === 'boss') { x.arc(0, 0, r * 0.8, 0, TAU); x.moveTo(r * 0.3, 0); x.arc(0, 0, r * 0.3, 0, TAU, true); }
  else if (kind === 'ace') { x.moveTo(0, -r); x.bezierCurveTo(r * 0.3, -r * 0.5, r * 1.05, -r * 0.05, r * 0.85, r * 0.35); x.bezierCurveTo(r * 0.65, r * 0.75, r * 0.2, r * 0.6, r * 0.1, r * 0.3); x.lineTo(r * 0.35, r * 0.95); x.lineTo(-r * 0.35, r * 0.95); x.lineTo(-r * 0.1, r * 0.3); x.bezierCurveTo(-r * 0.2, r * 0.6, -r * 0.65, r * 0.75, -r * 0.85, r * 0.35); x.bezierCurveTo(-r * 1.05, -r * 0.05, -r * 0.3, -r * 0.5, 0, -r); x.closePath(); }
  else if (kind === 'crook') { x.moveTo(-r * 0.15, r); x.lineTo(-r * 0.15, -r * 0.25); x.arc(r * 0.3, -r * 0.25, r * 0.45, Math.PI, TAU * 0.5 + Math.PI * 1.2, false); x.lineTo(r * 0.8, -r * 0.05); x.arc(r * 0.3, -r * 0.25, r * 0.22, TAU * 0.5 + Math.PI * 1.2 - TAU, Math.PI, true); x.lineTo(r * 0.15, r); x.closePath(); }
  else if (kind === 'mouth') { x.ellipse(0, -r * 0.2, r * 0.7, r * 0.55, 0, 0, TAU); x.moveTo(-r * 0.35, r * 0.15); x.lineTo(r * 0.35, r * 0.15); x.lineTo(r * 0.5, r); x.lineTo(-r * 0.5, r); x.closePath(); }
  x.lineWidth = Math.max(0.9, r * 0.42); x.strokeStyle = KEY; x.stroke(); x.fillStyle = col; x.fill('evenodd');
  if (kind === 'mouth') { x.fillStyle = KEY; x.beginPath(); x.ellipse(0, -r * 0.2, r * 0.32, r * 0.22, 0, 0, TAU); x.fill(); }
  x.restore();
}

/** The ghost of the wheel on the lid: the odds as sectors (R: [{ id, p }]) round the emblem. No odds (the Warden's, nothing laid low): a plain ring. */
function ghostWheel(x, cx, cy, r, R, al, t, kind, trim) {
  x.save(); x.translate(cx, cy); x.beginPath(); x.arc(0, 0, r + 0.5, 0, TAU); x.fillStyle = '#120c10'; x.fill();
  let a = 0;
  for (const s of R) { const len = s.p * TAU; if (len < 1e-4) continue; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r, -Math.PI / 2 + a, -Math.PI / 2 + a + len); x.closePath(); x.fillStyle = rgba(OUT(s.id).c, al); x.fill(); a += len; }
  if (!R.length) { x.beginPath(); x.arc(0, 0, r, 0, TAU); x.strokeStyle = 'rgba(158,200,232,.35)'; x.lineWidth = 0.5; x.stroke(); }
  x.beginPath(); x.arc(0, 0, r * 0.5, 0, TAU); x.fillStyle = '#0f0a0e'; x.fill();
  x.beginPath(); x.arc(0, 0, r + 0.5, 0, TAU); x.lineWidth = 0.7; x.strokeStyle = trim; x.stroke(); x.lineWidth = 0.35; x.strokeStyle = film(t * 0.05, 0.7); x.beginPath(); x.arc(0, 0, r + 1.1, 0, TAU); x.stroke();
  emblem(x, kind, r * 0.48, trim); x.restore();
}

/** The padlock on the hasp: iron, gold once it can open (fullAge: real s since), its shackle sprung up, swung open at the Opening. */
function padlock(x, cy, S, t) {
  const gold = S.canOpen ? sm(S.fullAge / 0.2) : 0, spring = S.canOpen ? oB(C01(S.fullAge / 0.25), 2.6) : 0, up = 2.2 * spring, swing = S.shackleOpen || 0;
  x.save(); x.translate(0, cy); x.lineCap = 'round';
  x.save(); x.translate(2, -2.6 - up); x.rotate(-swing * 1.2); x.translate(-2, 0); x.beginPath(); x.moveTo(-2, 0); x.lineTo(-2, -1.4); x.arc(0, -1.4, 2, Math.PI, TAU); x.lineTo(2, 0);
  x.lineWidth = 2.2; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 1.05; x.strokeStyle = mixH('#8d929c', '#f3d98f', gold); x.stroke(); x.restore();
  const g = x.createLinearGradient(0, -2.8, 0, 2.8); g.addColorStop(0, mixH('#a3a8b2', '#f6e2a0', gold)); g.addColorStop(0.55, mixH('#5c616b', '#c39a44', gold)); g.addColorStop(1, mixH('#2e3138', '#6a4a16', gold));
  x.beginPath(); x.moveTo(-3.3, -2.7); x.lineTo(3.3, -2.7); x.lineTo(3.3, 1.7); x.quadraticCurveTo(3.3, 2.9, 2, 2.9); x.lineTo(-2, 2.9); x.quadraticCurveTo(-3.3, 2.9, -3.3, 1.7); x.closePath(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke(); x.fillStyle = g; x.fill();
  const hole = () => { x.beginPath(); x.arc(0, -0.5, 0.8, 0, TAU); x.moveTo(-0.45, -0.2); x.lineTo(0.45, -0.2); x.lineTo(0.6, 1.7); x.lineTo(-0.6, 1.7); x.closePath(); };
  hole(); x.fillStyle = '#07050a'; x.fill();
  if (gold > 0.02) {
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha *= gold; hole(); x.fillStyle = film(t * 0.2, 1); x.fill();
    const lg = x.createRadialGradient(0, 0, 0, 0, 0, 5); lg.addColorStop(0, film(t * 0.2, 0.45)); lg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = lg; x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fill(); x.restore();
  }
  if (S.canOpen && S.fullAge < 0.4) { const q = S.fullAge / 0.4; x.strokeStyle = `rgba(255,240,190,${1 - q})`; x.lineWidth = 0.5; for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 - 0.3, r0 = 4 + q * 5; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * (r0 + 1.6), Math.sin(a) * (r0 + 1.6)); x.stroke(); } }
  x.restore();
}

/** The window: Lachryma against the measure; the glass runs from empty to twice full. */
function glass(x, S, t, level) {
  winPath(x); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#0a0814'; x.fill();
  x.save(); winPath(x); x.clip();
  const hv = S.hoover || 0, ww = 3.6;
  const surf = (X) => level + Math.sin(X * 1.6 + t * 5) * 0.25 * (1 - hv) + hv * 2.2 * (1 - (X / ww) ** 2) + (S.ripple || 0) * Math.sin(X * 3 - t * 20) * 0.6;
  const lg = x.createLinearGradient(0, level - 1, 0, WIN_B); lg.addColorStop(0, '#c9f2ff'); lg.addColorStop(0.18, '#7fdcff'); lg.addColorStop(0.7, '#4c2fd0'); lg.addColorStop(1, '#2e1a52');
  x.beginPath(); x.moveTo(-ww - 1, WIN_B + 1); for (let X = -ww - 1; X <= ww + 1; X += 0.4) x.lineTo(X, surf(X)); x.lineTo(ww + 1, WIN_B + 1); x.closePath(); x.fillStyle = lg; x.fill();
  if (S.hvCol && hv > 0.05) { x.globalAlpha = 0.55 * hv; x.fillStyle = S.hvCol; x.fill(); x.globalAlpha = 1; }
  for (let i = 0; i < 10; i++) { const px = -3 + 6 * hsh(i, 1), py = lerp(level + 1, WIN_B - 1, hsh(i, 2)), dr = Math.sin(t * 0.8 + i) * 0.4; if (py < surf(px) + 0.4) continue; x.fillStyle = film(hsh(i, 3) + t * 0.05, 0.85); x.fillRect(px + dr, py, 0.6, 0.6); } // (the schiller's motes in the liquid)
  if (hv > 0.02) { // (the hoover: the surface turned into a whirl, a spiral of motes running down into it)
    const vc = Math.min(WIN_B - 3, level + 5);
    for (let i = 0; i < 14; i++) { const ph = (t * 1.4 + i / 14) % 1, a = i * 2.4 + t * 9, r = 3.2 * (1 - ph); x.fillStyle = film(i / 14 + t * 0.2, hv * (1 - ph * 0.6)); x.fillRect(Math.cos(a) * r - 0.3, vc - 3 + ph * 5 + Math.sin(a) * r * 0.35 - 0.3, 0.7, 0.7); }
    x.lineWidth = 0.35; x.strokeStyle = `rgba(240,236,255,${0.6 * hv})`; x.beginPath();
    for (let k = 0; k < 40; k++) { const a = k * 0.45 + t * 9, r = 3.4 * (1 - k / 40), px = Math.cos(a) * r, py = vc - 2 + (k / 40) * 4 + Math.sin(a) * r * 0.35; if (k) x.lineTo(px, py); else x.moveTo(px, py); }
    x.stroke();
  }
  x.beginPath(); for (let X = -ww; X <= ww; X += 0.4) { const y = surf(X); if (X === -ww) x.moveTo(X, y); else x.lineTo(X, y); } x.lineWidth = 0.45; x.strokeStyle = '#f4fff8'; x.stroke();
  if (S.charge > 2 * S.fill) for (let i = 0; i < 3; i++) { const p = (t * 1.5 + i / 3) % 1; x.fillStyle = `rgba(255,255,255,${1 - p})`; x.fillRect(-1.5 + i * 1.4, WIN_T + 2 - p * 2, 0.5, 0.5); }
  x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.moveTo(-3.6, 31.5); x.lineTo(-1.2, 27.6); x.lineTo(-0.2, 27.6); x.lineTo(-3.6, 34.5); x.closePath(); x.fill(); x.restore(); // (the glass's sheen)
  // the measure on the glass: the brass line at half height (full), the fine gold at the top (twice full)
  x.lineWidth = 0.5; x.strokeStyle = 'rgba(243,217,143,.45)'; x.beginPath(); x.moveTo(-3.6, WIN_M); x.lineTo(3.6, WIN_M); x.stroke();
  x.lineWidth = 1.1; x.strokeStyle = KEY; x.beginPath(); x.moveTo(-5.6, WIN_M); x.lineTo(-3.4, WIN_M); x.moveTo(3.4, WIN_M); x.lineTo(5.6, WIN_M); x.stroke(); x.lineWidth = 0.6; x.strokeStyle = '#f3d98f'; x.stroke();
  winPath(x); x.lineWidth = 0.55; x.strokeStyle = '#b48a3e'; x.stroke();
}

/** The coffin, its head at the bail (the origin). S: { look, charge, fill, lid, snap, hoover, ghost, canOpen, fullAge, shackleOpen, ripple }. */
export function drawCoffin(x, S, t) {
  const H = S.look, level = WIN_B - (WIN_B - WIN_T) * C01(S.charge / (2 * S.fill));
  x.beginPath(); x.arc(0, 0.2, 1.6, 0, TAU); x.lineWidth = 1.4; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.7; x.strokeStyle = '#d9b048'; x.stroke(); // (the bail)
  const lid = C01(S.lid) + (S.snap >= 0 && S.snap < 0.1 ? 0.35 * Math.sin((S.snap / 0.1) * Math.PI) : 0) + (S.hoover || 0) * 0.05;
  if (lid > 0.01) { // (the inside: the coffin's own light, the Lachryma it holds)
    coffinPath(x); x.lineWidth = 1.4; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#0b0812'; x.fill(); x.save(); coffinPath(x); x.clip();
    const lv = lerp(44, 6, C01(S.charge / (2 * S.fill))), lg = x.createLinearGradient(0, lv, 0, 44); lg.addColorStop(0, '#c9f2ff'); lg.addColorStop(0.3, '#7fdcff'); lg.addColorStop(1, '#2e1a52'); x.fillStyle = lg; x.fillRect(-10, lv, 20, 46 - lv);
    const g = x.createRadialGradient(0, 20, 1, 0, 20, 24); g.addColorStop(0, film(t * 0.2, 0.75 * Math.min(1, lid * 1.5))); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-10, 0, 20, 46);
    x.lineWidth = 0.35; x.strokeStyle = 'rgba(233,220,200,.25)'; for (let yy = 6; yy < 44; yy += 4) { x.beginPath(); x.moveTo(-9, yy); x.lineTo(9, yy + 2); x.moveTo(-9, yy + 2); x.lineTo(9, yy); x.stroke(); }
    x.restore(); trimPath(x); x.lineWidth = 0.5; x.strokeStyle = shade(H.trim, -0.3); x.stroke();
  }
  x.save(); const sx = Math.cos(Math.min(1, lid) * Math.PI * 0.82); x.translate(-9, 0); x.scale(sx, 1); x.translate(9, 0); // (the lid on its left hinge)
  const back = sx < 0;
  coffinPath(x); x.lineWidth = 1.5; x.strokeStyle = KEY; x.stroke();
  const g = x.createLinearGradient(-9, 0, 9, 44); g.addColorStop(0, shade(H.col, back ? -0.1 : 0.28)); g.addColorStop(0.5, shade(H.col, back ? -0.3 : 0)); g.addColorStop(1, shade(H.col, -0.45)); x.fillStyle = g; x.fill();
  x.save(); coffinPath(x); x.clip(); const r3 = rng(3); x.lineWidth = 0.3; // (the grain of the lacquered wood)
  for (let i = 0; i < 9; i++) { const X = -8 + 16 * r3(); x.strokeStyle = `rgba(0,0,0,${0.12 + 0.12 * r3()})`; x.beginPath(); x.moveTo(X, 0); x.bezierCurveTo(X + r3() - 0.5, 15, X + r3() - 0.5, 30, X + r3() * 0.6, 46); x.stroke(); }
  x.fillStyle = 'rgba(255,240,220,.1)'; x.beginPath(); x.moveTo(-5.5, 2); x.lineTo(-2, 2); x.lineTo(-6.4, 12); x.lineTo(-4, 44); x.lineTo(-6, 44); x.lineTo(-9, 12); x.closePath(); x.fill(); x.restore();
  trimPath(x); x.lineWidth = 0.6; x.strokeStyle = H.trim; x.stroke();
  if (!back) {
    ghostWheel(x, 0, 7.6, 4.0, S.ghost || [], 0.7, t, H.emb, H.trim); padlock(x, 20.2, S, t); glass(x, S, t, level);
    for (const [bx, by] of [[-4.4, 3.4], [4.4, 3.4], [-4.9, 42.6], [4.9, 42.6]]) { x.beginPath(); x.arc(bx, by, 0.7, 0, TAU); x.fillStyle = '#d9b048'; x.fill(); x.lineWidth = 0.4; x.strokeStyle = KEY; x.stroke(); } // (the corner bosses)
  }
  x.restore();
  if (S.charge >= S.fill && lid < 0.02) { x.save(); x.globalCompositeOperation = 'lighter'; coffinPath(x); x.lineWidth = 0.55; x.strokeStyle = film(t * 0.1, 0.55 + 0.2 * Math.sin(t * 1.3)); x.stroke(); x.restore(); } // (full: the seam lit with its load)
  x.beginPath(); x.arc(0, 45.6, 1.4, 0, TAU); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.6; x.strokeStyle = '#d9b048'; x.stroke(); // (the foot ring)
}

// ---------------------------------------------------------------- the Possibilikeys
function bowPath(x, s) {
  x.beginPath();
  if (s === 'brass') x.arc(0, 2.4, 2.2, 0, TAU);
  else if (s === 'invert') { x.moveTo(-2.6, 0.4); x.lineTo(2.6, 0.4); x.lineTo(0, 4.6); x.closePath(); }
  else if (s === 'even') x.rect(-2.6, 1.2, 5.2, 2.4);
  else if (s === 'loaded') x.rect(-2.2, 0.2, 4.4, 4.4);
  else if (s === 'twin') { x.moveTo(-0.2, 2.4); x.arc(-1.3, 2.4, 1.5, 0, TAU); x.moveTo(2.8, 2.4); x.arc(1.3, 2.4, 1.5, 0, TAU); }
  else if (s === 'wide') { x.moveTo(-3.4, 2.4); x.lineTo(-2.2, 0.9); x.lineTo(-2.2, 1.6); x.lineTo(2.2, 1.6); x.lineTo(2.2, 0.9); x.lineTo(3.4, 2.4); x.lineTo(2.2, 3.9); x.lineTo(2.2, 3.2); x.lineTo(-2.2, 3.2); x.lineTo(-2.2, 3.9); x.closePath(); }
  else x.arc(0, 2.4, 2.4, 0, TAU); // (echo, and any kind not drawn yet)
}
function holePath(x, s) {
  x.beginPath();
  if (s === 'brass') x.arc(0, 2.4, 1, 0, TAU);
  else if (s === 'invert') { x.moveTo(-0.9, 1.3); x.lineTo(0.9, 1.3); x.lineTo(0, 2.9); x.closePath(); }
  else if (s === 'even') { x.rect(-1.8, 1.9, 3.6, 0.4); x.rect(-1.8, 2.6, 3.6, 0.4); }
  else if (s === 'loaded') x.arc(0, 2.4, 0.6, 0, TAU);
  else if (s === 'twin') { x.arc(-1.3, 2.4, 0.6, 0, TAU); x.moveTo(1.9, 2.4); x.arc(1.3, 2.4, 0.6, 0, TAU); }
  else if (s === 'echo') { x.arc(0, 2.4, 1.6, 0, TAU); x.moveTo(0.75, 2.4); x.arc(0, 2.4, 0.75, 0, TAU, true); }
}
function keyBody(x, s) { bowPath(x, s); x.rect(-0.6, 4.4, 1.2, 6.8); x.moveTo(0.6, 8.2); x.lineTo(2.9, 8.2); x.lineTo(2.9, 9.2); x.lineTo(1.3, 9.2); x.lineTo(1.3, 10.2); x.lineTo(2.9, 10.2); x.lineTo(2.9, 11.2); x.lineTo(0.6, 11.2); x.closePath(); }

/** A Possibilikey, its bow's top at the origin and its bit 11.2 below. `used`: times it has turned (a new one is whole); o.ch its break
 *  chance if given (the cracks: a hairline a seventh of it); o.glint a film phase washed over it (the brass melting in). */
export function drawKey(x, s, colour, used, o = {}) {
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  keyBody(x, s); x.lineWidth = 1.25; x.strokeStyle = KEY; x.stroke();
  const g = x.createLinearGradient(-2, 0, 2, 11); g.addColorStop(0, shade(colour, 0.4)); g.addColorStop(0.5, colour); g.addColorStop(1, shade(colour, -0.35)); x.fillStyle = g; keyBody(x, s); x.fill('nonzero');
  holePath(x, s); x.fillStyle = '#0a0710'; x.fill('evenodd');
  if (s === 'echo') { x.beginPath(); x.arc(0, 2.4, 0.75, 0, TAU); x.fillStyle = g; x.fill(); x.lineWidth = 0.35; x.strokeStyle = KEY; x.stroke(); }
  if (s === 'loaded') { x.fillStyle = KEY; for (const [px, py] of [[-1.2, 1.2], [1.2, 3.6]]) { x.beginPath(); x.arc(px, py, 0.35, 0, TAU); x.fill(); } }
  if (s !== 'brass') {
    const ch = o.ch ?? keyCh(`key.${s}`, used), n = o.ch == null && !used ? 0 : Math.round(ch * 7), R = rng(17 + s.length * 31);
    for (let i = 0; i < n; i++) {
      const onBow = R() < 0.55; let px = onBow ? -1.6 + 3.2 * R() : -0.4 + 0.8 * R(), py = onBow ? 0.8 + 3 * R() : 5 + 5.5 * R();
      x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 3; j++) { px += (R() - 0.5) * 1.6; py += (R() - 0.3) * (1 + ch); x.lineTo(px, py); }
      x.lineWidth = 0.32; x.strokeStyle = 'rgba(20,10,16,.95)'; x.stroke(); x.lineWidth = 0.18; x.strokeStyle = 'rgba(255,255,255,.35)'; x.translate(0.2, 0); x.stroke(); x.translate(-0.2, 0);
    }
  }
  if (o.glint != null) { x.save(); x.globalCompositeOperation = 'lighter'; keyBody(x, s); x.fillStyle = film(o.glint, 0.5); x.fill(); x.restore(); }
  x.restore();
}

// ---------------------------------------------------------------- the chain and the flail's string
function notch(x, px, py, eff, st, age) {
  const pop = age < 0.18 ? 1 + 0.6 * (1 - age / 0.18) : 1, sz = { stagger: 1.7, knock: 2.3, launch: 2.0 }[eff] * pop * (st === 'next' ? 1.15 : 1);
  x.save(); x.translate(px, py); x.lineJoin = 'round';
  const fill = st === 'struck' ? '#fff2c8' : st === 'next' ? '#f2c35a' : '#b9c3cc';
  x.beginPath();
  if (eff !== 'launch') { x.moveTo(0, -sz); x.lineTo(sz, 0); x.lineTo(0, sz); x.lineTo(-sz, 0); x.closePath(); }
  else for (const o of [-0.55, 0.45]) { x.moveTo(-sz, o * sz + sz * 0.5); x.lineTo(0, o * sz - sz * 0.25); x.lineTo(sz, o * sz + sz * 0.5); x.lineTo(sz, o * sz + sz * 0.95); x.lineTo(0, o * sz + sz * 0.2); x.lineTo(-sz, o * sz + sz * 0.95); x.closePath(); }
  x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); x.fillStyle = fill; x.fill();
  if (eff === 'knock') { x.fillStyle = KEY; x.beginPath(); x.arc(0, 0, sz * 0.34, 0, TAU); x.fill(); }
  if (age < 0.2) { x.strokeStyle = `rgba(255,240,200,${1 - age / 0.2})`; x.lineWidth = 0.4; for (let i = 0; i < 4; i++) { const a = (i * TAU) / 4 + 0.4, r0 = sz + 0.6 + age * 10; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * (r0 + 1.3), Math.sin(a) * (r0 + 1.3)); x.stroke(); } }
  x.restore();
}
const FEFF = ['stagger', 'launch', 'knock'], FPOS = [0.3, 0.55, 0.8]; // (the flail's three blows: tools/lockheart/lockheart.js MOVES, f2 lifts, f3 throws)

/** The chain from the hand (the origin) out along `phi` to the bail, the flail's string on it. S.flail: { st, hitAge, runP, next, cool }. */
export function drawChain(x, phi, S, t, al) {
  const dx = Math.sin(phi), dy = Math.cos(phi); x.save(); x.globalAlpha *= al;
  for (let i = 0, n = 11; i < n; i++) {
    const s = (i + 0.5) / n; x.save(); x.globalAlpha *= C01(s / 0.25); x.translate(dx * CH_L * s, dy * CH_L * s); x.rotate(-phi);
    if (i % 2) { x.beginPath(); x.ellipse(0, 0, 0.6, 1.3, 0, 0, TAU); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.5; x.strokeStyle = '#d9b048'; x.stroke(); }
    else { x.fillStyle = KEY; x.fillRect(-0.45, -1.4, 0.9, 2.8); x.fillStyle = '#e6c56a'; x.fillRect(-0.2, -1.2, 0.4, 2.4); }
    x.restore();
  }
  const F = S.flail; let lit = 0;
  if (F.st > 0) { const to = FPOS[Math.min(2, F.st - 1)], fr = F.st > 1 ? FPOS[Math.min(2, F.st - 2)] : 0; lit = lerp(fr, to, sm(F.runP)); }
  lit = lerp(0, lit, 1 - sm(F.cool));
  if (lit > 0.02) { x.beginPath(); x.moveTo(0, 0); x.lineTo(dx * CH_L * lit, dy * CH_L * lit); x.lineCap = 'round'; x.lineWidth = 2; x.strokeStyle = 'rgba(242,195,90,.35)'; x.stroke(); x.lineWidth = 0.8; x.strokeStyle = '#ffe3a0'; x.stroke(); }
  for (let i = 0; i < 3; i++) { const s = FPOS[i], st = F.st > i && lit >= s - 0.001 ? 'struck' : i === F.next ? 'next' : 'ahead'; notch(x, dx * CH_L * s, dy * CH_L * s, FEFF[i], st, i === F.st - 1 ? F.hitAge : 9); }
  x.restore();
}
