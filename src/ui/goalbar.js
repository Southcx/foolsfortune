// ---------------------------------------------------------------------------------------
// THE GOAL BAR: the table's one goal as a plate at the far edge of the cloth: its label (XL, plain: "FIRST TO 500"), one line, and a
// track for each seat in its seat colour, filling toward the target. A mark (a film tick) lights when a track jumps past it. A value past
// the target draws crazed ash (the bust line). Draws what the coach gives; computes no rule (docs/handoffs/dovina/casino-clarity-art-brief.md 2e).
// Prior art: Slay the Spire's energy orb and Balatro's blind target, in one. The rolling digits are the ceremony engine's (builder C);
// here a value changes at once and the fill eases.
// Interface: `goalBar({ label, line, target, tracks:[{seat,colour,value}], marks:[{at,label}] }) -> el`;
//   `el.bar.set(tracks)`, `el.bar.setGoal({ label, line, target, marks })`.
// ---------------------------------------------------------------------------------------
import { injectTableHudCss } from './tablehud.css.js';
import { SEAT_COLOURS, cueSvg } from './seatplate.js';

/** Build a goal bar. */
export function goalBar({ label = '', line = '', target = 100, tracks = [], marks = [] } = {}) {
  injectTableHudCss();
  const el = document.createElement('div');
  el.className = 'th-goal';
  el.innerHTML = '<div class="th-goal-label"></div><div class="th-goal-line"></div><div class="th-tracks"></div>';
  const lab = el.querySelector('.th-goal-label'), ln = el.querySelector('.th-goal-line'), box = el.querySelector('.th-tracks');
  let goal = { target, marks }, rows = new Map(), last = new Map();

  const build = (list) => {
    box.textContent = ''; rows = new Map(); last = new Map();
    list.forEach((t, n) => {
      const c = SEAT_COLOURS[t.colour] || SEAT_COLOURS.White, r = document.createElement('div');
      r.className = 'th-track'; r.style.setProperty('--seat', c.rim || c.hex);
      r.innerHTML = `${cueSvg(t.colour)}<div class="th-rail"><div class="th-fill"></div></div><div class="th-val"></div>`;
      const rail = r.querySelector('.th-rail');
      goal.marks.forEach((m, i) => {
        const k = document.createElement('div'); k.className = 'th-mark'; k.dataset.i = String(i);
        k.style.left = `${100 * Math.min(1, m.at / goal.target)}%`;
        if (m.label && n === 0) { const s = document.createElement('span'); s.textContent = m.label; k.appendChild(s); }
        rail.appendChild(k);
      });
      box.appendChild(r); rows.set(t.seat, r);
    });
  };
  const set = (list) => {
    if (list.length !== rows.size || list.some((t) => !rows.has(t.seat))) build(list);
    for (const t of list) {
      const r = rows.get(t.seat), fill = r.querySelector('.th-fill'), prev = last.get(t.seat) ?? 0;
      fill.style.width = `${100 * Math.max(0, Math.min(1, t.value / goal.target))}%`;
      fill.classList.toggle('over', t.value > goal.target);
      r.querySelector('.th-val').textContent = String(t.value);
      goal.marks.forEach((m, i) => { if (prev < m.at && t.value >= m.at) r.querySelector(`.th-mark[data-i="${i}"]`)?.classList.add('hit'); });
      last.set(t.seat, t.value);
    }
  };
  const setGoal = (g) => {
    goal = { target: g.target ?? goal.target, marks: g.marks ?? goal.marks };
    if (g.label != null) lab.textContent = g.label;
    if (g.line != null) ln.textContent = g.line;
    rows = new Map(); // the scale or marks changed: rebuild on the next set
  };
  el.bar = { set, setGoal };
  setGoal({ label, line, target, marks });
  set(tracks);
  return el;
}
