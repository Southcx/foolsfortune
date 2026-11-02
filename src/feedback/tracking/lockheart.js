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
    log.say('hurt', e.shattered ? 'Overload ended. It shattered your vessel.' : 'Overload ended. It cracked your vessel.');
  });
}

export function lockheartOutcomeRules({ on, L, log }) {
  on('lockheart.feed', (e) => { L.inc('lockheart.fed', e.amount); L.inc(`lockheart.fed.${e.from}`, e.amount); if (e.from === 'shard') log.say('luck', 'Lockheart fed: 1 whole crystal shard.', {}); });
  on('lockheart.full', (e) => log.say('luck', `The ${ITEM(e.heart).replace(/^THE /, '').toLowerCase()} is full. Use a Possibilikey to open it.`, { key: 'lhfull', throttle: 10 }));
  on('lockheart.drain', () => L.inc('lockheart.drain'));
  on('lockheart.open', (e) => {
    L.inc('lockheart.open'); L.inc(`lockheart.open.${e.heart}`); for (const k of e.keys) L.inc(`lockheart.key.${k}`); if (e.keys.length >= 3) L.inc('lockheart.three');
    log.say('luck', `Lockheart opened${e.power >= 1.9 ? ', overflowing,' : ''} with ${e.keys.map((k) => an(ITEM(k).toLowerCase())).join(', then ')}.`, {});
    for (const k of e.broke || []) { L.inc('lockheart.key.broke'); L.inc(`lockheart.key.broke.${k}`); log.say('luck', `Your ${ITEM(k).toLowerCase()} broke in the lock.`, {}); }
  });
  on('lockheart.outcome', (e) => {
    L.inc(`lockheart.out.${e.outcome}`); L.hi('lockheart.rank', e.rank);
    const O = { dud: 'Dud. Nothing inside.', bite: 'Bite. The Lockheart drains your pool.', spill: 'Lachryma spilled.', cubes: `${plural(e.n, 'cube')} poured out.`, mend: 'Pool refilled.',
      daze: `Daze ring released${e.n ? `. ${plural(e.n, 'thing')} dazed` : ''}.`, hush: `Hush released${e.n ? `. ${plural(e.n, 'thing')} asleep` : ''}.`, kin: `${e.n ? `${plural(e.n, 'creature')} now treat` : 'No creature nearby treats'} you as kin.`,
      spirit: `${e.n > 1 ? `${e.n} smoke spirits summoned` : 'Smoke spirit summoned'}.`, chest: 'A chest drops from the air!', nuke: `OVERLOAD!${e.n ? ` ${plural(e.n, 'thing')} caught in the blast.` : ''}` };
    log.say(e.rank >= 4 ? 'ach' : 'luck', O[e.outcome] || e.outcome, { tone: e.rank >= 4 ? '#ff5ad0' : undefined });
  });
}
