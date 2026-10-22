// ---------------------------------------------------------------------------------------
// THE GARDEN MADE COZY, MEASURED (docs/plans/GARDEN-COZY.md): the harmony gauge over game days of tending, neglect and carrying in; the
// decor catalogue's cost in minutes of play; the rating of a first set laid well and laid badly; the seasons. The Spirit Garden is in
// flux (CLAUDE.md), so these are MEASURE lines, never checks: they say whether the numbers answer to their reasons.
//
//   node scripts/garden-cozy.mjs
// ---------------------------------------------------------------------------------------
import { HARMONY, TEND, CARRY, NEGLECT, THORNS, bandOf, carriedIn, dayStep } from '../src/progress/harmony.js';
import { DECOR, SETS, priceOf, rating, LOTUSES } from '../src/progress/decor.js';
import { seasonOf, SEASON } from '../src/progress/seasons.js';
import { ECON } from '../src/progress/econ/table.js';

const M = (...a) => console.log('MEASURE', ...a);

// ---- harmony: a week of game days for three players
function week({ tends = 0, carry = 0, spirits = 0, prune = 0, days = 7 }) {
  let p = { h: HARMONY.rest, thorns: [], cause: null }, line = [];
  for (let d = 0; d < days; d++) {
    const held = d + 1 > NEGLECT.grace ? Math.min(NEGLECT.max, spirits * NEGLECT.per) : 0; // (as Harmony.owed)
    p.h = Math.max(0, Math.min(1, p.h + carry + Math.min(TEND.cap, tends * TEND.each)));
    for (let i = 0; i < prune && p.thorns.length; i++) { const t = p.thorns[0]; t.n--; if (!t.n) p.thorns.shift(); p.h += THORNS.prune; }
    const r = dayStep({ ...p, cause: carry < 0 ? CARRY.where : NEGLECT.where }, { held });
    p = { ...p, h: r.h, thorns: r.thorns };
    line.push(`${bandOf(p.h)[0]}${p.h.toFixed(2)}${r.grew ? '+' : ''}`);
  }
  return { h: p.h, thorns: p.thorns.reduce((n, t) => n + t.n, 0), line: line.join(' ') };
}
const cozy = week({ tends: 3 }), idle = week({}), stormy = week({ carry: carriedIn({ v: 1, brimming: true }) }), forgot = week({ spirits: 2 }), forgot3 = week({ spirits: 4, days: 12 });
M('harmony.tender (3 acts a game day):', cozy.line, '-> band', bandOf(cozy.h), '(want: bloom inside a week of game days)');
M('harmony.idle (nothing):', idle.line, '-> band', bandOf(idle.h), '(want: stays at rest, nothing lost)');
M('harmony.stormy (entering Prismatic and brimming every game day):', stormy.line, '-> thorns', stormy.thorns, '(want: briar, thorns capped at', THORNS.max + ')');
M('harmony.forgot (two spirits unvisited):', forgot.line, '-> band', bandOf(forgot.h), '(want: a nudge toward briar, not a ruin)');
M('harmony.forgot4 (four spirits unvisited, 12 game days):', forgot3.line, '-> band', bandOf(forgot3.h), '(want: the Grove overgrown)');
{ let p = { h: 0.1, thorns: [{ at: 'lotus', n: 6 }] }, d = 0; while (bandOf(p.h) === 'briar' && d < 60) { p = dayStep(p); d++; }
  M('harmony.recover (briar left alone):', d, 'game days back to between (want: briar fades by itself, about a week of game days or two)'); }
{ const tendDays = Math.ceil((HARMONY.bloom - HARMONY.rest) / (TEND.cap - HARMONY.drift)), oneDays = Math.ceil((HARMONY.bloom - HARMONY.rest) / (TEND.each - HARMONY.drift));
  M('harmony.toBloom:', tendDays, 'game days at the full cap,', oneDays, 'at one act a game day (want: a visit or two, not a chore list)'); }
M('harmony.carriedIn: Balanced', carriedIn({ v: 0.5 }), '| Fluid', carriedIn({ v: 0.75 }).toFixed(2), '| Prismatic', carriedIn({ v: 1 }).toFixed(2), '| brimming', carriedIn({ v: 1, brimming: true }).toFixed(2));

// ---- decor: what the catalogue costs
const ids = Object.keys(DECOR), mins = (c) => +(c / ECON.perMinute).toFixed(1);
const total = ids.reduce((n, id) => n + priceOf(id), 0);
M('decor.pieces', ids.length, 'in', Object.keys(SETS).length, 'sets; every piece has two sources or more:', ids.every((id) => DECOR[id].from.length >= 2 || DECOR[id].set === 'keepsake'), '(keepsakes one way, by design)');
M('decor.catalogue: one of each', total, 'cubes =', mins(total), 'minutes of play =', +(mins(total) / 60).toFixed(1), 'real hours at the aim (want: about three)');
for (const set of Object.keys(SETS)) { const c = ids.filter((id) => DECOR[id].set === set).reduce((n, id) => n + priceOf(id), 0); M(`decor.set.${set}`, c, 'cubes,', mins(c), 'minutes'); }
M('decor.dividend: the garden dividend at its share pays the catalogue in', +((total / (ECON.perMinute * 60 * ECON.dividend.share * ECON.dividend.slots))).toFixed(1), 'real hours with every slot working (want: inside a real week)');

// ---- the rating: a first set laid well, laid badly, and with a set finished
const shopIds = ids.filter((id) => DECOR[id].from.includes('shop'));
const spread = []; let k = 0;
for (let r = 0; r < 6; r++) for (let i = 0; i < 7; i++) { const id = shopIds[k++ % shopIds.length]; spread.push({ id, region: `dantian.${r}`, planet: 'dantian', pos: [r * 20 + i, 0, 0] }); }
const heaped = Array.from({ length: 42 }, (_, i) => ({ id: 'pathStone', region: 'dantian.0', planet: 'dantian', pos: [i, 0, 0] }));
const withSet = [...spread, ...ids.filter((id) => DECOR[id].set === 'wonder').map((id, i) => ({ id, region: 'terraces.0', planet: 'terraces', pos: [i, 0, 0] }))];
const R = (x) => { const r = rating(x); return `${r.points} points, ${r.lotuses} lake lotuses${r.sets.length ? `, sets ${r.sets.join(',')}` : ''}`; };
M('rating.spread (42 pieces, 7 a region, all kinds):', R(spread), '(want: about 3 lake lotuses)');
M('rating.heaped (42 path stones in one region):', R(heaped), '(want: next to nothing: variety over quantity)');
M('rating.withSet (the spread plus the Moss and Stone set round its deck):', R(withSet), '(want: a lake lotus more)');
M('rating.lakeLotuses at', LOTUSES.join(', '), 'points');

// ---- seasons
{ const seen = []; for (let d = 0; d < SEASON.days * 4; d += SEASON.days) seen.push(seasonOf(1000 * 28 + d).id); M('seasons:', seen.join(' -> '), `(${SEASON.days} game days each, a garden year ${SEASON.days * 4} game days = ${SEASON.days * 4} real hours)`); }
