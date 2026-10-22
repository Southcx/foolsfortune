// ---------------------------------------------------------------------------------------
// THE GOALS WINDOW: the game day's three goals (Dovina's progress/goals.js, game.goals) as a System window at the view's left edge, in
// Anagami's dress (OVERLAY.md 15.4: Clay). A row a goal, in the order the System lays them: its slot (CLOSE, ELSEWHERE, STRETCH, or FIRST
// STEP), the achievement's name and words, its tier, a bar filled to `frac` with `cur` of `goal` beside it, and a gold check when done.
// It reads what is and says nothing of what happened (the log does: tracking/goals.js). Summoned on `/goals` (goals.ask) for a while;
// shown a beat when a game day lays them (goals.set) and when one is done (goal.done: its row's check stamped, the others dimmed). Hidden
// at sea while the rail readout stands in the same corner.
//
//   MATTER     the Brine frame's structure and line (ui/brineframe.js) dressed in Clay: unglazed earthenware, its grog speckled, the
//              window colour fired faintly into it, and a cord-marked band under the header (Jōmon ware's rope impressions) in place of
//              Brine's twisted rope. A placeholder for a Clay frame of its own when the islands' dresses are built out.
//   THE BAR    a groove pressed in the clay, filled with the window colour's glaze; gold when done.
//
// Prior art: Hades' Fated List (a short list, checked off as play happens), Destiny's tracked pursuits (a bar a pursuit at the screen's
// edge, shown a beat as it moves), Animal Crossing's Nook Miles+ (three a day, one out of the way), Jōmon cord-marked ware.
//
//   new GoalsWindow(game)   .show(seconds)   .hide()   .draw()      (game.goals.list(): [{ id, slot, first, name, desc, tier, cur, goal, frac, done }])
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, GOLD, SALT, INK, COUNT_FACE } from './brineframe.js';
import { FONT } from './theme.js';

export const GOALS_LOOK = { ask: 8, set: 5, done: 4, fade: 0.35 }; // (real seconds a summon stands; the fade in and out)
const SLOT_WORD = { near: 'CLOSE', elsewhere: 'ELSEWHERE', stretch: 'STRETCH', first: 'FIRST STEP' }; // (Espada's words, as the log says them: Close, Elsewhere, Stretch, First step)
const TIER_WORD = [null, 'EASY', 'MEDIUM', 'HARD', 'ELITE', 'MASTER', 'GRANDMASTER'];

const CSS = `
.gw{position:fixed;left:calc(10*var(--d));top:calc(40*var(--d));z-index:3;width:calc(150*var(--d));pointer-events:none;
  opacity:0;transform:translateX(calc(-6*var(--d)));transition:opacity ${GOALS_LOOK.fade}s,transform ${GOALS_LOOK.fade}s}
.gw.on{opacity:1;transform:none}
.gw.clay .bf-body{background:
    radial-gradient(circle,rgba(255,236,214,.18) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) 0 0/calc(4*var(--d)) calc(5*var(--d)),
    radial-gradient(circle,rgba(40,20,10,.35) 0 calc(.6*var(--d)),transparent calc(.7*var(--d))) calc(2*var(--d)) calc(1*var(--d))/calc(6*var(--d)) calc(7*var(--d)),
    linear-gradient(180deg,rgba(var(--jtop,104,50,32),.22),rgba(var(--jbot,34,15,9),.3)),
    linear-gradient(180deg,#7a4630,#4e2a1c)}
.gw.clay .bf-rope{background:linear-gradient(180deg,rgba(255,230,200,.25),transparent 45%,rgba(0,0,0,.45)),
    repeating-linear-gradient(62deg,#a8664a 0 calc(1*var(--d)),#5c3020 calc(1*var(--d)) calc(2*var(--d))),#7a4630}
.gw.clay .bf-tab{background:linear-gradient(180deg,#5c3424,#36190f)}
.gw-row{display:grid;grid-template-columns:1fr auto;column-gap:calc(4*var(--d));row-gap:var(--d);padding:calc(3*var(--d)) 0;transition:opacity .3s}
.gw-row+.gw-row{border-top:var(--d) solid rgba(30,12,6,.45);box-shadow:inset 0 var(--d) 0 rgba(255,226,196,.08)}
.gw.beat .gw-row:not(.hit){opacity:.45}
.gw-slot{font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.16em;opacity:.7}
.gw-tier{font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.12em;opacity:.55;text-align:right}
.gw-name{grid-column:1/-1;font-family:${FONT.title};font-weight:700;font-size:calc(10*var(--d));letter-spacing:.08em;text-transform:uppercase;
  display:flex;align-items:center;gap:calc(3*var(--d))}
.gw-desc{grid-column:1/-1;font-size:calc(9*var(--d));line-height:1.2;opacity:.82}
.gw-bar{position:relative;height:calc(4*var(--d));align-self:center;background:#2a140c;
  box-shadow:inset 0 var(--d) 0 rgba(0,0,0,.6),0 var(--d) 0 rgba(255,226,196,.12)}
.gw-bar i{position:absolute;left:0;top:0;bottom:0;width:var(--f,0%);transition:width .6s cubic-bezier(.2,.8,.3,1);
  background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 50%),rgb(var(--jtop,104,50,32));box-shadow:inset 0 0 0 var(--d) rgba(255,240,220,.18);filter:brightness(2.1) saturate(1.2)}
.gw-row.done .gw-bar i{filter:none}
.gw-row.done .gw-bar i{background:linear-gradient(180deg,rgba(255,255,255,.5),transparent 50%),${GOLD}}
.gw-count{font-family:${COUNT_FACE};font-size:calc(10*var(--d));letter-spacing:.04em;font-variant-numeric:tabular-nums;white-space:nowrap}
.gw-row.done .gw-count{color:${GOLD}}
.gw-check{display:none;width:calc(9*var(--d));height:calc(9*var(--d));flex:none}
.gw-row.done .gw-check{display:inline-block}
.gw-row.hit .gw-check{animation:gw-stamp .32s cubic-bezier(.2,.9,.3,1.3)}
@keyframes gw-stamp{0%{transform:scale(2.4) rotate(-12deg);opacity:0}60%{opacity:1}100%{transform:none}}
.gw-none{font-size:calc(9*var(--d));opacity:.7;padding:calc(3*var(--d)) 0}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-goalswindow', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CHECK = `<svg class="gw-check" viewBox="0 0 9 9" aria-hidden="true"><path d="M1 4.6 3.4 7 8 1.6" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="square"/><path d="M1 5.4 3.4 7.8 8 2.4" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/></svg>`;

export class GoalsWindow {
  constructor(game) {
    this.game = game; this.root = null; this.timer = 0;
    const ev = game?.events; if (!ev?.on) return;
    ev.on('goals.ask', () => this.show(GOALS_LOOK.ask));
    ev.on('goals.set', () => this.show(GOALS_LOOK.set));
    ev.on('goal.done', (e) => this.show(GOALS_LOOK.done, e?.id));
  }

  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const root = (this.root = make('div', 'gw clay'));
    root.style.setProperty('--d', `${dot()}px`);
    const f = (this.frame = brineFrame(root, { tab: 'GOALS' }));
    f.body.append(make('div', 'bf-rope'));
    this.list = make('div', 'gw-list'); f.body.append(this.list);
    document.body.appendChild(root);
    addEventListener('resize', () => { root.style.setProperty('--d', `${dot()}px`); f.layout(); });
  }

  /** Draw the rows from game.goals.list() (`hit`: the id just done, stamped; the others dimmed a beat). */
  draw(hit = null) {
    this.build(); if (!this.root) return;
    const goals = this.game?.goals?.list?.() || [];
    this.list.innerHTML = '';
    if (!goals.length) this.list.append(make('div', 'gw-none', 'Nothing laid yet today.'));
    for (const g of goals) {
      const row = make('div', `gw-row${g.done ? ' done' : ''}${g.id === hit ? ' hit' : ''}`);
      row.append(make('span', 'gw-slot', g.first ? SLOT_WORD.first : SLOT_WORD[g.slot] || ''), make('span', 'gw-tier', TIER_WORD[g.tier] || ''));
      const name = make('div', 'gw-name'); name.insertAdjacentHTML('afterbegin', CHECK); name.append(make('span', '', g.name || g.id));
      const bar = make('div', 'gw-bar'), fill = make('i');
      fill.style.setProperty('--f', `${Math.round(Math.max(0, Math.min(1, g.frac ?? 0)) * 100)}%`); bar.append(fill);
      row.append(name, make('div', 'gw-desc', g.desc || ''), bar, make('span', 'gw-count', g.goal != null ? `${Math.min(g.cur ?? 0, g.goal)} / ${g.goal}` : g.done ? 'DONE' : ''));
      this.list.append(row);
    }
    this.root.classList.toggle('beat', !!hit);
    requestAnimationFrame(() => this.frame?.layout());
  }

  /** Stand for `seconds` (real), then go; never over the rail readout's corner at sea. */
  show(seconds = GOALS_LOOK.ask, hit = null) {
    if (this.game?.railReadout?.on) return;
    this.draw(hit); if (!this.root) return;
    requestAnimationFrame(() => this.root?.classList.add('on'));
    clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), seconds * 1000);
  }

  hide() { clearTimeout(this.timer); this.root?.classList.remove('on', 'beat'); }
}
