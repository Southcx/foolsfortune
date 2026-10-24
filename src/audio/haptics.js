// ---------------------------------------------------------------------------------------
// HAPTICS: the moments a sound wants the body to feel too (docs/plans/MOBILE.md 6.5), a third avenue beside the eye and the ear, where the
// device has one (Android's navigator.vibrate; on iOS the switch's tick, below). A short buzz for a thing done well, a heavier
// one for a thing done to you; never a drone, never on what happens often (a footstep, a shot), never while the page is hidden.
// Each pattern is the Vibration API's: milliseconds on, off, on.
//   a perfect pop   a crisp tap (the board leaving the crest at the right moment)
//   a parry         two quick taps: the blow met and turned back
//   a combo banked  a rising pair (short, then longer)
//   a hit taken     one heavier pulse (a crack in the vessel); the shield broken, a double; shattered, a long fall
//   the hull struck at sea, a heavy pulse; a line snapped, a sharp one; a fish landed, the lift's beat
// iOS (the owner's phone) has no Vibration API: the one web haptic it has is Safari 18's switch control (`<input type="checkbox" switch>`),
// whose toggle gives the system's tick. So there a moment is one tick, two for a pattern of two or more (unverified on the device: it may
// need the touch's own activation, which a moment soon after a touch has).
// Prior art: the ios-haptics trick (a hidden switch's label clicked), the DualSense's and the Switch's HD rumble kept for moments (Astro's Playroom), Apple's Human Interface Guidelines on haptics
// (match the strength to the event, use them sparingly), the Vibration API.
//
//   installHaptics(game)   (audio/cues.js hearEvents)   off with T.audio.haptics = false
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';

const MOMENTS = {
  'skiff.pop': (e) => (e.perfect ? [12] : null),
  'move.parry': () => [10, 40, 14],
  'skiff.combo.bank': () => [12, 50, 28],
  'vessel.crack': (e) => (e.by === 'courier' ? null : [36]),
  'vessel.shieldbreak': () => [30, 60, 30],
  'courier.shatter': () => [80, 40, 160],
  'sea.hull': () => [40],
  'angle.escape': (e) => (e.why === 'snap' ? [24] : null),
  'angle.lift': (e) => (e.quick ? null : e.legend || e.record ? [16, 60, 16, 60, 40] : [16, 60, 30]),
};
const GAP = 120; // (real ms between two buzzes at the least: a burst of events is felt once)

/** iOS's one tick: a hidden switch's label clicked (Safari 18). Returns a buzz(pattern) or null where there is no such control. */
function switchTick() {
  if (typeof document === 'undefined' || !/iP(hone|ad|od)/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent))) return null;
  const label = document.createElement('label'), box = document.createElement('input');
  box.type = 'checkbox'; box.setAttribute('switch', ''); label.appendChild(box);
  label.addEventListener('click', (e) => e.stopPropagation()); box.addEventListener('click', (e) => e.stopPropagation()); // (the game's own click handlers never see it)
  label.setAttribute('aria-hidden', 'true'); label.style.cssText = 'position:fixed;left:-99px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(label);
  return (p) => { const on = p.filter((_, i) => i % 2 === 0).length; label.click(); if (on > 1) setTimeout(() => label.click(), Math.min(140, (p[0] || 0) + (p[1] || 60))); };
}

export function installHaptics(game) {
  if (typeof navigator === 'undefined') return;
  const buzz = typeof navigator.vibrate === 'function' ? (p) => navigator.vibrate(p) : switchTick();
  if (!buzz) return;
  let last = 0;
  for (const [name, fn] of Object.entries(MOMENTS)) game.events.on(name, (e) => {
    if (T.audio?.haptics === false || document.hidden) return;
    const p = fn(e || {}), now = performance.now(); if (!p || now - last < GAP) return;
    last = now; try { buzz(p); } catch { /* not allowed before a gesture */ }
  });
}
