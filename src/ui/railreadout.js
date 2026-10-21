// ---------------------------------------------------------------------------------------
// THE RAIL READOUT: the crossing's score seen while it is made (docs/plans/RAIL-STANDARDS.md 6, Dovina's; Calissa's look, Petra's data).
// A small System window in Brine's dress (ui/brineframe.js) at the rail's top-left corner, clear of the Sight (top-right), the
// Lachrimeter (bottom-right) and the log (bottom-left). The overlay reads what is: it shows the state, never narrates; no number for a
// down, no banner, no kill-feed (the log says a leg's end). DOM and CSS only, 0 shader programs.
//
//   SCORE   the run's score rolling (RollingNumber, ui/rollnum.js), the hero of the window, under the tab SCORE.
//   CHAIN   three pips filling in the colour of the feeling being counted (COLOR, progress/weather.js), and beside them the chain's
//           multiplier at its level (level 1..8: x1.25 .. x3, SCORE.chain.step a level: progress/rail/score.js); a three made flashes
//           the pips full and slams the multiplier; a break flashes it and it falls to nothing.
//   SURGE   the surge's gauge, 0..100, in Lachryma's tint on a ruler; full, it wears the schiller.
//   HULL    the hits the ship can still bear, as pips (lit: still borne; spent: cracked).
//   MEDAL   the leg's downs over its medalAt (Star Fox 64's count), turning gold when reached.
// It touches the DOM only when a value it shows changes, so `set` may be called every frame.
//
// Prior art: Star Fox 64's hit counter and medal (the count over the stage's mark), Ikaruga's chain readout (three pips of the
// colour being chained, the chain's number beside), Rez's eight layers as a level, DoDonPachi's combo gauge falling to nothing, Sin and
// Punishment: Star Successor's multiplier; the style bible's row grammar (OVERLAY.md 10.1: LABEL ······ value).
//
//   game.railReadout = new RailReadout(game)
//   .show(on)                                   on a crossing or not (hidden by default)
//   .set({ score, chain: { aspect, of, links, level }, surge, hits, bears, downs, medalAt })   once a frame; any field may be left out
//        chain.of: downs of the feeling so far in the three being counted (0..2); chain.level (or links): threes made, 0..8
//        hits: hits taken; bears: hits the ship bears in all (pips lit = bears - hits); medalAt 0 or null hides the MEDAL row
//   .chainBreak()                               the chain broken (a hit, another feeling inside a three): flash, and fall to nothing
//   .destroy()
// ---------------------------------------------------------------------------------------
import { RollingNumber } from './rollnum.js';
import { brineFrame, dot, GOLD, SALT, INK, LACHRYMA_TINT, FILM } from './brineframe.js';
import { COLOR } from '../progress/weather.js';
import { SCORE } from '../progress/rail/score.js';

const STEP = SCORE.chain.step ?? 0.25, MAX = SCORE.chain.max ?? 8, OF = SCORE.chain.of ?? 3; // (Dovina's table; the fallbacks are hers too)
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
/** The chain's multiplier at a level as the readout writes it: x1.25, x1.5, x2, x3 ('' at 0). */
export const multText = (level) => (level > 0 ? 'x' + String(+(1 + Math.min(MAX, level) * STEP).toFixed(2)) : '');

const CSS = `
.rr{position:fixed;left:calc(10*var(--d));top:calc(18*var(--d) + var(--cine,0vh));z-index:3;pointer-events:none;width:calc(132*var(--d));
  transition:opacity .2s;opacity:1}
.rr[hidden]{display:block!important;opacity:0;visibility:hidden}
.rr-score{display:flex;justify-content:flex-end;margin:calc(-1*var(--d)) 0 calc(3*var(--d));min-height:1em}
.rr-row{display:flex;align-items:center;height:calc(12*var(--d));font-size:calc(11*var(--d))}
.rr-row>b{font-family:'Jersey 15',monospace;font-weight:400;letter-spacing:.12em;font-size:calc(12*var(--d));color:${SALT};opacity:.85}
.rr-row[hidden]{display:none}
.rr-pips{display:flex;gap:calc(2*var(--d))}
.rr-pip{width:calc(5*var(--d));height:calc(5*var(--d));transform:rotate(45deg);box-sizing:border-box;border:var(--d) solid rgba(239,230,210,.55);
  background:rgba(8,6,4,.6);transition:background .08s}
.rr-pip.on{background:var(--feel);border-color:${INK};box-shadow:0 0 0 var(--d) var(--feel)}
.rr-pips.link .rr-pip{animation:rr-link .32s ease-out}
@keyframes rr-link{0%{background:var(--feel);box-shadow:0 0 calc(4*var(--d)) var(--d) var(--feel)}100%{}}
.rr-pips.broke .rr-pip{animation:rr-broke .36s steps(3)}
@keyframes rr-broke{0%,66%{border-color:${SALT};background:rgba(239,230,210,.6)}100%{}}
.rr-mult{width:calc(30*var(--d));text-align:right;font-size:calc(14*var(--d));color:${SALT};display:inline-block}
.rr-mult.slam{animation:rr-slam .26s cubic-bezier(.2,.9,.3,1.3)}
@keyframes rr-slam{0%{transform:scale(1.9);opacity:.2}100%{transform:scale(1)}}
.rr-mult.fall{animation:rr-fall .5s cubic-bezier(.5,0,.9,.5) forwards}
@keyframes rr-fall{0%{color:#fff;transform:none;opacity:1}18%{color:#fff;transform:scale(1.25)}100%{transform:translateY(calc(8*var(--d))) rotate(9deg);opacity:0}}
.rr-gauge{position:relative;width:calc(46*var(--d));height:calc(4*var(--d));background:rgba(8,6,4,.75);box-shadow:0 0 0 var(--d) rgba(239,230,210,.35)}
.rr-gauge>i{position:absolute;left:0;top:0;bottom:0;width:0;background:${LACHRYMA_TINT};transition:width .12s linear}
.rr-gauge.full>i{background:linear-gradient(90deg,${FILM.join(',')},${FILM[0]});background-size:200% 100%;animation:rr-walk 2.4s linear infinite}
@keyframes rr-walk{to{background-position:-200% 0}}
.rr-gauge::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - var(--d)),rgba(8,6,4,.9) calc(10% - var(--d)) 10%)}
.rr-n{width:calc(18*var(--d));text-align:right;font-size:calc(13*var(--d))}
.rr-hull{display:flex;gap:calc(2*var(--d))}
.rr-hp{width:calc(4*var(--d));height:calc(7*var(--d));background:${SALT};box-shadow:inset 0 calc(-2*var(--d)) 0 rgba(127,220,255,.55),0 0 0 var(--d) ${INK}}
.rr-hp.spent{background:rgba(8,6,4,.7);box-shadow:inset 0 0 0 var(--d) rgba(239,230,210,.3);
  background-image:linear-gradient(115deg,transparent 45%,rgba(239,230,210,.45) 45% 55%,transparent 55%)}
.rr-hp.lost{animation:rr-lost .4s steps(2)}
@keyframes rr-lost{0%,50%{background:#fff}}
.rr-medal{font-size:calc(13*var(--d));white-space:nowrap}
.rr-medal i{font-style:normal;opacity:.6}
.rr-medal.won{color:${GOLD}}
.rr-medal.won.just{animation:rr-slam .3s cubic-bezier(.2,.9,.3,1.3)}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-railreadout', ''); s.textContent = CSS; document.head.appendChild(s);
}
const el = (cls, tag = 'div', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const row = (label) => { const r = el('rr-row'); r.append(el('', 'b', label), el('bf-lead', 'i')); return r; };

export class RailReadout {
  constructor(game = null) {
    this.game = game; this.root = null; this.on = false;
    this.v = { score: null, aspect: undefined, of: -1, level: -1, surge: -1, hits: -1, bears: -1, downs: -1, medalAt: -1 };
    this.onResize = () => this.root?.style.setProperty('--d', dot() + 'px');
  }

  // Built the first time it is shown: nothing is in the page until a crossing wants it.
  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const root = this.root = el('rr'); root.hidden = true; root.setAttribute('aria-hidden', 'true');
    root.style.setProperty('--d', dot() + 'px'); root.style.setProperty('--rn-scale', String(innerHeight / 1080));
    const { body } = this.frame = brineFrame(root, { tab: 'SCORE' });
    const rope = el('bf-rope'); body.appendChild(rope);
    const sc = el('rr-score bf-count'), sn = el(''); sc.appendChild(sn); body.appendChild(sc);
    this.score = new RollingNumber(sn, { tier: 'XL', colour: SALT });
    // CHAIN: three pips and the multiplier
    const chain = row('CHAIN'), pips = el('rr-pips');
    this.pips = Array.from({ length: OF }, () => { const p = el('rr-pip'); pips.appendChild(p); return p; });
    const mult = this.mult = el('rr-mult bf-count'); chain.append(pips, mult);
    this.pipsBox = pips;
    // SURGE
    const surge = row('SURGE'), g = this.gauge = el('rr-gauge'), gf = this.gaugeFill = el('', 'i'); g.appendChild(gf);
    const sn2 = this.surgeN = el('rr-n bf-count'); surge.append(g, sn2);
    // HULL
    const hull = row('HULL'), hp = this.hullBox = el('rr-hull'); hull.appendChild(hp);
    // MEDAL
    const medal = this.medalRow = row('MEDAL'), mv = this.medalVal = el('rr-medal bf-count'); medal.appendChild(mv);
    body.append(chain, surge, hull, medal);
    document.body.appendChild(root);
    addEventListener('resize', this.onResize);
  }

  show(on = true) {
    on = !!on;
    if (on) this.build();
    if (!this.root || on === this.on) { this.on = on; return; }
    this.on = on; this.root.hidden = !on;
    if (on) { this.onResize(); this.root.style.setProperty('--rn-scale', String(innerHeight / 1080)); requestAnimationFrame(() => this.frame?.layout()); }
  }

  /** What the run is now. Cheap when nothing changed: each value is compared to what is shown before the page is touched. */
  set({ score, chain, surge, hits, bears, downs, medalAt } = {}) {
    if (!this.root) this.build();
    if (!this.root) return;
    const v = this.v;
    if (score != null && score !== v.score) { if (v.score == null) this.score.set(score); else this.score.to(score); v.score = score; }
    if (chain) this.setChain(chain);
    if (surge != null) {
      const s = Math.max(0, Math.min(100, Math.round(surge)));
      if (s !== v.surge) { v.surge = s; this.gaugeFill.style.width = s + '%'; this.surgeN.textContent = String(s); this.gauge.classList.toggle('full', s >= 100); }
    }
    if ((hits != null && hits !== v.hits) || (bears != null && bears !== v.bears)) this.setHull(hits ?? v.hits, bears ?? v.bears);
    if ((downs != null && downs !== v.downs) || (medalAt !== undefined && medalAt !== v.medalAt)) this.setMedal(downs ?? v.downs, medalAt === undefined ? v.medalAt : medalAt);
  }

  setChain({ aspect = null, of = 0, links, level } = {}) {
    const v = this.v, L = Math.max(0, Math.min(MAX, level ?? links ?? 0));
    if (aspect !== v.aspect) { v.aspect = aspect; this.pipsBox.style.setProperty('--feel', aspect && COLOR[aspect] != null ? hex(COLOR[aspect]) : SALT); }
    if (L !== v.level) {
      const was = v.level; v.level = L;
      if (L > was && was >= 0) { this.mult.textContent = multText(L); this.mult.classList.remove('fall', 'slam'); void this.mult.offsetWidth; this.mult.classList.add('slam'); this.flash('link'); }
      else if (L === 0 && was > 0) this.fall();
      else { this.mult.classList.remove('fall', 'slam'); this.mult.textContent = multText(L); }
    }
    if (of !== v.of) { v.of = of; this.pips.forEach((p, i) => p.classList.toggle('on', i < of)); }
  }

  /** The chain broken: the pips flash, the multiplier flashes and falls to nothing. */
  chainBreak() {
    if (!this.root) return;
    this.flash('broke');
    this.v.of = 0; this.pips.forEach((p) => p.classList.remove('on'));
    if (this.v.level > 0) this.fall();
    this.v.level = 0;
  }

  fall() {
    const m = this.mult; m.classList.remove('slam', 'fall'); void m.offsetWidth; m.classList.add('fall');
    clearTimeout(this.fallT); this.fallT = setTimeout(() => { if (this.v.level === 0) { m.textContent = ''; m.classList.remove('fall'); } }, 520);
  }

  flash(kind) { const b = this.pipsBox; b.classList.remove('link', 'broke'); void b.offsetWidth; b.classList.add(kind); }

  setHull(hits, bears) {
    const v = this.v, n = Math.max(0, bears | 0), left = Math.max(0, n - Math.max(0, hits | 0)), wasLeft = v.bears >= 0 ? Math.max(0, v.bears - Math.max(0, v.hits)) : left;
    if (n !== this.hullBox.children.length) { this.hullBox.textContent = ''; for (let i = 0; i < n; i++) this.hullBox.appendChild(el('rr-hp')); }
    [...this.hullBox.children].forEach((p, i) => {
      const spent = i >= left; p.classList.toggle('spent', spent);
      if (spent && i < wasLeft) { p.classList.remove('lost'); void p.offsetWidth; p.classList.add('lost'); }
    });
    v.hits = hits; v.bears = bears;
  }

  setMedal(downs, medalAt) {
    const v = this.v, d = Math.max(0, downs | 0), was = v.downs >= 0 && v.medalAt > 0 && v.downs >= v.medalAt;
    v.downs = d; v.medalAt = medalAt;
    if (!medalAt) { this.medalRow.hidden = true; return; }
    this.medalRow.hidden = false;
    const won = d >= medalAt, m = this.medalVal;
    m.textContent = ''; m.append(String(d), el('', 'i', ' / '), String(medalAt));
    m.classList.toggle('won', won);
    if (won && !was) { m.classList.remove('just'); void m.offsetWidth; m.classList.add('just'); }
  }

  destroy() {
    removeEventListener('resize', this.onResize); clearTimeout(this.fallT);
    this.score?.destroy(); this.root?.remove(); this.root = null; this.on = false;
  }
}
