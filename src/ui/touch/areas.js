// ---------------------------------------------------------------------------------------
// THE TOUCH CONTROLS' PLACE: whether touch play is on, and where its controls stand (docs/plans/MOBILE.md 4 and 6.3). Both are the HUD
// layout manager's (ui/hudlayout.js, `game.hudLayout`: `.touch`, `.portrait`, `.view`, `.safe`, `.su`, `.areas { move, look, cluster,
// topBar, artBar }`, `.on('change')`); this module only reads it, and stands in for it while it is absent, so the controls can be seen
// working before it lands:
//   TOUCH      game.hudLayout.touch; else `?touch` in the URL (`?touch=0` off), else a coarse pointer with touch points (a phone or a
//              tablet, never a laptop's touchscreen with a mouse); `force(on)` overrides it (the headless look, a test), null clears it.
//   AREAS      the safe area read from `env(safe-area-inset-*)` on a probe; `su` 1% of the safe area's shorter side; the move area the
//              left half under the top bar, the look area the right half, the cluster the right half's bottom corner (240 px square),
//              the top bar a strip along the top's middle, the art bar along the bottom (portrait) or down the right edge (landscape).
//
// Prior art: the safe-area insets of iOS and Android (env(safe-area-inset-*), the notch and the home bar), Genshin Impact's and the
// mobile racers' layouts (a move area on the left, verbs bottom-right, the windows' icons along the top), MOBILE.md section 4.
//
//   touchOn(game) -> bool      force(on | null)      placeOf(game) -> { touch, portrait, view: {w,h}, safe: {t,r,b,l}, su, areas }
//   windowOpen(game) -> bool (a window over the world: the thumbs' controls stand down)
//   onPlaceChange(game, fn)    (the layout manager's change, a resize, an orientation or pointer change)   wireLayout(game) (once it exists)
// ---------------------------------------------------------------------------------------

let forced = null;
/** Touch play on (or off) whatever the device says; null gives the say back to the device. */
export function force(on) { forced = on == null ? null : !!on; for (const fn of listeners) fn(); }

const urlTouch = () => {
  try { const q = new URLSearchParams(location.search); if (!q.has('touch')) return null; return q.get('touch') !== '0'; } catch { return null; }
};
const coarse = () => {
  try { return !!(matchMedia('(pointer: coarse)').matches && (navigator.maxTouchPoints || 0) > 0 && !matchMedia('(any-pointer: fine)').matches); } catch { return false; }
};
/** Whether the touch controls stand: forced, else the layout manager's word, else the URL's, else the device's. */
export function touchOn(game) {
  if (forced != null) return forced;
  if (game?.hudLayout && typeof game.hudLayout.touch === 'boolean') return game.hudLayout.touch;
  return urlTouch() ?? coarse();
}

let probe = null;
function safeArea() {
  if (typeof document === 'undefined') return { t: 0, r: 0, b: 0, l: 0 };
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'
      + 'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(probe);
  }
  const s = getComputedStyle(probe), n = (v) => parseFloat(v) || 0;
  return { t: n(s.paddingTop), r: n(s.paddingRight), b: n(s.paddingBottom), l: n(s.paddingLeft) };
}

/** The numbers of the stand-in layout (CSS px): the cluster's square, the top bar's height and tile, the art bar's depth. */
export const PLACE = { cluster: 240, topBar: 52, topTile: 44, artBar: 112, margin: 8 };

/** Where the controls stand now: the layout manager's, or the stand-in's. */
export function placeOf(game) {
  const L = game?.hudLayout;
  if (L?.areas && L.view) return { touch: touchOn(game), portrait: !!L.portrait, view: L.view, safe: L.safe || { t: 0, r: 0, b: 0, l: 0 }, su: L.su, areas: L.areas };
  const w = innerWidth, h = innerHeight, safe = safeArea(), portrait = h > w, m = PLACE.margin;
  const iw = w - safe.l - safe.r, ih = h - safe.t - safe.b, su = Math.min(iw, ih) / 100;
  const top = safe.t + PLACE.topBar + m, C = PLACE.cluster, A = PLACE.artBar;
  const topW = Math.min(iw - 2 * m, 7 * (PLACE.topTile + 6));
  const areas = {
    topBar: { x: Math.round((w - topW) / 2), y: safe.t + 4, w: topW, h: PLACE.topBar },
    cluster: { x: w - safe.r - C, y: h - safe.b - C, w: C, h: C },
    move: { x: safe.l, y: top, w: Math.round(w / 2) - safe.l, h: h - top - safe.b },
    look: { x: Math.round(w / 2), y: top, w: w - Math.round(w / 2) - safe.r, h: h - top - safe.b },
    artBar: portrait ? { x: safe.l + m, y: h - safe.b - m - A, w: iw - 2 * m, h: A } : { x: w - safe.r - m - A, y: top, w: A, h: h - top - safe.b - m },
  };
  return { touch: touchOn(game), portrait, view: { w, h }, safe, su, areas };
}

const listeners = new Set();
let wired = false;
/** `fn` on any change of place: the layout manager's own, a resize, the phone turned, a pointer plugged in. */
export function onPlaceChange(game, fn) {
  listeners.add(fn);
  if (!wired && typeof window !== 'undefined') {
    wired = true;
    const all = () => { for (const f of listeners) f(); };
    addEventListener('resize', all); addEventListener('orientationchange', all);
    try { matchMedia('(pointer: coarse)').addEventListener('change', all); } catch { /* an old browser: the resize will do */ }
  }
  wireLayout(game);
  return () => listeners.delete(fn);
}
let layoutWired = null;
/** Hear the layout manager's change once it exists (it may be installed after the controls): call it again whenever; it wires once. */
export function wireLayout(game) {
  const L = game?.hudLayout;
  if (!L?.on || layoutWired === L) return;
  layoutWired = L; L.on('change', () => { for (const f of listeners) f(); });
  for (const f of listeners) f();
}

/** A window over the world (the Codex, the Pneuka Box, the map, the Index, the pause menu's overlay, the dialogue box, the kiln): the
 *  thumbs' controls stand down under it; the top bar stays. */
export function windowOpen(game) {
  const g = game || {}, ov = typeof document !== 'undefined' ? document.getElementById('overlay') : null;
  return !!(g.codex?.open || g.pneukaUI?.open || g.cartography?.open || g.indexMenu?.open || g.dialogue?.open || g.kilnUI?.open || g.shopUI?.open || g.qais?.open
    || g.title?.active || (ov && ov.style.display !== 'none'));
}
