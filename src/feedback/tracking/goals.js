// ---------------------------------------------------------------------------------------
// TRACKING, THE GOALS: the log's lines for the game day's three goals (progress/goals.js): laid, asked for (/goals), one done, all
// three done; and their counts. The words are Espada's (2026-10-21: the System's register, the fact first, a number as a number).
//
//   goalsRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const SLOT = { near: 'Close', elsewhere: 'Elsewhere', stretch: 'Stretch' };
const n = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-US') : '-');

export function goalsRules({ on, L, log }) {
  on('goals.set', () => log.say('system', '3 new goals for this game day. Type /goals to see them.', { key: 'goals', throttle: 5 }));
  on('goals.ask', (e) => {
    if (!e.goals?.length) { log.say('system', 'No goals are set for this game day.', { key: 'goals.ask', throttle: 1 }); return; }
    for (const g of e.goals) { const label = g.first ? 'First step' : SLOT[g.slot] || 'Goal';
      log.say('system', g.done ? `Goal (${label}): ${g.name}. Done.` : `Goal (${label}): ${g.name}. ${String(g.desc).replace(/\.$/, '')}. ${n(g.cur)} of ${n(g.goal)}.`, { key: `goal.${g.id}`, throttle: 0.5 }); }
  });
  on('goal.done', (e) => {
    if (e.by !== 'courier') return;
    L.inc('goal.done'); L.inc(`goal.done.${e.slot}`);
    if (e.all) { L.inc('goal.day.all'); log.say('gain', 'All 3 goals done for this game day.', { key: 'goals.all', throttle: 5 }); }
    else log.say('gain', e.ach ? `Goal done: ${e.ach}.` : 'Goal done.', { key: 'goal.done', throttle: 2 });
  });
}
