// ---------------------------------------------------------------------------------------
// TRACKING, THE RACEWAY AND THE SKIFF'S RACING VERBS (docs/plans/SKIFF-RACING.md): the race's countdown, gates, laps and medal said in
// the log (the only text feedback: no timer on the screen), its counts and bests kept for the ledger; and the skiff's carve, late pop,
// sun plates and hard landings counted. The log says "boost pad" (Espada's ruling, 2026-10-13: LORE.md); the other words are placeholders for Espada's.
//
//   race.start  race.count { n }  race.go  race.solarstart  race.gate { gate, lap, split }  race.lap { lap, seconds, best }
//   race.finish { seconds, medal, laps }  race.end { why }  race.respawn   skiff.carve { tier }  skiff.pop { late }  skiff.plate
//   skiff.landhard { impact }  skiff.grind  skiff.grind.end { metres, why }  skiff.ring { ring }  race.back { gate }
//   skiff.combo.bank { points, n, mult, stocks }  skiff.combo.drop { points, n, why }  skiff.grab { grab, seconds }  skiff.grab.late
//   skiff.pop.miss  skiff.land.slope { gain }  raceway.branch { branch }   (each with `by`)
// A race's condition (world/raceway/conditions.js) is said at its start, and its time kept on that condition's own board too.
//
//   raceRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const clock = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`; };
const signed = (s) => `${s >= 0 ? '+' : '−'}${Math.abs(s).toFixed(2)}`;
const MEDAL = { gold: 'gold', silver: 'silver', bronze: 'bronze' };
const ORD = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const TRACK_NAMES = { sun: 'The Sun Circuit', gorge: 'The Gorge Run', coaster: 'The Coaster' }; // (working names: Espada's to rule)
// what a condition does, said at a race's start (placeholders for Espada's words)
const LIGHT_SAYS = { night: 'Night: the boost pads are dark, and the cavern\'s crystal veins still burn.', twilight: 'A low sun: the boost pads are weak.' };
const WEATHER_SAYS = {
  mirth: 'A sunshower: the sand is wet, fast and slick, and the plates still drink the sun.', wonder: 'The aurora: the sun rings drink it, and push harder.',
  desire: 'The wanting wind: it blows harder down the course.', fury: 'The hail: squalls shove you across the wind.',
  gall: 'The miasma: the air is thick and the sand clings.', grief: 'The long rain: the sand is wet, fast and slick; the sun is dim.', dread: 'The pall: fog over the course.',
};

export function raceRules({ on, L, log }) {
  on('raceway.enter', () => log.say('info', 'The Raceway. Three tracks round the hub: the Sun Circuit to the south-west, the Gorge Run to the south-east, the Coaster to the north-east. F at a track\'s start pillar begins a race of three laps. Y brings the Solar Skiff.', { key: 'rw.enter', throttle: 30 }));
  on('raceway.pit', (e) => { L.inc('raceway.pit'); log.say('warn', 'The antlion takes you. The sand slides to its jaws: keep your speed on the slope.', { key: 'rw.pit', throttle: 4 }); });
  on('race.start', (e) => {
    if (e.track === 'made') return; // (a made track's: tracking/trackeditor.js, never the park's counts)
    if (e.mode && e.mode !== 'race') return; // (the other modes: racemodes.js)
    L.inc('race.raceway.start'); L.inc(`race.track.${e.track || 'sun'}.start`); log.say('skiff', `${TRACK_NAMES[e.track] || 'The race'}: to the line. Ready your sail.`, { key: 'race.start', throttle: 2 });
    const says = [LIGHT_SAYS[e.light], WEATHER_SAYS[e.aspect]].filter(Boolean); if (says.length) log.say('skiff', says.join(' '), { key: 'race.cond', throttle: 2 });
  });
  on('race.count', (e) => log.say('skiff', `${e.n}…`, { key: `race.count.${e.n}`, throttle: 0.5 }));
  on('race.go', () => log.say('skiff', 'Go!', { key: 'race.go', throttle: 0.5 }));
  on('race.solarstart', () => { L.inc('race.raceway.solarstart'); log.say('skiff', 'A solar start: you are off the line with the sun behind you.', { key: 'race.ss', throttle: 2 }); });
  on('race.gate', (e) => { L.inc('race.raceway.gate'); if (e.gate === 4 && e.split != null) log.say('skiff', `Half a lap: ${signed(e.split)} on your best.`, { key: 'race.split', throttle: 1 }); });
  on('race.lap', (e) => {
    L.inc('race.raceway.lap'); if (!e.mode || e.mode === 'race' || e.mode === 'hotlap') L.lo('race.raceway.lap.best', e.seconds); // (practice rewinds; a part's lap is not a clean one)
    log.say('skiff', `Lap ${e.lap}: ${clock(e.seconds)}${e.best ? ', your best lap' : ''}${e.place ? `; ${ORD(e.place)} of ${e.of}` : ''}.`, { key: `race.lap.${e.lap}`, throttle: 1 });
  });
  on('race.finish', (e) => {
    if (e.mode && e.mode !== 'race') return; // (the other modes: racemodes.js)
    L.inc('race.raceway.finish'); L.lo('race.raceway.best', e.seconds);
    if (e.medal) { L.inc(`race.raceway.${e.medal}`); if (e.track) { L.inc(`race.track.${e.track}.${e.medal}`); if (e.recordClass) L.inc(`race.track.${e.track}.${e.medal}.${e.recordClass}`); } } // (each track's medals, and each class's: SKIFF-TUNING.md 2.4)
    if (e.track) { L.inc(`race.track.${e.track}.finish`); L.lo(`race.track.${e.track}.best`, e.seconds); if (e.recordClass) L.lo(`race.track.${e.track}.best.${e.recordClass}`, e.seconds); }
    if (e.condition) { L.inc(`race.raceway.finish.${e.condition.split('.')[0]}`); const b = L.lo(`race.raceway.best.${e.condition}`, e.seconds); if (b && b !== 'new') log.say('record', 'Your best under this sky.', { key: 'race.condbest', throttle: 2 }); }
    if (e.of > 1) { L.inc(`race.raceway.place${Math.min(e.place, 4)}`); if (e.place === 1) L.inc('race.raceway.win'); }
    log.say('record', `Finished ${e.of > 1 ? `${ORD(e.place)} of ${e.of} ` : ''}in ${clock(e.seconds)}${e.recordClass ? ` (${e.recordClass.toUpperCase()})` : ''}${e.medal ? `: ${MEDAL[e.medal]}.` : '. No medal this time.'}`, { key: 'race.finish', throttle: 2 });
  });
  on('skiff.paint', (e) => { if (e.by !== 'courier') return; L.inc('skiff.paint'); L.inc(`skiff.paint.${e.kind}`); });
  on('skiff.tune', (e) => { if (e.by === 'courier') L.inc('skiff.tune'); });
  on('skiff.setup', (e) => { if (e.by === 'courier' && e.how === 'save') L.inc('skiff.setup'); });
  on('race.end', (e) => { if (e.why === 'left') log.say('warn', 'You leave the Raceway. The race is off.', { key: 'race.end', throttle: 2 }); else if (e.why === 'retired') { L.inc('race.raceway.retired'); log.say('skiff', 'You retire from the race.', { key: 'race.end', throttle: 2 }); } });
  on('race.takedown', (e) => { if (e.by !== 'courier') return; L.inc('race.takedown'); log.say('skiff', `Takedown: ${e.who || 'the rival'} spins out, and the push is yours.`, { key: 'race.takedown', throttle: 2 }); });
  on('race.bump', (e) => { if (e.by === 'courier') L.inc('race.bump'); });
  on('skiff.grind.trick', (e) => { if (e.by !== 'courier') return; if (e.trick === 'fiftyfifty') { L.inc('skiff.grind.fiftyfifty'); return; } L.inc('skiff.grind.trick'); L.inc(`skiff.grind.trick.${e.trick}`); }); // (a 50-50 is the plain grind, not a trick)
  on('race.respawn', () => L.inc('race.raceway.respawn'));
  // the skiff's racing verbs
  on('skiff.carve', (e) => { if (e.by !== 'courier') return; L.inc('skiff.carve'); L.inc(`skiff.carve.tier${e.tier}`); L.hi('skiff.carve.best', e.tier); });
  on('skiff.pop', (e) => { if (e.by !== 'courier') return; L.inc('skiff.pop'); if (e.perfect) { L.inc('skiff.pop.perfect'); log.say('skiff', 'A perfect pop.', { key: 'pop.perfect', throttle: 1.5 }); } });
  on('skiff.pop.miss', (e) => { if (e.by === 'courier') log.say('info', 'Too late to pop: let go of Space as the board leaves the crest.', { key: 'pop.miss', throttle: 12 }); });
  on('skiff.plate', (e) => { if (e.by !== 'courier') return; if (e.power > 0.05) L.inc('skiff.plate'); else log.say('info', 'The boost pad is dark: no sun to feed it.', { key: 'plate.dark', throttle: 30 }); });
  // the trick combo (courier/skiff/combo.js): what it banks and loses, said; its gauge is Calissa's
  on('skiff.combo.bank', (e) => {
    if (e.by !== 'courier') return; L.inc('skiff.combo.bank'); L.hi('skiff.combo.best', e.points); L.hi('skiff.combo.longest', e.n);
    if (e.n >= 2) log.say('skiff', `A combo of ${e.n}, x${e.mult}: ${e.points}. Banked flares: ${Math.floor(e.stocks)} of 3.`, { key: 'combo.bank', throttle: 1 });
  });
  on('skiff.combo.drop', (e) => { if (e.by !== 'courier') return; L.inc('skiff.combo.drop'); if (e.n >= 2 && e.why !== 'off') log.say('warn', `Your combo of ${e.n} is lost.`, { key: 'combo.drop', throttle: 2 }); });
  on('skiff.grab', (e) => { if (e.by !== 'courier') return; L.inc('skiff.grab'); L.inc(`skiff.grab.${e.grab}`); L.hi('skiff.grab.best', e.seconds); });
  on('skiff.grab.late', (e) => { if (e.by === 'courier') log.say('warn', 'You land still grabbing: let go before the sand.', { key: 'grab.late', throttle: 6 }); });
  on('skiff.land.slope', (e) => { if (e.by === 'courier') L.inc('skiff.land.slope'); });
  on('raceway.branch', (e) => { if (e.by !== 'courier') return; L.inc('raceway.cavern'); log.say('skiff', 'Through the cavern and out.', { key: 'rw.cavern', throttle: 10 }); });
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
