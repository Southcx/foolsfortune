// ---------------------------------------------------------------------------------------
// THE HUD LAYOUT: the one layout manager for touch play (docs/plans/MOBILE.md 4.9, 6.3, 10 "Calissa's answers" 1). It reads the screen
// (its size, its orientation, the safe area's insets, the last device) and lays out where everything may stand: the thumbs' areas (the
// move area, the look area), the cluster, the top bar, the art bar, and every corner instrument registered with it. Its unit is `su`,
// 1% of the safe area's SHORTER side (never the height: a phone held upright overflowed when the instruments were sized by it).
// On keyboard and mouse it still measures and lays out, but reserves nothing, and the instruments keep their own desk layout: nothing
// on the desk moves. It also owns the two touch-only pieces that follow the layout: the log's ticker (ui/touchlog.js) and the turn card
// (ui/turncard.js).
//
// How an instrument stands on touch (HUD_LAYOUT.instruments): an anchor corner of the safe area, a scale in su a line (a line: one
// line of the 480-line present, the unit every instrument already measures itself in), and the things it keeps clear of: `below` an
// instrument, `above` / `leftOf` an area or an instrument, `beside` one (left of it, bottoms aligned). If it would shrink under `min`
// of its size to fit, it takes its `else` placement instead. Nothing it places enters a reserved rect.
//
// THE STRIP'S ROOM (areas.strip, stripArea(cb)): the cluster's strip and the belt's pair (ui/touch/strip.js) stand over the cluster, and
// on a phone held sideways that column runs into the Sight; so the strip has a room of its own, reserved like the cluster: over the
// cluster up to the top bar and the log, and where the Sight stands in that column, only left of it (the Sight is never moved for it).
// The bottom row (the belt's pair's, or the strip's own with no pair) may reach further left, to a quarter of the view.
//
// THE KEPT LAYOUT (MOBILE.md 9, M5; the touch layout editor, ui/touchlayouteditor.js; kept by Petra's core/layoutkeep.js): read on boot,
// on `touch.layout` and on every poll (a save loaded late says nothing). Its shape is ours:
//   { v: 1, landscape: PART, portrait: PART }   PART { scale (0.75..1.3, the cluster's tiles), slots: [{ fx, fy }] x 4 (each cluster
//   slot's centre), stick: { fx, fy } (the stick's home) }   fx, fy fractions of the safe area's bounds, so it survives another phone.
// A kept place is clamped on every read: inside the bounds, off every corner instrument, the top bar and the log (clampRect), never under
// 44 px. Nothing kept moves the instruments: they keep the default cluster's reservation.
//
// Prior art: Apple's Human Interface Guidelines on safe areas and layout margins (the insets read from env(safe-area-inset-*), the
// controls inside them, 44 pt the least target); Genshin Impact's mobile HUD (the floating stick on the left half, the camera drag on the
// right, the verbs in one cluster under the right thumb, the minimap and menus clear of both thumbs at the top); Mario Kart Tour's (the
// race's readouts lifted to the top corners, nothing under the steering thumb); CSS's own environment variables and media queries.
//
//   game.hudLayout = new HudLayout(game)   (main.js, before the instruments)
//   L.touch  L.portrait  L.view {w, h}  L.safe {t, r, b, l}  L.su  L.turnHeld      (CSS px; read again on every change)
//   L.areas { move, look, cluster, topBar, artBar, strip }   each { x, y, w, h } CSS px from the view's top left
//   L.reserved() -> [rect]      on touch: the cluster, the move area's lower-left quarter, the top bar, the art bar while the
//                               Spirit Garden or the god hand is up; [] on keyboard and mouse
//   L.register(id, { anchor, w, h, touch: { anchor, scale, below, above, leftOf, beside, min, else } })   (w, h in lines)
//   L.place(id, { w, h }?) -> { x, y, scale, w, h }   the box's top left (CSS px), CSS px a line, the box's size (CSS px)
//   L.areas.strip  L.stripArea(cb) -> { left, right, top, base, sideLeft }   L.obstacles() -> [rect]   L.clampRect(r, extra?, bounds?)
//   L.custom (this orientation's kept PART, or null)   L.clusterScale()   L.fromFrac({ fx, fy }) -> { x, y }   L.toFrac(x, y)
//   L.stickHome() -> { x, y }   L.resetLayout() (the settings' `layout` row: the kept layout already forgotten, lay out again)
//   L.on('change', fn) -> off()  on a resize, an orientation change, a device change, the garden or the hand coming up
//   document.body: .hud-touch .hud-portrait .hud-landscape, and the CSS vars --su --safe-t --safe-r --safe-b --safe-l
//   (--hud-log-x, --hud-log-y, --hud-log-w: the log's ticker)
// ---------------------------------------------------------------------------------------
import { TouchLog } from './touchlog.js';
import { TurnCard } from './turncard.js';

export const HUD_LAYOUT = {
  gutter: 8,            // (CSS px inside the safe area, every side: the layout margin)
  gap: 8,               // (CSS px between two things placed)
  topBar: { h: 44 },    // (the strip of window icons: one 44 px target tall, left of the Sight)
  // the cluster: the main tile (80) in the corner, the three others (60) on an arc round its centre at 180, 135 and 90 degrees
  // (left, up-left, up), `ring` from it; its rect is the arc's bounds: main / 2 + ring + side / 2 = 180 px square
  cluster: { main: 80, side: 60, gap: 10, get ring() { return this.main / 2 + this.gap + this.side / 2; }, get size() { return this.main / 2 + this.ring + this.side / 2; } },
  artBar: { t: 60, side: 170 }, // (its thickness, CSS px: a 44 px tile and its margin, along the bottom upright; down the right edge on its side, three columns
                        //  of tiles wide from under the Sight to the foot, the cluster beside it: ten tiles never fit between the Sight and the cluster)
  log: { lines: 2, line: 18, pad: 6, maxW: 420 },
  strip: { budget: 180, minW: 150, side: 0.25 }, // (the strip's room: up to 180 px over the cluster (its pair and two rows), at least 150 wide; the bottom row
                        //  reaching left to a quarter of the view)
  custom: { scale: [0.75, 1.3], stick: { fx: 0.18, fy: 0.72 }, ring: 60 }, // (the kept layout: the cluster's scale range (60 x 0.75 = 45 px, over 44); the stick's
                        //  home by default, low in the move area; the ring kept clear round it (the stick's full push, ui/touch/stick.js STICK.full)) // (the ticker: two lines of 18 px (16 px type), at most 420 px wide)
  poll: 0.25,           // (real seconds between reads of the device, the garden and the hand, and the turn card's check)
  // the instruments, in lines of the 480-line present (their own unit); `scale` su a line on touch (0.2: a 390 px phone's 0.78 CSS px a
  // line, the desk's 1080 lines are 2.25)
  instruments: {
    sight: { anchor: 'tr', w: 172, h: 178, touch: { anchor: 'tr', scale: 0.2 } },
    lachrimeterTube: { anchor: 'br', w: 112, h: 189, touch: { anchor: 'tr', below: 'sight', above: 'cluster', scale: 0.2, min: 0.8,
      else: { anchor: 'br', leftOf: 'cluster', scale: 0.2 } } }, // (up the right edge under the Sight; on its side the phone has no room there: left of the cluster)
    psygunCylinder: { anchor: 'br', w: 190, h: 160, touch: { anchor: 'br', beside: 'lachrimeterTube', scale: 0.2 } },
  },
};

const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const rect = (x, y, w, h) => ({ x, y, w: Math.max(0, w), h: Math.max(0, h) });

export class HudLayout {
  constructor(game) {
    this.game = game;
    this.touch = false; this.portrait = false; this.turnHeld = false;
    this.view = { w: 0, h: 0 }; this.safe = { t: 0, r: 0, b: 0, l: 0 }; this.su = 1;
    this.areas = { move: rect(0, 0, 0, 0), look: rect(0, 0, 0, 0), cluster: rect(0, 0, 0, 0), topBar: rect(0, 0, 0, 0), artBar: rect(0, 0, 0, 0), strip: rect(0, 0, 0, 0) };
    this.log = rect(0, 0, 0, 0); this.bounds = rect(0, 0, 0, 0);
    this.specs = new Map(); this.rects = new Map(); this.fns = new Set(); this.sig = ''; this.kept = null;
    for (const [id, s] of Object.entries(HUD_LAYOUT.instruments)) this.register(id, s);
    if (typeof document === 'undefined') return;
    // the safe area's insets, read off a hidden probe padded by them (iOS gives them only under viewport-fit=cover; elsewhere 0)
    const p = (this.probe = document.createElement('div'));
    p.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(p);
    this.touchLog = new TouchLog(game, this); this.turnCard = new TurnCard(game, this);
    const read = () => this.read();
    addEventListener('resize', read); addEventListener('orientationchange', read);
    globalThis.visualViewport?.addEventListener?.('resize', read);
    try { matchMedia('(pointer: coarse)').addEventListener('change', read); } catch { /* an old engine: the poll still reads it */ }
    game.events?.on?.('input.device', read); game.events?.on?.('touch.layout', read);
    this.timer = setInterval(() => { this.read(); this.turnCard.check(); }, HUD_LAYOUT.poll * 1000);
    this.read(true);
  }

  /** Is the last device touch? `game.input.device` when the input layer has one; `?touch` (or `?touch=0`) forces it; else a coarse pointer with touch points. */
  isTouch() {
    if (this.forced != null) return this.forced; // (force(on): the touch controls' and a test's word, so the two never disagree)
    let q = null; try { q = new URLSearchParams(location.search); } catch { /* no location */ }
    if (q?.has('touch')) return q.get('touch') !== '0';
    const d = this.game.input?.device;
    if (d) return d === 'touch';
    try { return matchMedia('(pointer: coarse)').matches && (navigator.maxTouchPoints || 0) > 0; } catch { return false; }
  }

  /** Force touch on or off (null: back to the device's word); the touch controls' `game.touchUI.force` calls it too. */
  force(on) { this.forced = on == null ? null : !!on; this.read(true); }

  /** The art bar is up while the Spirit Garden or the god hand is. */
  artUp() { const g = this.game; return !!(g.realm?.active || g.god?.active || g.godhand?.active); }

  /** Read the screen; lay out again and tell the listeners if anything changed. */
  read(force = false) {
    const cs = this.probe ? getComputedStyle(this.probe) : null, px = (v) => Math.round(parseFloat(v) || 0);
    const safe = cs ? { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) } : { t: 0, r: 0, b: 0, l: 0 };
    const w = Math.round(innerWidth), h = Math.round(innerHeight), touch = this.isTouch(), art = this.artUp();
    let kept = null; try { kept = this.game.touchLayoutKeep?.get?.() ?? null; } catch { /* no keep */ }
    const sig = `${w}x${h}|${safe.t},${safe.r},${safe.b},${safe.l}|${touch}|${art}|${kept ? JSON.stringify(kept) : ''}`;
    if (sig === this.sig && !force) return;
    this.sig = sig; this.kept = kept && kept.v === 1 ? kept : null; this.view = { w, h }; this.safe = safe; this.touch = touch; this.portrait = h > w; this.art = art;
    this.su = Math.max(1, Math.min(w - safe.l - safe.r, h - safe.t - safe.b) / 100);
    this.layout(); this.dress();
    if (!touch) this.turnCard.check();
    for (const fn of this.fns) { try { fn(this); } catch (e) { console.warn('hudLayout change', e); } }
  }

  /** The areas and the instruments' boxes for this screen. */
  layout() {
    const H = HUD_LAYOUT, g = H.gutter, gap = H.gap, V = this.view, S = this.safe;
    const B = (this.bounds = rect(S.l + g, S.t + g, V.w - S.l - S.r - 2 * g, V.h - S.t - S.b - 2 * g));
    this.rects.clear();
    const A = this.areas;
    A.move = rect(0, 0, V.w / 2, V.h); A.look = rect(V.w / 2, 0, V.w - V.w / 2, V.h);
    A.cluster = rect(0, 0, 0, 0); A.topBar = rect(0, 0, 0, 0); A.artBar = rect(0, 0, 0, 0); // (cleared while the Sight is placed: it keeps clear of none of them)
    const sight = this.box('sight');
    // (upright the strip beside the Sight is narrow: the top bar may take the Sight's height there, its tiles wrapped into rows, ui/touch/topbar.js)
    A.topBar = rect(B.x, B.y, (sight ? sight.x - gap : B.x + B.w) - B.x, this.portrait && sight ? Math.max(H.topBar.h, sight.h) : H.topBar.h);
    const C = H.cluster.size, t = H.artBar.t;
    if (this.portrait) {
      A.artBar = rect(B.x, B.y + B.h - t, B.w, t);
      A.cluster = rect(B.x + B.w - C, (this.art ? A.artBar.y - gap : B.y + B.h) - C, C, C);
    } else {
      const y0 = sight ? sight.y + sight.h + gap : A.topBar.y + A.topBar.h + gap, w = H.artBar.side;
      A.artBar = this.art ? rect(B.x + B.w - w, y0, w, B.y + B.h - y0) : rect(0, 0, 0, 0);
      A.cluster = rect((this.art ? A.artBar.x - gap : B.x + B.w) - C, B.y + B.h - C, C, C);
    }
    this.rects.clear(); // (the instruments placed again against the areas as they now stand)
    A.strip = rect(0, 0, 0, 0);
    // the log's ticker: under the top bar, at the left, never wider than the room left of the Sight (upright) or the left half (on its side)
    const L = H.log, sb = this.box('sight'), sx = sb?.x ?? B.x + B.w, right = this.portrait ? sx - gap : Math.min(V.w / 2, sx - gap);
    this.log = rect(B.x, A.topBar.y + A.topBar.h + gap, Math.min(L.maxW, right - B.x), L.lines * L.line + L.pad);
    // the strip's room, against what stands before it (the Sight, the top bar, the log); reserved, so the instruments placed after keep off it
    if (!this.art) {
      const Z = this.stripArea(null, [sb, A.topBar, this.log].filter(Boolean)), top = Math.max(Z.top, Z.base - H.strip.budget);
      A.strip = rect(Z.left, top, Z.right - Z.left, Z.base - top);
    }
    this.rects.clear();
  }

  /** Where the cluster's strip may stand over cluster bounds `cb` (null: the default cluster's area): its rows between `left` and
   *  `right`, no higher than `top`, on `base`; its bottom row (beside the belt's pair) as far left as `sideLeft`. */
  stripArea(cb, obs = this.obstacles()) {
    const B = this.bounds, H = HUD_LAYOUT, gap = H.gap, A = this.areas, V = this.view, S = H.strip;
    const base = cb ? cb.y : A.cluster.y; let right = cb ? cb.x + cb.w : A.cluster.x + A.cluster.w;
    const left = Math.max(B.x, Math.min(A.look.w > 0 ? A.look.x + gap : V.w / 2, right - S.minW));
    const above = obs.filter((o) => o && o.w > 0 && o.h > 0 && o.y < base);
    const topAt = (r) => above.reduce((t, o) => (o.x < r && left < o.x + o.w ? Math.max(t, o.y + o.h + gap) : t), B.y);
    let top = topAt(right);
    if (base - top < S.budget) { // (too short: stand left of whatever blocks the column low, the Sight on a phone held sideways)
      const low = above.filter((o) => o.x < right && left < o.x + o.w && o.y + o.h + gap > base - S.budget && o.x - gap - left >= S.minW);
      if (low.length) { const r2 = Math.min(...low.map((o) => o.x - gap)), t2 = topAt(r2); if (t2 < top) { right = r2; top = t2; } }
    }
    // the bottom row's band may reach further left, to a quarter of the view on its side, stopping at anything standing in that band
    const bandTop = base - 64; let sideLeft = this.portrait ? left : Math.max(B.x, V.w * S.side + gap);
    for (const o of obs) if (o && o.w > 0 && o.y < base && o.y + o.h > bandTop && o.x + o.w <= right && o.x < left) sideLeft = Math.max(sideLeft, o.x + o.w + gap);
    return { left, right, top, base, sideLeft: Math.min(sideLeft, left) };
  }

  /** Every rect a touch control may not enter: the corner instruments, the top bar, the log's ticker (and the art bar while it stands). */
  obstacles() {
    if (!this.touch) return [];
    const out = [this.areas.topBar, this.log];
    if (this.art) out.push(this.areas.artBar);
    for (const id of this.specs.keys()) { const r = this.box(id); if (r) out.push(r); }
    return out.filter((r) => r && r.w > 0 && r.h > 0);
  }

  /** `r` moved the least way inside `bounds` (the safe area's, by default) and off every obstacle and every rect in `extra`. */
  clampRect(r, extra = [], bounds = this.bounds) {
    const B = bounds, obs = [...this.obstacles(), ...extra].filter((o) => o && o.w > 0 && o.h > 0);
    const inside = (q) => q.x >= B.x - 0.5 && q.y >= B.y - 0.5 && q.x + q.w <= B.x + B.w + 0.5 && q.y + q.h <= B.y + B.h + 0.5;
    const free = (q) => !obs.some((o) => hit(q, o));
    let q = { ...r, x: Math.min(Math.max(r.x, B.x), B.x + B.w - r.w), y: Math.min(Math.max(r.y, B.y), B.y + B.h - r.h) };
    for (let i = 0; i < 6 && !free(q); i++) {
      const o = obs.find((x) => hit(q, x)), d = (m) => Math.abs(m.x - q.x) + Math.abs(m.y - q.y);
      const moves = [[o.x - q.w - 1, q.y], [o.x + o.w + 1, q.y], [q.x, o.y - q.h - 1], [q.x, o.y + o.h + 1]].map(([x, y]) => ({ ...q, x, y })).filter(inside).sort((a, b) => d(a) - d(b));
      if (!moves.length) break;
      q = moves.find(free) || moves[0];
    }
    if (free(q)) return q;
    let best = null, bd = Infinity; // (boxed in: the nearest clear spot on an 8 px grid)
    for (let y = B.y; y + q.h <= B.y + B.h; y += 8) for (let x = B.x; x + q.w <= B.x + B.w; x += 8) {
      const c = { ...q, x, y }, dd = Math.hypot(x - r.x, y - r.y); if (dd < bd && free(c)) { bd = dd; best = c; }
    }
    return best || q;
  }

  /** This orientation's kept part (touch only), or null: the default rule. */
  get custom() { const k = this.touch && this.kept; return (k && k[this.portrait ? 'portrait' : 'landscape']) || null; }
  /** The cluster's tiles' scale: the kept one, clamped (1 by default). */
  clusterScale(part = this.custom) { const [lo, hi] = HUD_LAYOUT.custom.scale, s = +part?.scale; return Number.isFinite(s) && s > 0 ? Math.min(hi, Math.max(lo, s)) : 1; }
  fromFrac(f) { const B = this.bounds; return { x: B.x + (+f?.fx || 0) * B.w, y: B.y + (+f?.fy || 0) * B.h }; }
  toFrac(x, y) { const B = this.bounds, r = (v) => Math.round(v * 1e4) / 1e4; return { fx: r((x - B.x) / Math.max(1, B.w)), fy: r((y - B.y) / Math.max(1, B.h)) }; }

  /** The stick's home: where its ring rests (the kept one, else low in the move area), its ring inside the move area and off the instruments. */
  stickHome(part = this.custom, extra = []) {
    const R = HUD_LAYOUT.custom.ring, c = this.fromFrac(part?.stick || HUD_LAYOUT.custom.stick), M = this.areas.move, B = this.bounds;
    const x0 = Math.max(B.x, M.x), inMove = rect(x0, B.y, Math.min(B.x + B.w, M.x + M.w) - x0, B.h);
    const q = this.clampRect({ x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R }, extra, inMove);
    return { x: q.x + R, y: q.y + R };
  }

  /** The settings' `layout` row ran (core/settings.js run: the keep already cleared): forget the kept layout and lay out again. */
  resetLayout() { this.kept = null; this.sig = ''; this.read(true); }

  /** The body's classes and CSS vars. */
  dress() {
    if (typeof document === 'undefined') return;
    const b = document.body, s = b.style, S = this.safe;
    b.classList.toggle('hud-touch', this.touch); b.classList.toggle('hud-portrait', this.portrait); b.classList.toggle('hud-landscape', !this.portrait);
    s.setProperty('--su', `${this.su.toFixed(2)}px`);
    s.setProperty('--safe-t', `${S.t}px`); s.setProperty('--safe-r', `${S.r}px`); s.setProperty('--safe-b', `${S.b}px`); s.setProperty('--safe-l', `${S.l}px`);
    s.setProperty('--hud-log-x', `${Math.round(this.log.x)}px`); s.setProperty('--hud-log-y', `${Math.round(this.log.y)}px`); s.setProperty('--hud-log-w', `${Math.round(this.log.w)}px`);
  }

  /** What nothing else may enter on touch. */
  reserved() {
    if (!this.touch) return [];
    const A = this.areas, V = this.view, out = [A.cluster, rect(0, V.h / 2, V.w / 4, V.h / 2), A.topBar];
    if (this.art) out.push(A.artBar); else if (A.strip?.w) out.push(A.strip);
    return out;
  }

  register(id, spec) { this.specs.set(id, { ...spec }); this.rects.delete(id); return this; }

  on(what, fn) { if (what !== 'change' || typeof fn !== 'function') return () => {}; this.fns.add(fn); return () => this.fns.delete(fn); }

  /** Where a registered instrument stands now: its box's top left and size (CSS px), and CSS px a line. */
  place(id, size = null) {
    const spec = this.specs.get(id); if (!spec) return null;
    if (size && ((size.w != null && size.w !== spec.w) || (size.h != null && size.h !== spec.h))) { spec.w = size.w ?? spec.w; spec.h = size.h ?? spec.h; this.rects.clear(); }
    const r = this.box(id);
    return r ? { x: r.x, y: r.y, scale: r.scale, w: r.w, h: r.h } : null;
  }

  box(id, depth = 0) {
    if (this.rects.has(id)) return this.rects.get(id);
    const spec = this.specs.get(id); if (!spec || depth > 4) return null;
    this.rects.set(id, null); // (a cycle reads as nothing)
    const r = this.touch && spec.touch ? this.solve(spec.touch, spec, depth) : this.desk(spec);
    this.rects.set(id, r); return r;
  }

  /** The desk's own rule (the 480-line present's lines, from the view's corner): what the instruments do without asking. */
  desk(spec) {
    const s = this.view.h / 480, W = spec.w * s, H = spec.h * s, a = spec.anchor || 'tl';
    return { x: a[1] === 'r' ? this.view.w - W : 0, y: a[0] === 'b' ? this.view.h - H : 0, w: W, h: H, scale: s };
  }

  solve(T, spec, depth, tries = 0) {
    const B = this.bounds, gap = HUD_LAYOUT.gap, ref = (k) => this.areas[k] || this.box(k, depth + 1);
    let left = B.x, right = B.x + B.w, top = B.y, bottom = B.y + B.h;
    if (T.below) { const o = ref(T.below); if (o) top = Math.max(top, o.y + o.h + gap); }
    if (T.above) { const o = ref(T.above); if (o && o.h) bottom = Math.min(bottom, o.y - gap); }
    if (T.leftOf) { const o = ref(T.leftOf); if (o && o.w) right = Math.min(right, o.x - gap); }
    if (T.beside) { const o = ref(T.beside); if (o) { right = Math.min(right, o.x - gap); bottom = Math.min(bottom, o.y + o.h); } }
    const s0 = (T.scale ?? 0.2) * this.su, fit = Math.min(1, (bottom - top) / (spec.h * s0), (right - left) / (spec.w * s0));
    const next = () => (T.else && tries < 3 ? this.solve(T.else, spec, depth, tries + 1) : null);
    if (fit < (T.min ?? 0.5)) { const n = next(); if (n) return n; }
    const s = s0 * Math.max(0.1, fit), W = spec.w * s, H = spec.h * s, a = T.anchor || spec.anchor || 'tl';
    const r = { x: a[1] === 'r' || T.beside ? right - W : left, y: a[0] === 'b' || T.beside ? bottom - H : top, w: W, h: H, scale: s };
    if (this.reserved().some((q) => q.w && q.h && hit(r, q))) { const n = next(); if (n) return n; }
    return r;
  }
}
