// ---------------------------------------------------------------------------------------
// THE QUEST JOURNAL: the quests (Dovina's progress/quests.js, game.quests: docs/plans/QUESTS.md) as a System window at the view's left
// edge, the goals window's sibling (ui/goalswindow.js), in Anagami's dress (OVERLAY.md 15.4: Clay). It reads what is and says nothing of
// what happened (the log does: tracking/quests.js). Summoned on `/quests` (quests.ask) for a while; shown a beat when a quest begins
// and when one is complete, that quest lit and the others dimmed, handed over by the quest splash once it has had its say
// (ui/questsplash.js: it waits out a live moment, so the beat does too); and on the recap (recap.show) with what you did last time above
// the quests, the goals window standing beside it for what is still open today.
//
//   A QUEST    its state in RuneScape's three colours, each with its own shape and word (CLARITY.md 7: never colour alone): NOT STARTED
//              an open ring in iron red, IN PROGRESS a ring half filled in yellow Seto, COMPLETE a full disc in Oribe green with a check
//              cut out of it. Its name in that colour, who it is for, its quest points, its trouble in one line; not started, where it
//              begins; in progress, the steps done struck through and the next one, never the one after it (QUESTS.md 2: no spoilers);
//              complete, folded to its name unless it is the one lit.
//   THE BEAT   the lit quest's mark stamped in (the goals window's check, gw-stamp), its new next step swept in from the left; on
//              quest.done each step's strike drawn across in turn (an inline element's background, so a wrapped step is struck on each of its lines in turn), the disc stamped, and the quest points' count rolled on with a +N
//              beside it. The window is the beat; Tomba!'s bigger EVENT! splash waits on South's ruling (one toast: a title).
//              The done beat and the recap leave the trouble out, so the struck steps and the next ones fit.
//   THE COLUMN the left edge's windows stand one under another in the order they came on (`leftColumn`, goalswindow.js), or beside the
//              one before where there is no room under it (above the desk log, under the touch log's ticker), so the journal and the
//              goals window never cover each other or the log; still too tall, the list fades out at its foot.
//
// Prior art: RuneScape's quest journal (red, yellow, green; the diary's done steps struck through and only the next one written; quest
// points), Tomba!'s event list (open and cleared events in one menu, each moment marked as it starts and clears), Xenoblade's "The Story
// So Far" (the recap's LAST TIME), and this house's goals window (its frame, its stamp, its beat).
//
//   new QuestJournal(game)   .show(seconds, { lit, kind, recap })   .hide()   .draw(...)   .on      QUEST_LOOK
//   (game.quests.list(): [{ id, state: 'none'|'started'|'done', name, who, trouble, begin, points, next, step, steps: [{ say, done }] }])
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, INK, COUNT_FACE } from './brineframe.js';
import { clayDress, leftColumn } from './goalswindow.js';
import { FONT } from './theme.js';

/** Real seconds a summon stands (asked, a quest begun, a quest complete, the recap), the fade, the strike's step; the states' colours
 *  (RuneScape's red, yellow and green as three glazes: bengara's iron red, yellow Seto, Oribe green) and words. */
export const QUEST_LOOK = {
  ask: 12, start: 6, done: 8, recap: 10, fade: 0.35, strike: 0.28, width: 178,
  colour: { none: '#ff7a5e', started: '#f6d452', done: '#8fdc96' },
  word: { none: 'NOT STARTED', started: 'IN PROGRESS', done: 'COMPLETE' },
};
const L = QUEST_LOOK;

const CSS = `
.qj{position:fixed;left:calc(10*var(--d));top:calc(40*var(--d));z-index:3;width:calc(${L.width}*var(--d));pointer-events:none;
  opacity:0;transform:translateX(calc(-6*var(--d)));transition:opacity ${L.fade}s,transform ${L.fade}s,top ${L.fade}s}
.qj.on{opacity:1;transform:none}
${clayDress('.qj.clay')}
.qj-pts{display:flex;align-items:baseline;justify-content:space-between;gap:calc(4*var(--d));padding:calc(1*var(--d)) 0 calc(2*var(--d));
  font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.16em}
.qj-pts>span:first-child{opacity:.7}
.qj-pts b{font-weight:400;font-size:calc(13*var(--d));letter-spacing:.04em;font-variant-numeric:tabular-nums;color:#fff1dc;display:inline-block}
.qj-pts b.pop{animation:qj-pop .4s cubic-bezier(.2,.9,.3,1.4)}
.qj-pts em{font-style:normal;margin-left:calc(2*var(--d));color:${L.colour.done};opacity:0}
.qj-pts em.up{animation:qj-up 1.6s ease-out}
@keyframes qj-pop{0%{transform:scale(1.7)}100%{transform:none}}
@keyframes qj-up{0%{opacity:0;transform:translateY(calc(3*var(--d)))}15%{opacity:1}70%{opacity:1}100%{opacity:0;transform:translateY(calc(-4*var(--d)))}}
.qj-list{max-height:var(--qj-max,none);overflow:hidden}
.qj-list.clip{-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 18*var(--d)),transparent);mask-image:linear-gradient(180deg,#000 calc(100% - 18*var(--d)),transparent)}
.qj-sec{display:flex;align-items:center;gap:calc(4*var(--d));margin:calc(3*var(--d)) 0 var(--d);font-family:${FONT.title};font-weight:700;
  font-size:calc(8*var(--d));letter-spacing:.24em;color:rgba(255,226,196,.82)}
.qj-sec::after{content:'';flex:1;height:var(--d);background:rgba(30,12,6,.55);box-shadow:0 var(--d) 0 rgba(255,226,196,.1)}
.qj-last{font-size:calc(9*var(--d));line-height:1.2;opacity:.85;padding:calc(.5*var(--d)) 0 calc(.5*var(--d)) calc(5*var(--d));text-indent:calc(-5*var(--d))}
.qj-last::before{content:'';display:inline-block;width:calc(3*var(--d));height:calc(3*var(--d));margin-right:calc(2*var(--d));vertical-align:middle;
  transform:rotate(45deg);background:rgba(255,226,196,.7)}
.qj-row{padding:calc(3*var(--d)) 0;transition:opacity .3s;--qc:${L.colour.none}}
.qj-row+.qj-row{border-top:var(--d) solid rgba(30,12,6,.45);box-shadow:inset 0 var(--d) 0 rgba(255,226,196,.08)}
.qj-row.started{--qc:${L.colour.started}}
.qj-row.done{--qc:${L.colour.done}}
.qj.beat .qj-row:not(.lit){opacity:.45}
.qj-head{display:flex;align-items:center;gap:calc(3*var(--d))}
.qj-mark{flex:none;width:calc(9*var(--d));height:calc(9*var(--d));filter:drop-shadow(0 var(--d) 0 rgba(20,8,4,.7))}
.qj-row.lit .qj-mark{animation:qj-stamp .34s cubic-bezier(.2,.9,.3,1.3) both}
.qj-row.lit.done .qj-mark{animation-delay:var(--qj-mark-at,0s)}
@keyframes qj-stamp{0%{transform:scale(2.6) rotate(-14deg);opacity:0}60%{opacity:1}100%{transform:none}}
.qj-name{flex:1;min-width:0;font-family:${FONT.title};font-weight:700;font-size:calc(10*var(--d));letter-spacing:.08em;text-transform:uppercase;
  color:var(--qc);text-shadow:0 var(--d) 0 rgba(20,8,4,.75)}
.qj-qp{flex:none;font-family:${COUNT_FACE};font-size:calc(10*var(--d));letter-spacing:.06em;font-variant-numeric:tabular-nums;opacity:.85;white-space:nowrap}
.qj-sub{display:flex;justify-content:space-between;gap:calc(4*var(--d));margin:calc(.5*var(--d)) 0 calc(1*var(--d)) calc(12*var(--d));
  font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.14em}
.qj-sub span{opacity:.7}
.qj-sub b{font-weight:400;color:var(--qc)}
.qj-trouble{margin-left:calc(12*var(--d));font-size:calc(9*var(--d));line-height:1.2;opacity:.82}
.qj-steps{margin:calc(2*var(--d)) 0 0 calc(12*var(--d))}
.qj-step{position:relative;display:grid;grid-template-columns:calc(7*var(--d)) 1fr;font-size:calc(9*var(--d));line-height:1.2;padding:calc(.5*var(--d)) 0}
.qj-step i{align-self:start;margin-top:calc(2*var(--d));width:calc(4*var(--d));height:calc(4*var(--d))}
.qj-step.did{opacity:.55}
.qj-step.did i{border:var(--d) solid rgba(255,226,196,.7);border-radius:50%;box-sizing:border-box}
.qj-step em{font-style:normal}
.qj-step.did em{background:linear-gradient(rgba(255,236,214,.85),rgba(255,236,214,.85)) 0 58%/100% var(--d) no-repeat}
.qj-row.lit .qj-step.did em{animation:qj-strike ${L.strike}s ease-out both;animation-delay:var(--qj-at,0s)}
@keyframes qj-strike{0%{background-size:0% var(--d)}100%{background-size:100% var(--d)}}
.qj-step.next i{background:var(--qc);clip-path:polygon(0 0,100% 50%,0 100%)}
.qj-step.next span{color:#fff1dc}
.qj-row.lit .qj-step.next{animation:qj-in .45s .15s cubic-bezier(.2,.8,.3,1) both}
@keyframes qj-in{0%{opacity:0;transform:translateX(calc(-8*var(--d)))}100%{opacity:1;transform:none}}
.qj-begin{display:grid;grid-template-columns:auto 1fr;column-gap:calc(3*var(--d));margin:calc(2*var(--d)) 0 0 calc(12*var(--d));font-size:calc(9*var(--d));line-height:1.2}
.qj-begin b{font-family:${COUNT_FACE};font-weight:400;font-size:calc(9*var(--d));letter-spacing:.14em;color:var(--qc)}
.qj-none{font-size:calc(9*var(--d));opacity:.7;padding:calc(3*var(--d)) 0}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-questjournal', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** A state's mark: an open ring (not started), a ring half filled (in progress), a full disc with a check cut out (complete). */
export function questMark(state) {
  const c = L.colour[state] || L.colour.none;
  const ring = `<circle cx="4.5" cy="4.5" r="3.6" fill="none" stroke="${c}" stroke-width="1.3"/>`;
  const body = state === 'done' ? `<circle cx="4.5" cy="4.5" r="4.2" fill="${c}"/><path d="M2.4 4.7 3.9 6.2 6.7 3" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="square"/>`
    : state === 'started' ? `${ring}<path d="M4.5 1.4A3.1 3.1 0 0 0 4.5 7.6Z" fill="${c}"/>` : ring;
  return `<svg class="qj-mark" viewBox="0 0 9 9" aria-label="${L.word[state] || ''}">${body}</svg>`;
}

export class QuestJournal {
  constructor(game) {
    this.game = game; this.root = null; this.on = false; this.timer = 0; this.shownPts = null;
    const ev = game?.events; if (!ev?.on) return;
    ev.on('quests.ask', (e) => this.show(L.ask, { quests: e?.quests, points: e?.points }));
    ev.on('recap.show', (e) => { if (e?.last?.length || e?.open?.length) this.show(L.recap, { recap: e }); });
  }

  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const root = (this.root = make('div', 'qj clay'));
    root.style.setProperty('--d', `${dot()}px`);
    const f = (this.frame = brineFrame(root, { tab: 'QUESTS' }));
    f.body.append(make('div', 'bf-rope'));
    const pts = make('div', 'qj-pts'); pts.append(make('span', '', 'QUEST POINTS'));
    const n = make('span'); n.append((this.ptsN = make('b', '', '0')), (this.ptsUp = make('em')));
    pts.append(n);
    this.list = make('div', 'qj-list');
    f.body.append(pts, this.list);
    document.body.appendChild(root);
    addEventListener('resize', () => { root.style.setProperty('--d', `${dot()}px`); f.layout(); if (this.on) leftColumn(root, true, (top, floor) => this.fit(top, floor)); });
  }

  /** One quest's row (`lit`: the quest of this beat; `kind`: its beat, 'start' or 'done'; `brief`: no trouble line, for the done beat's
   *  struck steps and the recap). */
  row(q, lit, kind, brief = false) {
    const row = make('div', `qj-row ${q.state}${lit ? ' lit' : ''}`);
    const head = make('div', 'qj-head'); head.insertAdjacentHTML('afterbegin', questMark(q.state));
    head.append(make('span', 'qj-name', q.name || q.id), make('span', 'qj-qp', q.points != null ? `${q.points} QP` : ''));
    const sub = make('div', 'qj-sub'); sub.append(make('span', '', q.who ? `FOR ${String(q.who).toUpperCase()}` : ''), make('b', '', L.word[q.state] || ''));
    row.append(head, sub);
    if (q.state === 'done' && !lit) return row;
    if (q.trouble && !brief) row.append(make('div', 'qj-trouble', q.trouble));
    if (q.state === 'none') {
      const b = make('div', 'qj-begin'); b.append(make('b', '', 'START'), make('span', '', q.begin || '')); row.append(b);
      return row;
    }
    const steps = make('div', 'qj-steps'), all = q.steps || [], upto = q.state === 'done' ? all.length : Math.min(all.length, (q.step ?? 0) + 1);
    let k = 0;
    for (let i = 0; i < upto; i++) {
      const s = all[i], did = !!s.done, el = make('div', `qj-step ${did ? 'did' : 'next'}`);
      const say = make('span'); say.append(make('em', '', s.say || '')); el.append(make('i'), say);
      if (did && lit && kind === 'done') el.style.setProperty('--qj-at', `${0.25 + k++ * L.strike}s`);
      steps.append(el);
    }
    if (lit && kind === 'done') row.style.setProperty('--qj-mark-at', `${0.25 + k * L.strike}s`);
    row.append(steps);
    return row;
  }

  /** Draw from game.quests.list() (or `quests` from the ask's payload); the recap's LAST TIME above them. */
  draw({ lit = null, kind = null, quests = null, points = null, recap = null } = {}) {
    this.build(); if (!this.root) return;
    const Q = this.game?.quests, list = quests || Q?.list?.() || [], pts = points ?? Q?.points ?? 0;
    this.list.innerHTML = ''; this.list.style.removeProperty('--qj-max'); this.list.classList.remove('clip');
    if (recap?.last?.length) {
      const sec = make('div', 'qj-sec'); sec.append(make('span', '', recap.minutes != null ? `LAST TIME · ${recap.minutes} MIN` : 'LAST TIME')); this.list.append(sec);
      for (const l of recap.last) this.list.append(make('div', 'qj-last', l));
      if (list.length) { const s2 = make('div', 'qj-sec'); s2.append(make('span', '', 'QUESTS')); this.list.append(s2); }
    }
    if (!list.length) this.list.append(make('div', 'qj-none', 'No quests yet.'));
    for (const q of list) this.list.append(this.row(q, q.id === lit, kind, !!recap || (q.id === lit && kind === 'done')));
    this.root.classList.toggle('beat', !!lit);
    const gain = kind === 'done' && this.shownPts != null && pts > this.shownPts ? pts - this.shownPts : 0;
    this.ptsN.textContent = String(gain ? this.shownPts : pts); this.shownPts = pts;
    this.ptsN.classList.remove('pop'); this.ptsUp.classList.remove('up');
    if (gain) {
      const at = (0.25 + (list.find((q) => q.id === lit)?.steps?.length || 0) * L.strike + 0.3) * 1000;
      clearTimeout(this.popT);
      this.popT = setTimeout(() => { this.ptsN.textContent = String(pts); this.ptsUp.textContent = `+${gain}`; void this.ptsN.offsetWidth; this.ptsN.classList.add('pop'); this.ptsUp.classList.add('up'); }, at);
    }
    requestAnimationFrame(() => this.frame?.layout());
  }

  /** Fit the list to what the column leaves between this window's top and its floor (CSS px), fading out at its foot when it is cut. */
  fit(top, floor = innerHeight) {
    if (!this.root) return;
    const d = dot(), max = Math.max(60 * d, floor - top - 8 * d - (this.root.offsetHeight - this.list.offsetHeight));
    this.list.style.setProperty('--qj-max', `${max}px`);
    this.list.classList.toggle('clip', this.list.scrollHeight > max + 1);
    this.frame?.layout();
  }

  /** Stand for `seconds` (real), then go; never over the rail readout's corner at sea. */
  show(seconds = L.ask, opts = {}) {
    if (this.game?.railReadout?.on) return;
    this.draw(opts); if (!this.root) return;
    this.on = true;
    requestAnimationFrame(() => this.root?.classList.add('on'));
    leftColumn(this.root, true, (top, floor) => this.fit(top, floor));
    clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), seconds * 1000);
    if (opts.recap) this.game?.goalsWindow?.show?.(seconds);
  }

  hide() {
    clearTimeout(this.timer); this.on = false;
    if (!this.root) return;
    this.root.classList.remove('on', 'beat'); leftColumn(this.root, false);
  }
}
