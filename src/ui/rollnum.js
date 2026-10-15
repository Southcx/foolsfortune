// ---------------------------------------------------------------------------------------
// THE ROLLING NUMBER: a number at Raku's tables whose digits roll like an odometer to a new value (the table view's one exception to the
// no-text rule: the owner, 2026-10-15; docs/handoffs/dovina/casino-clarity-art-brief.md section 2g). DOM and CSS only, 0 shader programs.
//
//   EACH DIGIT   its own column of 0-9, rolled by a CSS transition of 0.4 s on cubic-bezier(.34,1.56,.64,1) (an overshoot that settles),
//                the columns staggered 50 ms left to right. A new length rebuilds the columns (rolling up from 0).
//   THOUSANDS    thin spaces. A minus sign stands as its own glyph.
//   THE POP      once every digit has settled the whole number jumps 1.12x and back (0.18 s), the cue that it is final.
//   TIERS        XL 56px, L 34px, M 20px, S 14px at 1080 lines (the brief's size tiers), scaled by the viewport height (--rn-scale).
//
// Prior art: Balatro's score counter (Crosley's approximate timings: ~0.4 s roll, 50 ms stagger, pop on settle), the mechanical
// odometer, and the split-flap board's per-column delay. CSS transform transitions are the browser's own (no dependency).
//
//   const n = new RollingNumber(el, { tier: 'L', colour: '#f4ecd8', speed: 1 })   n.set(v)   n.to(v, { dur, stagger }) -> Promise   n.value   n.destroy()
// ---------------------------------------------------------------------------------------
export const TIERS = { XL: 56, L: 34, M: 20, S: 14 }; // (CSS px at 1080 lines)
export const ROLL = { dur: 0.4, stagger: 0.05, ease: 'cubic-bezier(.34,1.56,.64,1)', pop: 0.18 };

const CSS = `
.rn{display:inline-flex;align-items:baseline;line-height:1;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:.01em;
  font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif;white-space:pre;color:var(--rn-colour,#f4ecd8);
  font-size:calc(var(--rn-size,34px)*var(--rn-scale,1));text-shadow:0 .06em 0 rgba(0,0,0,.55)}
.rn-col{display:inline-block;height:1em;overflow:hidden;position:relative;width:.62em;text-align:center}
.rn-strip{display:block;transition-property:transform;will-change:transform}
.rn-strip>i{display:block;height:1em;font-style:normal;line-height:1}
.rn-sep{display:inline-block;width:.28em}
.rn-pop{animation:rn-pop var(--rn-pop,.18s) ease-out}
@keyframes rn-pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-rollnum', ''); s.textContent = CSS; document.head.appendChild(s);
}

const isDigit = (c) => c >= '0' && c <= '9';

/** A number as the characters the odometer draws: thin-space thousands, a minus sign. */
export function formatNumber(v) {
  const n = Math.round(v), s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '−' : '') + s;
}

export class RollingNumber {
  constructor(el, { tier = 'L', colour = null, speed = 1 } = {}) {
    style();
    this.el = el; this.speed = speed; this.value = 0; this.cols = []; this.timer = 0; this.token = 0;
    el.classList.add('rn');
    el.style.setProperty('--rn-size', (TIERS[tier] || TIERS.L) + 'px');
    if (colour) el.style.setProperty('--rn-colour', colour);
    this.text = '0';
    this.build(this.text);
    this.settle(this.text, 0, 0);
  }

  colour(c) { this.el.style.setProperty('--rn-colour', c); }

  build(text) {
    this.el.textContent = ''; this.cols = [];
    for (const ch of text) {
      if (isDigit(ch)) {
        const col = document.createElement('span'), strip = document.createElement('span');
        col.className = 'rn-col'; strip.className = 'rn-strip';
        for (let d = 0; d < 10; d++) { const i = document.createElement('i'); i.textContent = d; strip.appendChild(i); }
        strip.style.transform = 'translateY(0)';
        col.appendChild(strip); this.el.appendChild(col); this.cols.push(strip);
      } else {
        const sp = document.createElement('span');
        if (ch === ' ') sp.className = 'rn-sep'; else sp.textContent = ch;
        this.el.appendChild(sp);
      }
    }
  }

  // Put the digits of `text` on the columns, each rolling in its own window.
  settle(text, dur, stagger) {
    const digits = [...text].filter(isDigit);
    digits.forEach((d, i) => {
      const s = this.cols[i].style;
      s.transitionDuration = dur + 's';
      s.transitionDelay = i * stagger + 's';
      s.transitionTimingFunction = ROLL.ease;
      s.transform = `translateY(${-d}em)`;
    });
    return digits.length;
  }

  /** Jump to v with no roll. */
  set(v) {
    this.token++; clearTimeout(this.timer);
    this.value = v; this.text = formatNumber(v);
    this.build(this.text); this.settle(this.text, 0, 0);
  }

  /** Roll to v: resolves true when the last digit has settled and the number has popped (false if another roll or a set took over). */
  to(v, { dur = ROLL.dur, stagger = ROLL.stagger } = {}) {
    const tok = ++this.token; clearTimeout(this.timer);
    const k = 1 / this.speed, text = formatNumber(v);
    if (text.length !== this.text.length || [...text].some((c, i) => isDigit(c) !== isDigit(this.text[i]))) {
      this.build(text); // (a new shape: the columns start again at 0 and roll up to it)
      this.el.getBoundingClientRect(); // (commit the zero frame so the transition has somewhere to start)
    }
    this.value = v; this.text = text;
    const n = this.settle(text, dur * k, stagger * k);
    const total = ((n ? n - 1 : 0) * stagger + dur) * 1000 * k;
    return new Promise((res) => {
      this.timer = setTimeout(() => {
        if (tok !== this.token) return res(false);
        this.el.classList.remove('rn-pop'); void this.el.offsetWidth;
        this.el.style.setProperty('--rn-pop', ROLL.pop * k + 's');
        this.el.classList.add('rn-pop');
        res(true);
      }, total);
    });
  }

  destroy() { this.token++; clearTimeout(this.timer); this.el.textContent = ''; this.el.classList.remove('rn', 'rn-pop'); }
}
