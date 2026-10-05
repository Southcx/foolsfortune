// ---------------------------------------------------------------------------------------
// THE FIGHT'S NUMBERS, PRINTED: the phase B tables (docs/plans/SYSTEMS.md) laid out as a designer reads them before anything is wired:
// the damage types' chart (the closed trump cycle, annihilation), what each tool's causes deal, the mental states' multipliers, the
// EmO curve (yield, enrage, the catch), Luck from a sample ledger, and the domains' levels. The companion of scripts/economy.mjs, for the fight.
//
// Prior art: the type charts every Pokemon player keeps beside the game, and Machinations' habit of tuning on a table before playing.
//
//   node scripts/combat.mjs
// ---------------------------------------------------------------------------------------
import { TYPES, TYPE_IDS, TRUMPS, CAUSE_TYPE, BUILD, multiplier } from '../src/progress/combat/types.js';
import { STATES, MIND, stateOf, pushed } from '../src/progress/combat/mind.js';
import { EMO, yieldOf, catchFactor, enraged } from '../src/progress/combat/emo.js';
import { FRIENDLY, friendlyDamage, tolerance } from '../src/progress/combat/friendly.js';
import { ATTRIBUTES, radiusAt, fuelAt, widenAtRank } from '../src/progress/alchemy.js';
import { ENCOUNTERS } from '../src/progress/garden.js';
import { ASPECTS, TYPE_OF, weatherAt, phaseAt, lightAt } from '../src/progress/weather.js';
import { UNLIKELY, luckOf } from '../src/progress/luck.js';
import { DOMAINS, SOURCES, PACE, scaleOf, skillWeight, expAt, levelOf, WIDEN, widenAt } from '../src/progress/domains.js';

const pad = (s, n) => String(s).padEnd(n);

console.log('the damage types, lawful to chaotic: attacker (row) against a target of each type (column), damage multiplier');
console.log(pad('', 11) + TYPE_IDS.map((t) => pad(t, 10)).join(''));
for (const a of TYPE_IDS) console.log(pad(a, 11) + TYPE_IDS.map((t) => pad(multiplier(a, t).dmg.toFixed(2), 10)).join('') + `  builds ${TYPES[a].builds}`);
const beaten = Object.fromEntries(TYPE_IDS.map((t) => [t, TYPE_IDS.filter((a) => TRUMPS[a] === t).length]));
console.log(`each type is beaten by: ${TYPE_IDS.map((t) => `${t} ${beaten[t]}`).join(', ')} (a closed cycle has 1 each)`);
console.log(`annihilation: impact on a ${TYPES.delirium.builds} target x${multiplier('impact', null, [TYPES.delirium.builds]).dmg}, delirium on a ${TYPES.impact.builds} target x${multiplier('delirium', null, [TYPES.impact.builds]).dmg}`);
console.log(`build-up: ${TYPE_IDS.map((t) => (TYPES[t].poise ? `${t} ${TYPES[t].poise} of a poise a blow` : `${t} ${TYPES[t].builds} at ${TYPES[t].buildAt} blows for ${TYPES[t].buildDur} s`)).join(', ')}; meters drain ${BUILD.drainPerSec} a second`);
const byType = {};
for (const [c, t] of Object.entries(CAUSE_TYPE)) (byType[t] ||= []).push(c);
console.log(`\nwhat the tools' causes deal (a proposal):\n${TYPE_IDS.map((t) => `  ${pad(t, 10)} ${(byType[t] || []).join(', ')}`).join('\n')}`);

console.log('\nthe mental states: how readily a status takes, and a buff');
for (const s of STATES) console.log(`  ${pad(s.name, 10)} take x${s.take}  buff x${s.buff}`);
let m = 0, blows = 0;
while (stateOf(m).id !== 'prismatic') { m = pushed(m, MIND.perBlow); blows++; }
console.log(`  a balanced mind turns prismatic after ${blows} steady blows (${MIND.perBlow} a blow), and settles back at ${MIND.settlePerSec} a second`);

console.log(`\nEmO (optimal band ${EMO.optimal.join(' to ')}, enrage at ${EMO.enrage}; +${EMO.perBlow} a blow)`);
console.log('  emo    yield  catch  enraged');
for (const e of [0, 0.2, 0.45, 0.6, 0.7, 0.8, 0.85, 1]) console.log(`  ${e.toFixed(2)}   ${yieldOf(e).toFixed(2)}   ${catchFactor(e).toFixed(2)}   ${enraged(e)}`);
console.log(`  from calm, the band is reached after ${Math.ceil(EMO.optimal[0] / EMO.perBlow)} blows and left after ${Math.floor(EMO.optimal[1] / EMO.perBlow)}`);

const sample = { 'chest.open.prismatic': 2, 'chest.open.epic': 6, 'chest.near': 30, 'lockheart.out.nuke': 1, 'fish.legend': 1, 'crystal.sweet.fragile': 20 };
const luck = luckOf({ get: (k) => sample[k] || 0 });
console.log(`\nLuck: each unlikely event counts its surprise in bits (-log2 p): ${Object.entries(UNLIKELY).map(([k, p]) => `${k} ${(-Math.log2(p)).toFixed(1)}`).join(', ')}`);
console.log(`  a sample ledger (${Object.entries(sample).map(([k, v]) => `${v} ${k}`).join(', ')}) is ${luck.bits.toFixed(0)} bits: Luck ${luck.level}`);

// the domains: the EXP curve, and how long 99 takes at a steady pace of the domain's own acts (sloppy, middling, perfect)
console.log(`\nthe domains: EXP to level 10 ${expAt(10).toLocaleString('en')}, to 50 ${expAt(50).toLocaleString('en')}, to 99 ${expAt(99).toLocaleString('en')} (v0.1's curve)`);
console.log('  domain           sources (event: base)                                hours to 99: rote / middling / masterful');
for (const d of Object.values(DOMAINS)) {
  const src = SOURCES.filter((s) => s.domain === d.id), ord = src.filter((s) => s.base != null), base = ord.reduce((a, s) => a + s.base, 0) / Math.max(1, ord.length);
  const hours = (q) => (expAt(99) / (PACE.actsPerMin * 60 * base * scaleOf(d.id) * skillWeight(q))).toFixed(0);
  console.log(`  ${pad(d.name, 16)} ${pad(src.map((s) => `${s.event}: ${s.base ?? `${s.acts} acts`}`).join(', '), 52)} ${hours(0)} / ${hours(0.5)} / ${hours(1)}`);
}
console.log(`  (a level check: ${[1000, 50000, 500000].map((x) => `${x.toLocaleString('en')} EXP is level ${levelOf(x)}`).join(', ')})`);
const world = (q) => (7 * expAt(99) / (PACE.actsPerMin * 60 * skillWeight(q) * (expAt(99) / (PACE.hours99 * 60 * PACE.actsPerMin * skillWeight(0.5))))).toFixed(0);
console.log(`  "The World" (all seven at 99): ${world(0)} hours rote, ${world(0.5)} middling (the grind), ${world(0.75)} good, ${world(1)} masterful`);

console.log(`\nFRIENDLY FIRE (combat/friendly.js): a blow of 50 deals ${friendlyDamage(50)} to an ally; an ally's statuses from allies within ${FRIENDLY.windowSec} s: ${[0, 1, 2].map((n) => { const t = tolerance(n); return t ? `x${t.build} build-up, x${t.dur} hold` : 'shrugged off'; }).join(' / ')}`);
console.log('\nWIDENING (domains.js WIDEN: what a level widens, never accuracy) at levels 1 / 33 / 66 / 99');
for (const [k, w] of Object.entries(WIDEN)) console.log(`  ${k.padEnd(22)} ${[1, 33, 66, 99].map((l) => (w.plus ? `+${widenAt(k, l)}` : `x${widenAt(k, l).toFixed(2)}`).padEnd(6)).join(' ')} ${w.does}`);
console.log('\nSOUL ALCHEMY (alchemy.js): the attributes on the wheel, what each widens at ranks 0 / 5 / 10, and the press by rank');
for (const a of Object.values(ATTRIBUTES)) console.log(`  ${a.name.padEnd(14)} hue ${String(a.hue).padStart(3)}  ${Object.keys(a.widen).map((k) => `${k} ${[0, 5, 10].map((r) => widenAtRank(k, r).toFixed(2)).join('/')}`).join(', ')}   (${a.does})`);
console.log(`  the target's radius at rank 0 / 5 / 9: ${[0, 5, 9].map((r) => radiusAt(r).toFixed(3)).join(' / ')}; the fuel: ${[0, 5, 9].map(fuelAt).join(' / ')} cubes (all seven to 10: ${Object.keys(ATTRIBUTES).length * Array.from({ length: 10 }, (_, r) => fuelAt(r)).reduce((a, b) => a + b, 0)} cubes)`);
console.log(`THE SHRINE GARDEN (garden.js): encounters a slot can work: ${Object.values(ENCOUNTERS).map((e) => e.name).join(', ')}`);

console.log('\nEMOTIONAL WEATHER (weather.js): over 240 game hours (ten real hours), the share of each weather by island, and the spells');
for (const isl of ['margarite', 'anagami', 'entra']) {
  const n = { calm: 0 }, spells = []; let last = null, len = 0;
  for (let h = 0; h < 240; h++) { const w = weatherAt(isl, h), a = w.aspect || 'calm'; n[a] = (n[a] || 0) + 1; if (a !== last) { if (last) spells.push(len); last = a; len = 0; } len++; }
  const mean = spells.reduce((a, b) => a + b, 0) / Math.max(1, spells.length);
  console.log(`  ${isl.padEnd(10)} ${['calm', ...ASPECTS].map((a) => `${a} ${Math.round(100 * (n[a] || 0) / 240)}%`).join(', ')}; a spell lasts ${mean.toFixed(1)} game hours (${(mean * 2.5).toFixed(0)} real minutes)`);
}
console.log(`  each feeds: ${ASPECTS.map((a) => `${a} -> ${TYPE_OF[a]}`).join(', ')}`);
console.log(`  a game day: ${[0, 4, 6, 9, 12, 15, 18, 19, 21].map((h) => `${h}h ${phaseAt(h)} ${lightAt(h).toFixed(2)}`).join(' | ')}`);
