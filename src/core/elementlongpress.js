// ---------------------------------------------------------------------------------------
// A LONG PRESS ON AN ELEMENT (docs/plans/MOBILE.md 4: "right-click, hover and examine become a press held 420 ms"): for a window's own
// element (a cell of the macro composer, a row), where the touch cursor (core/touchcursor.js, the canvas's) does not reach. A finger held
// still CURSOR.long ms on the element runs `fn` (its right-click's job), the ring filling under it (Calissa's ui/touch/longpress.js), and
// the click that would follow the lift is swallowed, so the press is one verb, never two. A mouse is left alone: its right button is
// the element's own `contextmenu`.
//
// Prior art: iOS's haptic touch (a held finger opens what the right button would), Android's long-press context menu; the choice card's
// 420 ms (ui/choicecard.js).
//
//   longPressOn(el, fn, game)   (fn(event) run on a held touch; returns el)
// ---------------------------------------------------------------------------------------
import { CURSOR } from './touchcursor.js';

export function longPressOn(el, fn, game) {
  let timer = 0, x0 = 0, y0 = 0, id = null;
  const ring = () => game?.touchUI?.longPress;
  const stop = () => { clearTimeout(timer); timer = 0; id = null; ring()?.cancel(); };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    stop(); id = e.pointerId; x0 = e.clientX; y0 = e.clientY;
    ring()?.show(x0, y0, { ms: CURSOR.long });
    timer = setTimeout(() => { timer = 0; swallow(); try { fn(e); } catch (err) { console.warn('longPressOn', err); } }, CURSOR.long);
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id && timer && Math.hypot(e.clientX - x0, e.clientY - y0) > CURSOR.slop) stop(); });
  for (const k of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(k, (e) => { if (e.pointerId === id && timer) stop(); });
  return el;
}

/** The next click, within a moment, swallowed wherever it lands: the lift after a long press is not also a tap (fn may have drawn the
 *  window again, so the element under the finger is a new one). So is the browser's own `contextmenu` while the finger is down (Android's
 *  Chrome sends one for a long press of its own, about half a real second in): the right click's job is done once. */
function swallow() {
  let t = setTimeout(() => done(), 10000); // (a finger never lifted: let go of it all the same)
  const kill = (e) => { e.preventDefault(); e.stopImmediatePropagation(); done(); };
  const menu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  const lift = () => { clearTimeout(t); t = setTimeout(() => done(), 350); }; // (the click comes just after the lift, or not at all)
  const done = () => {
    clearTimeout(t);
    document.removeEventListener('click', kill, true); document.removeEventListener('contextmenu', menu, true); document.removeEventListener('pointerup', lift, true);
  };
  document.addEventListener('click', kill, true); document.addEventListener('contextmenu', menu, true); document.addEventListener('pointerup', lift, true);
}
