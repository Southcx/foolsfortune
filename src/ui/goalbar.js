// ---------------------------------------------------------------------------------------
// THE GOAL BAR: the table's one goal as a plate at the far edge of the cloth: its label (XL, plain: "FIRST TO 500"), one line, and a
// track for each seat in its seat colour, filling toward the target. A mark (a gold tick) lights in the film when a track jumps past it,
// once. A value past the target draws crazed ash (the bust line). Draws what the coach gives; computes no rule (brief 2e). The panel's
// own edge is plain lacquer: the film is the acting plate's alone, and it lights only on a mark.
// Prior art: Slay the Spire's energy orb and Balatro's blind target, in one. The rolling digits are the ceremony engine's;
// here a value changes at once and the fill eases. Colours and shapes are vfx/seatlook.js's.
// Interface: `goalBar({ label, line, target, tracks:[{seat,colour,value}], marks:[{at,label}] }) -> el`;
//   `el.bar.set(tracks)`, `el.bar.setGoal({ label, line, target, marks })`. Calling setGoal again with the same target and marks
//   changes nothing but the words; lit marks and each track's last value survive a rebuild (a seat joining or leaving).
// ---------------------------------------------------------------------------------------
import { injectTableHudCss } from './tablehud.css.js';
import { cueSvg, seatInk } from './seatplate.js';

/** Build a goal bar. */
export function goalBar({ label = '', line = '', target = 100, tracks = [], marks = [] } = {}) {
  injectTableHudCss();
  const el = document.createElement('div');
  el.className = 'th-goal';
  el.innerHTML = '<div class="th-goal-label"></div><div class="th-goal-line"></div><div class="th-tracks"></div>';
  const lab = el.querySelector('.th-goal-label'), ln = el.querySelector('.th-goal-line'), box = el.querySelector('.th-tracks');
  let goal = { target, marks }, rows = new Map(), dirty = true;
  const last = new Map(); // seat -> last value (kept across rebuilds)
  const hit = new Map();  // seat -> Set of mark indexes already lit (kept across rebuilds)

  const build = (list) => {
    box.textContent = ''; rows = new Map();
    list.forEach((t, n) => {
      const r = document.createElement('div');
      r.className = 'th-track'; r.style.setProperty('--seat', seatInk(t.colour));
      r.innerHTML = `${cueSvg(t.colour)}<div class="th-rail"><div class="th-fill"></div></div><div class="th-val"></div>`;
      const rail = r.querySelector('.th-rail'), lit = hit.get(t.seat);
      goal.marks.forEach((m, i) => {
        const k = document.createElement('div'); k.className = 'th-mark'; k.dataset.i = String(i);
        k.style.left = `${100 * Math.min(1, m.at / goal.target)}%`;
        if (lit?.has(i)) k.classList.add('hit');
        if (m.label && n === 0) { const s = document.createElement('span'); s.textContent = m.label; k.appendChild(s); }
        rail.appendChild(k);
      });
      box.appendChild(r); rows.set(t.seat, r);
    });
    dirty = false;
  };
  const set = (list) => {
    if (dirty || list.length !== rows.size || list.some((t) => !rows.has(t.seat))) build(list);
    for (const t of list) {
      const r = rows.get(t.seat), fill = r.querySelector('.th-fill'), prev = last.get(t.seat) ?? 0;
      fill.style.width = `${100 * Math.max(0, Math.min(1, t.value / goal.target))}%`;
      fill.classList.toggle('over', t.value > goal.target);
      r.querySelector('.th-val').textContent = String(t.value);
      let lit = hit.get(t.seat); if (!lit) hit.set(t.seat, lit = new Set());
      goal.marks.forEach((m, i) => {
        if (prev < m.at && t.value >= m.at) { lit.add(i); r.querySelector(`.th-mark[data-i="${i}"]`)?.classList.add('hit'); }
      });
      last.set(t.seat, t.value);
    }
  };
  const same = (a, b) => a.length === b.length && a.every((m, i) => m.at === b[i].at && m.label === b[i].label);
  const setGoal = (g) => {
    const next = { target: g.target ?? goal.target, marks: g.marks ?? goal.marks };
    if (next.target !== goal.target || !same(next.marks, goal.marks)) { dirty = true; hit.clear(); } // a new scale: marks start unlit
    goal = next;
    if (g.label != null) lab.textContent = g.label;
    if (g.line != null) ln.textContent = g.line;
  };
  el.bar = { set, setGoal };
  setGoal({ label, line, target, marks });
  set(tracks);
  return el;
}
