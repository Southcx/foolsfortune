// ---------------------------------------------------------------------------------------
// THE FIGHT'S NUMBERS, PRINTED: the phase B tables (docs/plans/SYSTEMS.md) laid out as a designer reads them before anything is wired:
// the damage types' chart (the closed trump cycle, annihilation), what each tool's causes deal, the mental states' multipliers, the
// EmO curve (yield, enrage, the catch) and Luck from a sample ledger. The companion of scripts/economy.mjs, for the fight.
//
// Prior art: the type charts every Pokemon player keeps beside the game, and Machinations' habit of tuning on a table before playing.
//
//   node scripts/combat.mjs
// ---------------------------------------------------------------------------------------
import { TYPES, TYPE_IDS, TRUMPS, CAUSE_TYPE, multiplier } from '../src/progress/combat/types.js';
import { STATES, MIND, stateOf, pushed } from '../src/progress/combat/mind.js';
import { EMO, yieldOf, catchFactor, enraged } from '../src/progress/combat/emo.js';
import { UNLIKELY, luckOf } from '../src/progress/luck.js';

const pad = (s, n) => String(s).padEnd(n);

console.log('the damage types, lawful to chaotic: attacker (row) against a target of each type (column), damage multiplier');
console.log(pad('', 11) + TYPE_IDS.map((t) => pad(t, 10)).join(''));
for (const a of TYPE_IDS) console.log(pad(a, 11) + TYPE_IDS.map((t) => pad(multiplier(a, t).dmg.toFixed(2), 10)).join('') + `  builds ${TYPES[a].builds}`);
const beaten = Object.fromEntries(TYPE_IDS.map((t) => [t, TYPE_IDS.filter((a) => TRUMPS[a] === t).length]));
console.log(`each type is beaten by: ${TYPE_IDS.map((t) => `${t} ${beaten[t]}`).join(', ')} (a closed cycle has 1 each)`);
console.log(`annihilation: impact on a ${TYPES.delirium.builds} target x${multiplier('impact', null, [TYPES.delirium.builds]).dmg}, delirium on a ${TYPES.impact.builds} target x${multiplier('delirium', null, [TYPES.impact.builds]).dmg}`);
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
