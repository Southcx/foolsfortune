// ---------------------------------------------------------------------------------------
// THE RESULTS WINDOW: the crossing told at the trip's end (docs/plans/RAIL-STANDARDS.md 6, Dovina's; Calissa's look, Petra's data). A
// System window summoned over the view in Brine's dress (ui/brineframe.js), never a toast. It counts the trip up, a row a leg:
//
//   A LEG     its name (the plain word: the shoal, the Wreckers, Old Nobody ...), SCORE rolling, PAR, RANK in a bracket square, DOWNS
//             over the medal's mark (gold when reached), MEDAL, HITS taken, best CHAIN (its multiplier), PARTS broken; each cell ticks in
//             on the sixteenth (a sixteenth of the cue's bar: BAR_S / 16, progress/rail/crossing.js), the score rolling while they do.
//   THE TALLY the hull's pips the ship could still bear lit one a sixteenth, times 1,000 (Star Fox 64's), its total rolling.
//   THE TRIP  the score ceremony's count-up (ScoreCeremony, ui/scoreceremony.js: Balatro's, as Raku's tables play it), each leg and the
//             tally a chip flying into SCORE, the total slammed; it flies down into the window's TOTAL, then the trip's RANK letter and
//             MEDAL are slammed down beside it.
//   SKIPPING  any key or a click jumps to the end; once ended, any key or a click closes it (onClose is called).
// What it says, the log says too (Dovina's tracking rule: a line a leg, a line for the trip). Sounds: the casino's count-up placeholders
// (sfx.casinoTick / casinoMult / casinoFlourish) until Wanda gives the crossing its own; `onBeat` takes them over.
//
// Prior art: Star Fox 64's stage results (hits counted up, the medal, the tally of what the ship bears), Rez's analysis screen (a row
// a area, shot down / support items / rank), Ikaruga's chapter results (the chain's best), Balatro's count-up (ui/scoreceremony.js),
// the isekai status window's rows (OVERLAY.md 10.1: rank letters in bracket squares, sections split by a hairline and a glyph).
//
//   game.railResults = new RailResults(game)
//   .open({ legs: [{ type, score, par, rank, downs, medalAt, medal, hits, bestChain, parts }], tally: { bears, per: 1000, total },
//          trip: { score, rank, medal } }, { onClose, onBeat, speed })   -> Promise (resolves when it closes)
//        bestChain: the leg's best chain level (0..8); parts: parts broken (a count or a list); per: what a hit still borne pays
//   .skip()   .close()   .isOpen   .ended
// ---------------------------------------------------------------------------------------
import { RollingNumber, formatNumber } from './rollnum.js';
import { ScoreCeremony } from './scoreceremony.js';
import { brineFrame, dot, GOLD, SALT, INK, FILM } from './brineframe.js';
import { multText } from './railreadout.js';
import { BAR_S } from '../progress/rail/crossing.js';
import { FONT } from './theme.js';
import { sfx } from '../audio/sfx.js';

export const SIXTEENTH = BAR_S / 16; // (real seconds: the cue's bar in four beats of four)
/** The legs' plain words (tracking/rail.js's LEG_NAMES and the sea chart's WAYPOINT words: placeholders, Espada's to word). */
export const LEG_LABEL = { shoal: 'The shoal', wreckers: 'The Wreckers', pirates: 'The Wreckers', leviathan: 'Old Nobody', eyewall: 'The eyewall', graveyard: 'The graveyard', maelstrom: 'The maelstrom', bounty: 'The bounty', calm: 'The calm' };
const SHAKE = { S: 2, A: 1.5, B: 1, C: 0.5, D: 0 }; // (the ceremony's scale by the trip's rank: its shake)
const COLS = ['LEG', 'SCORE', 'PAR', 'RANK', 'DOWNS', 'MEDAL', 'HITS', 'CHAIN', 'PARTS'];

const CSS = `
.rres{position:fixed;inset:0;z-index:9;display:grid;place-items:center;cursor:pointer;
  background:radial-gradient(ellipse at 50% 50%,rgba(8,10,14,.25),rgba(4,5,8,.72))}
.rres-win{min-width:calc(300*var(--d));max-width:94vw;opacity:0;transform:scaleY(.04);transition:opacity .12s,transform .2s cubic-bezier(.2,.8,.3,1)}
.rres-win.in{opacity:1;transform:none}
.rres-win.out{opacity:0;transform:scaleY(.04);transition-duration:.12s}
.rres-grid{display:grid;grid-template-columns:auto repeat(8,auto);column-gap:calc(9*var(--d));row-gap:calc(3*var(--d));align-items:center}
.rres-h{font-family:'Jersey 15',monospace;font-size:calc(11*var(--d));letter-spacing:.14em;opacity:.7;text-align:right;
  padding-bottom:calc(2*var(--d));border-bottom:var(--d) solid rgba(239,230,210,.25)}
.rres-h:first-child{text-align:left}
.rres-c{text-align:right;font-family:'Jersey 15',monospace;font-size:calc(14*var(--d));white-space:nowrap;visibility:hidden}
.rres-c.on{visibility:visible;animation:rres-in .16s ease-out}
@keyframes rres-in{0%{transform:scale(1.35);opacity:.3}100%{transform:none;opacity:1}}
.rres-name{text-align:left;font-family:${FONT.title};font-weight:700;font-size:calc(11*var(--d));letter-spacing:.12em;text-transform:uppercase}
.rres-c .rn-col{width:.5em}
.rres-dim{opacity:.55}
.rres-gold{color:${GOLD}}
.rres-rank{display:inline-block;min-width:1.1em;text-align:center;padding:0 calc(2*var(--d));box-shadow:inset 0 0 0 var(--d) rgba(239,230,210,.6)}
.rres-rank.S{color:${GOLD};box-shadow:inset 0 0 0 var(--d) ${GOLD}}
.rres-medal{display:inline-block;width:calc(13*var(--d));height:calc(13*var(--d));vertical-align:middle}
.rres-sep{display:flex;align-items:center;gap:calc(4*var(--d));margin:calc(5*var(--d)) 0 calc(4*var(--d))}
.rres-sep::before,.rres-sep::after{content:'';flex:1;height:var(--d);background:linear-gradient(90deg,transparent,rgba(239,230,210,.4),transparent)}
.rres-sep i{width:calc(4*var(--d));height:calc(4*var(--d));transform:rotate(45deg);background:${FILM[1]};box-shadow:0 0 0 var(--d) ${INK}}
.rres-line{display:flex;align-items:center;gap:calc(6*var(--d));min-height:calc(16*var(--d))}
.rres-line>b{font-family:'Jersey 15',monospace;font-weight:400;font-size:calc(13*var(--d));letter-spacing:.14em;opacity:.85}
.rres-hp{display:flex;gap:calc(2*var(--d))}
.rres-hp i{width:calc(4*var(--d));height:calc(7*var(--d));background:rgba(8,6,4,.7);box-shadow:inset 0 0 0 var(--d) rgba(239,230,210,.3)}
.rres-hp i.on{background:${SALT};box-shadow:inset 0 calc(-2*var(--d)) 0 rgba(127,220,255,.55),0 0 0 var(--d) ${INK};animation:rres-in .16s ease-out}
.rres-times{font-family:'Jersey 15',monospace;font-size:calc(13*var(--d));opacity:.75}
.rres-trip{display:flex;align-items:center;gap:calc(10*var(--d))}
.rres-total{min-width:calc(90*var(--d));text-align:right}
.rres-big{font-family:'Jersey 15',monospace;font-size:calc(30*var(--d));line-height:1;visibility:hidden}
.rres-big.on{visibility:visible;animation:rres-slam .28s cubic-bezier(.2,.9,.3,1.3)}
.rres-big .rres-medal{width:calc(22*var(--d));height:calc(22*var(--d))}
@keyframes rres-slam{0%{transform:scale(2.6);opacity:0}60%{opacity:1}100%{transform:none}}
.rres-foot{margin-top:calc(5*var(--d));text-align:right;font-family:${FONT.sys};font-size:calc(11*var(--d));opacity:.6;letter-spacing:.06em}
.rres-foot b{font-family:'Jersey 15',monospace;font-weight:400;padding:0 calc(2*var(--d));box-shadow:inset 0 0 0 var(--d) rgba(239,230,210,.5);margin-right:calc(3*var(--d))}
/* the score ceremony, worn in Brine at sea: the System's faces, the window colour's glaze, salt on tar */
.rres .sc{font-family:'Jersey 15',monospace}
.rres .sc-stage{width:min(80vw,calc(250*var(--d)));background:linear-gradient(rgba(var(--jtop,104,50,32),.97),rgba(var(--jbot,34,15,9),.98)) padding-box,
  conic-gradient(from var(--sc-spin,0deg),var(--f0),var(--f1),var(--f2),var(--f3),var(--f0)) border-box;border-radius:0;
  clip-path:polygon(calc(6*var(--d)) 0,100% 0,100% calc(100% - calc(6*var(--d))),calc(100% - calc(6*var(--d))) 100%,0 100%,0 calc(6*var(--d)))}
.rres .sc-name{font-family:${FONT.title};letter-spacing:.16em;color:${SALT}}
.rres .sc-box.base{background:#16110d;border-color:rgba(239,230,210,.55);color:${SALT};border-radius:0}
.rres .sc .rn{font-family:'Jersey 15',monospace;font-weight:400}
.rres .sc-chip{border-radius:0;font-family:${FONT.sys};font-weight:400;background:${SALT};color:${INK}}
.rres .sc-chip b{font-family:'Jersey 15',monospace;font-weight:400}
.rres .sc-totalwrap>b{color:${SALT};font-family:'Jersey 15',monospace;font-weight:400}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-railresults', ''); s.textContent = CSS; document.head.appendChild(s);
}
const el = (cls, tag = 'div', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== '') e.textContent = text; return e; };
const count = (p) => (Array.isArray(p) ? p.length : Math.max(0, p | 0));

/** The medal as drawn: a disc on a ribbon, gold when won, a hollow ring when not. */
export function medalSvg(won) {
  const s = '<svg class="rres-medal" viewBox="0 0 18 18" aria-hidden="true">';
  return won
    ? `${s}<path d="M5 1h3l1 5-3 1zM13 1h-3l-1 5 3 1z" fill="#2a8fb8" stroke="${INK}" stroke-width="1"/><circle cx="9" cy="11.5" r="5.5" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/><path d="M9 8.3l1 2h2.1l-1.7 1.3.7 2.1L9 12.4l-2.1 1.3.7-2.1-1.7-1.3H8z" fill="#fff6d0"/></svg>`
    : `${s}<circle cx="9" cy="11.5" r="5" fill="none" stroke="rgba(239,230,210,.45)" stroke-width="1.2" stroke-dasharray="2 1.5"/></svg>`;
}

export class RailResults {
  constructor(game = null) {
    this.game = game; this.root = null; this.isOpen = false; this.ended = false; this.skipped = false; this.run = 0;
    this.onKey = (e) => { if (!this.isOpen) return; e.preventDefault(); e.stopPropagation(); this.press(); };
  }

  // a key or a click: the first jumps to the end, one once it has ended closes it
  press() { if (this.ended) this.close(); else this.skip(); }

  skip() {
    if (!this.isOpen || this.skipped) return;
    this.skipped = true; this.skipRes?.(); this.ceremony?.skip();
  }

  sleep(sec) {
    if (this.skipped) return Promise.resolve();
    return Promise.race([new Promise((r) => setTimeout(r, (sec * 1000) / this.speed)), this.skipP]);
  }

  beat(kind, info = {}) {
    try {
      if (this.onBeat) return this.onBeat(kind, info);
      if (kind === 'tick') sfx.casinoTick?.(info.k ?? 0); else if (kind === 'mult') sfx.casinoMult?.(info.n ?? 2); else if (kind === 'flourish') sfx.casinoFlourish?.(info.tier ?? 1);
    } catch { /* a sound never stops the count */ }
  }

  /** Summon the window and count the trip up. Resolves when it closes. */
  open(data = {}, { onClose = null, onBeat = null, speed = 1 } = {}) {
    if (typeof document === 'undefined') return Promise.resolve();
    this.close(true);
    style();
    const run = ++this.run;
    this.onClose = onClose; this.onBeat = onBeat; this.speed = speed; this.isOpen = true; this.ended = false; this.skipped = false;
    this.skipP = new Promise((r) => { this.skipRes = r; });
    const legs = data.legs || [], tally = { per: 1000, bears: 0, ...(data.tally || {}) }, trip = data.trip || {};
    tally.total ??= tally.bears * tally.per;
    const sum = legs.reduce((a, l) => a + (l.score || 0), 0), total = trip.score ?? sum + tally.total;

    const root = this.root = el('rres'); root.style.setProperty('--d', dot() + 'px'); root.style.setProperty('--rn-scale', String(innerHeight / 1080));
    const win = el('rres-win'); root.appendChild(win);
    const { body, layout } = brineFrame(win, { tab: 'RESULTS' });
    body.appendChild(el('bf-rope'));
    // the legs: a header row and a row a leg, every cell hidden until its sixteenth
    const grid = el('rres-grid'); body.appendChild(grid);
    COLS.forEach((c) => grid.appendChild(el('rres-h', 'div', c)));
    this.rows = legs.map((l, i) => {
      const cells = COLS.map(() => el('rres-c')); cells.forEach((c) => grid.appendChild(c));
      cells[0].classList.add('rres-name'); cells[0].textContent = LEG_LABEL[l.type] || String(l.type || `Leg ${i + 1}`);
      const sn = el(''); cells[1].appendChild(sn); const num = new RollingNumber(sn, { tier: 'L', colour: SALT, speed });
      cells[2].textContent = l.par != null ? formatNumber(l.par) : '—'; cells[2].classList.add('rres-dim');
      cells[3].innerHTML = `<span class="rres-rank ${l.rank || ''}"></span>`; cells[3].firstChild.textContent = l.rank || '—';
      const reached = l.medalAt > 0 && l.downs >= l.medalAt;
      cells[4].textContent = l.medalAt ? `${l.downs ?? 0} / ${l.medalAt}` : String(l.downs ?? 0); if (reached) cells[4].classList.add('rres-gold');
      cells[5].innerHTML = medalSvg(!!l.medal);
      cells[6].textContent = String(l.hits ?? 0);
      cells[7].textContent = multText(l.bestChain || 0) || '—';
      cells[8].textContent = String(count(l.parts));
      return { cells, num, score: l.score || 0 };
    });
    // the tally
    body.appendChild(el('rres-sep')).appendChild(el('', 'i'));
    const tl = el('rres-line'); tl.appendChild(el('', 'b', 'HULL'));
    const hp = el('rres-hp'); this.hullPips = Array.from({ length: Math.max(0, tally.bears | 0) }, () => hp.appendChild(el('', 'i'))); tl.appendChild(hp);
    tl.appendChild(el('rres-times', 'span', `× ${formatNumber(tally.per)}`)); tl.appendChild(el('bf-lead', 'i'));
    const tn = el(''), tw = el('rres-c'); tw.appendChild(tn); tl.appendChild(tw); this.tallyCell = tw;
    this.tallyNum = new RollingNumber(tn, { tier: 'L', colour: SALT, speed }); this.tallyTotal = tally.total;
    body.appendChild(tl);
    // the trip
    body.appendChild(el('rres-sep')).appendChild(el('', 'i'));
    const trow = el('rres-line rres-trip'); trow.appendChild(el('', 'b', 'TOTAL')); trow.appendChild(el('bf-lead', 'i'));
    const tt = this.totalCell = el('rres-total'), ttn = el(''); tt.appendChild(ttn); this.totalNum = new RollingNumber(ttn, { tier: 'XL', colour: SALT, speed });
    trow.appendChild(tt);
    trow.appendChild(el('', 'b', 'RANK'));
    const rk = this.rankBig = el('rres-big'); rk.innerHTML = `<span class="rres-rank ${trip.rank || ''}"></span>`; rk.firstChild.textContent = trip.rank || '—'; trow.appendChild(rk);
    trow.appendChild(el('', 'b', 'MEDAL'));
    const md = this.medalBig = el('rres-big'); md.innerHTML = medalSvg(!!trip.medal); trow.appendChild(md);
    body.appendChild(trow);
    const foot = this.foot = el('rres-foot'); foot.innerHTML = '<b>ANY KEY</b><span>SKIP</span>'; body.appendChild(foot);

    root.addEventListener('pointerdown', (e) => { e.preventDefault(); this.press(); });
    addEventListener('keydown', this.onKey, true);
    document.body.appendChild(root);
    requestAnimationFrame(() => { layout(); win.classList.add('in'); });
    this.win = win;
    this.ceremony = new ScoreCeremony({ root, events: null, hud: { shake: () => {} }, speed, hold: 0.05, onBeat: (k, i) => this.beat(k, i) });
    this.done = new Promise((r) => { this.resolveDone = r; });
    this.play(run, { legs, tally, trip, total }).catch(() => {});
    return this.done;
  }

  async play(run, { legs, tally, trip, total }) {
    const S = SIXTEENTH, live = () => run === this.run && this.isOpen;
    await this.sleep(S * 2);
    // the legs: a cell a sixteenth, the score rolling over its next four
    let k = 0;
    for (const r of this.rows) {
      for (let c = 0; c < r.cells.length && !this.skipped; c++) {
        r.cells[c].classList.add('on');
        if (c === 1) r.num.to(r.score, { dur: S * 4, stagger: S / 4 });
        this.beat('tick', { k: k++ });
        await this.sleep(c === 1 ? S * 3 : S);
        if (!live()) return;
      }
      k = Math.max(0, k - 6);
    }
    // the tally: a pip a sixteenth, then its total
    for (let i = 0; i < this.hullPips.length && !this.skipped; i++) { this.hullPips[i].classList.add('on'); this.beat('tick', { k: i }); await this.sleep(S); if (!live()) return; }
    if (!this.skipped) { this.tallyCell.classList.add('on'); this.tallyNum.to(tally.total); await this.sleep(S * 6); }
    if (!live()) return;
    // the trip: the ceremony counts the legs and the tally into SCORE, slams the total and flies it into the window's TOTAL
    if (!this.skipped) {
      const steps = [{ op: 'base', n: 0, why: 'Score' }, ...legs.map((l, i) => ({ op: '+', n: l.score || 0, why: LEG_LABEL[l.type] || `Leg ${i + 1}` })), { op: '+', n: tally.total, why: 'Hull' }];
      const rest = total - legs.reduce((a, l) => a + (l.score || 0), 0) - tally.total; if (rest) steps.push({ op: '+', n: rest, why: 'The rest' });
      await this.ceremony.play({ steps, total, scale: SHAKE[trip.rank] ?? 1 }, { title: 'The crossing', speed: this.speed, target: this.totalCell });
      if (!live()) return;
    }
    this.finish(trip, total);
  }

  // Everything at its end: the cells shown, the numbers at their values, the trip's rank and medal down.
  finish(trip, total) {
    if (!this.isOpen) return;
    for (const r of this.rows) { r.cells.forEach((c) => c.classList.add('on')); r.num.set(r.score); }
    this.hullPips.forEach((p) => p.classList.add('on')); this.tallyCell.classList.add('on');
    const quick = this.skipped;
    if (quick) { this.tallyNum.set(this.tallyTotal); this.totalNum.set(total); } else this.totalNum.to(total, { dur: 0.2, stagger: 0.02 });
    this.rankBig.classList.add('on'); this.beat('mult', { n: 2 });
    setTimeout(() => { if (!this.isOpen) return; this.medalBig.classList.add('on'); this.beat('flourish', { tier: trip.medal ? 2 : 1 }); }, quick ? 0 : 260 / this.speed);
    this.ended = true;
    this.foot.innerHTML = '<b>ANY KEY</b><span>CLOSE</span>';
  }

  /** Take the window away (the onClose is called unless `quiet`). */
  close(quiet = false) {
    if (!this.root) return;
    const root = this.root, win = this.win, cb = this.onClose;
    this.run++; this.isOpen = false; this.ended = false; this.root = null; this.onClose = null;
    removeEventListener('keydown', this.onKey, true);
    this.ceremony?.close(); this.ceremony = null; this.skipRes?.();
    for (const r of this.rows || []) r.num.destroy();
    win?.classList.add('out'); setTimeout(() => root.remove(), quiet ? 0 : 140);
    this.resolveDone?.(); this.resolveDone = null;
    if (!quiet) try { cb?.(); } catch { /* the caller's own */ }
  }
}
