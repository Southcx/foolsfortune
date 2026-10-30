// ---------------------------------------------------------------------------------------
// THE CARVING BENCH'S WINDOW, DRESSED (Petra's window: world/garden/bench.js, a Brine frame in the Clay dress, its classes `.cb`,
// `.cb-read`, `.cb-time`, `.cb-nums`, `.cb-row`, `.cb-acts`; docs/plans/SEEDS-SLABS-SCANS.md 2.3). Only looks: every number, word and
// button stays the window's; this lays its own marks beside them and hides what they replace.
//   THE SETTING    the time bar as a vein of Lachrymite hardening: what is left of the time runs in the film's colours, what has set is
//                  dull crystal; the minutes in the counts face beside it
//   THE TWO METERS Fossil Fighters' cleaning meter against its damage meter, drawn from the kernel's own score (progress/slabs.js
//                  scoreOf): BARED filling gold in a bisque trough, its flawless line a gold notch at 97%; CRACKED filling ember from
//                  nothing; a gold seal on the row while nothing is cracked (UNCRACKED), FLAWLESS once the bared share reaches it too.
//                  The window's own BARED and CRACKED are hidden.
//   THE TOLLS      the Crucibelle's three tolls as three small bells, rung dark as they are spent
//   THE VERBS      the slot row's icons, what each verb does to the stone (ui/icons/slabverbart.js; the bench asks for `slabverb.<verb>`);
//                  a slot's sides pared so its longest word (OUTLINE) fits on a phone
//   THE BUTTONS    SET IT NOW and PUT IT OFF as clay tiles, their keys in caps
//
// Prior art: Fossil Fighters' cleaning (its two meters side by side, the score from them), the collection log's and the goals window's
// troughs and glazed bars here (ui/collectionslook.js, ui/goalswindow.js), a geode's vein.
//
//   game.benchLook = new BenchWindowLook(game)   .update()   (once a frame: the meters from the bench's slab, the icons when the row is drawn)
// ---------------------------------------------------------------------------------------
import { scoreOf, SLAB } from '../progress/slabs.js';
import { FILM, GOLD, SALT, COUNT_FACE } from './brineframe.js';

const S = 'body .cb.clay'; // (an element and a class more than the window's own rules: the dress wins whichever style comes later)
const CSS = `
${S} .cb-time{height:calc(5*var(--d));margin:calc(3*var(--d)) 0 calc(2*var(--d));background:linear-gradient(180deg,#3c3448,#211c29);border-radius:calc(2*var(--d));
  box-shadow:inset 0 var(--d) 0 rgba(0,0,0,.55),0 var(--d) 0 rgba(255,226,196,.14),0 0 0 var(--d) #2a140c}
${S} .cb-time i{border-radius:calc(2*var(--d));filter:none;background:linear-gradient(180deg,rgba(255,255,255,.4),transparent 45%,rgba(0,0,0,.25)),
  linear-gradient(90deg,${FILM[0]},${FILM[1]},${FILM[2]},${FILM[3]},${FILM[0]}) 0 0/calc(240*var(--d)) 100%;animation:cbl-vein 9s linear infinite;
  box-shadow:0 0 calc(3*var(--d)) rgba(127,220,255,.45)}
@keyframes cbl-vein{to{background-position:0 0,calc(240*var(--d)) 0}}
${S} .cb-nums{gap:calc(6*var(--d))}
${S} .cb-nums span{display:none}
${S} .cb-nums b{font-family:${COUNT_FACE};font-weight:400;font-size:calc(11*var(--d));letter-spacing:.06em;color:${GOLD}}
${S} .cbl-meters{display:grid;grid-template-columns:auto 1fr auto;column-gap:calc(4*var(--d));row-gap:calc(2*var(--d));align-items:center;margin:calc(2*var(--d)) 0 calc(3*var(--d))}
${S} .cbl-meters em{font-style:normal;font-size:calc(8*var(--d));letter-spacing:.14em;opacity:.85}
${S} .cbl-meters u{text-decoration:none;font-family:${COUNT_FACE};font-size:calc(10*var(--d));min-width:3.2em;text-align:right;font-variant-numeric:tabular-nums}
${S} .cbl-bar{position:relative;height:calc(5*var(--d));background:linear-gradient(180deg,#d9c3a2,#b89a74);border-radius:calc(1*var(--d));
  box-shadow:inset 0 var(--d) calc(1*var(--d)) rgba(60,30,14,.6),0 0 0 var(--d) #2a140c}
${S} .cbl-bar i{position:absolute;left:0;top:0;bottom:0;width:var(--f,0%);transition:width .25s;border-radius:calc(1*var(--d))}
${S} .cbl-bar.bared i{background:linear-gradient(180deg,rgba(255,255,255,.55),transparent 50%),${GOLD}}
${S} .cbl-bar.cracked i{background:linear-gradient(180deg,rgba(255,255,255,.4),transparent 50%),#d0642a}
${S} .cbl-bar.bared b{position:absolute;top:calc(-1*var(--d));bottom:calc(-1*var(--d));left:${SLAB.flawless * 100}%;width:var(--d);background:${GOLD};box-shadow:0 0 0 var(--d) #2a140c}
${S} .cbl-seal{grid-column:1/-1;display:flex;align-items:center;gap:calc(4*var(--d));font-size:calc(8*var(--d));letter-spacing:.14em}
${S} .cbl-bells{display:flex;gap:calc(2*var(--d));margin-left:auto}
${S} .cbl-bells i{width:calc(6*var(--d));height:calc(7*var(--d));background:${GOLD};clip-path:polygon(35% 0,65% 0,72% 30%,100% 85%,100% 100%,0 100%,0 85%,28% 30%)}
${S} .cbl-bells i.spent{background:#4a3a30}
${S} .cbl-flaw{display:inline-flex;align-items:center;gap:calc(2*var(--d));color:${GOLD};opacity:0;transition:opacity .3s}
${S} .cbl-flaw.on{opacity:1}
${S} .cbl-flaw::before{content:'';width:calc(7*var(--d));height:calc(7*var(--d));border-radius:50%;background:radial-gradient(circle,${GOLD} 0 45%,transparent 50%),#7a2a1a;box-shadow:0 0 0 var(--d) #2a140c}
${S} .cb-acts button{color:#3a1c10;background:linear-gradient(180deg,#e9d6bc,#c9a882);border:0;border-radius:calc(2*var(--d));padding:calc(3*var(--d)) calc(6*var(--d));
  font-family:${COUNT_FACE};font-size:calc(10*var(--d));letter-spacing:.08em;box-shadow:inset 0 var(--d) 0 rgba(255,255,255,.4),inset 0 calc(-1*var(--d)) 0 rgba(0,0,0,.22),0 0 0 var(--d) #2a140c,0 var(--d) calc(2*var(--d)) rgba(0,0,0,.4)}
${S} .cb-acts button:hover{box-shadow:inset 0 var(--d) 0 rgba(255,255,255,.4),inset 0 calc(-1*var(--d)) 0 rgba(0,0,0,.22),0 0 0 var(--d) ${GOLD}}
${S} .cb-acts kbd{display:inline-block;margin-left:calc(3*var(--d));padding:0 calc(2*var(--d));border-radius:calc(1*var(--d));background:#3a1c10;color:${SALT};opacity:1;font-size:calc(8*var(--d))}
${S} .slotrow .sl canvas{image-rendering:pixelated}
${S} .slotrow .sl{padding-left:calc(1.5*var(--d));padding-right:calc(1.5*var(--d))}
`;

export class BenchWindowLook {
  constructor(game) { this.game = game; this.styled = false; this.seen = -1; }
  style() {
    if (this.styled || typeof document === 'undefined') return; this.styled = true;
    const st = document.createElement('style'); st.setAttribute('data-benchlook', ''); st.textContent = CSS; document.head.appendChild(st);
  }
  update() {
    const B = this.game.realm?.bench, Sl = B?.slab, root = B?.root; if (!root || !Sl) return;
    this.style();
    const body = root.querySelector('.bf-body'), read = root.querySelector('.cb-read'); if (!body || !read) return;
    let M = root.querySelector('.cbl-meters');
    if (!M) {
      M = document.createElement('div'); M.className = 'cbl-meters';
      M.innerHTML = '<em>BARED</em><span class="cbl-bar bared"><i></i><b></b></span><u class="cbl-b"></u><em>CRACKED</em><span class="cbl-bar cracked"><i></i></span><u class="cbl-c"></u><span class="cbl-seal"><span class="cbl-flaw"></span><span class="cbl-bells"></span></span>';
      read.after(M); this.seen = -1;
    }
    const key = `${Sl.uses}|${Sl.tolls}|${Sl.cracks}`;
    if (key !== this.seen) {
      this.seen = key; const sc = scoreOf(Sl), bells = M.querySelector('.cbl-bells');
      M.querySelector('.bared i').style.setProperty('--f', `${(100 * sc.bared).toFixed(1)}%`); M.querySelector('.cracked i').style.setProperty('--f', `${(100 * Math.min(1, sc.cracked)).toFixed(1)}%`);
      M.querySelector('.cbl-b').textContent = `${Math.round(100 * sc.bared)}%`; M.querySelector('.cbl-c').textContent = `${Math.round(100 * sc.cracked)}%`;
      const fl = M.querySelector('.cbl-flaw'); fl.classList.toggle('on', Sl.cracks === 0); fl.textContent = sc.flawless ? 'FLAWLESS' : 'UNCRACKED'; // (plain words, Espada's to rule)
      bells.innerHTML = Array.from({ length: SLAB.tolls }, (_, i) => `<i class="${i < SLAB.tolls - Sl.tolls ? 'spent' : ''}"></i>`).join('');
    }
  }
}
