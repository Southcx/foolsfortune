// ---------------------------------------------------------------------------------------
// THE TOUCH LAYOUT EDITOR (docs/plans/MOBILE.md 9, M5: "a layout editor (move and size the cluster)"): touch play's buttons laid out by
// hand, opened from the settings window (ui/settingswindow.js, its "Touch layout" row) for the way the phone is held now. Over the world:
//   THE TILES    the cluster's four slots as its own glazed tiles (ui/touch/tile.js; faces: JUMP, CROUCH, DASH, PARRY, the on-foot set),
//                each dragged by a finger; where it is let go it stands clamped (hudlayout.js clampRect): inside the safe area, off every
//                corner instrument, the top bar, the log and the other tiles.
//   THE RING     the stick's home: where the stick's ring rests (ui/touch/stick.js, at rest), dragged inside the move area.
//   KEEP-OUTS    every rect a tile may not enter, hatched in dark clay with a gold keyline, so a tile that stops says why (CLAUDE.md:
//                the UI shows where it bites).
//   THE PANEL    a System window in the Clay dress (ui/brineframe.js under ui/goalswindow.js clayDress) where the top bar stands (a
//                keep-out already): SIZE (the cluster's tiles, x0.70 .. x1.30: never under 44 px), DONE (kept: game.touchLayoutKeep.put,
//                core/layoutkeep.js), RESET (this way of holding back to the HUD's own rule; kept on DONE), CANCEL (nothing kept).
// The layout's shape is the HUD layout's (hudlayout.js "THE KEPT LAYOUT"): per orientation, centres as fractions of the safe area, so it
// survives a different phone. Each orientation is laid out on its own; turning the phone mid-edit shows the other one's draft. The
// words are placeholders, in plain English, for Espada (MOBILE.md 8.3). No stock control: the slider and the buttons are drawn here.
//
// Prior art: PUBG Mobile's and Genshin Impact's custom HUD layout editors (every button dragged over the live game, a size slider, a
// reset to default and a save; Genshin's resting joystick shown where it waits), Call of Duty Mobile's (the keep-outs it will not let a
// button cross), the house's settings window and turn card for the dress (ui/settingswindow.js, ui/turncard.js).
//
//   game.touchLayoutEditor = new TouchLayoutEditor(game)   (made by the settings window on first use)   .open(onClose) -> bool (touch
//   only)   .close(keep)   .isOpen   .reset()   .scale(k)   LAYOUT_EDITOR (the numbers and words)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TouchTile, TILE } from './touch/tile.js';
import { placeOf } from './touch/areas.js';
import { defaultSpots } from './touch/cluster.js';
import { HUD_LAYOUT } from './hudlayout.js';
import { brineFrame, GOLD, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';
import { schillerInk, SCHILLER } from '../vfx/oxidation.js';
import { sfx } from '../audio/sfx.js';

/** The numbers and words: the slots' faces (id, glyph, word), the size's step, the ring's radius (the stick's full push), the words. */
export const LAYOUT_EDITOR = {
  faces: [['jump', 'jump', null], ['crouch', 'crouch', 'CROUCH'], ['dash', 'dash', null], ['parry', 'parry', 'PARRY']],
  step: 0.05, ring: HUD_LAYOUT.custom.ring, target: 44, rate: 12,
  words: { title: 'LAYOUT', size: 'SIZE', done: 'DONE', reset: 'RESET', cancel: 'CANCEL' }, // (placeholders: Espada's)
};
const E = LAYOUT_EDITOR, Wd = E.words;

const CSS = `
.tle{position:fixed;inset:0;z-index:61;background:rgba(14,6,3,.3);touch-action:none;user-select:none;-webkit-user-select:none}
.tle[hidden]{display:none}
.tle-keep{position:absolute;pointer-events:none;border-radius:6px;box-shadow:inset 0 0 0 2px rgba(255,211,106,.55),0 0 0 1px rgba(23,17,31,.7);
  background:repeating-linear-gradient(135deg,rgba(42,20,12,.55) 0 6px,rgba(42,20,12,.18) 6px 12px)}
.tle-ring{position:absolute;left:0;top:0;touch-action:none;cursor:grab;z-index:2}
.tle-win{position:absolute;--d:2px;color:#efe6d2;font-family:${FONT.sys};font-size:15px;z-index:3}
${clayDress('.tle-win.clay')}
.tle-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:6px 10px}
.tle-title{font-family:${FONT.title};font-weight:700;font-size:16px;letter-spacing:.16em;min-height:${E.target}px;display:flex;align-items:center;padding-right:4px}
.tle-size{flex:1 1 150px;display:flex;align-items:center;gap:8px;min-width:150px}
.tle-size b{font-family:${FONT.title};font-size:14px;letter-spacing:.08em}
.tle-val{font-family:${COUNT_FACE};font-size:16px;color:${GOLD};min-width:44px;text-align:right;font-variant-numeric:tabular-nums}
.tle-track{position:relative;flex:1;height:${E.target}px;cursor:pointer;touch-action:none}
.tle-groove{position:absolute;left:12px;right:12px;top:50%;height:10px;margin-top:-5px;border-radius:5px;background:#2a140c;box-shadow:inset 0 2px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.12)}
.tle-fill{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 55%),rgb(var(--jtop,104,50,32));filter:brightness(1.9) saturate(1.2)}
.tle-knob{position:absolute;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f2c49a,#a8664a 55%,#5c3020);box-shadow:0 2px 0 #1c0d08,0 0 0 2px rgba(255,236,214,.25)}
.tle-btns{display:flex;flex-wrap:wrap;gap:6px;flex:1 0 auto;justify-content:flex-end}
.tle-btn{flex:1 0 auto;min-height:${E.target}px;min-width:${E.target}px;padding:0 9px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:${FONT.title};font-weight:700;font-size:14px;letter-spacing:.04em;
  border-radius:8px;background:linear-gradient(180deg,#6a3a26,#3e2016);box-shadow:inset 0 1px 0 rgba(255,226,196,.2),0 2px 0 #1c0d08}
.tle-btn.done{color:#2a140c;background:linear-gradient(180deg,#ffe9a8,${GOLD} 60%,#b98a2e)}
`;

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const clone = (v) => (v == null ? null : JSON.parse(JSON.stringify(v)));
const _c = new THREE.Color();

export class TouchLayoutEditor {
  constructor(game) { this.game = game; this.isOpen = false; this.root = null; this.tiles = []; this.drafts = {}; this.rects = []; this.raf = 0; this.drag = null; }

  build() {
    if (this.root || typeof document === 'undefined') return;
    const st = make('style'); st.setAttribute('data-touchlayouteditor', ''); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = make('div', 'tle')); root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'touch layout');
    for (const ev of ['pointerdown', 'touchstart', 'mousedown', 'wheel', 'contextmenu']) root.addEventListener(ev, (e) => { e.stopPropagation(); if (ev === 'contextmenu') e.preventDefault(); }, { passive: ev !== 'contextmenu' });
    this.keeps = make('div'); root.append(this.keeps);
    // the stick's home
    const ring = (this.ring = make('div', 'tle-ring')); this.ringCv = make('canvas'); ring.append(this.ringCv); root.append(ring);
    this.dragOn(ring, () => ({ x: this.home.x, y: this.home.y }), (c) => { this.draft().stick = this.game.hudLayout.toFrac(c.x, c.y); });
    // the panel
    const win = (this.win = make('div', 'tle-win clay')); root.append(win);
    const f = (this.frame = brineFrame(win)), row = make('div', 'tle-row');
    const size = make('div', 'tle-size'), track = make('div', 'tle-track'), groove = make('div', 'tle-groove');
    this.fill = make('div', 'tle-fill'); this.knob = make('div', 'tle-knob'); this.val = make('span', 'tle-val');
    groove.append(this.fill, this.knob); track.append(groove); size.append(make('b', null, Wd.size), track, this.val);
    const at = (e) => { const b = groove.getBoundingClientRect(), k = Math.min(1, Math.max(0, (e.clientX - b.left) / Math.max(1, b.width))), [lo, hi] = HUD_LAYOUT.custom.scale; this.scale(lo + k * (hi - lo)); };
    let held = null;
    track.addEventListener('pointerdown', (e) => { held = e.pointerId; track.setPointerCapture?.(e.pointerId); at(e); });
    track.addEventListener('pointermove', (e) => { if (e.pointerId === held) at(e); });
    for (const ev of ['pointerup', 'pointercancel']) track.addEventListener(ev, (e) => { if (e.pointerId === held) { held = null; sfx.click?.(); } });
    const btns = make('div', 'tle-btns'), done = make('div', 'tle-btn done', Wd.done), reset = make('div', 'tle-btn', Wd.reset), cancel = make('div', 'tle-btn', Wd.cancel);
    done.dataset.layoutDone = ''; reset.dataset.layoutReset = '';
    done.onclick = () => this.close(true); reset.onclick = () => this.reset(); cancel.onclick = () => this.close(false);
    btns.append(done, reset, cancel); row.append(make('div', 'tle-title', Wd.title), size, btns); f.body.append(row);
    // the four slots
    this.tiles = E.faces.map(([id, glyph, word]) => {
      const t = new TouchTile(`edit.${id}`, { size: TILE.size, glyph, word, onPress: () => {} }); // (a tile here only moves: it presses nothing)
      t.el.style.zIndex = '63'; t.el.style.cursor = 'grab';
      return t;
    });
    this.tiles.forEach((t, i) => this.dragOn(t.el, () => { const r = this.rects[i]; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }, (c) => {
      const d = this.draft(); d.slots[i] = this.game.hudLayout.toFrac(c.x, c.y);
    }));
    document.body.appendChild(root);
  }

  /** A finger on `el` drags what `from()` says is its centre; each move is `to(centre)` then a fresh placing; let go, the clamped places are kept. */
  dragOn(el, from, to) {
    el.addEventListener('pointerdown', (e) => {
      if (!this.isOpen || this.drag) return;
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, c: from() };
    });
    el.addEventListener('pointermove', (e) => {
      const D = this.drag; if (!D || e.pointerId !== D.id) return;
      to({ x: D.c.x + e.clientX - D.x, y: D.c.y + e.clientY - D.y }); this.place();
    });
    const end = (e) => { const D = this.drag; if (!D || e.pointerId !== D.id) return; this.drag = null; this.settle(); sfx.click?.(); };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
  }

  get part() { return this.game.hudLayout?.portrait ? 'portrait' : 'landscape'; }
  /** The HUD's own rule for this way of holding, as a layout part. */
  defaults() {
    const L = this.game.hudLayout, spots = defaultSpots(placeOf(this.game).areas.cluster, null);
    return { scale: 1, slots: spots.map(([x, y, s]) => L.toFrac(x + s / 2, y + (s + TILE.foot) / 2)), stick: { ...HUD_LAYOUT.custom.stick } };
  }
  /** This way of holding's draft, made from what stands the first time it is changed. */
  draft() { const p = this.part; if (!this.drafts[p]) this.drafts[p] = this.shown(); return this.drafts[p]; }
  /** What stands for this way of holding: its draft, else the kept part, else the default. */
  shown() {
    const p = this.part, d = this.drafts[p];
    if (d) return d;
    if (d === null) return this.defaults(); // (RESET: the default, kept as no part)
    return clone(this.game.hudLayout?.kept?.[p]) || this.defaults();
  }

  open(onClose = null) {
    const L = this.game.hudLayout; if (!L?.touch || this.isOpen) return false;
    this.build(); if (!this.root) return false;
    this.onClose = onClose; this.drafts = {}; this.isOpen = true; this.root.hidden = false;
    for (const t of this.tiles) t.set({ hidden: false });
    this.off = L.on('change', () => { if (this.isOpen) this.place(); });
    this.place(); this.frame.layout?.();
    const loop = (ms) => { this.raf = 0; if (!this.isOpen) return; this.frameTick(ms / 1000); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    sfx.menuOpen?.();
    return true;
  }

  /** Close: `keep` puts what was laid out to the keep (every orientation touched), else nothing changes. */
  close(keep = false) {
    if (!this.isOpen) return;
    if (keep) {
      const K = this.game.touchLayoutKeep, kept = clone(this.game.hudLayout?.kept) || {}, out = { v: 1 };
      for (const p of ['landscape', 'portrait']) { const d = p in this.drafts ? this.drafts[p] : kept[p]; if (d) out[p] = d; }
      if (out.landscape || out.portrait) K?.put(out); else { K?.clear(); this.game.hudLayout?.resetLayout?.(); }
      sfx.menuOk?.();
    } else sfx.menuBack?.();
    this.isOpen = false; this.drag = null; this.root.hidden = true; this.off?.(); this.off = null;
    for (const t of this.tiles) { t.release(); t.set({ hidden: true }); }
    if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
    const fn = this.onClose; this.onClose = null; fn?.();
  }

  /** This way of holding back to the HUD's own rule (kept on DONE as no part). */
  reset() { this.drafts[this.part] = null; this.place(); sfx.menuMove?.(); }
  /** The cluster's tiles sized, snapped to the step. */
  scale(k) { const [lo, hi] = HUD_LAYOUT.custom.scale, s = Math.round(Math.min(hi, Math.max(lo, k)) / E.step) * E.step; const d = this.draft(); if (Math.abs((d.scale ?? 1) - s) < 1e-6) return; d.scale = +s.toFixed(2); this.place(); }

  /** Everything stood again from the shown part: the panel over the top bar, the tiles clamped (hudlayout.js clampRect), the ring after them. */
  place() {
    const L = this.game.hudLayout; if (!L) return;
    const T = L.areas.topBar, P = this.shown(), k = L.clusterScale(P), gap = HUD_LAYOUT.gap;
    // over the top bar, starting right of QAIS's corner tile where it stands in the same row (debug/qais/reportbutton.js)
    const qe = document.querySelector('[data-tile="qais.report"]:not(.hidden)'), qr = qe?.getBoundingClientRect();
    const x0 = qr && qr.width && qr.top < T.y + T.h && qr.bottom > T.y && qr.left < T.x + 120 ? Math.max(T.x, qr.right + gap) : T.x;
    Object.assign(this.win.style, { left: `${Math.round(x0)}px`, top: `${Math.round(T.y)}px`, width: `${Math.round(Math.max(T.x + T.w - x0, 220))}px` });
    const pb = this.win.getBoundingClientRect(), panel = { x: pb.left, y: pb.top, w: pb.width, h: pb.height }, spots = defaultSpots(L.areas.cluster, null);
    this.rects = [];
    this.tiles.forEach((t, i) => {
      const size = Math.max(TILE.min, Math.round(spots[i][2] * k)), w = t.widthFor(size), c = P.slots?.[i] ? L.fromFrac(P.slots[i]) : { x: spots[i][0] + spots[i][2] / 2, y: spots[i][1] + spots[i][2] / 2 };
      const q = L.clampRect({ x: c.x - w / 2, y: c.y - (size + TILE.foot) / 2, w, h: size + TILE.foot }, [panel, ...this.rects]);
      t.place(q.x, q.y, size, w); this.rects.push(q);
    });
    this.home = L.stickHome(P, [panel, ...this.rects]); this.ringAt = -9;
    const lo = HUD_LAYOUT.custom.scale[0], hi = HUD_LAYOUT.custom.scale[1], f = (k - lo) / (hi - lo);
    this.fill.style.width = `${f * 100}%`; this.knob.style.left = `${f * 100}%`; this.val.textContent = `x${k.toFixed(2)}`;
    // the keep-outs: what a tile may not enter, the top bar under the panel left out
    const ks = L.obstacles().filter((o) => o !== T);
    while (this.keeps.children.length < ks.length) this.keeps.append(make('div', 'tle-keep'));
    [...this.keeps.children].forEach((el, i) => { const o = ks[i]; el.hidden = !o; if (o) Object.assign(el.style, { left: `${Math.round(o.x)}px`, top: `${Math.round(o.y)}px`, width: `${Math.round(o.w)}px`, height: `${Math.round(o.h)}px` }); });
  }

  /** A finger let go: the draft takes the places as they were clamped, so what is kept is where it stood. */
  settle() {
    const L = this.game.hudLayout, d = this.drafts[this.part]; if (!L || !d) return;
    d.slots = this.rects.map((r) => L.toFrac(r.x + r.w / 2, r.y + r.h / 2));
    d.stick = L.toFrac(this.home.x, this.home.y);
    this.place();
  }

  frameTick(now) {
    for (const t of this.tiles) t.update(now);
    if (now - this.ringAt >= 1 / E.rate) { this.ringAt = now; this.drawRing(now); }
  }

  /** The stick's home: the well, the full push's ring walking the schiller (the stick's own), a clay knob at its heart. */
  drawRing(now) {
    const R = E.ring, B = R + 10, D = 2 * B, dpr = Math.max(1, Math.min(3, devicePixelRatio || 1)), cv = this.ringCv, H = this.home; if (!H) return;
    if (cv.width !== Math.round(D * dpr)) { cv.width = cv.height = Math.round(D * dpr); cv.style.width = cv.style.height = `${D}px`; this.ring.style.width = this.ring.style.height = `${D}px`; }
    this.ring.style.transform = `translate(${Math.round(H.x - B)}px, ${Math.round(H.y - B)}px)`;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, D, D);
    const o = B, well = g.createRadialGradient(o, o, R * 0.3, o, o, R + 8);
    well.addColorStop(0, 'rgba(28,13,8,.55)'); well.addColorStop(1, 'rgba(28,13,8,0)'); g.beginPath(); g.arc(o, o, R + 8, 0, Math.PI * 2); g.fillStyle = well; g.fill();
    const N = 48; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < N; i++) { schillerInk(now * SCHILLER.rate + i * 0.01, _c, { floor: 0.5, sheen: 1, bright: 1.4 }); g.beginPath(); g.arc(o, o, R, (i / N) * Math.PI * 2, ((i + 1) / N) * Math.PI * 2 + 0.01); g.strokeStyle = _c.getStyle(); g.stroke(); }
    g.setLineDash([4, 5]); g.beginPath(); g.arc(o, o, R + 6, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = this.drag ? 'rgba(255,211,106,.9)' : 'rgba(239,230,210,.45)'; g.stroke(); g.setLineDash([]);
    const k = 24, clay = g.createRadialGradient(o - k * 0.3, o - k * 0.35, 2, o, o, k);
    clay.addColorStop(0, '#f2c49a'); clay.addColorStop(0.55, '#a8664a'); clay.addColorStop(1, '#5c3020');
    g.beginPath(); g.arc(o, o + 2, k, 0, Math.PI * 2); g.fillStyle = '#1c0d08'; g.fill();
    g.beginPath(); g.arc(o, o, k, 0, Math.PI * 2); g.fillStyle = clay; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  }
}
