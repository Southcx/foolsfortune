// ---------------------------------------------------------------------------------------
// TRACKING, THE GOALS: the log's lines for the game day's three goals (progress/goals.js): laid, asked for (/goals), one done, all
// three done; and their counts. Placeholder words for Espada's (the System's voice).
//
//   goalsRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const SLOT = { near: 'Nearly there', elsewhere: 'Elsewhere', stretch: 'A stretch' };
const n = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-US') : '-');

export function goalsRules({ on, L, log }) {
  on('goals.set', () => log.say('system', "The System lays this game day's goals. /goals to see them.", { key: 'goals', throttle: 5 }));
  on('goals.ask', (e) => {
    if (!e.goals?.length) { log.say('system', 'No goals yet this game day.', { key: 'goals.ask', throttle: 1 }); return; }
    for (const g of e.goals) log.say('system', `${g.first ? 'A first step' : SLOT[g.slot] || 'Goal'}: ${g.name} (${g.desc}) ${g.done ? 'Done.' : `${n(g.cur)} of ${n(g.goal)}.`}`, { key: `goal.${g.id}`, throttle: 0.5 });
  });
  on('goal.done', (e) => {
    if (e.by !== 'courier') return;
    L.inc('goal.done'); L.inc(`goal.done.${e.slot}`);
    if (e.all) { L.inc('goal.day.all'); log.say('gain', "All three of this game day's goals done.", { key: 'goals.all', throttle: 5 }); }
    else log.say('gain', "One of this game day's goals done.", { key: 'goal.done', throttle: 2 });
  });
}
