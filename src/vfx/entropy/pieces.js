// ---------------------------------------------------------------------------------------
// THE BOARD'S PIECES (plain names; South, 2026-11-06: "cosmic-themed, abstract, eldritch and avant-garde", "I don't want you guys to anchor
// to the current artstyle"; docs/plans/ENTROPY-TACTICS.md 7): what the board view (boardview.js) stands on Entropy Tactics' tiles, made in
// one look of its own: bone-ivory made things against void black, a hue drifting slowly between ultraviolet and acid chartreuse, your side
// a cool pale cyan and theirs a warm pale vermilion. Abstract sculptures, never figurines, a court token by its suit (version 2):
// wands a lance, pentacles a wheel, swords a blade, cups a vessel, its rank as tiers at its foot. A seat's deck and discard as stacks. The Grand Bomb a black sphere in a
// corona with a ring of thirty ticks burning down, the Hungry Die a polyhedron by its sides, an Arcana a slab with its name, its class's suit and its health,
// a card ivory strokes on black. Numbers and ranks are drawn in the board's own stroke type (`strokeText`: a hairline constructivist face,
// a dot at each stroke's start), never the house's fonts; names in a plain light sans, letter-spaced.
// Looks only; every rule is Dovina's (progress/casino/entropy/).
//
// Prior art: Hearthstone's and MTG Arena's pieces read at a glance by silhouette, Brancusi's and Hepworth's abstract forms, Rez's and
// Tetris Effect's hue drift, El Lissitzky's and Rodchenko's constructivist type, Into the Breach's health pips as countable marks.
//
//   LOOK   eldritch(t, out, phase)   strokeText(ctx, str, x, y, h, opts)   new Kit()   .own(x)   .shared(key, make)   .dispose()
//   makeToken(kit, suit, owner, rank)   makePile(kit)   makeBomb(kit)   makeDie(kit)   makeArcana(kit, seat)   cardTexture(kit, card)   backTexture(kit)
//   numberSprite(kit, scale)   new Sparks(kit, cap)   .burst(at, n, color, opts)   .tick(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rankOf, suitOf } from '../../progress/casino/entropy/cards.js';

/** The look's numbers: bone, void, the two sides, the drift (real s a cycle, its hue's two ends). */
export const LOOK = {
  bone: 0xe9e2cf, void: 0x050307, ours: 0x9fe9ff, theirs: 0xffa48c, ink: '#ece6d6', inkDim: 'rgba(236,230,214,0.45)',
  drift: { rate: 0.33, from: 0.75, span: 0.52, s: 0.95, l: 0.62 }, // (hue 0.75 ultraviolet, down through blue and cyan to 0.23 chartreuse)
  side: (owner) => (owner === 0 ? LOOK.ours : LOOK.theirs), sideCss: (owner) => (owner === 0 ? '#9fe9ff' : '#ffa48c'),
};
/** The eldritch hue now (a phase offsets it, so two things never drift in step). */
export function eldritch(t, out = new THREE.Color(), phase = 0) {
  const D = LOOK.drift, k = 0.5 + 0.5 * Math.sin(t * D.rate + phase);
  return out.setHSL(D.from - D.span * k, D.s, D.l);
}

// ------------------------------------------------------------- the stroke type
/** Glyphs on a 4 x 6 grid (x right, y down), each a list of polylines. Digits, the ranks' letters (A, P, N for the knight, Q, K), d. */
const GLYPH = {
  0: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[4, 0], [0, 6]]],
  1: [[[0, 1.2], [1.4, 0], [1.4, 6]]],
  2: [[[0, 0], [4, 0], [4, 3], [0, 3], [0, 6], [4, 6]]],
  3: [[[0, 0], [4, 0], [4, 6], [0, 6]], [[1.4, 3], [4, 3]]],
  4: [[[0, 0], [0, 3.6], [4, 3.6]], [[3, 1.6], [3, 6]]],
  5: [[[4, 0], [0, 0], [0, 2.8], [4, 2.8], [4, 6], [0, 6]]],
  6: [[[4, 0], [0, 0], [0, 6], [4, 6], [4, 3], [0, 3]]],
  7: [[[0, 0], [4, 0], [1.4, 6]]],
  8: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 3], [4, 3]]],
  9: [[[4, 3], [0, 3], [0, 0], [4, 0], [4, 6], [0, 6]]],
  A: [[[0, 6], [2, 0], [4, 6]], [[1, 3.8], [3, 3.8]]],
  P: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  Q: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[2.4, 4], [4.4, 6.4]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.4], [4, 6]]],
  d: [[[4, 0], [4, 6], [0, 6], [0, 2.6], [4, 2.6]]],
};
const wOf = (ch) => (ch === '1' ? 1.4 : GLYPH[ch] ? 4 : 2.6);
/** A string in the stroke type, `h` px tall, centred on (x, y) (or `align` left / right). A dot marks each stroke's start. */
export function strokeText(c, str, x, y, h, { lw = h * 0.085, align = 'center', dots = true, gap = 1.5 } = {}) {
  const u = h / 6, s = String(str); let total = 0;
  for (const ch of s) total += wOf(ch) + gap; total = (total - gap) * u;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'miter';
  for (const ch of s) {
    for (const pl of GLYPH[ch] || []) {
      c.beginPath(); pl.forEach(([a, b], i) => (i ? c.lineTo(cx + a * u, y - h / 2 + b * u) : c.moveTo(cx + a * u, y - h / 2 + b * u))); c.stroke();
      if (dots) { c.beginPath(); c.arc(cx + pl[0][0] * u, y - h / 2 + pl[0][1] * u, lw * 1.1, 0, 7); c.fill(); }
    }
    cx += (wOf(ch) + gap) * u;
  }
}
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'N', 'Q', 'K'];
/** A suit's own glyph (cups a bowl on a stem, swords a blade and guard, pentacles a ring and its star, wands a budded staff). */
function suitGlyph(c, suit, x, y, r, lw) {
  c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  if (suit === 0) { c.arc(x, y - r * 0.35, r * 0.75, 0, Math.PI); c.moveTo(x - r * 0.75, y - r * 0.35); c.lineTo(x + r * 0.75, y - r * 0.35); c.moveTo(x, y + r * 0.4); c.lineTo(x, y + r); c.moveTo(x - r * 0.45, y + r); c.lineTo(x + r * 0.45, y + r); }
  else if (suit === 1) { c.moveTo(x, y - r); c.lineTo(x, y + r); c.moveTo(x - r * 0.55, y + r * 0.45); c.lineTo(x + r * 0.55, y + r * 0.45); c.moveTo(x - r * 0.12, y - r * 0.75); c.lineTo(x, y - r); c.lineTo(x + r * 0.12, y - r * 0.75); }
  else if (suit === 2) { c.arc(x, y, r, 0, 7); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 2 * 2 * Math.PI) / 5, px = x + Math.cos(a) * r * 0.92, py = y + Math.sin(a) * r * 0.92; if (i) c.lineTo(px, py); else c.moveTo(px, py); } }
  else { c.moveTo(x - r * 0.55, y + r); c.lineTo(x + r * 0.55, y - r); for (const k of [-0.3, 0.15]) { const px = x + k * r * 0.55 * 2, py = y - k * r * 2; c.moveTo(px, py); c.lineTo(px + r * 0.35, py + r * 0.05); } c.moveTo(x + r * 0.55 + r * 0.16, y - r); c.arc(x + r * 0.55, y - r, r * 0.16, 0, 7); }
  c.stroke();
}

// ------------------------------------------------------------- what a seat owns, disposed whole on leave
export class Kit {
  constructor() { this.list = new Set(); this.cache = new Map(); }
  own(x) { this.list.add(x); return x; }
  shared(key, make) { let x = this.cache.get(key); if (!x) { x = this.own(make()); this.cache.set(key, x); } return x; }
  canvas(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const tex = this.own(new THREE.CanvasTexture(cv)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return { cv, c: cv.getContext('2d'), tex }; }
  dispose() { for (const x of this.list) x.dispose?.(); this.list.clear(); this.cache.clear(); }
}
const boneMat = (kit, emissive = 0.1) => kit.own(new THREE.MeshStandardMaterial({ color: LOOK.bone, roughness: 0.5, metalness: 0.05, flatShading: true, emissive: new THREE.Color(LOOK.bone).multiplyScalar(emissive) }));
const glowMat = (kit, color, extra = {}) => kit.own(new THREE.MeshBasicMaterial({ color, toneMapped: false, ...extra }));
const voidMat = (kit) => kit.shared('mat.void', () => new THREE.MeshStandardMaterial({ color: LOOK.void, roughness: 0.12, metalness: 0.7 }));

/** A number in the stroke type on a sprite over a thing (redrawn only when it changes), always on top. */
export function numberSprite(kit, scale = 0.8) {
  const { c, tex } = kit.canvas(256, 128), mat = kit.own(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
  const sprite = new THREE.Sprite(mat); sprite.scale.set(scale * 2, scale, 1); sprite.renderOrder = 30; let last = null;
  return { sprite, set(str, color = LOOK.ink) {
    const key = `${str}|${color}`; if (key === last) return; last = key;
    c.clearRect(0, 0, 256, 128); c.strokeStyle = 'rgba(3,2,6,0.85)'; c.fillStyle = 'rgba(3,2,6,0.85)'; strokeText(c, str, 128, 64, 80, { lw: 16 });
    c.strokeStyle = color; c.fillStyle = color; strokeText(c, str, 128, 64, 80, { lw: 6.5 }); tex.needsUpdate = true;
  } };
}

// ------------------------------------------------------------- a court token by its suit
/** { group, body (its bone material, lit and flashed alone), ring (its side's mark on the tile), spin ([mesh, axis] that turn), top }.
 *  By suit (version 2, ENTROPY-TACTICS.md 8.4): wands a lance (the strike), pentacles a wheel (the claim), swords a blade (the fight),
 *  cups a vessel (the return); its rank (page 1 .. king 4, the Empress's +1) as that many tiers of its owner's colour at its foot. */
export function makeToken(kit, suit, owner, rank = 1) {
  const g = new THREE.Group(), body = boneMat(kit), side = glowMat(kit, LOOK.side(owner)), vm = voidMat(kit), spin = [];
  const add = (key, make, mat, x, y, z, rx = 0, ry = 0, rz = 0, sc = null) => { const m = new THREE.Mesh(kit.shared(`geo.${key}`, make), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); if (sc) m.scale.set(...sc); g.add(m); return m; };
  let top = 1.4;
  if (suit === 3) { // wands: a lance, its point up, a void collar
    add('lance', () => new THREE.ConeGeometry(0.14, 1.25, 4), body, 0, 0.98, 0, 0, Math.PI / 4, 0);
    add('shaft', () => new THREE.CylinderGeometry(0.05, 0.07, 0.4, 6), body, 0, 0.36, 0);
    spin.push([add('collar', () => new THREE.TorusGeometry(0.17, 0.035, 4, 4), vm, 0, 0.42, 0, Math.PI / 2, 0, 0), 'z']);
    top = 1.62;
  } else if (suit === 2) { // pentacles: a wheel stood up, a void pentagon at its hub
    spin.push([add('wheel', () => new THREE.CylinderGeometry(0.44, 0.44, 0.07, 40), body, 0, 0.66, 0, Math.PI / 2, 0, 0), 'y']);
    add('hub', () => new THREE.CylinderGeometry(0.2, 0.2, 0.09, 5), vm, 0, 0.66, 0, Math.PI / 2, 0, 0);
    add('axle', () => new THREE.BoxGeometry(0.06, 0.24, 0.06), body, 0, 0.12, 0);
    top = 1.15;
  } else if (suit === 1) { // swords: a blade, point up, over a guard
    add('blade', () => new THREE.OctahedronGeometry(0.5, 0), body, 0, 0.98, 0, 0, 0, 0, [0.26, 1.5, 0.06]);
    add('guard', () => new THREE.BoxGeometry(0.5, 0.05, 0.09), vm, 0, 0.26, 0);
    add('grip', () => new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), body, 0, 0.12, 0);
    top = 1.75;
  } else { // cups: a vessel, its mouth a void
    add('cup', () => new THREE.LatheGeometry([[0, 0], [0.24, 0], [0.26, 0.04], [0.06, 0.12], [0.05, 0.42], [0.12, 0.5], [0.3, 0.72], [0.36, 0.98], [0.34, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)), 24), body, 0, 0.02, 0);
    add('mouth', () => new THREE.CircleGeometry(0.33, 24), vm, 0, 0.99, 0, -Math.PI / 2, 0, 0);
    top = 1.15;
  }
  for (let i = 0; i < Math.min(5, rank); i++) add('tier', () => new THREE.CylinderGeometry(0.4, 0.42, 0.035, 24), side, 0, 0.1 + i * 0.055, 0, 0, 0, 0, [1 - i * 0.12, 1, 1 - i * 0.12]);
  add('plinthVoid', () => new THREE.CylinderGeometry(0.52, 0.56, 0.06, 32), vm, 0, 0.03, 0);
  const ring = new THREE.Mesh(kit.shared('geo.base', () => new THREE.RingGeometry(0.56, 0.64, 48)), glowMat(kit, LOOK.side(owner), { transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.065; g.add(ring);
  return { group: g, body, ring, spin, top, suit, owner, rank };
}
/** A seat's deck or discard pile: a short stack of cards, its height its count, its top a card's face or the back; its count over it. */
export function makePile(kit) {
  const side = kit.shared('mat.pileSide', () => new THREE.MeshBasicMaterial({ color: 0x2a2630, toneMapped: false })), topM = kit.own(new THREE.MeshBasicMaterial({ toneMapped: false, map: backTexture(kit) }));
  const mesh = new THREE.Mesh(kit.shared('geo.pile', () => new THREE.BoxGeometry(0.5, 1, 0.7).translate(0, 0.5, 0)), [side, side, topM, side, side, side]);
  const num = numberSprite(kit, 0.34), g = new THREE.Group(); g.add(mesh, num.sprite);
  let last = null;
  return { group: g, mesh, set(n, face) {
    mesh.scale.y = 0.02 + 0.011 * n; mesh.visible = n > 0; num.sprite.position.y = mesh.scale.y + 0.35; num.set(n, LOOK.ink);
    const map = face == null ? backTexture(kit) : cardTexture(kit, face); if (map !== last) { last = map; topM.map = map; topM.needsUpdate = true; }
  } };
}

// ------------------------------------------------------------- the Grand Bomb
const radial = (kit, key, stops) => kit.shared(key, () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [at, a] of stops) gr.addColorStop(at, `rgba(255,255,255,${a})`);
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
});
/** { group, core, corona, ticks (30, instanced), num, setCounter(n, hue) }. */
export function makeBomb(kit) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(kit.own(new THREE.SphereGeometry(0.46, 32, 20)), kit.own(new THREE.MeshStandardMaterial({ color: 0x010102, roughness: 0.1, metalness: 0.85 }))); core.position.y = 0.62; g.add(core);
  const corona = new THREE.Sprite(kit.own(new THREE.SpriteMaterial({ map: radial(kit, 'tex.corona', [[0, 0], [0.33, 0], [0.4, 0.95], [0.52, 0.4], [0.75, 0.08], [1, 0]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  corona.position.y = 0.62; corona.scale.setScalar(2.5); g.add(corona);
  const ticks = new THREE.InstancedMesh(kit.own(new THREE.BoxGeometry(0.04, 0.03, 0.17)), glowMat(kit, 0xffffff), 30), m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; q.setFromAxisAngle(Y, -a); m.compose(new THREE.Vector3(Math.sin(a) * 0.86, 0.05, -Math.cos(a) * 0.86), q, new THREE.Vector3(1, 1, 1)); ticks.setMatrixAt(i, m); ticks.setColorAt(i, new THREE.Color(0x111111)); }
  ticks.frustumCulled = false; g.add(ticks);
  const num = numberSprite(kit, 0.62); num.sprite.position.y = 1.6; g.add(num.sprite);
  const lit = new THREE.Color(), dark = new THREE.Color(0x1a1620), bone = new THREE.Color(LOOK.bone);
  return { group: g, core, corona, ticks, num, setCounter(n, hue) {
    for (let i = 0; i < 30; i++) ticks.setColorAt(i, i < n ? lit.copy(hue).lerp(bone, i === n - 1 ? 0.1 : 0.55) : dark);
    ticks.instanceColor.needsUpdate = true; num.set(Math.max(0, n));
  } };
}

// ------------------------------------------------------------- the Hungry Die
function bipyramid(n, r, h) {
  const p = [], top = [0, h, 0], bot = [0, -h, 0], eq = (i) => [Math.cos((i / n) * Math.PI * 2) * r, 0, Math.sin((i / n) * Math.PI * 2) * r];
  for (let i = 0; i < n; i++) { const a = eq(i), b = eq(i + 1); p.push(...top, ...b, ...a, ...bot, ...a, ...b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}
const DIE_GEO = { 4: () => new THREE.TetrahedronGeometry(0.36), 6: () => new THREE.BoxGeometry(0.44, 0.44, 0.44), 8: () => new THREE.OctahedronGeometry(0.36), 10: () => bipyramid(5, 0.33, 0.3), 12: () => new THREE.DodecahedronGeometry(0.34), 20: () => new THREE.IcosahedronGeometry(0.36) };
/** { group, spinner (the polyhedron and its edges, turned alone), num, setSides(n), edges (its line material, tinted by the drift) }. */
export function makeDie(kit) {
  const g = new THREE.Group(), spinner = new THREE.Group(); g.add(spinner);
  const body = boneMat(kit, 0.16), edgeM = kit.own(new THREE.LineBasicMaterial({ color: 0xffffff, toneMapped: false }));
  const mesh = new THREE.Mesh(undefined, body), lines = new THREE.LineSegments(undefined, edgeM); spinner.add(mesh, lines);
  const num = numberSprite(kit, 0.5); num.sprite.position.y = 0.75; g.add(num.sprite);
  let sides = 0;
  return { group: g, spinner, num, edges: edgeM, body, get sides() { return sides; }, setSides(n) {
    if (n === sides) return; sides = n;
    mesh.geometry = kit.shared(`die.${n}`, DIE_GEO[n] || DIE_GEO[6]); lines.geometry = kit.shared(`die.edge.${n}`, () => new THREE.EdgesGeometry(mesh.geometry, 1));
  } };
}

// ------------------------------------------------------------- an Arcana's slab
/** { mesh, draw({ label, hp, max, flash, lit, owner }) } : a thin slab, its face the canvas (name, a sigil, health as a number and a bar). */
export function makeArcana(kit, seat) {
  const { c, tex } = kit.canvas(256, 400), face = kit.own(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })), side = boneMat(kit, 0.12), back = voidMat(kit);
  const mesh = new THREE.Mesh(kit.shared('geo.slab', () => new THREE.BoxGeometry(1.25, 1.95, 0.09)), [side, side, side, side, face, back]);
  let last = '';
  return { mesh, side, draw({ label, hp, max, flash = 0, lit = 0, suit = null }) {
    const key = `${label}|${hp}|${max}|${Math.round(flash * 8)}|${Math.round(lit * 4)}|${suit}`; if (key === last) return; last = key;
    const col = LOOK.sideCss(seat), W = 256, H = 400;
    c.fillStyle = '#050307'; c.fillRect(0, 0, W, H);
    c.strokeStyle = LOOK.ink; c.lineWidth = 2; c.strokeRect(9, 9, W - 18, H - 18); c.lineWidth = 1; c.strokeStyle = LOOK.inkDim; c.strokeRect(16, 16, W - 32, H - 32);
    c.fillStyle = col; c.fillRect(16, 16, 3, H - 32);
    c.fillStyle = LOOK.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '5px';
    let px = 24; do { c.font = `300 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`; px--; } while (c.measureText(label.toUpperCase()).width > W - 56 && px > 10);
    c.fillText(label.toUpperCase(), W / 2 + 2, 52); c.letterSpacing = '0px';
    c.strokeStyle = LOOK.ink; c.lineWidth = 1.5;
    if (suit == null) { c.beginPath(); c.ellipse(W / 2, 140, 54, 26, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(W / 2, 140, 15, 0, 7); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(W / 2, 140, 6, 0, 7); c.fill(); } // (the Fool: no suit, the open eye)
    else { c.strokeStyle = col; suitGlyph(c, suit, W / 2, 140, 44, 4); c.strokeStyle = LOOK.ink; }
    c.beginPath(); c.moveTo(W / 2, 84); c.lineTo(W / 2, 92); c.moveTo(W / 2, 188); c.lineTo(W / 2, 196); c.stroke();
    c.strokeStyle = LOOK.ink; c.fillStyle = LOOK.ink; strokeText(c, Math.max(0, hp), W / 2, 268, 74, { lw: 5 });
    const bw = W - 64, k = Math.max(0, Math.min(1, hp / max));
    c.strokeStyle = LOOK.inkDim; c.lineWidth = 1; c.strokeRect(32, 330, bw, 12); c.fillStyle = col; c.fillRect(34, 332, (bw - 4) * k, 8);
    for (let i = 1; i < max; i++) if (i % 5 === 0) { c.fillStyle = '#050307'; c.fillRect(32 + (bw * i) / max, 330, 1.5, 12); }
    if (lit > 0) { c.strokeStyle = `rgba(236,230,214,${0.5 + lit * 0.5})`; c.lineWidth = 4; c.strokeRect(3, 3, W - 6, H - 6); }
    if (flash > 0) { c.fillStyle = `rgba(255,255,255,${flash * 0.7})`; c.fillRect(0, 0, W, H); }
    tex.needsUpdate = true;
  } };
}

// ------------------------------------------------------------- the cards
/** A card's face (cached on the kit): its rank in the stroke type at two corners, its suit's glyph, ivory on black. */
export function cardTexture(kit, card) {
  return kit.shared(`card.${card}`, () => {
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 232; const c = cv.getContext('2d'), r = RANK[rankOf(card)], s = suitOf(card);
    c.fillStyle = '#050307'; c.fillRect(0, 0, 160, 232); c.strokeStyle = LOOK.ink; c.fillStyle = LOOK.ink;
    c.lineWidth = 2; c.strokeRect(7, 7, 146, 218); c.lineWidth = 1; c.strokeStyle = LOOK.inkDim; c.strokeRect(12, 12, 136, 208); c.strokeStyle = LOOK.ink;
    strokeText(c, r, 22, 36, 30, { lw: 2.8, align: 'left' }); suitGlyph(c, s, 34, 74, 11, 2);
    c.save(); c.translate(160, 232); c.rotate(Math.PI); strokeText(c, r, 22, 36, 30, { lw: 2.8, align: 'left' }); suitGlyph(c, s, 34, 74, 11, 2); c.restore();
    suitGlyph(c, s, 80, 124, 30, 3);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  });
}
/** The face-down back: a vesica and its pupil, ivory on black. */
export function backTexture(kit) {
  return kit.shared('card.back', () => {
    const cv = document.createElement('canvas'); cv.width = 80; cv.height = 116; const c = cv.getContext('2d');
    c.fillStyle = '#050307'; c.fillRect(0, 0, 80, 116); c.strokeStyle = LOOK.ink; c.lineWidth = 1.5; c.strokeRect(4, 4, 72, 108);
    c.beginPath(); c.arc(40, 30, 40, Math.PI * 0.32, Math.PI * 0.68); c.arc(40, 86, 40, Math.PI * 1.32, Math.PI * 1.68); c.stroke(); c.beginPath(); c.arc(40, 58, 6, 0, 7); c.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// ------------------------------------------------------------- motes and sparks
/** A pool of additive points: a burst flies out, slows, falls a little and fades (a token frayed, a hit, the bomb pushed). */
export class Sparks {
  constructor(kit, cap = 700) {
    this.cap = cap; this.i = 0; this.pos = new Float32Array(cap * 3).fill(-1e4); this.col = new Float32Array(cap * 3); this.vel = new Float32Array(cap * 3); this.base = new Float32Array(cap * 3); this.life = new Float32Array(cap); this.max = new Float32Array(cap);
    const g = kit.own(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, kit.own(new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    this.points.frustumCulled = false; this.points.renderOrder = 10;
  }
  burst(at, n, color, { speed = 1.6, up = 0.8, life = 1.1, height = 0, radius = 0.1, gravity = -0.5 } = {}) {
    const c = color.isColor ? color : new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const i = (this.i = (this.i + 1) % this.cap), j = i * 3, a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, sp = speed * (0.35 + Math.random() * 0.65);
      this.pos[j] = at.x + Math.cos(a) * radius; this.pos[j + 1] = at.y + Math.random() * height; this.pos[j + 2] = at.z + Math.sin(a) * radius;
      this.vel[j] = Math.cos(a) * Math.sqrt(1 - e * e) * sp; this.vel[j + 1] = e * sp * 0.5 + up * (0.5 + Math.random()); this.vel[j + 2] = Math.sin(a) * Math.sqrt(1 - e * e) * sp;
      this.base[j] = c.r; this.base[j + 1] = c.g; this.base[j + 2] = c.b; this.max[i] = this.life[i] = life * (0.6 + Math.random() * 0.6); this.grav = gravity;
    }
  }
  tick(dt) {
    const drag = Math.exp(-1.6 * dt);
    for (let i = 0; i < this.cap; i++) {
      const j = i * 3; if (this.life[i] <= 0) { if (this.pos[j + 1] > -1e3) { this.pos[j + 1] = -1e4; this.col[j] = this.col[j + 1] = this.col[j + 2] = 0; } continue; }
      this.life[i] -= dt; const k = Math.max(0, this.life[i] / this.max[i]);
      this.vel[j] *= drag; this.vel[j + 1] = this.vel[j + 1] * drag + (this.grav ?? -0.5) * dt; this.vel[j + 2] *= drag;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      this.col[j] = this.base[j] * k; this.col[j + 1] = this.base[j + 1] * k; this.col[j + 2] = this.base[j + 2] * k;
    }
    const g = this.points.geometry; g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  }
}
