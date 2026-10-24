// ---------------------------------------------------------------------------------------
// TRACKING, THE WORLD SHELLS (docs/plans/CASTER-SHELLS.md section 7; progress/combat/worldshells.js): the ledger keeps the World shells
// found (by kind: what WorldShellFinds reads to give the next), the ones fired on a draw, the best draw and the dry clicks; the log says a
// find, a draw (its power and what it drew on), and a dry click at the trigger. Achievements wd1 to wd3 are predicates over these.
//
// Prior art: the shells' own rules (tracking.js shell.fire); the palm die's (a find said, a count kept).
//
//   worldShellRules({ on, L, log })   (tracking/rules.js calls it)
//   events read: shell.found { id, tier, from, by }   shell.draw { id, k, need, drawn, feeling, from: { <kind>: units }, by }   shell.dry { id, by }
// ---------------------------------------------------------------------------------------
import { shellById, typeLabel } from '../../progress/combat/castershells.js';

const WORDS = { paint: 'paint', crude: 'crude', blot: 'a blot', slick: 'a slick', bauble: 'baubles', weather: 'the weather', liquid: 'the Lachryma here' };
const nameOf = (id) => { const r = shellById(id); return r ? `${typeLabel(r.no)} ${r.label}` : id; };

export function worldShellRules({ on, L, log }) {
  on('shell.found', (e) => {
    if (e.tier !== 5) return;
    L.inc('shell.world.found'); L.inc(`shell.world.found.${e.id}`);
    log.say('gain', `A World shell condenses out of the blot: ${nameOf(e.id)}.`, { key: 'shell.found' });
  });
  on('shell.draw', (e) => {
    if (e.by !== 'courier') return;
    L.inc('shell.world.fire'); L.hi('shell.world.k', Math.round(e.k * 100) / 100);
    for (const k of Object.keys(e.from || {})) if (e.from[k] > 0) L.inc(`shell.world.from.${k}`);
    const what = Object.entries(e.from || {}).filter(([, u]) => u > 0).sort((a, b) => b[1] - a[1]).map(([k]) => WORDS[k] || k);
    log.say('other', `${shellById(e.id)?.label || e.id} draws on ${what.slice(0, 2).join(' and ') || 'the place'}: ${Math.round(e.k * 100)}% strength.`, { key: 'shell.draw', throttle: 2 });
  });
  on('shell.dry', (e) => {
    if (e.by !== 'courier') return;
    L.inc('shell.world.dry');
    log.say('warn', 'Too little Lachryma here.', { key: 'shell.dry', throttle: 3 });
  });
}
