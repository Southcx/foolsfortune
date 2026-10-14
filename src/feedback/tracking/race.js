// ---------------------------------------------------------------------------------------
// TRACKING, THE RACEWAY AND THE SKIFF'S RACING VERBS (docs/plans/SKIFF-RACING.md): the race's countdown, gates, laps and medal said in
// the log (the only text feedback: no timer on the screen), its counts and bests kept for the ledger; and the skiff's carve, late pop,
// sun plates and hard landings counted. The words are placeholders for Espada's.
//
//   race.start  race.count { n }  race.go  race.solarstart  race.gate { gate, lap, split }  race.lap { lap, seconds, best }
//   race.finish { seconds, medal, laps }  race.end { why }  race.respawn   skiff.carve { tier }  skiff.pop { late }  skiff.plate
//   skiff.landhard { impact }  skiff.grind  skiff.grind.end { metres, why }  skiff.ring { ring }  race.back { gate }   (each with `by`)
//
//   raceRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const clock = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`; };
const signed = (s) => `${s >= 0 ? '+' : '−'}${Math.abs(s).toFixed(2)}`;
const MEDAL = { gold: 'gold', silver: 'silver', bronze: 'bronze' };

export function raceRules({ on, L, log }) {
  on('raceway.enter', () => log.say('info', 'The Raceway. F at the start\'s pillar begins a race of three laps. Y brings the Solar Skiff.', { key: 'rw.enter', throttle: 30 }));
  on('race.start', () => { L.inc('race.raceway.start'); log.say('skiff', 'To the line. Ready your sail.', { key: 'race.start', throttle: 2 }); });
  on('race.count', (e) => log.say('skiff', `${e.n}…`, { key: `race.count.${e.n}`, throttle: 0.5 }));
  on('race.go', () => log.say('skiff', 'Go!', { key: 'race.go', throttle: 0.5 }));
  on('race.solarstart', () => { L.inc('race.raceway.solarstart'); log.say('skiff', 'A solar start: you are off the line with the sun behind you.', { key: 'race.ss', throttle: 2 }); });
  on('race.gate', (e) => { L.inc('race.raceway.gate'); if (e.gate === 4 && e.split != null) log.say('skiff', `Half a lap: ${signed(e.split)} on your best.`, { key: 'race.split', throttle: 1 }); });
  on('race.lap', (e) => {
    L.inc('race.raceway.lap'); L.lo('race.raceway.lap.best', e.seconds);
    log.say('skiff', `Lap ${e.lap}: ${clock(e.seconds)}${e.best ? ', your best lap.' : '.'}`, { key: `race.lap.${e.lap}`, throttle: 1 });
  });
  on('race.finish', (e) => {
    L.inc('race.raceway.finish'); L.lo('race.raceway.best', e.seconds);
    if (e.medal) L.inc(`race.raceway.${e.medal}`);
    log.say('record', `Finished in ${clock(e.seconds)}${e.medal ? `: ${MEDAL[e.medal]}.` : '. No medal this time.'}`, { key: 'race.finish', throttle: 2 });
  });
  on('race.end', (e) => { if (e.why === 'left') log.say('warn', 'You leave the Raceway. The race is off.', { key: 'race.end', throttle: 2 }); });
  on('race.respawn', () => L.inc('race.raceway.respawn'));
  // the skiff's racing verbs
  on('skiff.carve', (e) => { if (e.by !== 'courier') return; L.inc('skiff.carve'); L.inc(`skiff.carve.tier${e.tier}`); L.hi('skiff.carve.best', e.tier); });
  on('skiff.pop', (e) => { if (e.by === 'courier') L.inc('skiff.pop'); });
  on('skiff.plate', (e) => { if (e.by === 'courier') L.inc('skiff.plate'); });
  on('skiff.grind', (e) => { if (e.by === 'courier') L.inc('skiff.grind'); });
  on('skiff.grind.end', (e) => {
    if (e.by !== 'courier') return; L.inc('skiff.grind.metres', Math.round(e.metres)); L.hi('skiff.grind.best', e.metres);
    if (e.metres >= 12) log.say('skiff', `A ${Math.round(e.metres)} m grind.`, { key: 'grind', throttle: 2 });
    if (e.why === 'fell') log.say('warn', 'You lose your balance off the rail.', { key: 'grind.fell', throttle: 3 });
  });
  on('skiff.ring', (e) => { if (e.by === 'courier') L.inc('skiff.ring'); });
  on('race.back', () => L.inc('race.raceway.back'));
  on('skiff.landhard', (e) => { if (e.by === 'courier') { L.inc('skiff.landhard'); log.say('warn', 'A hard landing. The hover takes it, and your speed with it.', { key: 'skiff.hard', throttle: 4 }); } });
}
