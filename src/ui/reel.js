// ---------------------------------------------------------------------------------------
// THE REEL: a slot-machine reel at Raku's tables, a vertical strip of symbols or labels that spins and lands on one with an overshoot,
// where a hidden thing is revealed (a die face, an arcanum, a tier's name). The table view's words-and-numbers exception (the owner,
// 2026-10-15; docs/handoffs/dovina/casino-clarity-art-brief.md section 2g). DOM and CSS only, 0 shader programs.
//
//   THE SPIN     the strip runs `laps` times round the symbols (default 3) in `dur` (0.6 s) on cubic-bezier(.2,.9,.3,1.04): fast, then a
//                single overshoot past the stop that settles back (the one-frame kick of a real reel).
//   THE STAGGER  `Reel.spinAll(reels, stops, { stagger })` starts a row of reels 150 ms apart, left to right.
//   A SYMBOL     a string, or { text, colour } (a die face, a tier name in its colour).
//
// Prior art: the fruit machine's reels (Bally, Fey's Liberty Bell) stopping one by one left to right, and Balatro's card-flip reveals.
//
//   const r = new Reel(el, symbols, { tier: 'L' })   r.spin(stopAt, { dur, stagger }) -> Promise   r.show(i)   Reel.spinAll(reels, stops, opts)
// ---------------------------------------------------------------------------------------
import { TIERS } from './rollnum.js';

export const REEL = { dur: 0.6, stagger: 0.15, laps: 3, ease: 'cubic-bezier(.2,.9,.3,1.04)' };

const CSS = `
.rl{display:inline-block;overflow:hidden;height:1.3em;line-height:1.3em;vertical-align:middle;font-weight:800;text-align:center;
  font-size:calc(var(--rl-size,34px)*var(--rn-scale,1));font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif;color:#f4ecd8;
  min-width:1.6em;padding:0 .35em;border-radius:.2em;background:#17111f;border:2px solid #6f8be0;box-shadow:inset 0 .12em .3em rgba(0,0,0,.7)}
.rl-strip{display:block;transition-property:transform;will-change:transform}
.rl-strip>i{display:block;height:1.3em;font-style:normal;white-space:nowrap}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-reel', ''); s.textContent = CSS; document.head.appendChild(s);
}

export class Reel {
  constructor(el, symbols, { tier = 'L', speed = 1 } = {}) {
    style();
    this.el = el; this.symbols = symbols.map((s) => (typeof s === 'string' ? { text: s } : s)); this.speed = speed;
    this.at = 0; this.timer = 0; this.token = 0;
    el.classList.add('rl'); el.style.setProperty('--rl-size', (TIERS[tier] || TIERS.L) + 'px');
    this.strip = document.createElement('span'); this.strip.className = 'rl-strip';
    el.appendChild(this.strip);
    // the symbols repeated: the current lap, `laps` of running, and one spare under the overshoot
    for (let l = 0; l < REEL.laps + 6; l++) for (const s of this.symbols) {
      const i = document.createElement('i'); i.textContent = s.text; if (s.colour) i.style.color = s.colour; this.strip.appendChild(i);
    }
    this.show(0);
  }

  place(index, dur, delay) {
    const st = this.strip.style;
    st.transitionDuration = dur + 's'; st.transitionDelay = delay + 's'; st.transitionTimingFunction = REEL.ease;
    st.transform = `translateY(${-index * 1.3}em)`;
  }

  /** Show symbol i at once. */
  show(i) { this.token++; clearTimeout(this.timer); this.at = i; this.place(i, 0, 0); }

  /** Spin and land on symbol `stopAt`; resolves true when it has settled (false if another spin or a show took over). */
  spin(stopAt, { dur = REEL.dur, stagger = 0, laps = REEL.laps } = {}) {
    const tok = ++this.token, n = this.symbols.length, k = 1 / this.speed;
    this.place(this.at, 0, 0); this.strip.getBoundingClientRect(); // (start from where it stands)
    this.at = stopAt;
    this.place(Math.min(laps, REEL.laps + 4) * n + stopAt, dur * k, stagger * k);
    clearTimeout(this.timer);
    return new Promise((res) => {
      this.timer = setTimeout(() => res(tok === this.token), (dur + stagger) * 1000 * k + 30);
    });
  }

  /** A row of reels started `stagger` apart, left to right; resolves when the last has landed. */
  static spinAll(reels, stops, { dur = REEL.dur, stagger = REEL.stagger, laps = REEL.laps } = {}) {
    return Promise.all(reels.map((r, i) => r.spin(stops[i], { dur, stagger: stagger * i, laps })));
  }

  destroy() { this.token++; clearTimeout(this.timer); this.el.textContent = ''; this.el.classList.remove('rl'); }
}
