// ---------------------------------------------------------------------------------------
// TRACKING, ANGLING: the rules that hear the angler (src/tools/sondelass/angling/) and keep its counts, and the lines of a fishing log
// in FFXI's and FFXIV's manner (a bite said by how hard it pulls: !, !!, !!!; a catch with its size; the first of each species and a
// record written down). The first domain lifted out of tracking.js (docs/ARCHITECTURE.md, Phase 2: tracking.js split by domain);
// tracking.js calls it from listen() with what every rule needs.
//
//   anglingRules({ on, L, log, where })    on(event, fn)   L: the ledger   log: the game log   where() -> the place, for a record
// ---------------------------------------------------------------------------------------
import { BY_SPECIES, ASPECTS } from '../../tools/sondelass/angling/species.js';

export function anglingRules({ on, L, log, where }) {
  const asp = (id) => ASPECTS.find((a) => a.id === id)?.name.toLowerCase() || id;
  on('angle.charge', () => L.inc('angle.charge'));
  on('angle.cast', (e) => {
    L.inc('angle.cast'); L.inc(`angle.cast.${e.aspect}`); if (e.water) L.inc('angle.cast.water'); if (e.lure) { L.inc(`angle.lure.${e.lure}`); if (e.lure.startsWith('curio.')) L.inc('angle.lure.curio'); } L.hi('angle.cast.dist', e.dist, { at: where() }); if (e.water) L.hi('angle.cast.dist.water', e.dist, { at: where() }); // (into water: what the casting achievements read)
    log.say('angle', e.water ? `Lure cast. It carries a mask of ${asp(e.aspect)}.` : 'Lure cast. It landed on dry ground.', { key: 'cast', throttle: 0.5 });
  });
  on('lure.land', (e) => L.inc(e.water ? 'lure.land.water' : 'lure.land.ground'));
  on('angle.retrieve', () => { L.inc('angle.retrieve'); log.say('angle', 'Lure reeled in.', { key: 'ret', throttle: 1 }); });
  on('angle.twitch', () => { L.inc('angle.twitch'); log.say('angle', 'Lure twitched.', { key: 'twitch', win: 4, fmt: (n) => `Lure twitched (×${n}).` }); });
  on('angle.sound', (e) => { L.inc('angle.sound'); log.say('angle', e.stirred ? `Water pinged. ${e.stirred === 1 ? 'Something stirs.' : 'Things stir.'}` : 'Water pinged.', { key: 'sound', throttle: 2 }); });
  on('angle.lure', () => L.inc('angle.lure.change'));
  on('angle.nibble', (e) => { L.inc('angle.nibble'); log.say('angle', 'Something nibbles at the lure.', { key: 'nib', win: 5, fmt: () => 'Something nibbles at the lure.' }); });
  on('angle.bite', (e) => {
    L.inc('angle.bite'); L.inc(`angle.bite.${e.kind}`);
    log.say('angle', e.kind === 'gulp' ? 'Something takes the lure!!!' : e.kind === 'tug' ? 'Something tugs at your line!!' : 'You feel a light tug!');
  });
  on('angle.hookset', (e) => {
    L.inc('angle.hookset'); L.inc(`angle.hookset.${e.quality}`);
    log.say('angle', e.quality === 'perfect' ? 'Hook set: perfect!' : e.quality === 'early' ? 'Hook set, a little early.' : 'Hook set, a little late.');
  });
  on('angle.miss', () => { L.inc('angle.miss'); log.say('warn', 'The lure came back empty. The fish is gone.'); });
  on('angle.reveal', () => L.inc('angle.reveal'));
  on('angle.notice', () => L.inc('angle.notice'));
  on('angle.warn', () => log.say('warn', 'Something big is on the line. Brace!', { key: 'awarn', throttle: 4 }));
  on('angle.thrash', () => L.inc('angle.thrash'));
  on('angle.brace', () => L.inc('angle.brace'));
  on('angle.crank', () => L.inc('angle.crank'));
  on('angle.retrieve.fast', () => L.inc('angle.retrieve.fast'));
  on('angle.pump', () => { L.inc('angle.pump'); log.say('angle', 'Rod pumped. Line won back.', { key: 'pump', win: 4, fmt: (n) => `Rod pumped. Line won back (×${n}).` }); }); // (the words a placeholder for Espada's)
  on('angle.bolt', () => { L.inc('angle.bolt'); log.say('angle', 'It bolts at the last moment!', { key: 'bolt', throttle: 3 }); });
  on('angle.breach', () => { L.inc('angle.breach'); log.say('god', 'Something enormous breaches the water!', { key: 'breach', throttle: 4 }); });
  on('angle.spent', () => log.say('angle', 'The fish has stopped fighting.', { key: 'spent', throttle: 3 }));
  on('angle.mindgone', () => { L.inc('angle.mindgone'); log.say('warn', 'Pool empty. The line goes slack.'); });
  on('angle.escape', (e) => {
    L.inc('angle.escape'); L.inc(`angle.escape.${e.why}`);
    if (e.species) L.inc(`fish.lost.${e.species}`);
    if (e.why === 'snap') log.say('hurt', 'The line snaps!');
    else if (e.why === 'spool') log.say('hurt', 'The line ran out and parted!');
    else if (e.why === 'slip') log.say('warn', 'Hook slipped free. The fish is gone.');
    else if (e.why === 'stow') log.say('warn', 'Rod put away. The line goes slack.');
    if (e.dur > 25) L.hi('fish.fight.longestlost', e.dur);
  });
  on('angle.catch', (e) => {
    const sp = BY_SPECIES[e.species];
    L.inc('fish.total'); L.inc(`fish.sp.${e.species}`); L.inc(`fish.cls.${e.cls}`); L.inc(`fish.aspect.${e.aspect}`); L.inc(`fish.tide.${e.tide}`); L.inc(`fish.hookset.${e.quality}`);
    L.inc('fish.kg', e.kg); L.inc('fish.cm', e.cm); L.inc('fish.fight.time', e.dur); L.inc(`fish.tier.${sp.tier}`);
    if (e.brace) L.inc('fish.braced'); if (e.peak < 0.9 && e.slackMax < 0.6) L.inc('fish.clean'); if (e.ans >= 0.8) L.inc('fish.wellread'); if (e.gave < 0.05) L.inc('fish.nogive');
    if (e.thrashes) L.inc('fish.thrashes', e.thrashes); if (e.legend) L.inc('fish.legend');
    const r = L.hi(`fish.cm.${e.species}`, e.cm, { at: e.tide }); L.hi(`fish.kg.${e.species}`, e.kg);
    L.hi('fish.fight.longest', e.dur); L.lo('fish.fight.shortest', e.dur); L.hi('fish.depth.max', e.depth); L.hi('fish.kg.max', e.kg); L.hi('fish.cm.max', e.cm);
    const cm = e.cm >= 100 ? `${(e.cm / 100).toFixed(2)} m` : `${e.cm.toFixed(1)} cm`;
    const art = sp.name.startsWith('The ') ? '' : /^[AEIOU]/i.test(sp.name) ? 'an ' : 'a ';
    log.say('angle', `Landed: ${art}${sp.name}! (${cm}, ${e.kg.toFixed(2)} kg)`);
    if (e.cls === 'giant') log.say('angle', `Size: giant.`);
    else if (e.cls === 'large') log.say('angle', `Size: large.`);
    if (e.first) log.say('record', `Logged: your first ${sp.name}. ${sp.blurb}`);
    else if (r === 'beat' || r === 'small') log.say('record', `New record for the ${sp.name}: ${cm}.`);
    if (e.legend) log.say('god', 'The Drowned Lachryma comes apart in your hands, and the workshop is a little quieter.');
  });
  // a landed fish let go (released by default; F keeps it: the owner, 2026-10-11, ANGLING.md 5): half again of the landing's Possession experience, never cubes
  on('angle.release', (e) => { if (e.by !== 'courier') return; L.inc('fish.release'); L.inc(`fish.release.${e.species}`);
    log.say('angle', `Released: the ${BY_SPECIES[e.species]?.name || 'fish'}.`, { key: 'release', throttle: 0.5 }); }); // (placeholder words, Espada's to word)
  on('angle.keep', (e) => { if (e.by !== 'courier') return; L.inc('fish.kept'); }); // (the keep key pressed on the lift: into the Pneuka Box, sold to Old Grog)
  on('angle.mooch', (e) => { L.inc('angle.mooch'); L.inc(`angle.mooch.${e.echo}`); log.say('angle', `The lure carries an echo of ${BY_SPECIES[e.echo].name}.`); });
  on('angle.landed', (e) => L.inc('fish.lachryma', e.baubles));
  on('angle.tide', (e) => { L.inc('angle.tide'); L.inc(`angle.tide.${e.phase}`); if (e.near) log.say('angle', `Tide: ${e.phase === 'low' ? 'lowest' : e.phase === 'high' ? 'full' : e.phase}.`); });
  on('angle.legend', () => log.say('god', 'Something vast turns over in the Well.'));
}
