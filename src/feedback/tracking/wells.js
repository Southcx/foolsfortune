// ---------------------------------------------------------------------------------------
// TRACKING, THE WELLS: the rules that hear a Well (world/well/dunemaw.js) and keep the counts the slice's contract names
// (docs/plans/SLICE.md, "The contract"), with the log's lines for going down, deeper and back out. The words are placeholders for
// Espada's (the log's phrasing in tracking.js is Espada's to edit as strings). tracking.js calls it from listen().
//
//   wellRules({ on, L, log })     on(event, fn)   L: the ledger   log: the game log
// ---------------------------------------------------------------------------------------
const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];

export function wellRules({ on, L, log }) {
  on('well.enter', (e) => { if (e.by !== 'courier') return; L.inc('well.enter'); log.say('explore', 'You go down into the Great Dunemaw.'); });
  on('well.floor', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.floor'); L.hi('well.depth', e.floor);
    if (e.floor > 1) log.say('explore', `You go down to the ${ORD[e.floor - 1] || `${e.floor}th`} floor.`);
  });
  on('well.leave', (e) => {
    if (e.by !== 'courier') return;
    if (!e.shattered) L.inc('well.out');
    L.hi('well.charted', Math.round((e.charted || 0) * 100));
    if (e.fill <= 0) L.inc('well.dry');
    log.say(e.shattered ? 'warn' : 'explore', e.shattered ? "The Well keeps this run's finds." : 'You climb out of the Well.');
  });
}
