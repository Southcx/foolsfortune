// ---------------------------------------------------------------------------------------
// THE DUEL'S BIG PLAYS (the duel's view: vfx/duelview.js; Dovina's folds, PUZZLE-DUELS.md 19): what a puzzle duel's board does when a
// play earns more than its clear. Each is a beat (beats.js hands these events here, in the kernel's order) and, where a word is read,
// a short readout in the System's type at the thing (DotGothic16: an overlay readout, never narration; the log says what happened):
//   REFUND    `refund { side, ap, why }`: an action point flies back out of the clear into the side's AP row on an arc and lands in a
//             flash; ONE MORE pops at the row (0.8 real s), in the film for a chain (why 'chain'), in gold for a big clear ('size')
//   ALL CLEAR `allclear { side, n }`: the half flashes clear, a held beat (0.25 real s: the board's motion all but stops), a gold ring
//             and a sweep run from the Line out to the half's back wall, the frame's brass bosses flare, ALL CLEAR on the frame over
//             the half; the Courier's alone earns a glitch, small and short (vfx/glitch.js; off with the setting)
//   WEAK      a `chain` with `weak` (the weak colour's gems in that step: weaknessOf): a sharper spark in the weak feeling's colour with a
//             cracked-glass star where the step cleared, a held beat (0.08), WEAK over the foe's head; a step with the resisted
//             colour on your side: a dull grey deflect falling off it and RESIST, small and dim. While a weakness holds: the weak pip
//             and the resist pip on the frame's top member at the foe's end (a gem of the colour; the resisted one dull, barred in
//             clay), and a glint now and then on one of the weak colour's gems on your half, so the colour is learned by looking
//   TRICKLE   `trickle { side, pool, n }`: motes of Lachryma drifting off the step's cleared cells to the link's end on the frame (the
//             Courier's: a drink runs up the spiritual link into the Lachrimeter), or into the foe's idol
//   UNDO      `undo { side, left }`: the board rebuilt from the kernel's restored turn, every piece sliding back from where it was
//             drawn to where it stood (a rewind's ease), what the action made going in a puff, a ripple of the film over the slab;
//             `left` as small film pips under the Courier's AP row while the turn may still be taken back
//
// Prior art: Persona 5's One More (the extra action for a hit on a weakness), its WEAK and RESIST pop-ups, its All-Out Attack's held
// frame; Puyo Puyo's all clear (zenkeshi) and Tetris 99's perfect clear; Puzzle Quest's extra turn and its mana from matches; Into the
// Breach's reset turn (the board seen rewinding); hit-stop (the frames a fighting game holds on a heavy blow).
//
//   const J = new DuelJuice(view)   J.beat(beats, e) -> phase   J.note(clears)   J.chainHit(chain, local, clears)   J.scale(dt) -> dt
//   J.rewind(state) (the view's resync)   J.update(dt)   J.clear()   J.prewarm()   JUICE_EVENTS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bakedCanvasTexture } from '../../render/bakedcanvas.js';
import { mindLineMaterial } from '../labradorite.js';
import { featTint } from '../oxidation.js';
import { FONT } from '../../ui/theme.js';
import { T } from '../../core/config.js';
import { weaknessOf } from '../../progress/duel/duel.js';
import { duelMaterials } from './pieces.js';
import { DUEL_VIEW, cellLocal, feelColour, sm, ease, lerp, hash, clamp01 } from './layout.js';

export const JUICE_EVENTS = new Set(['refund', 'allclear', 'trickle', 'undo']);
const GOLD = 0xffd36a, TEAR = 0x7fdcff, DULL = 0x8a8a90, INK = '#17111f', BRASS = 0x2a1a08;
const WORD_PX = 128, WORD_FONT = (px) => `${px}px ${FONT.sys}`, MOTES = 96;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _d = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();

/** A word in the System's type, white with an ink keyline, baked once (and again when the face has loaded). */
function wordTexture(text) {
  const w = 64 + text.length * 70;
  const paint = (x) => {
    x.font = WORD_FONT(96); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const k = Math.min(1, (w - 40) / Math.max(1, x.measureText(text).width)); x.setTransform(k, 0, 0, 1, w / 2, WORD_PX / 2 + 4);
    x.lineWidth = 16; x.strokeStyle = INK; x.strokeText(text, 0, 0); x.fillStyle = '#ffffff'; x.fillText(text, 0, 0);
  };
  const tex = bakedCanvasTexture(paint, w, WORD_PX); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  document.fonts?.load?.(WORD_FONT(96)).then(() => { tex.source.data = null; tex.needsUpdate = true; }, () => {});
  return { tex, aspect: w / WORD_PX };
}

/** A cracked-glass star: eight spikes of uneven reach and a ring of short cross-cracks between them (unit radius). */
function starGeometry() {
  const p = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (hash(i, 3) - 0.5) * 0.5, r = 0.55 + 0.45 * hash(i, 7), w = 0.06, ca = Math.cos(a), sa = Math.sin(a);
    p.push(-sa * w, ca * w, 0, ca * r, sa * r, 0, sa * w, -ca * w, 0);
    const b = a + Math.PI / 8, rr = 0.3 + 0.15 * hash(i, 11), cb = Math.cos(b), sb = Math.sin(b), t = 0.025;
    p.push(ca * rr * 0.9 - sa * t, sa * rr * 0.9 + ca * t, 0, cb * rr + sb * t, sb * rr - cb * t, 0, ca * rr * 0.9 + sa * t, sa * rr * 0.9 - ca * t, 0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
}

export class DuelJuice {
  constructor(view) {
    this.view = view; const parent = view.frame, cs = DUEL_VIEW.cs;
    this.group = new THREE.Group(); this.group.name = 'duel-juice'; parent.add(this.group);
    this.words = new Map(); this.pops = []; this.last = [[], []]; this.hold = 0; this.brassK = 0; this.glintT = 0; this.undoSeen = false; this.undoFlash = 0;
    const add = (m, order = 7) => { m.visible = false; m.renderOrder = order; m.frustumCulled = false; this.group.add(m); return m; };
    const glow = (hex, extra = {}) => new THREE.MeshBasicMaterial({ name: 'duel-juice', color: hex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, ...extra });
    this.star = add(new THREE.Mesh(starGeometry(), glow(0xffffff, { side: THREE.DoubleSide })));
    this.ring = add(new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), glow(GOLD, { side: THREE.DoubleSide })));
    this.sweep = add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glow(GOLD)));
    this.ripple = add(new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), mindLineMaterial({ opacity: 0, depthTest: true, bright: 1.6 })));
    // the motes (the trickle's drops and the refund's flying point): one instanced mesh in the bursts' program
    this.motes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), duelMaterials().glow, MOTES);
    this.motes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MOTES * 3), 3); this.motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.motes.frustumCulled = false; this.motes.count = 0; this.motes.name = 'duel-motes'; this.group.add(this.motes); this.flying = [];
    // the weak pip and the resist pip (the frame's top member, the foe's end), and the undo pips (under the Courier's AP row)
    const pip = new THREE.OctahedronGeometry(cs * 0.24, 0);
    this.weakPip = add(new THREE.Mesh(pip, new THREE.MeshBasicMaterial({ name: 'duel-pip', color: 0xffffff, toneMapped: false })), 6);
    this.resistPip = add(new THREE.Mesh(pip, new THREE.MeshBasicMaterial({ name: 'duel-pip', color: 0xffffff, toneMapped: false })), 6);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.62, cs * 0.09, cs * 0.06), new THREE.MeshBasicMaterial({ name: 'duel-pip', color: 0x2e1810, toneMapped: false }));
    bar.rotation.z = -0.6; bar.position.z = cs * 0.2; this.resistPip.add(bar); // (the resisted colour barred in clay)
    this.undoMat = new THREE.MeshBasicMaterial({ name: 'duel-pip', color: 0xffffff, toneMapped: false });
    this.undoPips = Array.from({ length: 8 }, () => add(new THREE.Mesh(new THREE.SphereGeometry(cs * 0.1, 8, 6), this.undoMat), 6));
  }

  /** The frame's numbers this board stands at (metres, the board's frame). */
  dims() { const B = this.view.board3, { cs, base, border, lip } = DUEL_VIEW, W = B.w * cs, H = B.h * cs; return { B, cs, base, b: border, lip, W, H, top: base + H, lx: ((B.line ?? B.w / 2) - B.w / 2) * cs }; }

  /** A word in the System's type popping at a point: `hex` a colour or 'film' (walking), `h` its height (m), `dur` real s, `rise` (m). */
  word(text, at, hex, { h = 0.1, dur = 0.8, rise = 0.08, dim = 1 } = {}) {
    let W = this.words.get(text);
    if (!W) { const { tex, aspect } = wordTexture(text); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), new THREE.MeshBasicMaterial({ name: 'duel-word', map: tex, transparent: true, depthWrite: false, toneMapped: false })); mesh.renderOrder = 8; mesh.visible = false; this.group.add(mesh); W = { mesh }; this.words.set(text, W); }
    this.pops = this.pops.filter((p) => p.W !== W); // (one of a word at a time: a new one restarts it)
    this.pops.push({ W, at: at.clone(), hex, h, dur, rise, dim, age: 0 }); W.mesh.visible = true;
  }

  /** A mote from a point to a point (the board's frame) over `life` real s after `delay`, wound a little; `onLand` once it lands. */
  mote(from, to, hex, { delay = 0, life = 0.7, size = 0.014, curl = 0.25, onLand = null, film = false } = {}) {
    if (this.flying.length >= MOTES) return;
    this.flying.push({ from: from.clone(), to: to.clone(), hex, age: -delay, life, size, curl: curl * (hash(this.flying.length, from.x) - 0.5) * 2, onLand, film });
  }

  /** The clears of a settle pass as they burst (beats.js clears): the cells a trickle or a refund rises from. */
  note(clears) { const by = [[], []]; for (const c of clears) if (c.type === 'clear' && c.at) by[c.side ?? 0].push(c.at); for (const s of [0, 1]) if (by[s].length) this.last[s] = by[s]; }
  lastAt(side, out) {
    const L = this.last[side], B = this.view.board3; if (!L.length) return cellLocal(side ? (B.line + B.w) / 2 : B.line / 2, B.h / 2, B, out);
    let x = 0, y = 0; for (const [cx, cy] of L) { x += cx; y += cy; } return cellLocal(x / L.length, y / L.length, B, out);
  }
  headAt(side, out) { const V = this.view; return V.pieces.bodyAt(side) ? V.headOf(side, out).add(_b.set(0, DUEL_VIEW.cs * 1.6, 0.06)) : this.lastAt(side, out).add(_b.set(0, DUEL_VIEW.cs * 3, 0.06)); }

  /** The board's motion held (hit-stop): what the view's parts are given while a hold runs. */
  scale(dt) { if (this.hold <= 0) return dt; this.hold -= dt; return dt * 0.04; }

  beat(beats, e) {
    if (e.type === 'refund') return this.refund(e);
    if (e.type === 'allclear') return this.allclear(e);
    if (e.type === 'trickle') return this.trickle(e);
    if (e.type === 'undo') return this.undo(e);
    return { events: [e], dur: 0 };
  }

  /** ONE MORE: the point flies back out of the clear into the row and lands lit. */
  refund(e) {
    const V = this.view, side = e.side ?? 0, film = e.why === 'chain', from = this.lastAt(side, new THREE.Vector3()), n = Math.max(1, e.ap || 1);
    let landed = 0;
    for (let i = 0; i < n; i++) { const k = V.apShown[side] + i, to = V.board.apAt(side, k, new THREE.Vector3());
      this.mote(from, to, film ? TEAR : GOLD, { delay: i * 0.08, life: 0.38, size: 0.04, curl: 1.4, film, onLand: () => {
        landed++; V.apShown[side] += 1; const [, max, lost] = V.board.ap[side]; V.board.setAP(side, V.apShown[side], Math.max(max, V.apShown[side] + lost), lost);
        V.bursts.burst(to, film ? V.filmHex(0.2) : GOLD, 10, { speed: 0.8, life: 0.32, fall: 0, spread: 0.3, size: 0.02 }); V.bursts.burst(to, 0xffffff, 4, { speed: 0.3, life: 0.2, fall: 0, size: 0.03 }); } }); }
    const D = this.dims(), row = V.board.apAt(side, 2, new THREE.Vector3()).setY(D.base + D.b * 0.4).setZ(D.lip + 0.06);
    let said = false;
    return { events: [e], dur: 0.46 + n * 0.08 + DUEL_VIEW.ma, step: (u, age) => { if (!said && age >= 0.36) { said = true; this.word('ONE MORE', row, film ? 'film' : GOLD, { h: 0.2, dur: 0.8, rise: 0.09 }); } },
      end: () => { if (!said) this.word('ONE MORE', row, film ? 'film' : GOLD, { h: 0.2, dur: 0.8 }); if (landed < n) { V.apShown[side] += n - landed; landed = n; } } };
  }

  /** ALL CLEAR: the half flashes, the board holds a beat, the gold runs out from the Line, the bosses flare, the frame says it. */
  allclear(e) {
    const V = this.view, side = e.side ?? 0, D = this.dims(), far = side ? D.W / 2 : -D.W / 2, mid = D.base + D.H / 2;
    V.clash.flash(side); this.hold = 0.25; this.brassK = 1;
    V.sent[side] = (V.sent[side] || 0) + (e.n || 0); V.showCounts();
    if (side === 0 && T.visual?.glitch !== false) this.view.game.glitch?.pulse?.({ split: 0.22, tear: 0.1, dur: 0.3 }); // (earned: rare by design, the Courier's only, under the moments' strength)
    for (let i = 0; i < 12; i++) V.bursts.burst(_a.set(D.lx, D.base + ((i + 0.5) / 12) * D.H, DUEL_VIEW.front), GOLD, 2, { speed: 0.5, life: 0.5, fall: 0, spread: 0.2, size: 0.02 });
    const R = this.ring, S = this.sweep, span = Math.abs(far - D.lx);
    R.position.set(D.lx, mid, DUEL_VIEW.front + 0.03); S.position.set(D.lx, mid, DUEL_VIEW.front + 0.02); S.scale.set(D.cs * 0.6, D.H, 1);
    const over = _a.set((D.lx + far) / 2, D.top + D.b * 0.5, D.lip + 0.05).clone();
    let said = false;
    return { events: [e], dur: 1.0 + DUEL_VIEW.ma, step: (u, age) => {
      const k = clamp01((age - 0.22) / 0.6), f = sm(k); R.visible = S.visible = age >= 0.18 && k < 1;
      R.scale.setScalar(Math.max(1e-3, lerp(D.cs, Math.hypot(span, D.H / 2) * 1.05, f))); R.material.opacity = (1 - k) * 0.9;
      S.position.x = lerp(D.lx, far, f); S.material.opacity = (1 - k * k) * 0.55;
      if (!said && age >= 0.22) { said = true; this.word('ALL CLEAR', over, GOLD, { h: 0.26, dur: 1.3, rise: 0.06 }); }
    }, end: () => { R.visible = S.visible = false; } };
  }

  /** A chain step's weak or resisted hit (beats.js clears, as its numeral shows): the Courier's side only (the ruleset is the foe's). */
  chainHit(ch, at, clears = []) {
    const V = this.view, W = V.state && weaknessOf(V.state); if (!W || ch.side !== 0) return;
    if (ch.weak) {
      const hex = feelColour(W.weak, _c).getHex();
      V.bursts.burst(at, hex, 16, { speed: 2.4, life: 0.28, fall: 0, spread: 0.15, size: 0.02 }); V.bursts.burst(at, 0xffffff, 6, { speed: 1.4, life: 0.18, fall: 0, spread: 0.1, size: 0.024 });
      this.star.position.copy(at).setZ(at.z + 0.05); this.star.rotation.z = hash(at.x, at.y) * 6.28; this.star.material.color.setHex(hex); this.starAge = 0; this.star.visible = true;
      this.hold = Math.max(this.hold, 0.08); this.weakFlare = 1;
      this.word('WEAK', this.headAt(1, _a), hex, { h: 0.3, dur: 0.9, rise: 0.12 });
    }
    const resisted = clears.filter((c) => c.type === 'clear' && c.side === 0 && c.colour === W.resists).length;
    if (resisted) { V.bursts.burst(at, DULL, 6, { speed: 0.5, life: 0.5, fall: 5, spread: 0.1, size: 0.022 });
      this.word('RESIST', this.headAt(1, _a).add(_b.set(0, ch.weak ? -DUEL_VIEW.cs * 2.4 : 0, 0)), DULL, { h: 0.16, dur: 0.7, rise: 0.04, dim: 0.75 }); }
  }

  /** Pool from a chain: motes off the step's cleared cells to the link's end (the Courier's), or into the foe's idol. */
  trickle(e) {
    const V = this.view, side = e.side ?? 0, D = this.dims(), B = V.board3, cells = this.last[side].length ? this.last[side] : [[side ? B.w - 3 : 2, B.h / 2]];
    const to = side === 0 ? new THREE.Vector3(D.W / 2 + D.b * 0.5, D.base - D.b * 0.5, D.lip + 0.02) : (V.pieces.bodyAt(1) ? V.headOf(1, new THREE.Vector3()) : this.lastAt(1, new THREE.Vector3()));
    const n = Math.min(12, Math.max(3, (e.n || 2) * 2)); let first = true;
    for (let i = 0; i < n; i++) { const [cx, cy] = cells[i % cells.length]; cellLocal(cx + (hash(i, cx) - 0.5) * 0.6, cy + (hash(cy, i) - 0.5) * 0.6, B, _a);
      this.mote(_a, to, TEAR, { delay: i * 0.05, life: 0.75 + 0.2 * hash(i, 9), size: 0.012 + 0.006 * hash(i, 4), curl: 0.6, film: true, onLand: () => {
        if (!first) return; first = false; if (side === 0) V.game.spiritualLink?.bead({ amount: e.n || 2, colour: TEAR, rev: true, dur: 0.45 }); } }); }
    return { events: [e], dur: 0.3 + DUEL_VIEW.ma };
  }

  /** The board stood again from a restored turn (the session's `view.resync`, before its `undo` event plays): the pieces rebuilt from
   *  the kernel's board, each drawn where it stood a moment ago (a new one at nothing), so nothing jumps until the undo beat slides them. */
  rewind(s) {
    const V = this.view, P = V.pieces, key = (v) => (v.kind === 'body' ? 'body' + v.side : v.id), was = new Map();
    for (const v of P.list) { const k = key(v); if (k != null) was.set(k, { x: v.x, y: v.y }); }
    P.build(s.board, V.aspect); const seen = new Set();
    for (const v of P.list) { const k = key(v), o = k != null ? was.get(k) : null; seen.add(k); if (o) { v.x = o.x; v.y = o.y; } else { v.s = 0.01; v.grow = true; } }
    this.gone = [...was].filter(([k]) => !seen.has(k)).map(([, o]) => o);
    V.gravLine = s.board.line; V.board.setGravity(s.board); V.setLine(s.board.line);
    V.forms = s.sides.map((S) => S.form); V.tune = s.sides.map((S) => S.tune || null); V.readCounts(); V.readPoints(); V.readFight();
    this.rewound = true;
  }

  /** UNDO: every piece sliding back from where it was drawn to where the restored turn stands; what the action made goes in a puff; a
   *  ripple of the film over the slab; the steps left as pips (update). */
  undo(e) {
    const V = this.view, s = V.state; if (!s) return { events: [e], dur: 0 };
    if (!this.rewound) this.rewind(s); this.rewound = false; // (no resync before it: stood again here)
    const mv = V.pieces.list.filter((v) => v.grow || v.x !== v.cx || v.y !== v.cy).map((v) => ({ v, grow: v.grow, fx: v.x, fy: v.y }));
    for (const o of this.gone || []) { cellLocal(o.x, o.y, V.board3, _a); V.bursts.burst(_a, V.filmHex(0.4), 4, { speed: 0.3, life: 0.35, fall: 0, spread: 0.1, size: 0.016 }); } this.gone = null;
    const D = this.dims(), R = this.ripple; R.position.set(0, D.base + D.H / 2, DUEL_VIEW.front + 0.04); R.visible = true;
    this.undoSeen = true; this.undoFlash = 1;
    return { events: [e], dur: 0.36 + DUEL_VIEW.ma, step: (u) => { const r = 1 - sm(u); // (a rewind's ease: fast off the mark, settling home)
      for (const m of mv) { if (m.grow) { m.v.s = 0.01 + 0.99 * sm(u); m.v.flash = 1 - u; continue; } m.v.x = lerp(m.v.cx, m.fx, r * r); m.v.y = lerp(m.v.cy, m.fy, r * r); m.v.spin = -0.6 * Math.sin(Math.PI * u); }
      R.scale.setScalar(Math.max(1e-3, lerp(D.cs, Math.hypot(D.W, D.H) * 0.55, sm(u)))); R.material.uniforms.uOpacity.value = 0.9 * (1 - u); },
      end: () => { for (const m of mv) { m.v.x = m.v.cx; m.v.y = m.v.cy; m.v.s = 1; m.v.flash = 0; m.v.spin = 0; m.v.grow = false; } R.visible = false; } };
  }

  clear() {
    for (const p of this.pops) p.W.mesh.visible = false; this.pops.length = 0; this.flying.length = 0; this.motes.count = 0; this.last = [[], []];
    this.hold = 0; this.brassK = 0; this.undoSeen = false; this.rewound = false; this.gone = null; this.star.visible = this.ring.visible = this.sweep.visible = this.ripple.visible = false;
    this.weakPip.visible = this.resistPip.visible = false; for (const m of this.undoPips) m.visible = false; this.applyBrass(0);
  }
  applyBrass(k) { const b = this.view.board.brass; if (!b) return; b.emissive.setHex(BRASS).lerp(_c.setHex(GOLD), k); b.emissiveIntensity = 0.4 + 2.8 * k; }

  update(dt) {
    const V = this.view, t = (this.t = (this.t || 0) + dt);
    // the readouts
    for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i], m = p.W.mesh; p.age += dt; const u = p.age / p.dur;
      if (u >= 1) { m.visible = false; this.pops.splice(i, 1); continue; }
      const k = ease(clamp01(u / 0.14), 2.6) * (u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1); m.visible = true;
      m.position.copy(p.at).add(_a.set(0, p.rise * sm(u * 1.3), 0)); m.scale.setScalar(Math.max(1e-4, p.h * k));
      if (p.hex === 'film') featTint(t * 0.35, m.material.color, { bright: 1.5 }); else m.material.color.setHex(p.hex).multiplyScalar(p.dim);
      m.material.opacity = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1; }
    // the motes
    let n = 0;
    for (let i = this.flying.length - 1; i >= 0; i--) { const q = this.flying[i]; q.age += dt; if (q.age < 0) continue;
      const u = q.age / q.life; if (u >= 1) { this.flying.splice(i, 1); q.onLand?.(); continue; }
      const f = sm(u); _a.lerpVectors(q.from, q.to, f); const bend = Math.sin(Math.PI * f) * q.curl * 0.3; _a.x += -(q.to.y - q.from.y) * bend * 0.3; _a.y += (q.to.x - q.from.x) * bend * 0.3 + Math.sin(Math.PI * f) * 0.08; _a.z += 0.05 * Math.sin(Math.PI * f);
      if (q.film) featTint(t * 0.4 + i * 0.07, _c, { bright: 1.8 }).lerp(_d.setHex(q.hex), 0.4); else _c.setHex(q.hex).multiplyScalar(1.5);
      this.motes.setMatrixAt(n, _m.compose(_a, _q.identity(), _s.setScalar(q.size * (1 - 0.4 * u * u)))); this.motes.setColorAt(n++, _c); }
    this.motes.count = n; this.motes.instanceMatrix.needsUpdate = true; this.motes.instanceColor.needsUpdate = true;
    // the weak star, the brass
    if (this.star.visible) { this.starAge += dt; const u = this.starAge / 0.5; if (u >= 1) this.star.visible = false;
      else { this.star.scale.setScalar(DUEL_VIEW.cs * 2.6 * ease(clamp01(u / 0.12), 2)); this.star.material.opacity = u < 0.15 ? 1 : 1 - (u - 0.15) / 0.85; } }
    if (this.brassK > 0) { this.brassK = Math.max(0, this.brassK - dt / 0.9); this.applyBrass(this.brassK); }
    // what holds while it matters: the weakness's pips, a glint on a weak gem, the undo's pips
    const s = V.state, W = s && V.isOpen ? weaknessOf(s) : null, D = this.dims();
    this.weakPip.visible = !!W; this.resistPip.visible = !!W?.resists;
    if (W) { this.weakFlare = Math.max(0, (this.weakFlare || 0) - dt / 0.6);
      this.weakPip.position.set(D.W / 2 - D.cs * 0.9, D.top + D.b * 0.5, D.lip + 0.03); this.weakPip.rotation.y = t * 1.2;
      feelColour(W.weak, this.weakPip.material.color).multiplyScalar(1.1 + 0.25 * Math.sin(t * 3) + 1.5 * this.weakFlare); this.weakPip.scale.setScalar(1 + 0.6 * this.weakFlare);
      if (W.resists) { this.resistPip.position.set(D.W / 2 - D.cs * 2.1, D.top + D.b * 0.5, D.lip + 0.03); feelColour(W.resists, this.resistPip.material.color).multiplyScalar(0.35); }
      if ((this.glintT -= dt) <= 0) { this.glintT = 0.9 + 0.6 * hash(t, 2); const L = V.lineCol ?? D.B.line, mine = V.pieces.list.filter((v) => v.kind === 'gem' && v.colour === W.weak && v.cx < L && !v.hidden);
        if (mine.length) { const v = mine[Math.floor(hash(t, 5) * mine.length) % mine.length]; cellLocal(v.x + 0.22, v.y - 0.22, D.B, _a); _a.z += 0.03; V.bursts.burst(_a, 0xffffff, 2, { speed: 0.12, life: 0.45, fall: 0, spread: 0.05, size: 0.012 }); V.bursts.burst(_a, feelColour(W.weak, _c).getHex(), 1, { speed: 0.05, life: 0.6, fall: 0, spread: 0, size: 0.018 }); } } }
    const left = this.undoSeen && s?.toMove === 0 ? Math.min(8, s.undo?.length || 0) : 0; this.undoFlash = Math.max(0, this.undoFlash - dt / 0.5);
    featTint(t * 0.1, this.undoMat.color, { bright: 1.4 + this.undoFlash });
    this.undoPips.forEach((m, k) => { m.visible = k < left; if (!m.visible) return; V.board.apAt(0, k, m.position); m.position.y -= D.b * 0.36; m.position.z += 0.01; m.scale.setScalar(1 + 0.5 * this.undoFlash); });
  }

  /** For the boot's warm-up: every program shown once. */
  prewarm() {
    const D = this.dims(); this.word('ONE MORE', _a.set(0, D.base, 0.1), 'film'); this.word('ALL CLEAR', _a.set(0, D.top, 0.1), GOLD); this.word('WEAK', _a.set(0, 1, 0.1), GOLD); this.word('RESIST', _a.set(0, 1.2, 0.1), DULL);
    this.mote(_a.set(0, 1, 0.1), _b.set(1, 1, 0.1), TEAR, { film: true });
    this.starAge = 0; this.update(0.016);
    for (const m of [this.star, this.ring, this.sweep, this.ripple, this.weakPip, this.resistPip, this.undoPips[0]]) { m.visible = true; m.position.set(0, 1, 0.1); m.scale.setScalar(0.2); } // (shown for the warm-up's frame; the view's close hides them)
  }
}
