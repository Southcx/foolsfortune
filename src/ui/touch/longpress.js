// ---------------------------------------------------------------------------------------
// THE LONG PRESS'S RING: touch play's second verb shown while it waits (docs/plans/MOBILE.md 4.4 and 8.2: right-click, hover and examine
// become a press held 420 ms, the choice card's own window, ui/choicecard.js). A ring fills under the finger over those 420 ms in the
// System's gold (#ffd36a, the window's accent), round a dark keyline so it reads on bright sand and on a dark window alike; full, it
// flashes once and its `done` is called. "The ring of the long press is the only wait, and it shows."
// Usable anywhere: the garden's hand, a window's thing, a tile. One element, the fill a CSS animation (no per-frame script).
//
// Prior art: the hold-to-confirm rings of console UIs (Destiny's and Overwatch's held buttons), iOS's haptic touch (the thing swells
// under a held finger), the choice card's 420 ms (ui/choicecard.js).
//
//   longPress.show(x, y, { ms = 420, done })   longPress.cancel()   longPress.done = () => {}   longPress.active   LONG_PRESS (the numbers)
// ---------------------------------------------------------------------------------------

/** The numbers: its wait (ms, the choice card's), the ring's radius and width (CSS px), the gold. */
export const LONG_PRESS = { ms: 420, r: 30, w: 5, gold: '#ffd36a' };

const C = 2 * Math.PI * LONG_PRESS.r, SIZE = (LONG_PRESS.r + LONG_PRESS.w + 4) * 2;
const CSS = `
.tlong{position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px;z-index:8;pointer-events:none;display:none}
.tlong.on{display:block}
.tlong circle{fill:none}
.tlong .k{stroke:#1c0d08;stroke-width:${LONG_PRESS.w + 3}px;opacity:.7}
.tlong .f{stroke:${LONG_PRESS.gold};stroke-width:${LONG_PRESS.w}px;stroke-linecap:round;stroke-dasharray:${C.toFixed(2)};stroke-dashoffset:${C.toFixed(2)};
  transform:rotate(-90deg);transform-origin:50% 50%;filter:drop-shadow(0 0 3px rgba(255,211,106,.6))}
.tlong.on .f{animation:tlong-fill var(--ms,420ms) linear forwards}
.tlong.full .f{animation:none;stroke-dashoffset:0;stroke:#fff6d0}
.tlong.full{animation:tlong-flash .18s ease-out forwards}
@keyframes tlong-fill{to{stroke-dashoffset:0}}
@keyframes tlong-flash{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1.05);opacity:0}}
`;

class LongPress {
  constructor() { this.el = null; this.timer = 0; this.active = false; this.done = null; this.cb = null; }
  build() {
    if (this.el || typeof document === 'undefined') return;
    const s = document.createElement('style'); s.setAttribute('data-touchlongpress', ''); s.textContent = CSS; document.head.appendChild(s);
    const el = (this.el = document.createElement('div')); el.className = 'tlong';
    const o = SIZE / 2;
    el.innerHTML = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true"><circle class="k" cx="${o}" cy="${o}" r="${LONG_PRESS.r}"/><circle class="f" cx="${o}" cy="${o}" r="${LONG_PRESS.r}"/></svg>`;
    document.body.appendChild(el);
  }
  /** The ring at (x, y) (CSS px), filling over `ms`; full, `done` (this call's, else the standing one) is called. */
  show(x, y, { ms = LONG_PRESS.ms, done = null } = {}) {
    this.build(); if (!this.el) return;
    this.cancel();
    const el = this.el; el.style.left = `${Math.round(x)}px`; el.style.top = `${Math.round(y)}px`; el.style.setProperty('--ms', `${ms}ms`);
    void el.offsetWidth; el.classList.add('on'); this.active = true; this.cb = done;
    this.timer = setTimeout(() => {
      this.active = false; el.classList.add('full');
      setTimeout(() => el.classList.remove('on', 'full'), 200);
      try { (this.cb || this.done)?.(); } catch (e) { console.warn('longPress.done', e); }
    }, ms);
  }
  /** Let it go before it filled: nothing is called. */
  cancel() { clearTimeout(this.timer); this.active = false; this.cb = null; this.el?.classList.remove('on', 'full'); }
}

export const longPress = new LongPress();
