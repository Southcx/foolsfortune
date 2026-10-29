// ---------------------------------------------------------------------------------------
// THE ABERRANT'S CASTS (plain name; the PvE duel, PUZZLE-DUELS.md 23; South, 2026-10-28: "flashier and cinematic; a true battle of wills
// complete with special moves from the Aberrant"): the foe's half of the battle drawn on and round the tsuitate.
//   ITS COUNTDOWNS   a row of clay badges over its body (foeIntent: soonest first), each a skill's glyph and the turns left; the last
//                    tick throbs, rimmed in ember. In the board view (its body off the screen) they stand as a column in the flank beside
//                    the frame's foe end. No words: the glyph and the number.
//   ITS CASTS        foe.skill from its body: HURL its flare, the junk itself thrown from its end of the board in high arcs onto your
//                    half at once (the land beat after it, beats.js); PETRIFY a spiral to each gem, the gem greying and dropping to stone (its piece swapped for the junk's
//                    id); SEAL a chain slammed down a column of yours, held while the column is sealed; SAP your skill troughs drained,
//                    motes flying to it; RECLAIM a shove from its body to the Line (the line event after it the retreat)
//   ITS MOMENTS      foe.desperate (after its limit break's cut-in, cutin.js): its half flashed, embers off it; foe.stagger: a jolt, gold daze off
//                    its head, STAGGER, its badges knocked back a turn
//   THE CONQUEST     a column taken (a line event of yours): a sweep of the film down it, its frozen gems lit as they wake; one lost: the
//                    sweep in its feeling, the other way
//   THE DRAG'S TIMER a bar standing beside the frame's Courier end, draining downward as the session says (`timer(k)`), ember near its end
// Programs: the board's glow (instanced, its motes'), the juice's additive sweep, the word's map, the gauges' emo bars: nothing new.
// Prior art: Puzzle & Dragons' enemy turn counters over the monster and its skill's cut-in, Into the Breach's attacks drawn a turn ahead,
// Terra Battle's boss gimmicks, a tug of war's rope (the Line), the duel's own skill casts (skillcast.js).
//
//   const F = new FoeCast(view)   F.beat(beats, e) -> phase   F.conquest(from, to)   F.timer(k | null)   F.update(dt)   F.clear()
//   F.tap(clientX, clientY) -> taken (the session's, on a press)   F.pick(clientX, clientY) -> skill | null   F.tip(skill, clientX, clientY) -> shown?   FOE_CAST (the knobs)   FOE_TIP
//   THE TOOLTIP      a badge tapped: its label and line in the house's table tip, only for a skill seen (game.foeSeen); unseen, its badge a ?
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../ui/theme.js';
import { foeIntent, FOE_SKILLS } from '../../progress/duel/foeskills.js';
import { showTableTip, hideTableTip } from '../../ui/tabletip.js';
import { duelMaterials } from './pieces.js';
import { DUEL_VIEW, cellLocal, feelColour, sm, clamp01 } from './layout.js';

/** badge: a countdown's side (m, the board's frame); over: the row above the head; the casts' lengths (real s). */
/** The badges' tooltips (Espada's words, docs/handoffs: the label over, this line under). */
export const FOE_TIP = {
  hurl: 'Throws junk onto your half.', // (a placeholder since Hurl lands at once, Dovina 2026-10-29: Espada's to word)
  petrify: 'Gems on your half turn to junk.',
  seal: 'A column of yours locks for your next turn: nothing in it can be dragged.',
  sap: 'Each skill you wear loses half its charge.',
  reclaim: 'The Line moves a column toward you.',
};
export const FOE_CAST = { tip: 3, tapR: 30, badge: 0.24, gap: 0.035, over: 0.5, petrify: 0.55, seal: 0.5, sap: 0.65, reclaim: 0.5, desperate: 1.3, stagger: 0.7, sweep: 0.6, shots: 24 };
const GOLD = 0xffd36a, FILM = 0x9fd8ff, STONE = 0x9a948c, EMBER = 0xff6a2a, INK = '#17111f';
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _w = new THREE.Vector3();

/** A skill's glyph on a 128 px canvas, white on the badge's dark (a light shape, the icons' hand). */
function glyph(x, skill) {
  x.save(); x.translate(64, 60); x.fillStyle = x.strokeStyle = '#f4ecdc'; x.lineWidth = 9; x.lineCap = x.lineJoin = 'round';
  if (skill === 'hurl') { x.beginPath(); x.arc(-6, 6, 30, Math.PI * 1.05, Math.PI * 1.75); x.stroke(); x.beginPath(); x.moveTo(26, -18); x.lineTo(10, -26); x.lineTo(12, -8); x.fill(); x.beginPath(); x.moveTo(-34, 14); x.lineTo(-14, 6); x.lineTo(-6, 22); x.lineTo(-22, 32); x.closePath(); x.fill(); }
  else if (skill === 'petrify') { x.beginPath(); x.moveTo(0, -30); x.lineTo(26, -4); x.lineTo(0, 30); x.lineTo(-26, -4); x.closePath(); x.stroke(); x.lineWidth = 5; x.beginPath(); x.moveTo(-8, -18); x.lineTo(4, -2); x.lineTo(-6, 8); x.lineTo(6, 22); x.stroke(); }
  else if (skill === 'seal') { x.lineWidth = 8; for (const dy of [-16, 14]) { x.beginPath(); x.ellipse(0, dy, 11, 18, 0, 0, Math.PI * 2); x.stroke(); } x.fillRect(-24, -4, 48, 6); }
  else if (skill === 'sap') { x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(22, -2, 22, 26, 0, 26); x.bezierCurveTo(-22, 26, -22, -2, 0, -30); x.fill(); x.fillStyle = INK; x.fillRect(-10, 6, 20, 6); }
  else if (skill === 'kindle') { x.beginPath(); x.moveTo(0, -32); x.bezierCurveTo(20, -8, 22, 10, 0, 28); x.bezierCurveTo(-22, 10, -20, -8, 0, -32); x.fill(); x.fillStyle = INK; x.beginPath(); x.moveTo(0, -4); x.bezierCurveTo(9, 6, 9, 16, 0, 20); x.bezierCurveTo(-9, 16, -9, 6, 0, -4); x.fill(); } // (a flame)
  else { x.beginPath(); x.moveTo(26, -22); x.lineTo(-4, 0); x.lineTo(26, 22); x.stroke(); x.beginPath(); x.moveTo(4, -22); x.lineTo(-26, 0); x.lineTo(4, 22); x.stroke(); } // (reclaim: the Line pushed back toward you)
  x.restore();
}

/** A countdown badge's canvas: the glyph on dark clay (a ? for a skill not yet seen: progress/foeseen.js) and the turns left in gold. */
function badgeTexture(skill, left, seen = true) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = INK; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
  if (seen) glyph(x, skill); else { x.font = `bold 70px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f4ecdc'; x.fillText('?', 58, 58); }
  x.fillStyle = '#2e1810'; x.beginPath(); x.arc(98, 98, 26, 0, Math.PI * 2); x.fill();
  x.font = `bold 42px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = INK; x.strokeText(String(left), 98, 100); x.fillStyle = '#ffd76a'; x.fillText(String(left), 98, 100);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** The seal's chain: links down a column, repeating (its texture tiled by the column's height). */
function chainTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
  x.lineWidth = 9; x.strokeStyle = '#2a2018'; for (const dy of [32, 96]) { x.beginPath(); x.ellipse(32, dy, 15, 26, 0, 0, Math.PI * 2); x.stroke(); }
  x.lineWidth = 4; x.strokeStyle = '#c9a45a'; for (const dy of [32, 96]) { x.beginPath(); x.ellipse(32, dy, 15, 26, 0, -0.4, 1.2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; return t;
}

export class FoeCast {
  constructor(view) {
    this.view = view; const cs = DUEL_VIEW.cs;
    this.group = new THREE.Group(); this.group.name = 'duel-foecast'; view.frame.add(this.group);
    const word = (map) => new THREE.MeshBasicMaterial({ name: 'duel-word', map, transparent: true, depthWrite: false, toneMapped: false }); // (the words' own program, juice.js)
    const glow = (hex) => new THREE.MeshBasicMaterial({ name: 'duel-juice', color: hex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }); // (the juice's sweep's program)
    const plane = new THREE.PlaneGeometry(1, 1);
    this.tex = new Map(); this.badges = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(plane, word(null)); m.visible = false; m.renderOrder = 9; this.group.add(m); return m; });
    this.chain = new THREE.Mesh(plane, word(chainTexture())); this.chain.visible = false; this.chain.renderOrder = 7; this.group.add(this.chain);
    this.sweeps = Array.from({ length: 2 }, () => { const m = new THREE.Mesh(plane, glow(FILM)); m.visible = false; m.renderOrder = 7; this.group.add(m); return { m, age: 1, life: 1, x: 0, dir: 1 }; });
    this.shots = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), duelMaterials().glow, FOE_CAST.shots); // (the board's glow, its motes' program)
    this.shots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FOE_CAST.shots * 3), 3); this.shots.frustumCulled = false; this.shots.count = 0; this.group.add(this.shots); this.flying = [];
    const bar = new THREE.BoxGeometry(1, 1, 1); bar.translate(0.5, 0, 0);
    this.trough = new THREE.Mesh(bar, new THREE.MeshBasicMaterial({ name: 'duel-emo', color: 0x1c1018, toneMapped: false })); // (the gauges' emo bars' program, skillgauges.js)
    this.fill = new THREE.Mesh(bar, new THREE.MeshBasicMaterial({ name: 'duel-emo', color: 0xffffff, toneMapped: false }));
    for (const m of [this.trough, this.fill]) { m.visible = false; this.group.add(m); }
    this.timerK = null; this.knock = 0; this.burn = 0; this.t = 0; this.cs = cs; this.box = new THREE.Box3(); this.boxT = 0;
  }

  /** Where its head is in the world: the top of its drawn body (its root's bounds, measured twice a real second), else over its place. */
  headWorld(out) {
    const f = this.view.foe, o = f?.root || f?.model?.group || null;
    if (o && this.boxT <= 0) { this.box.setFromObject(o); this.boxT = 0.5; }
    if (o && !this.box.isEmpty()) return this.box.getCenter(out).setY(this.box.max.y + 0.1);
    return f?.pos ? out.copy(f.pos).setY(f.pos.y + 1.4) : null;
  }
  /** Where its head is, in the board's frame (its body in the world, else its figurine, else the half's middle over the top). */
  head(out) { const V = this.view, w = this.headWorld(_w); return w ? V.frame.worldToLocal(out.copy(w)) : V.juice.headAt(1, out); }
  /** Whether the foe's head is on the screen (else the countdowns stand in the flank beside the frame). */
  onScreen() { const cam = this.view.game.camera, w = this.headWorld(_w); if (!w || !cam) return false; w.project(cam); return Math.abs(w.x) < 0.86 && Math.abs(w.y) < 0.8 && w.z < 1; }
  dims() { const B = this.view.board3, { cs, base, border, lip } = DUEL_VIEW; return { B, cs, W: B.w * cs, top: base + B.h * cs, base, b: border, lip }; }

  /** The kernel's foe events as beats (beats.js hands them here). */
  beat(T, e) {
    const V = this.view, at = this.head(new THREE.Vector3()), cs = this.cs;
    if (e.type === 'foe.stagger') { this.knock = 1; V.stage?.jolt?.(0.45); V.juice.word('STAGGER', _a.copy(at).add(_b.set(0, 0.2, 0.05)), GOLD, { h: 0.12, dur: 1 }); V.bursts.burst(at, GOLD, 14, { speed: 1.4, life: 0.6, fall: 0, spread: 0.3 }); V.bursts.burst(at, 0xffffff, 6, { speed: 0.5, life: 0.4, fall: 0, size: 0.05 }); return { events: [e], dur: FOE_CAST.stagger }; }
    if (e.type === 'foe.desperate') {
      const hex = feelColour(V.aspect, _c).getHex(); this.burn = 1; V.clash.flash(1); V.stage?.jolt?.(1); V.juice.hold = 0.25; // (its word, CORNERED, and the glitch: the limit break's cut-in before this, cutin.js)
      let k = 0; return { events: [e], dur: FOE_CAST.desperate, step: (u) => { while (k < Math.floor(u * 6)) { k++; V.bursts.burst(at, k % 2 ? EMBER : hex, 12, { speed: 2.2, life: 0.7, fall: -1, spread: 0.5 }); } } };
    }
    if (e.type !== 'foe.skill') return { events: [e], dur: 0 };
    if (e.skill === 'kindle' && V.elite?.on) return V.elite.kindle(T, e); // (an aberrant's own skill: its own file, duelview/aberrants/)
    V.stage?.jolt?.(0.25); V.bursts.burst(at, feelColour(V.aspect, _c).getHex(), 10, { speed: 1.2, life: 0.4, fall: 0, spread: 0.3 }); // (the cast's flare at its body)
    if (e.skill === 'hurl') { V.hurled = true; return { events: [e], dur: 0.18 }; } // (Hurl lands at once (Dovina, 2026-10-29): its `land` that follows throws the pieces themselves from the aberrant, beats.js land)
    if (e.skill === 'petrify') { const cells = e.cells || [], done = new Set();
      cells.forEach((c, i) => V.bursts.spiral(at, cellLocal(c.at[0], c.at[1], V.board3, new THREE.Vector3()), STONE, i * 0.06, 0.35));
      return { events: [e], dur: FOE_CAST.petrify + cells.length * 0.06, step: (u, age) => { cells.forEach((c, i) => { const v = V.pieces.byId(c.from); if (age > i * 0.06 + 0.2 && v) v.grey = Math.min(1, (age - i * 0.06 - 0.2) / 0.25);
        if (age > i * 0.06 + 0.45 && !done.has(i)) { done.add(i); this.petrify(c); } }); }, end: () => cells.forEach((c, i) => { if (!done.has(i)) this.petrify(c); }) }; }
    if (e.skill === 'seal') { this.sealT = 0; this.sealX = e.x; this.fling(at, cellLocal(e.x, 0, V.board3, _b).add(_a.set(0, cs, 0.05)), 0x2a2018, { life: 0.3, size: 0.05, arc: 0.4 }); return { events: [e], dur: FOE_CAST.seal }; }
    if (e.skill === 'sap') { const G = V.gauges, K = Object.keys(e.lost || {});
      G?.slots?.forEach((S, i) => { if (!S.trough.visible || !K.length) return; S.flash = 1; for (let j = 0; j < 6; j++) this.fling(_b.set(S.x + S.w * (j + 0.5) / 6, S.trough.position.y, S.trough.position.z + 0.02), at, 0x9a6ad8, { delay: j * 0.04, life: 0.5, size: 0.018, arc: 0.3 }); });
      return { events: [e], dur: FOE_CAST.sap }; }
    if (e.skill === 'reclaim') { const D = this.dims(), lx = ((V.lineCol ?? D.B.line) - D.B.w / 2) * cs, hex = feelColour(V.aspect, _c).getHex();
      for (let i = 0; i < 8; i++) this.fling(at, _b.set(lx, D.base + D.B.h * cs * (i + 0.5) / 8, D.lip + 0.04), hex, { delay: i * 0.03, life: 0.35, size: 0.022, arc: 0.15 });
      V.clash.push(0); return { events: [e], dur: FOE_CAST.reclaim }; }
    return { events: [e], dur: 0.2 };
  }

  /** A gem petrified: its piece put away and the junk the kernel made stood in its cell, dust off it. */
  petrify(c) {
    const V = this.view, P = V.pieces, v = P.byId(c.from); if (v) P.remove(v);
    if (!P.byId(c.id)) { const j = P.add('junk', { id: c.id, side: 0 }, c.at[0], c.at[1]); j.s = 1.3; }
    V.bursts.burst(cellLocal(c.at[0], c.at[1], V.board3, _a), STONE, 6, { speed: 0.6, life: 0.4, fall: 3, size: 0.02 });
  }

  /** A shot of the cast (a chunk, a mote) along a raised arc in the board's frame. */
  fling(from, to, hex, { delay = 0, life = 0.6, size = 0.03, arc = 0.5 } = {}) {
    if (this.flying.length >= FOE_CAST.shots) return;
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5); mid.y += arc + from.distanceTo(to) * 0.2;
    this.flying.push({ from: from.clone(), to: to.clone(), mid, hex, age: -delay, life, size, trailT: 0 });
  }

  /** A column taken (dir 1, yours) or lost (dir -1): a sweep down it in the film or the foe's feeling. `from`, `to`: the Line's columns. */
  conquest(from, to) {
    const V = this.view, dir = to > from ? 1 : -1, lo = Math.min(from, to), hi = Math.max(from, to), D = this.dims();
    for (let x = lo; x < hi; x++) { const S = this.sweeps.find((q) => q.age >= q.life) || this.sweeps[0]; S.age = -(x - lo) * 0.08; S.life = FOE_CAST.sweep; S.x = x; S.dir = dir;
      S.m.material.color.setHex(dir > 0 ? FILM : feelColour(V.aspect, _c).getHex());
      for (let y = 0; y < D.B.h; y += 2) V.bursts.burst(cellLocal(x, y, V.board3, _a), dir > 0 ? FILM : EMBER, 2, { speed: 0.5, life: 0.5, fall: 0, spread: 0.1, size: 0.02 }); }
    if (dir > 0) V.stage?.jolt?.(0.35);
  }

  /** The drag's timer (the session's): 1 full .. 0 out, null hidden. */
  timer(k) { this.timerK = k == null ? null : clamp01(k); }

  clear() { if (this.tipT > 0) hideTableTip(); this.tipT = 0; this.flying.length = 0; this.shots.count = 0; this.chain.visible = false; this.sealX = null; this.timerK = null; this.knock = this.burn = 0; for (const b of this.badges) b.visible = false; for (const S of this.sweeps) { S.age = S.life = 1; S.m.visible = false; } this.trough.visible = this.fill.visible = false; }

  badgeTex(skill, left) { const seen = this.seen(skill), k = skill + ':' + left + (seen ? '' : '?'); let t = this.tex.get(k); if (!t) { t = badgeTexture(skill, left, seen); this.tex.set(k, t); } return t; }
  seen(skill) { const F = this.view.game.foeSeen; return !F || F.seen(skill); }

  /** The foe skill whose countdown badge is under a point of the page (client px), or null: for the session's tap (Petra's). */
  pick(cx, cy) {
    const cam = this.view.game.camera, cv = this.view.game.overlayScene?.r?.domElement; if (!cam || !cv) return null; const R = cv.getBoundingClientRect(), I = this.shown || [];
    for (let i = 0; i < this.badges.length; i++) { const m = this.badges[i]; if (!m.visible || !I[i]) continue;
      m.getWorldPosition(_w).project(cam); const x = R.left + (_w.x * 0.5 + 0.5) * R.width, y = R.top + (0.5 - _w.y * 0.5) * R.height;
      if (Math.hypot(cx - x, cy - y) < FOE_CAST.tapR) return I[i].skill; }
    return null;
  }
  /** The session's first look at a press (Mouse0, client px): a badge hit shows its tooltip (or nothing, unseen) and takes the press. */
  tap(mx, my) { const skill = this.pick(mx, my); if (!skill) { if (this.tipT > 0) { hideTableTip(); this.tipT = 0; } return false; } this.tip(skill, mx, my); return true; }
  /** A badge's tooltip (South, 2026-10-28: "only for a foe skill you have seen happen"): its label and Espada's line in the house's table
   *  tip beside the point, for TIP_HOLD real s; a skill not yet seen shows nothing (false). */
  tip(skill, cx, cy) {
    if (!skill || !this.seen(skill) || !FOE_SKILLS[skill]) { hideTableTip(); return false; }
    showTableTip({ label: FOE_SKILLS[skill].label.toUpperCase(), line: FOE_TIP[skill] || FOE_SKILLS[skill].line }, cx, cy); this.tipT = FOE_CAST.tip; return true;
  }

  update(dt) {
    const V = this.view, s = V.state, cs = this.cs; this.t += dt; const t = this.t; this.boxT -= dt;
    const pve = !!(V.isOpen && s?.style === 'pve' && s.foe), D = this.dims();
    // its countdowns
    const I = pve ? foeIntent(s) : []; this.shown = I; if (this.tipT > 0 && (this.tipT -= dt) <= 0) hideTableTip(); this.knock = Math.max(0, this.knock - dt / 0.6); this.burn = Math.max(0, this.burn - dt / 1.6);
    const on = this.onScreen(), at = on ? this.head(_a).add(_b.set(0, FOE_CAST.over, 0.05)) : _a.set(D.W / 2 + D.b + FOE_CAST.badge * 0.75, D.top - FOE_CAST.badge, D.lip + 0.06); // (off the screen: a column in the flank beside the frame's foe end)
    const size = FOE_CAST.badge, n = Math.min(I.length, this.badges.length), step = size + FOE_CAST.gap, w0 = on ? -((n - 1) * step) / 2 : 0;
    this.badges.forEach((m, i) => { const it = I[i]; m.visible = !!it; if (!it) return;
      if (m.material.map !== this.badgeTex(it.skill, it.left)) { m.material.map = this.badgeTex(it.skill, it.left); m.material.needsUpdate = true; }
      const last = it.left <= 1, th = last ? 1 + 0.16 * Math.max(0, Math.sin(t * 7)) : 1;
      m.position.set(on ? at.x + w0 + i * step : at.x, (on ? at.y : at.y - i * step) + this.knock * 0.06 * Math.sin(t * 30), at.z);
      m.scale.setScalar(size * th * (1 + 0.25 * this.knock));
      m.material.color.setRGB(1, 1, 1); if (last) m.material.color.lerp(_c.setHex(EMBER), 0.25 + 0.25 * Math.sin(t * 7)); if (this.burn > 0) m.material.color.lerp(_c.setHex(EMBER), this.burn * 0.6); });
    // the seal's chain, held while its column is sealed
    const sx = pve ? s.sides?.[0]?.sealed : null; this.sealT = (this.sealT ?? 1) + dt;
    this.chain.visible = sx != null; if (sx != null) { const H = D.B.h * cs, drop = sm(clamp01(this.sealT / 0.25)); cellLocal(sx, (D.B.h - 1) / 2, V.board3, this.chain.position); this.chain.position.y += (1 - drop) * H; this.chain.position.z = DUEL_VIEW.front + 0.04; this.chain.scale.set(cs * 0.8, H, 1); this.chain.material.map.repeat.set(1, D.B.h / 2); this.chain.material.opacity = 0.92; }
    // the conquest sweeps
    for (const S of this.sweeps) { S.age += dt; const u = S.age / S.life; S.m.visible = u >= 0 && u < 1; if (!S.m.visible) continue;
      const H = D.B.h * cs, y = S.dir > 0 ? D.top - H * sm(u) : D.base + H * sm(u); cellLocal(S.x, 0, V.board3, S.m.position); S.m.position.y = y; S.m.position.z = DUEL_VIEW.front + 0.06;
      S.m.scale.set(cs, cs * 3, 1); S.m.material.opacity = (1 - u) * 0.9; }
    // the casts' shots
    let k = 0;
    for (let i = this.flying.length - 1; i >= 0; i--) { const q = this.flying[i]; q.age += dt; if (q.age < 0) continue; const u = q.age / q.life;
      if (u >= 1) { V.bursts.burst(q.to, q.hex, 5, { speed: 0.6, life: 0.35, fall: 3, size: 0.02 }); this.flying.splice(i, 1); continue; }
      const f = sm(u), v = 1 - f; _a.copy(q.from).multiplyScalar(v * v).addScaledVector(q.mid, 2 * v * f).addScaledVector(q.to, f * f);
      if ((q.trailT -= dt) <= 0) { q.trailT = 0.03; V.bursts.burst(_a, q.hex, 1, { speed: 0.1, life: 0.25, fall: 0, spread: 0.02, size: q.size * 0.5 }); }
      this.shots.setMatrixAt(k, _m.compose(_a, _q.setFromAxisAngle(_b.set(0.3, 1, 0.2).normalize(), t * 8 + i), _s.setScalar(q.size))); this.shots.setColorAt(k++, _c.setHex(q.hex).multiplyScalar(1.4)); }
    this.shots.count = k; this.shots.instanceMatrix.needsUpdate = true; if (this.shots.instanceColor) this.shots.instanceColor.needsUpdate = true;
    // the drag's timer
    const tk = pve ? this.timerK : null; this.trough.visible = this.fill.visible = tk != null;
    if (tk != null) { const x = -D.W / 2 - D.b - cs * 0.6, y0 = D.base, H = D.B.h * cs; // (a column beside the frame's Courier end, draining downward: the board view crops the frame's foot)
      this.trough.position.set(x, y0, D.lip); this.trough.rotation.z = Math.PI / 2; this.trough.scale.set(H, cs * 0.5, 0.012);
      this.fill.position.set(x, y0, D.lip + 0.007); this.fill.rotation.z = Math.PI / 2; this.fill.scale.set(Math.max(0.001, H * tk), cs * 0.36, 0.012);
      this.fill.material.color.setHex(tk > 0.3 ? FILM : EMBER).multiplyScalar(tk > 0.3 ? 1 : 1 + 0.4 * Math.sin(t * 14)); }
  }
}
