// ---------------------------------------------------------------------------------------
// THE BOARD'S PIECES (plain names; South, 2026-11-06: "cosmic-themed, abstract, eldritch and avant-garde", "I don't want you guys to anchor
// to the current artstyle"; docs/plans/ENTROPY-TACTICS.md 7): what the board view (boardview.js) stands on Entropy Tactics' tiles, made in
// one look of its own: bone-ivory made things against void black, a hue drifting slowly between ultraviolet and acid chartreuse, your side
// a cool pale cyan and theirs a warm pale vermilion. Abstract sculptures, never figurines, a court token read by its parts (makeToken:
// its suit by silhouette and a floating glyph, its owner as its disc and band, its rank as tiers under it, its speed as chevrons the way it
// marches, its health as the band's segments). A seat's deck and discard as stacks. The Grand Bomb a black sphere in a corona with a ring
// of thirty ticks burning down (its number the countdown's, countdown.js), the Hungry Die a polyhedron by its sides (the Arcana are
// portraits.js's), a card ivory strokes on black. Numbers and ranks are drawn in the board's own stroke type (`strokeText`: a hairline constructivist face,
// a dot at each stroke's start), never the house's fonts; names in a plain light sans, letter-spaced.
// Looks only; every rule is Dovina's (progress/casino/entropy/).
//
// Prior art: Hearthstone's and MTG Arena's pieces read at a glance by silhouette, Brancusi's and Hepworth's abstract forms, Rez's and
// Tetris Effect's hue drift, El Lissitzky's and Rodchenko's constructivist type, Into the Breach's health pips as countable marks and its
// move arrows, Advance Wars' and Fire Emblem's units read by silhouette from far off, chess's Staunton pieces (height as rank).
//
//   LOOK   eldritch(t, out, phase)   strokeText(ctx, str, x, y, h, opts)   new Kit()   .own(x)   .shared(key, make)   .dispose()
//   makeToken(kit, suit, owner, rank, speed)   makePile(kit)   makeBomb(kit)   makeDie(kit)   cardTexture(kit, card)   backTexture(kit)
//   numberSprite(kit, scale)   suitGlyph(ctx, suit, x, y, r, lw)   glyphTexture(kit, suit, owner)   strokeWidth(str, h)   new Sparks(kit, cap)   .burst(at, n, color, opts)   .tick(dt)
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
/** How wide a string in the stroke type is at `h` px (strokeText's own measure). */
export const strokeWidth = (str, h, gap = 1.5) => { let t = 0; for (const ch of String(str)) t += wOf(ch) + gap; return Math.max(0, t - gap) * (h / 6); };
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'N', 'Q', 'K'];
/** A suit's own glyph (cups a bowl on a stem, swords a blade and guard, pentacles a ring and its star, wands a budded staff). */
export function suitGlyph(c, suit, x, y, r, lw) {
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
/** A suit's glyph as a small sprite's texture (cached a suit and side): its owner's colour on a void disc, ringed in bone. */
export function glyphTexture(kit, suit, owner) {
  return kit.shared(`glyph.${suit}.${owner}`, () => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    c.fillStyle = 'rgba(5,3,7,0.88)'; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fill(); c.strokeStyle = LOOK.sideCss(owner); c.lineWidth = 5; c.beginPath(); c.arc(64, 64, 55, 0, 7); c.stroke();
    c.strokeStyle = LOOK.ink; suitGlyph(c, suit, 64, 64, 32, 7);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}
const TOKEN = { base: 0.64, baseH: 0.09, band: 0.07, tier: 0.075, tierGap: 0.03, tierR: 0.36, chev: 0.07, dark: 0x16121c };
/** { group, body, ring (its owner's band: whole, or its health's segments), spin, top, glyph, tick(dt), health(hp, max) }. Read from the
 *  seated camera with the far rows softened, so each part says one mechanic, big: its SUIT by its silhouette (wands a lance: it strikes;
 *  pentacles a wheel: it claims; swords a blade: it fights; cups a vessel: it mends and goes home) and again as a floating glyph that reads
 *  as a speck; its OWNER as the base disc's face and a bright band round it (yours cyan, theirs vermilion); its RANK (page 1 .. king 4,
 *  the Empress's +1) as that many tiers stacked under the body, so a higher rank stands taller; its SPEED (tiles a turn, tokens.js speedOf)
 *  as bone chevrons on the disc pointing the way it marches; its HEALTH (when the rules give `t.hp`) as the band cut into segments, a lost
 *  one ticking out dark through a white flash. */
export function makeToken(kit, suit, owner, rank = 1, speed = rank) {
  const g = new THREE.Group(), body = boneMat(kit), sideC = new THREE.Color(LOOK.side(owner)), vm = voidMat(kit), spin = [], T = TOKEN;
  const face = kit.shared(`mat.face.${owner}`, () => new THREE.MeshBasicMaterial({ color: sideC.clone().multiplyScalar(0.42), toneMapped: false }));
  const tierM = kit.shared(`mat.tier.${owner}`, () => new THREE.MeshBasicMaterial({ color: sideC, toneMapped: false })), chevM = kit.shared('mat.chev', () => new THREE.MeshBasicMaterial({ color: LOOK.bone, toneMapped: false }));
  const add = (key, make, mat, x, y, z, rx = 0, ry = 0, rz = 0, sc = null, to = g) => { const m = new THREE.Mesh(kit.shared(`geo.${key}`, make), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); if (sc) m.scale.set(...sc); to.add(m); return m; };
  // the base: a void disc, its face its owner's, its band bright
  add('tokBase', () => new THREE.CylinderGeometry(T.base, T.base + 0.03, T.baseH, 40), vm, 0, T.baseH / 2, 0);
  add('tokFace', () => new THREE.CircleGeometry(T.base - 0.02, 40), face, 0, T.baseH + 0.002, 0, -Math.PI / 2);
  const ring = new THREE.Group(); ring.position.y = T.baseH * 0.5; g.add(ring);
  const whole = add('tokBand', () => new THREE.CylinderGeometry(T.base + 0.035, T.base + 0.035, T.band, 40, 1, true), kit.own(new THREE.MeshBasicMaterial({ color: sideC, toneMapped: false, side: THREE.DoubleSide })), 0, 0, 0, 0, 0, 0, null, ring);
  // the speed: chevrons on the disc's leading half, pointing the march (yours away from you, -z; theirs +z)
  const fw = owner === 0 ? -1 : 1, n = Math.max(1, Math.min(6, speed)), stepZ = Math.min(T.chev, 0.24 / n);
  const chevGeo = kit.shared('geo.chev', () => { const s = new THREE.Shape(); s.moveTo(-0.15, 0); s.lineTo(0, -0.1); s.lineTo(0.15, 0); s.lineTo(0.15, 0.035); s.lineTo(0, -0.065); s.lineTo(-0.15, 0.035); s.closePath(); return new THREE.ShapeGeometry(s); });
  // (the shape points +z laid flat: turned for a march toward -z)
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(chevGeo, chevM); m.rotation.set(-Math.PI / 2, 0, fw < 0 ? Math.PI : 0); m.position.set(0, T.baseH + 0.006, fw * (T.tierR + 0.06 + i * stepZ)); g.add(m); }
  // the rank: tiers of its owner's colour stacked under the body, void between
  let y = T.baseH;
  for (let i = 0; i < Math.min(5, rank); i++) {
    const r = T.tierR - i * 0.035;
    add('tokGap', () => new THREE.CylinderGeometry(1, 1, 1, 28), vm, 0, y + T.tierGap / 2, 0, 0, 0, 0, [r - 0.03, T.tierGap, r - 0.03]);
    add('tokTier', () => new THREE.CylinderGeometry(1, 1, 1, 28), tierM, 0, y + T.tierGap + T.tier / 2, 0, 0, 0, 0, [r, T.tier, r]); y += T.tierGap + T.tier;
  }
  const b = new THREE.Group(); b.position.y = y; g.add(b); let top;
  if (suit === 3) { // wands: a lance, point up, a void collar turning on its shaft
    add('wShaft', () => new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8), body, 0, 0.25, 0, 0, 0, 0, null, b);
    add('wLance', () => new THREE.ConeGeometry(0.2, 1.05, 4), body, 0, 1.0, 0, 0, Math.PI / 4, 0, null, b);
    spin.push([add('wCollar', () => new THREE.TorusGeometry(0.2, 0.045, 4, 4), vm, 0, 0.5, 0, Math.PI / 2, 0, 0, null, b), 'z']);
    top = 1.55;
  } else if (suit === 2) { // pentacles: a wheel stood face on, five spokes, a void hub, turning
    const wheel = new THREE.Group(); wheel.position.y = 0.52; b.add(wheel); spin.push([wheel, 'z']);
    add('pRim', () => new THREE.TorusGeometry(0.4, 0.07, 6, 40), body, 0, 0, 0, 0, 0, 0, null, wheel);
    for (let i = 0; i < 5; i++) add('pSpoke', () => new THREE.BoxGeometry(0.05, 0.4, 0.05).translate(0, 0.2, 0), body, 0, 0, 0, 0, 0, (i * 2 * Math.PI) / 5, null, wheel);
    add('pHub', () => new THREE.CylinderGeometry(0.13, 0.13, 0.12, 5), vm, 0, 0, 0, Math.PI / 2, 0, 0, null, wheel);
    add('pPost', () => new THREE.BoxGeometry(0.08, 0.12, 0.08), body, 0, 0.06, 0, 0, 0, 0, null, b);
    top = 1.0;
  } else if (suit === 1) { // swords: a broad blade, point up, over a wide guard
    add('sBlade', () => new THREE.OctahedronGeometry(0.5, 0), body, 0, 0.98, 0, 0, 0, 0, [0.34, 1.55, 0.08], b);
    add('sGuard', () => new THREE.BoxGeometry(0.66, 0.07, 0.12), vm, 0, 0.24, 0, 0, 0, 0, null, b);
    add('sGrip', () => new THREE.CylinderGeometry(0.045, 0.045, 0.2, 6), body, 0, 0.1, 0, 0, 0, 0, null, b);
    top = 1.78;
  } else { // cups: a wide chalice, its mouth a void
    add('cCup', () => new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.32, 0.05], [0.07, 0.14], [0.06, 0.42], [0.16, 0.5], [0.4, 0.72], [0.46, 0.98], [0.43, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)), 28), body, 0, 0.0, 0, 0, 0, 0, null, b);
    add('cMouth', () => new THREE.CircleGeometry(0.42, 28), vm, 0, 0.98, 0, -Math.PI / 2, 0, 0, null, b);
    top = 1.05;
  }
  top += y;
  const glyph = new THREE.Sprite(kit.shared(`mat.glyph.${suit}.${owner}`, () => new THREE.SpriteMaterial({ map: glyphTexture(kit, suit, owner), transparent: true, depthWrite: false, depthTest: false, toneMapped: false })));
  glyph.scale.setScalar(0.5); glyph.position.y = top + 0.4; glyph.renderOrder = 26; g.add(glyph);
  // the health: the band cut into segments (built when the rules first give a max)
  let segs = [], segMax = 0; const dark = new THREE.Color(T.dark), white = new THREE.Color(1, 1, 1);
  function health(hp, max) {
    if (max == null || hp == null) { whole.visible = true; for (const s of segs) s.mesh.visible = false; return; }
    if (max !== segMax) {
      for (const s of segs) ring.remove(s.mesh); segs = []; segMax = max; whole.visible = false; const gap = max > 1 ? 0.12 : 0, arc = (Math.PI * 2) / max;
      for (let i = 0; i < max; i++) {
        const geo = kit.shared(`geo.seg.${max}.${i}`, () => new THREE.CylinderGeometry(T.base + 0.04, T.base + 0.04, T.band * 1.5, Math.max(3, Math.ceil(40 / max)), 1, true, Math.PI + i * arc + gap / 2, arc - gap));
        const mat = kit.own(new THREE.MeshBasicMaterial({ color: sideC, toneMapped: false, side: THREE.DoubleSide })), mesh = new THREE.Mesh(geo, mat); ring.add(mesh); segs.push({ mesh, mat, k: 1, alive: true, flash: 0 });
      }
    }
    segs.forEach((s, i) => { const alive = i < hp; if (s.alive && !alive) s.flash = 1; s.alive = alive; });
  }
  function tick(dt) { for (const s of segs) { s.k += ((s.alive ? 1 : 0) - s.k) * Math.min(1, dt * 5); s.flash = Math.max(0, s.flash - dt * 2.2); s.mat.color.copy(dark).lerp(sideC, s.k).lerp(white, s.flash); s.mesh.scale.setScalar(1 + s.flash * 0.18); } }
  return { group: g, body, ring: whole, spin, top, glyph, suit, owner, rank, health, tick };
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
/** { group, core, corona, ticks (30, instanced), setCounter(n, hue) }: the ring burns down here; the number is the countdown's (countdown.js). */
export function makeBomb(kit) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(kit.own(new THREE.SphereGeometry(0.46, 32, 20)), kit.own(new THREE.MeshStandardMaterial({ color: 0x010102, roughness: 0.1, metalness: 0.85 }))); core.position.y = 0.62; g.add(core);
  const corona = new THREE.Sprite(kit.own(new THREE.SpriteMaterial({ map: radial(kit, 'tex.corona', [[0, 0], [0.33, 0], [0.4, 0.95], [0.52, 0.4], [0.75, 0.08], [1, 0]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  corona.position.y = 0.62; corona.scale.setScalar(2.5); g.add(corona);
  const ticks = new THREE.InstancedMesh(kit.own(new THREE.BoxGeometry(0.04, 0.03, 0.17)), glowMat(kit, 0xffffff), 30), m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; q.setFromAxisAngle(Y, -a); m.compose(new THREE.Vector3(Math.sin(a) * 0.86, 0.05, -Math.cos(a) * 0.86), q, new THREE.Vector3(1, 1, 1)); ticks.setMatrixAt(i, m); ticks.setColorAt(i, new THREE.Color(0x111111)); }
  ticks.frustumCulled = false; g.add(ticks);
  const lit = new THREE.Color(), dark = new THREE.Color(0x1a1620), bone = new THREE.Color(LOOK.bone);
  return { group: g, core, corona, ticks, setCounter(n, hue) { // (its number is the countdown's: countdown.js)
    for (let i = 0; i < 30; i++) ticks.setColorAt(i, i < n ? lit.copy(hue).lerp(bone, i === n - 1 ? 0.1 : 0.55) : dark);
    ticks.instanceColor.needsUpdate = true;
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
