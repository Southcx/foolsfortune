// ---------------------------------------------------------------------------------------
// TRACKING, THE RACEWAY'S MODES AND THE BOARD'S RULES (docs/plans/SKIFF-RACING.md section 12): the hot lap, practice, the pot smash,
// the escape, the licences, the cups, the City Trial and the wager said in the log and kept on the ledger; and the board's rules (the
// hull, the wreck, the vein lane, the scorch, the manual, the shoulder, the near miss, the gaps, the buoys, the parts). The log is the
// only text feedback; a count every hit would drown it, so the hull speaks only when the pool runs low. Words: placeholders for Espada's.
//
//   hot lap, pots, escape, licence: race.start / race.finish { mode, ... }   race.restart   race.rewind   race.pot   race.escape.*
//   licence.fail   cup.*   citytrial.*   wager.*   skiff.hull / .wreck / .refill / .scorch / .manual / .shoulder / .nearmiss / .gap
//   / .buoy / .part / .glaze / .setting   race.taunt / .nemesis / .takedown { how }   (each with `by`)
//
//   raceModeRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const clock = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`; };
const TRACKS = { sun: 'the Sun Circuit', gorge: 'the Gorge Run', coaster: 'the Coaster' }; // (working names: Espada's)
const ORD = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const CUP_NAMES = { clay: 'the Clay Cup', sibling: 'the Sibling Cup' };
const FAILS = { flare: 'You flared: the test asked for none.', snakes: 'Not enough snaking carves.', grind: 'Not enough rail ground.', trick: 'No spin landed square.', pool: 'Your pool ran too low.', lane: 'You never rode the vein lane.', slow: 'Slower than bronze.', bail: 'You bailed.', bump: 'You touched a rival.', wall: 'You hit a wall.', land: 'You landed hard.' };
const STADIUM = { race: 'a race against the rivals', hotlap: 'a hot lap', pots: 'a pot smash', escape: 'the escape' };

export function raceModeRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 2) => log.say(kind, text, { key, throttle });
  // ---- the modes
  on('race.start', (e) => {
    if (e.mode === 'hotlap') say('skiff', `A hot lap of ${TRACKS[e.track]}: a flying start, the clock begins at the line.`, 'rm.start');
    else if (e.mode === 'practice') say('skiff', `Practice on ${TRACKS[e.track]}. Hold Backspace to rewind; nothing is recorded.`, 'rm.start');
    else if (e.mode === 'pots') say('skiff', `A pot smash on ${TRACKS[e.track]}: every pot you ride through takes a second off.`, 'rm.start');
    else if (e.mode === 'escape') say('skiff', 'The crater. Ride for the climb out.', 'rm.start');
    if (e.mode !== 'race') say('info', 'Backspace starts again; R held retires.', 'rm.keys', 60);
  });
  on('race.restart', () => L.inc('race.restart'));
  on('race.rewind', (e) => { L.inc('race.rewind'); if (e.seconds > 0) say('info', `Rewound ${e.seconds} s.`, 'rm.rewind', 1); });
  on('race.finish', (e) => {
    if (e.mode === 'race' && e.of > 1) { L.inc(`race.track.${e.track}.finish.rivals`); if (e.place === 1) L.inc(`race.track.${e.track}.win`); if (e.place <= 3) L.inc(`race.track.${e.track}.podium`); }
    if (e.mode === 'hotlap') { L.inc('race.hotlap'); const b = L.lo(`race.hotlap.${e.track}`, e.seconds); say('record', `A hot lap of ${clock(e.seconds)}${b ? ', your best' : ''}.`, 'rm.fin'); }
    if (e.mode === 'pots') { L.inc('race.pots'); L.lo(`race.pots.${e.track}`, e.seconds); L.hi('race.pots.smashed.best', e.pots?.smashed || 0); say('record', `${e.pots?.smashed} of ${e.pots?.of} pots: ${clock(e.raw)} less ${e.pots?.smashed} s, ${clock(e.seconds)}.`, 'rm.fin'); }
    if (e.mode === 'escape') { L.inc('race.escape.out'); L.lo('race.escape', e.seconds); say('record', `Out of the crater in ${clock(e.seconds)}, ${e.margin} m ahead of the jaws.`, 'rm.fin'); }
    if (e.mode === 'licence') { L.inc('licence.pass'); if (e.medal) L.inc(`licence.${e.test}.${e.medal}`); L.lo(`licence.${e.test}.best`, e.seconds); say('record', `Licence passed in ${clock(e.seconds)}: ${e.medal}.`, 'rm.fin'); }
  });
  on('race.end', (e) => { if (e.why === 'caught') say('warn', 'The antlion has you. Backspace to try again.', 'rm.end'); });
  on('race.pot', () => L.inc('race.pot'));
  on('race.escape.wake', () => say('warn', 'The crater wakes. Something is coming up the road behind you.', 'rm.wake'));
  on('race.escape.near', () => say('warn', 'It is right behind you.', 'rm.near', 4));
  on('race.escape.caught', () => L.inc('race.escape.caught'));
  on('licence.fail', (e) => { L.inc('licence.fail'); say('warn', `Licence failed. ${FAILS[e.why] || ''} Backspace to try again.`, 'rm.fail', 1); });
  // ---- the cups
  on('cup.start', (e) => say('skiff', `${CUP_NAMES[e.cup]}: three races, points by place.`, 'cup'));
  on('cup.race', (e) => say('skiff', `Race ${e.round}: ${ORD(e.place)}, ${e.points} points. You have ${e.total}.`, 'cup.race'));
  on('cup.finish', (e) => { L.inc('cup.finish'); if (e.place === 1) L.inc(`cup.${e.cup}.win`); say('record', e.place === 1 ? `You win ${CUP_NAMES[e.cup]}, with ${e.points} points.` : `${CUP_NAMES[e.cup]} ends: ${ORD(e.place)}, with ${e.points} points.`, 'cup.fin'); });
  on('cup.end', (e) => say('warn', `${CUP_NAMES[e.cup]} is off.`, 'cup.end'));
  // ---- the City Trial
  let patches = 0;
  on('citytrial.start', (e) => { patches = 0; L.inc('citytrial.start'); say('skiff', `The City Trial: ${Math.round(e.seconds / 60 * 10) / 10} real minutes to take what patches you can, then the Stadium.`, 'ct'); });
  on('citytrial.clock', (e) => say('skiff', `${e.left} s left to roam.`, `ct.clock.${e.left}`, 1));
  on('citytrial.patch', (e) => { patches++; L.inc('citytrial.patch'); L.inc(`citytrial.patch.${e.kind}`); L.hi('citytrial.patch.best', patches); });
  on('citytrial.stadium', (e) => say('skiff', `The Stadium: ${STADIUM[e.event] || e.event}, on ${TRACKS[e.track]}, on the board you built.`, 'ct.stadium'));
  on('citytrial.end', (e) => { if (e.why === 'finish') L.inc('citytrial.done'); else say('warn', 'The City Trial is over.', 'ct.end'); });
  // ---- the wager
  on('wager.place', (e) => { L.inc('wager.place'); say('skiff', `${e.stake} cubes on you to ${e.on === 'win' ? 'win' : 'make the podium'}, at ${e.odds} to 1.`, 'wager'); });
  on('wager.settle', (e) => { if (e.won) { L.inc('wager.won'); L.inc('wager.paid', e.paid); say('record', `The wager pays ${e.paid} cubes.`, 'wager.s'); } else { L.inc('wager.lost'); say('info', e.why === 'finish' ? 'The wager is lost.' : 'The stake is forfeit.', 'wager.s'); } });
  // ---- the board's rules (courier/skiff/boardrules.js)
  on('skiff.hull', (e) => { if (e.by !== 'courier') return; L.inc('skiff.hull'); L.inc('skiff.hull.damage', Math.round(e.damage)); if (e.left < 20) say('warn', 'Your pool runs low: one more hard knock wrecks the board. Find a vein lane.', 'hull.low', 8); });
  on('skiff.wreck', (e) => { if (e.by !== 'courier') return; L.inc('skiff.wreck'); say('warn', 'The board is wrecked: your pool was empty.', 'wreck', 2); });
  on('skiff.refill', (e) => { if (e.by !== 'courier' || !e.fresh) return; L.inc('skiff.refill'); say('skiff', 'The vein lane fills your pool.', 'refill', 10); });
  on('skiff.scorch', (e) => { if (e.by !== 'courier') return; L.inc('skiff.scorch'); say('warn', 'Your sail scorches and luffs: ease off the flare.', 'scorch', 4); });
  on('skiff.manual', (e) => { if (e.by !== 'courier') return; L.inc('skiff.manual'); L.hi('skiff.manual.best', e.seconds); if (e.fell) say('warn', 'You lose the manual.', 'manual', 3); else if (e.seconds >= 2) say('skiff', `A ${e.seconds.toFixed(1)} s manual.`, 'manual', 2); });
  on('skiff.shoulder', (e) => { if (e.by === 'courier') L.inc('skiff.shoulder'); });
  on('skiff.nearmiss', (e) => { if (e.by !== 'courier') return; L.inc('skiff.nearmiss'); L.inc(`skiff.nearmiss.${e.what}`); say('skiff', 'Near miss.', 'nearmiss', 3); });
  on('skiff.gap', (e) => { if (e.by !== 'courier') return; L.inc('skiff.gap'); L.inc(`skiff.gap.${e.gap}`); const n = L.get(`skiff.gap.${e.gap}`); say('skiff', `Gap: ${e.label}, ${e.points}.${n === 1 ? ' Your first time.' : ''}`, `gap.${e.gap}`, 1); });
  on('skiff.buoy', (e) => { if (e.by !== 'courier') return; L.inc(e.hit ? 'skiff.buoy.hit' : 'skiff.buoy.miss'); L.hi('skiff.buoy.power', e.power); if (!e.hit) say('warn', 'You miss a buoy: your power is gone.', 'buoy', 3); else if (e.power === 5) say('skiff', 'Full power.', 'buoy.full', 6); });
  on('skiff.part', (e) => say('skiff', `You fit the ${e.part.split('.').reverse().join(' ')}.`, 'part', 0.5));
  on('skiff.glaze', (e) => { if (e.by !== 'courier') return; L.inc('skiff.glaze'); say('skiff', e.glaze ? 'Your hull comes out of the kiln glazed.' : 'Your hull is bare again.', 'skiff.glaze', 0.5); });
  on('skiff.setting', (e) => say('info', e.on ? 'The balance is turned round: A pushes the lean left.' : 'The balance is as it was: A pushes the lean right.', 'skiff.set', 0.5));
  // ---- the rivals' grudges and takedowns (world/raceway/rivals.js)
  on('race.taunt', (e) => say('skiff', `${e.who} claps at you as it passes.`, 'taunt', 8));
  on('race.nemesis', (e) => { if (e.beaten) { L.inc('race.nemesis.beaten'); say('record', `You beat ${e.who}: the grudge is settled.`, 'nemesis'); } else say('skiff', `${e.who} beat you, and will remember it.`, 'nemesis'); });
  on('race.takedown', (e) => { if (e.by === 'courier' && e.how) L.inc(`race.takedown.${e.how}`); });
}
