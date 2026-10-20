// ---------------------------------------------------------------------------------------
// A MOUNT'S VIEWS: on a mount's choice card at the pier (ui/mountcards.js, ui/choicecard.js), what the mount does shown three ways at
// once, playing one loop of four real seconds in sync: TOP (its reach on the water, from above), SIDE (a side-on shmup box of its own,
// just for the card: not the crossing's side act) and CHASE (behind and above the ship, down the lane); under them a timeline marking
// the loop's events with its playhead, and a live count (LOCK n / 8, CUT n / 3, CHARGES ×n, ENERGY +n, OPEN n.n s, COOLDOWN n.n s or
// READY, WARNED n.n s). The loops are ui/mountviews/sims.js, the drawing ui/mountviews/draw.js; every number is read from the live tables
// (the mount's row, the moored ship's locks, the bar, the reticles, the hurtbox, the shot's size, the looks), never retyped. A legend of
// the marks stands under the first card of a list. *Not:* a mount's preview (vfx/mountpreview.js: the shape on the water round the
// moored hull). Ported from the mount views mock Dovina approved against the rules (the owner, 2026-10-20: "implement the Rail
// Crossing Mount mockups as outlined").
//
// Cost: one requestAnimationFrame loop for every card's views, drawing at 30 Hz at most and only the views on screen (an
// IntersectionObserver: a card scrolled away, or the pier's page shut, which hides the window, is not drawn); the loop stops when none
// is on screen and starts again when one is. A view's canvas is its CSS size times devicePixelRatio, sized again (and drawn at once:
// a sized canvas is cleared) when it resizes or the ratio changes. A card drawn anew drops its old views at the next tick.
//
// Prior art: the Mega Man weapon-get demo (a short loop of the thing in use beside its card: CLARITY.md section 6), Into the Breach's
// previews, a video editor's timeline (markers and a playhead), vfx/redrawgate.js's rate cap (drawn no faster than the eye needs).
//
//   mountViews(row, { ship = 'sloop', feel = null }) -> element | null   (row: mountRow's; feel: the ship's feeling, a 0xRRGGBB colour)
//   (a card asks for it through the row's `media`: ui/mountcards.js mountRow(tool, { views: { ship, feel } }))
// ---------------------------------------------------------------------------------------
import { SHIPS } from '../progress/rail/ships.js';
import { COLOR } from '../progress/weather.js';
import { mountSim, LOOP } from './mountviews/sims.js';
import { makeView, drawPane, drawScrub, LEGEND, drawLegendMark } from './mountviews/draw.js';

const VIEWS = [['top', 'TOP'], ['side', 'SIDE'], ['chase', 'CHASE']];
const HZ = 30, ASPECT = 0.625, SCRUB_H = 22;
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);

const CSS = `
.ccards:has(> .cc .mv) { grid-template-columns: minmax(0, 1fr); }
#indexmenu[data-aside] .im:has(.mv) { width: min(460px, calc(100% - 24px)); }
.cc .cc-media { grid-column: 1 / -1; margin-top: 5px; }
.mv .mv-views { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.mv .mv-view { position: relative; background: #07050b; box-shadow: 0 0 0 1px rgb(var(--jbot, 34,15,9)), 0 0 0 2px rgba(164,140,242,.25); line-height: 0; }
.mv .mv-view canvas { display: block; width: 100%; }
.mv .mv-tag { position: absolute; left: 4px; top: 7px; font: 12px/1 'Jersey 15', var(--f-sys, monospace); letter-spacing: .14em; color: rgba(225,214,240,.72); pointer-events: none; }
.mv .mv-scrub { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; margin-top: 4px; }
.mv .mv-scrub canvas { display: block; width: 100%; height: ${SCRUB_H}px; }
.mv .mv-n { font: 15px/1 'Jersey 15', var(--f-sys, monospace); color: #e8dccb; min-width: 92px; text-align: right; font-feature-settings: 'tnum'; white-space: nowrap; }
.mv .mv-legend { display: none; flex-wrap: wrap; gap: 3px 12px; margin-top: 6px; align-items: center; font: 11px/1.2 var(--f-sys, monospace); color: #d8c8b4; }
.ccards > .cc:first-child .mv .mv-legend { display: flex; }
.mv .mv-legend span { display: flex; align-items: center; gap: 4px; }
.mv .mv-legend canvas { width: 22px; height: 22px; }
`;
let installed = false;
function install() { if (installed) return; installed = true; const st = document.createElement('style'); st.id = 'mountviewscss'; st.textContent = CSS; document.head.appendChild(st); }
let countFace = null; // (the count face, Jersey 15, over the System's: src/ui/theme.js's faces, read from its CSS variable)
const face = () => (countFace ??= `'Jersey 15', ${getComputedStyle(document.documentElement).getPropertyValue('--f-sys').trim() || 'monospace'}`);

// ---- the one loop for every card's views
const live = new Set();
let raf = 0, last = -1e9, lastT = 0, io = null, ro = null;
const clockT = (now) => ((now / 1000) % LOOP + LOOP) % LOOP; // (one clock: every card's loop in step)
function observers() {
  io ??= new IntersectionObserver((es) => { for (const e of es) { const V = e.target._mv; if (V) V.on = e.isIntersecting; } wake(); });
  ro ??= new ResizeObserver((es) => { // (on a new width only, and a frame on: sizing in the callback would resize what it watches)
    for (const e of es) { const V = e.target._mv, w = Math.round(e.contentRect.width); if (!V || w === V.w) continue; V.w = w; requestAnimationFrame(() => { if (V.el._mv) { size(V); draw(V, lastT); } }); }
  });
}
function drop(V) { live.delete(V); io?.unobserve(V.el); ro?.unobserve(V.el); V.el._mv = null; }
function wake() { if (!raf && [...live].some((V) => V.on)) raf = requestAnimationFrame(tick); }
function tick(now) {
  raf = 0;
  let any = false;
  const due = now - last >= 1000 / HZ - 1;
  if (due) { last = now; lastT = clockT(now); }
  for (const V of live) {
    if (!V.el.isConnected) { drop(V); continue; } // (the card drawn anew, or the page gone)
    if (!V.on || !V.el.getClientRects().length) continue; // (scrolled away, or the window shut)
    any = true;
    if (due) { if ((window.devicePixelRatio || 1) !== V.dpr) size(V); draw(V, lastT); }
  }
  if (any) raf = requestAnimationFrame(tick);
}

/** The canvases at their CSS size times the ratio (a sized canvas is cleared: the caller draws again). */
function size(V) {
  const dpr = window.devicePixelRatio || 1; V.dpr = dpr;
  for (const p of V.panes) {
    const W = Math.max(1, p.c.parentElement.clientWidth), H = Math.max(1, Math.round(W * ASPECT));
    p.c.width = Math.round(W * dpr); p.c.height = Math.round(H * dpr); p.c.style.height = `${H}px`; p.V = makeView(p.kind, W, H);
  }
  V.sw = Math.max(1, V.scrub.clientWidth); V.scrub.width = Math.round(V.sw * dpr); V.scrub.height = Math.round(SCRUB_H * dpr);
}
function draw(V, t) {
  if (!V.panes[0].V) return;
  const R = V.sim.run(t), ctx = { t, col: V.sim.col, you: V.you, count: face() };
  for (const p of V.panes) { const g = p.c.getContext('2d'); g.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); drawPane(g, p.V, R, ctx); }
  const g = V.scrub.getContext('2d'); g.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); drawScrub(g, V.sw, SCRUB_H, V.sim, V.sim.col, t, face());
  if (V.n.textContent !== R.count) V.n.textContent = R.count;
}

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
function legend(you) {
  const L = make('div', 'mv-legend'), dpr = window.devicePixelRatio || 1;
  for (const [words, o] of LEGEND) {
    const s = make('span'), c = make('canvas'); c.width = Math.round(22 * dpr); c.height = Math.round(22 * dpr);
    const g = c.getContext('2d'); g.scale(dpr, dpr); drawLegendMark(g, o, { t: 0.4, col: you, you, count: face() });
    s.append(c, words); L.append(s);
  }
  return L;
}

/** A mount's three views, its timeline and its count, for its card; null for a tool with no loop. */
export function mountViews(row, { ship = 'sloop', feel = null } = {}) {
  if (typeof document === 'undefined' || !row) return null;
  const you = hex(feel ?? COLOR.mirth), locks = (SHIPS[ship] || SHIPS.sloop).locks;
  const sim = mountSim(row.id, { row, you, locks }); if (!sim) return null;
  install(); observers();
  const el = make('div', 'mv'), views = make('div', 'mv-views');
  const panes = VIEWS.map(([kind, tag]) => { const w = make('div', 'mv-view'), c = make('canvas'); w.append(c, make('span', 'mv-tag', tag)); views.append(w); return { kind, c, V: null }; });
  const sc = make('div', 'mv-scrub'), scrub = make('canvas'), n = make('span', 'mv-n');
  sc.append(scrub, n); el.append(views, sc, legend(you));
  const V = { el, panes, scrub, n, sim, you, on: false, dpr: 0, sw: 0, w: -1 };
  el._mv = V; live.add(V); io.observe(el); ro.observe(el);
  return el;
}
