// ---------------------------------------------------------------------------------------
// TRACKING, THE GOALS: the log's lines for the game day's three goals (progress/goals.js): laid, asked for (/goals), one done, all
// three done, the first path's next step; and their counts. And the first hour's one refusal (docs/plans/FIRST-HOUR.md 3): a Movement
// Art's key pressed before it is learned. The words are Espada's (2026-10-21: the System's register, the fact first, a number as a number).
//
//   goalsRules({ on, L, log, g })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { BY_ID } from '../../progress/skills.js';
import { deviceText } from '../../progress/devicewords.js';

const SLOT = { near: 'Close', elsewhere: 'Elsewhere', stretch: 'Stretch' };
const n = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-US') : '-');

export function goalsRules({ on, L, log, g }) {
  const said = (text) => { const t = deviceText(text, g.input?.device || 'keyboard'); return t[0].toUpperCase() + t.slice(1); }; // (a sentence may open on a key)
  on('goals.set', (e) => log.say('system', e.first ? 'Your first 3 goals are set. Type /goals to see them.' : (e.kept ? `A new game day: ${3 - e.kept} new goal${3 - e.kept === 1 ? '' : 's'}, ${e.kept} carried over. Type /goals to see them.` : '3 new goals for this game day. Type /goals to see them.'), { key: 'goals', throttle: 5 }));
  // the first path's refill (FIRST-HOUR.md 4): a step done gives way to the next (Espada's words, 2026-10-22)
  on('goal.next', (e) => log.say('system', e.ach ? `Next goal: ${e.ach}.${e.where ? ` ${said(e.where)}` : ''} Type /goals for all three.` : 'A new goal is set.', { key: 'goal.next', throttle: 1 })); // (the where's keys said for the device last touched)
  on('goals.ask', (e) => {
    if (!e.goals?.length) { log.say('system', 'No goals are set for this game day.', { key: 'goals.ask', throttle: 1 }); return; }
    for (const g of e.goals) { const label = g.first ? 'First step' : SLOT[g.slot] || 'Goal';
      log.say('system', g.done ? `Goal (${label}): ${g.name}. Done.` : `Goal (${label}): ${g.name}. ${String(g.desc).replace(/\.$/, '')}. ${n(g.cur)} of ${n(g.goal)}.`, { key: `goal.${g.id}`, throttle: 0.5 }); }
  });
  // the first of each module a game day (progress/firsttoday.js): counted, and said once a module
  on('firsttoday.paid', (e) => { if (e.by !== 'courier') return; L.inc('firsttoday'); L.inc(`firsttoday.${e.module}`); log.say('gain', `First today: ${e.label}, ${e.cubes} cubes.${e.left ? ` ${e.left} more to try this game day.` : ' Every one tried this game day.'}`, { key: 'firsttoday', throttle: 1 }); });
  on('goal.done', (e) => {
    if (e.by !== 'courier') return;
    L.inc('goal.done'); L.inc(`goal.done.${e.slot}`);
    if (e.all && !e.first) { L.inc('goal.day.all'); log.say('gain', 'All 3 goals done for this game day.', { key: 'goals.all', throttle: 5 }); }
    else log.say('gain', e.ach ? `Goal done: ${e.ach}.` : 'Goal done.', { key: 'goal.done', throttle: 2 });
  });
  // V and E did nothing, silently: the refusal at the point of use says what earns the art and how near you are (the hook: Petra's,
  // courier/moves/techs.js and kick.js; event art.unlearned { ability }; Espada's words, kept 2026-10-22)
  on('art.unlearned', (e) => {
    const a = BY_ID[e.ability]; if (!a || g?.system?.has?.(a.id)) return;
    const gl = a.goals?.[0], cur = gl ? Math.min(gl.n, Math.floor(L.get(gl.key) || 0)) : 0;
    log.say('warn', `You have not learned ${a.name} yet. ${a.hint || ''}${gl ? ` (${cur} of ${gl.n} ${gl.label})` : ''}`.trim(), { key: `art.unlearned.${a.id}`, throttle: 20 });
  });
}
