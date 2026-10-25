// ---------------------------------------------------------------------------------------
// TRACKING, THE LOCKHEART'S RECOIL: an Overload let out cracks the vessel on its way (the owner, 2026-10-13: a pressurized vessel when
// taking things out; tools/lockheart/table.js OUTCOMES.nuke.recoil). Counted and said. The Lockheart's outcomes are lockheartOutcomeRules, below.
// Words are placeholders for Espada's.
//
//   lockheartRules({ on, L, log })
//   lockheartOutcomeRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { plural, an, ITEM } from './lineformat.js';
export function lockheartRules({ on, L, log }) {
  on('lockheart.recoil', (e) => {
    if (e.by !== 'courier') return;
    L.inc('lockheart.recoil');
    log.say('hurt', e.shattered ? 'The Overload breaks you on its way out.' : 'The Overload cracks you on its way out.');
  });
}

export function lockheartOutcomeRules({ on, L, log }) {
  on('lockheart.feed', (e) => { L.inc('lockheart.fed', e.amount); L.inc(`lockheart.fed.${e.from}`, e.amount); if (e.from === 'shard') log.say('luck', 'The Lockheart drinks the shard whole.', {}); });
  on('lockheart.full', (e) => log.say('luck', `The ${ITEM(e.heart).replace(/^THE /, '').toLowerCase()} is full: a Possibilikey will open it.`, { key: 'lhfull', throttle: 10 }));
  on('lockheart.drain', () => L.inc('lockheart.drain'));
  on('lockheart.open', (e) => {
    L.inc('lockheart.open'); L.inc(`lockheart.open.${e.heart}`); for (const k of e.keys) L.inc(`lockheart.key.${k}`); if (e.keys.length >= 3) L.inc('lockheart.three');
    log.say('luck', `You turn ${e.keys.map((k) => an(ITEM(k).toLowerCase())).join(', then ')} in the Lockheart${e.power >= 1.9 ? ', overflowing,' : ''} and it opens.`, {});
    for (const k of e.broke || []) { L.inc('lockheart.key.broke'); L.inc(`lockheart.key.broke.${k}`); log.say('luck', `Your ${ITEM(k).toLowerCase()} snaps in the lock.`, {}); }
  });
  on('lockheart.outcome', (e) => {
    L.inc(`lockheart.out.${e.outcome}`); L.hi('lockheart.rank', e.rank);
    const O = { dud: 'Nothing comes out of it but a moth.', bite: 'It bites back, and drinks from you.', spill: 'Lachryma spills out of it.', cubes: `${plural(e.n, 'cube')} pour out of it.`, mend: 'Your Lachryma comes flooding back.',
      daze: `A ring of light goes out of it${e.n ? `: ${plural(e.n, 'thing')} reel` : ''}.`, hush: `A hush goes out of it${e.n ? `: ${plural(e.n, 'thing')} fall asleep` : ''}.`, kin: `${e.n ? `${plural(e.n, 'creature')} take` : 'Nothing near takes'} you for kin.`,
      spirit: `${e.n > 1 ? `${e.n} smoke spirits climb` : 'A smoke spirit climbs'} out of it.`, chest: 'A chest falls out of the air.', nuke: `OVERLOAD.${e.n ? ` ${plural(e.n, 'thing')} drown in it.` : ''}` };
    log.say(e.rank >= 4 ? 'ach' : 'luck', O[e.outcome] || e.outcome, { tone: e.rank >= 4 ? '#ff5ad0' : undefined });
  });
}
