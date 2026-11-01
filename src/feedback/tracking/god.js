// ---------------------------------------------------------------------------------------
// TRACKING, THE GOD HAND'S MATTER, MIRACLES AND REJECTION (docs/plans/GODHAND.md 3 to 5, 10): the rules that hear the hand move the
// island's matter (godhand/matterarts.js), call a miracle or an epic down (godhand/miracles.js) and the island answer it
// (godhand/rejection.js), and keep their counts. Only the Courier's acts count (`by`). tracking/rules.js calls it. Words are
// placeholders for Espada's.
//
//   godRules({ on, L, log })
//   godHandRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';
import { MIRACLES, EPICS, GOD_POWERS, POWER_EVENTS } from '../../progress/godpowers.js';

// the domains' other powers, counted alike (`god.power.<id>`); what each says, where it says anything (placeholders for Espada's)
const POWER_SAYS = { portal: 'Portal pair opened.', fold: 'Ground folded over.', setfast: 'Creation set. It will not crumble.', totem: 'Totem raised. It keeps the weather.', herd: 'Herded. They walk the line you drew.', take: 'Taken in hand.', muster: 'Muster. Clay workers rise to carry.', ward: 'Ward written.', stamp: 'Ground pressed again.' };


const LEVEL_SAYS = [ // (the Dissonance Level, 0 to 5)
  'Dissonance Level 0. The island is calm.',
  'Dissonance Level 1. Slip jellies come for your Pneuka Jar.',
  'Dissonance Level 2. Slip jellies and a Lantern Wisp come for your Pneuka Jar.',
  'Dissonance Level 3. Stronger Figments come for your Pneuka Jar.',
  'Dissonance Level 4. A sentinel rises to mend the ground you warped.',
  'Dissonance Level 5. The island sends its strongest answer. Defeat it to clear the dissonance.',
];

export function godRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  const matter = (verb, says) => on(`god.${verb}`, (e) => {
    if (e.by !== 'courier') return;
    const m = Math.round(e.moved || 0), made = Math.round(e.made || 0);
    L.inc(`god.${verb}`); if (m) { L.inc('god.moved', m); L.hi(`god.${verb}.best`, m); } if (made) L.inc('god.made', made);
    if (says) log.say('god', says(e), { key: `gm.${verb}`, throttle: 3 });
  });
  matter('scoop'); matter('pour');
  matter('shape', () => 'Ground moved.');
  matter('carve', () => 'Channel cut.');
  on('god.sculpt', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.sculpt'); L.inc(`god.sculpt.${e.shape}`); L.hi('god.sculpt.volume', Math.round(e.volume || 0));
    log.say('god', { pillar: 'Clay pillar raised.', arch: 'Clay arch raised.', ramp: 'Clay ramp raised.' }[e.shape] || 'Clay raised.', { key: 'gsc', throttle: 1 });
  });
  for (const id of POWER_EVENTS) on(`god.${id}`, (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.power'); L.inc(`god.power.${id}`);
    if (POWER_SAYS[id]) log.say('god', POWER_SAYS[id], { key: `gp.${id}`, throttle: 2 });
    if (L.first(`god.power.${id}`)) log.say('record', `Logged: your first ${GOD_POWERS[id].label}.`);
  });
  on('god.miracle', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.miracle'); L.inc(`god.miracle.${e.feeling}`); L.hi('god.miracle.score', Math.round((e.score || 0) * 100));
    if (e.size >= 0.9 && e.score >= 0.95 && e.level >= 5) L.inc(`god.miracle.${e.feeling}.great`); // (an epic's feat way: skills.js EPIC_ARTS)
    log.say('god', `${MIRACLES[e.feeling]?.label || 'Miracle'} called down.`, { key: 'gmir', throttle: 1 });
    first('god.miracle', 'Logged: your first miracle.');
  });
  on('god.epic', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.epic'); L.inc(`god.epic.${e.epic}`);
    log.say('god', `${EPICS[e.epic]?.label || 'Epic miracle'}! The release cracks your vessel.`);
    if (e.epic === 'prophecy') log.say('god', 'Next raid foreseen. It comes later.');
  });
  on('god.dissonance', (e) => {
    if (e.level > 0) L.hi('god.dissonance.level', e.level);
    log.say(e.level ? 'warn' : 'god', LEVEL_SAYS[e.level] || LEVEL_SAYS[0], { key: 'gdis', throttle: 2 });
  });
  on('god.rejection.beaten', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.rejection.beaten');
    log.say('god', 'The island\'s answer defeated. Dissonance cleared.');
  });
}

export function godHandRules({ on, L, log }) {
  // ---- the hand
  on('god.enter', () => { L.inc('god.enter'); log.say('god', 'God hand active.'); });
  on('god.exit', () => { L.inc('god.exit'); log.say('god', 'God hand inactive.'); });
  on('god.grab', (e) => { L.inc('god.grab'); if (e.clapper) L.inc('god.grab.clapper'); });
  on('god.throw', (e) => { L.inc('god.throw'); L.hi('god.throw.speed', e.speed); });
  on('god.select', (e) => L.inc(`god.select.${e.id}`));
  on('god.sunder', (e) => { L.inc('god.sunder'); L.inc('god.cuts', e.cuts); L.hi('god.cuts.best', e.cuts); log.say('god', e.cuts ? `Your blade cleaves ${plural(e.cuts, 'clapperjar')}.` : 'The blade missed.', { key: 'sund', win: 1 }); });
  on('god.swell', () => L.inc('god.swell'));
  on('god.wring', () => L.inc('god.wring'));
  on('god.manifest', (e) => { L.inc('god.manifest'); L.hi('god.manifest.len', e.len); log.say('god', 'Clay wall raised.', { key: 'mani', win: 1.5 }); });
  on('god.raid', (e) => { L.inc('god.raid'); L.hi('god.wave.max', e.wave); log.say('god', `Raid, wave ${e.wave}: ${plural(e.n, 'clapperjar')} approach.`); });
  on('god.wave', (e) => { L.inc('god.wave'); log.say('god', `Wave ${e.wave} cleared.`); });
  on('jar.hit', (e) => { L.inc('jar.hit'); L.inc('jar.damage', e.amount || 0); L.inc(`jar.hit.${e.kind}`); }); // (the god hand's jar: GLOSSARY)
  on('jar.shatter', () => { L.inc('jar.shatter'); log.say('hurt', 'Your Pneuka Jar breaks.'); });
  on('jar.reforge', () => { L.inc('jar.reforge'); log.say('god', 'Your Pneuka Jar is made whole.'); });
}
