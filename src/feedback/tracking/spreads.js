// ---------------------------------------------------------------------------------------
// TRACKING, THE SPREAD: what the log says of the spread on the Pneuka Box's underside (docs/plans/SPREADS.md 7). Only on what you do:
// the positions that move by themselves (the Past fading, the Future growing, the Crown position with the goals) are never announced
// (Petra's catch, 2026-10-23). Turning the Box back after a change says the tallies once.
//
//   spreadRules({ on, log })   (tracking/rules.js calls it)   events: spread.flip { under, spread, sums, changed, by }
// ---------------------------------------------------------------------------------------
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NAME = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles' };
const said = (n) => (Number.isInteger(n) ? WORD[n] ?? String(n) : n.toFixed(1));

export function spreadRules({ on, log }) {
  on('spread.flip', (e) => {
    if (e.under || !e.changed || e.by !== 'courier') return;
    const lit = Object.entries(e.sums || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([s, v]) => `${said(Math.round(v * 10) / 10)} ${NAME[s]}`);
    log.say('system', lit.length ? `Your spread lights ${lit.length > 1 ? `${lit.slice(0, -1).join(', ')} and ${lit[lit.length - 1]}` : lit[0]}.` : 'Your spread lights nothing in the Box yet.', { key: 'spread.read', throttle: 1 });
  });
}
