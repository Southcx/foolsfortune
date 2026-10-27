// ---------------------------------------------------------------------------------------
// TRACKING, THE VERITOME: the book that is a camera: the memory, the darkroom, the bestiary, the cards bound and condensed. Moved out of
// tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy
// XI's one sentence an event).
//
//   veritomeRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, an, CARD, said } from './lineformat.js';
import { CREATURES } from '../../tools/veritome/bestiary.js';
import { SUBJECTS } from '../../tools/veritome/subjects.js';

export function veritomeRules({ on, L, log, g }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- the Veritome: the memory, the darkroom, the bestiary, the Book (src/tools/veritome/veritome.js, src/tools/veritome/)
  const subj = (k) => (k === 'nothing' ? null : k === 'sky' ? 'the open sky' : k === 'sun' ? 'the sun' : SUBJECTS[k]?.name ? an(SUBJECTS[k].name) : k);
  on('veritome.draw', () => { L.inc('veritome.draw'); log.say('info', 'You open the Veritome.', { key: 'vdraw', throttle: 2 }); });
  on('veritome.lens', () => L.inc('veritome.lens'));
  on('photo.take', (e) => {
    L.inc('photo.take'); L.inc(`photo.shot.${e.kind}`);
    first('photo', said(g, "Logged: your first photograph. It stays in the Veritome's memory until you appraise it ({codex})."));
    if (e.held) { L.inc('photo.held'); if (e.held === 'chance') L.inc('photo.chance'); log.say('battle', e.held === 'chance' ? 'Shutter chance! You catch it at the height of the moment.' : 'You hold it in the lens for a clean photograph.', { key: 'phheld', throttle: 1 }); }
    if (e.unwritten) { L.inc('photo.unwritten', e.unwritten); log.say('info', `The photograph shows ${e.unwritten === 1 ? 'a thing' : `${e.unwritten} things`} as they truly are.`, { key: 'phtrue', throttle: 1 }); }
    if (e.left === 0) log.say('info', "The Veritome's memory is full: 24 photos.", { key: 'memorylast', throttle: 5 });
  });
  on('photo.discard', (e) => L.inc('photo.discard', e.n));
  on('photo.appraise', (e) => {
    L.inc('photo.appraised'); L.inc(`photo.kind.${e.kind}`); L.inc(`photo.stars.${e.stars}`); L.hi('photo.stars.best', e.stars); L.hi('photo.kinds.best', e.kinds); if (e.stars >= 4) L.inc(`photo.four.${e.kind}`); // (Rule of Thirds' feat: four kinds at four stars)
    if (e.entry && subj(e.kind)) log.say('record', `New in the Compendium: ${subj(e.kind)} (${'★'.repeat(e.stars || 1)}).`);
  });
  on('darkroom.develop', (e) => {
    L.inc('darkroom.batches'); L.hi('darkroom.batch.best', e.n);
    first('darkroom', 'Logged: your first photos appraised.');
    log.say('info', `You appraise ${plural(e.n, 'photograph')}: ${plural(e.entries, 'new entry').replace('entrys', 'entries')}, ${plural(e.facts, 'fact')}, ${plural(e.cards, 'card')}.`, {});
  });
  on('bestiary.fact', (e) => {
    L.inc('bestiary.facts'); L.inc(`bestiary.fact.${e.creature}`); L.inc(`bestiary.fact.${e.creature}.${e.fact}`); if (e.battle) L.inc('bestiary.battle');
    const C = CREATURES[e.creature], b = g.veritome?.book.bestiary, u = b?.understanding(e.creature);
    if (u && u.tier > L.get(`bestiary.u.${e.creature}`)) L.inc(`bestiary.u.${e.creature}`, u.tier - L.get(`bestiary.u.${e.creature}`)); // (the understanding reached, 1-4)
    log.say(e.battle ? 'battle' : 'record', `Bestiary, ${C?.name || e.creature}: ${C?.facts.find((f) => f.id === e.fact)?.text || e.fact}`, {});
    if (u && u.tier >= 2 && L.first(`bestiary.${e.creature}.${u.tier}`)) log.say('ach', `You have ${u.name.toLowerCase()} the ${C.name.toLowerCase()}.`, {});
  });
  on('card.get', (e) => {
    L.inc('card.get'); L.inc(`card.got.${e.card}`);
    L.inc('card.pages'); L.inc(`card.pages.${e.section}`); // (a card is bound once: every card.get is its first, progress/collection.js)
    log.say('gain', `${CARD(e.card)} is bound into your collection (rank ${e.rank}).`, { key: `cget.${e.card}`, throttle: 1 });
  });
  on('card.condense', (e) => { L.inc('card.condense'); log.say('loot', `${CARD(e.card)} is bound already: it condenses into ${plural(e.cubes, 'Lachryma cube')}.`, { tone: '#ffd98a' }); });
}
