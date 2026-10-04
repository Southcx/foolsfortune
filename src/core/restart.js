// ---------------------------------------------------------------------------------------
// RESTART A CSS ANIMATION without stalling the frame. The usual trick (take the class off, read `offsetWidth`, put it back) makes the
// browser lay out the whole page there and then, mid-tick; done for every cube earned or every bead of Lachryma it was a burst of
// layouts (the owner's spikes in the dunes, R41). Here the class comes off now and goes back on at the next frame, after the browser's
// own style pass has seen it gone, so the animation starts again with no forced layout.
//
// Prior art: the "restart a CSS animation" recipes (CSS-Tricks; MDN's "Tips: run an animation again"), the second of them, by frames.
//
//   restartClass(el, 'pop')            restartClass(el, 'gain', ['gain', 'deny'])   (the others taken off with it)
// ---------------------------------------------------------------------------------------
const pending = new WeakMap();

export function restartClass(el, cls, off = [cls]) {
  if (!el) return;
  el.classList.remove(...off);
  const was = pending.get(el);
  if (was) cancelAnimationFrame(was);
  pending.set(el, requestAnimationFrame(() => requestAnimationFrame(() => { pending.delete(el); el.classList.add(cls); })));
}
