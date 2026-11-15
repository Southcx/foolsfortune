// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS BATTLES (docs/plans/WELL-BOARD.md 12; South, 2026-11-15: "look into and execute how Dicey Dungeon's
// mechanics work ... using all the dice for movement is wasted design space"): a fight, a stray or the FOE on the board fought with
// dice. Each round every die you have NOT spent moving is thrown, and each is set into one of your tools' slots; a slot takes only
// the dice its rule allows and does one thing with the face it is given. Then the foe's blow lands: its dice were thrown and shown
// at the round's start, so a guard is a decision and never a guess. So a die is spent once a cast, on a move or on a power, and
// what is left is your hand in a fight: the d20 that would carry you to the door is also your heaviest blow.
//
// A data-and-rules module (no three.js): the rules kernel (rules.js) opens one where a floor of creatures is landed on and reads its
// end as that floor cleared or failed; the bot and the simulator play it the same way.
//
//   GEAR      the six tool slots, the same for every seat in the draft. One job each, one line each.
//   A ROUND   hand thrown; the foe's dice shown; place dice (each `place` a move); `end`: the blow lands on your poise, less your guard.
//   POISE     what you can take in one battle: BATTLE.poise, less BATTLE.crack for each crack you carry (a modifier with its source
//             shown: the cracked vessel). At none the battle is lost. It is the battle's own and is whole again at the next.
//   FLAWLESS  a battle won with no poise lost: the floor counts as cleared well (a material a tier higher).
//
// Prior art: Dicey Dungeon (dice thrown each turn and spent into equipment whose slots constrain them: a maximum, evens only, a
// countdown; splitting and re-throwing a die as equipment; the foe's dice on show), Slay the Spire (the intent shown before you
// act), Machi Koro and King of Tokyo (a hand of dice as the turn).
//
//   GEAR { id: { does: hit | guard | split | again | count, bonus?, label, slot, line, uses, count? } }   BATTLE (the numbers)   FOES { kind: (depth) -> { hp, dice, sides } }
//   newBattle(r, { dice, cracks, kind, depth }) -> B   battleMoves(B) -> moves   battleApply(B, move, r) -> log entries   fits(gear, die)
//   B { round, hp, hpMax, guard, hand: [{ sides, face, used }], gear: { id: { used, count } }, foe: { hp, hpMax, intent: [faces], stun }, over, won, flawless }
//   moves: place { die (index in the hand), gear } · end
// ---------------------------------------------------------------------------------------
import { die } from '../casino/table.js';

/** `poise`: about two unguarded blows of a first-floor fight. `crack`: poise a crack takes. `bare`: with fewer than `least` dice
 *  left unspent you fight with bare d4s made up to it (a fight entered on your last die is a poor one). `rounds`: a battle not
 *  won by then is lost (the foe outlasts you). */
export const BATTLE = { poise: 16, crack: 2, least: 2, bare: 4, rounds: 10 };

export const GEAR = {
  cutlass: { does: 'hit', label: 'Cutlass', slot: 'any', line: 'Any die. Deals its face.', uses: 1 },
  psygun: { does: 'hit', bonus: 2, label: 'Psygun', slot: 'max4', line: 'A face of 4 or less. Deals its face + 2. Twice a round.', uses: 2 },
  lockheart: { does: 'guard', label: 'Lockheart', slot: 'even', line: 'An even face. Guards that much of the foe\'s blow.', uses: 1 },
  dreamvane: { does: 'split', label: 'Dreamvane', slot: 'min2', line: 'A face of 2 or more. Splits it into two dice.', uses: 1 },
  veritome: { does: 'again', label: 'Veritome', slot: 'any', line: 'Any die. Throws it again.', uses: 1 },
  crucibelle: { does: 'count', label: 'Crucibelle', slot: 'count', count: 12, line: 'Any dice. Counts down from 12 across rounds; at 0 the foe\'s blow is stopped.', uses: 6 },
};
export const GEAR_IDS = Object.keys(GEAR);
export const SLOT = { any: 'ANY', max4: 'MAX 4', even: 'EVEN', min2: 'MIN 2', count: 'COUNTDOWN' };

/** A foe's numbers by where it is met. A fight's creatures hit harder deeper; the FOE has the most dice and the biggest. */
export const FOES = {
  stray: (d) => ({ hp: 10 + 4 * d, dice: 2, sides: 4 }),
  fight: (d) => ({ hp: 14 + 6 * d, dice: d >= 2 ? 3 : 2, sides: 6 }),
  foe: (d) => ({ hp: 34 + 6 * d, dice: 3, sides: 8 }),
};

export const fits = (gear, d) => { const s = GEAR[gear].slot; return s === 'max4' ? d.face <= 4 : s === 'even' ? d.face % 2 === 0 : s === 'min2' ? d.face >= 2 : true; };

export function newBattle(r, { dice = [], cracks = 0, kind = 'fight', depth = 0 } = {}) {
  const pool = dice.slice(); while (pool.length < BATTLE.least) pool.push(BATTLE.bare);
  const F = (FOES[kind] || FOES.fight)(depth), hp = Math.max(4, BATTLE.poise - BATTLE.crack * cracks);
  const B = { kind, depth, round: 0, hp, hpMax: hp, held: BATTLE.crack * cracks, guard: 0, hurt: 0, pool, hand: [], gear: Object.fromEntries(GEAR_IDS.map((id) => [id, { used: 0, count: GEAR[id].count ?? null }])),
    foe: { hp: F.hp, hpMax: F.hp, dice: F.dice, sides: F.sides, intent: [], stopped: false }, over: false, won: false, flawless: false };
  round(B, r);
  return B;
}
function round(B, r) {
  B.round++; B.guard = 0; B.foe.stopped = false;
  B.hand = B.pool.map((sides) => ({ sides, face: die(r, sides), used: false }));
  for (const id of GEAR_IDS) B.gear[id].used = 0;
  B.foe.intent = [...Array(B.foe.dice)].map(() => die(r, B.foe.sides));
}
export const blowOf = (B) => (B.foe.stopped ? 0 : Math.max(0, B.foe.intent.reduce((a, b) => a + b, 0) - B.guard));

export function battleMoves(B) {
  if (B.over) return [];
  const out = [];
  B.hand.forEach((d, i) => { if (!d.used) for (const id of GEAR_IDS) if (B.gear[id].used < GEAR[id].uses && fits(id, d)) out.push({ id: 'place', die: i, gear: id }); });
  out.push({ id: 'end' });
  return out;
}

export function battleApply(B, m, r) {
  const log = [];
  const hit = (n, gear) => { B.foe.hp = Math.max(0, B.foe.hp - n); log.push({ hit: n, gear, left: B.foe.hp }); if (B.foe.hp <= 0) { B.over = true; B.won = true; B.flawless = B.hurt === 0; log.push({ end: 'won', flawless: B.flawless, rounds: B.round }); } };
  if (m.id === 'place') {
    const d = B.hand[m.die], G = B.gear[m.gear]; if (!d || d.used || !fits(m.gear, d) || G.used >= GEAR[m.gear].uses) return log;
    G.used++;
    const does = GEAR[m.gear].does; // (what a slot does is its row's: no tool is asked for by name)
    if (does === 'again') { const was = d.face; d.face = die(r, d.sides); log.push({ again: d.face, was, sides: d.sides }); return log; }
    d.used = true;
    if (does === 'hit') hit(d.face + (GEAR[m.gear].bonus || 0), m.gear);
    else if (does === 'guard') { B.guard += d.face; log.push({ guard: B.guard }); }
    else if (does === 'split') { const a = Math.ceil(d.face / 2), b = Math.floor(d.face / 2); B.hand.push({ sides: d.sides, face: a, used: false, half: true }, { sides: d.sides, face: b, used: false, half: true }); log.push({ split: [a, b] }); }
    else if (does === 'count') { G.count -= d.face; if (G.count <= 0) { G.count = GEAR[m.gear].count; B.foe.stopped = true; log.push({ stop: true }); } else log.push({ count: G.count }); }
  } else if (m.id === 'end') {
    const n = blowOf(B); B.hp = Math.max(0, B.hp - n); B.hurt += n; log.push({ blow: n, poise: B.hp, stopped: B.foe.stopped, guarded: B.guard });
    if (B.hp <= 0 || B.round >= BATTLE.rounds) { B.over = true; B.won = false; log.push({ end: 'lost', rounds: B.round }); } else round(B, r);
  }
  return log;
}

/** A plain way to play a round well, for the bots (and a hint a view may show): kill if the hand can; else the heaviest die to the
 *  Cutlass, small ones to the Psygun, an even one to the Lockheart when a blow is coming, a poor die thrown again, a big spare split
 *  for the Psygun, the rest to the countdown. */
export function battleBest(B) {
  const M = battleMoves(B), can = (does, bonus) => M.filter((m) => m.gear && GEAR[m.gear].does === does && (bonus == null || !!GEAR[m.gear].bonus === bonus)), face = (m) => B.hand[m.die].face, top = (list) => list.reduce((a, m) => (!a || face(m) > face(a) ? m : a), null), low = (list) => list.reduce((a, m) => (!a || face(m) < face(a) ? m : a), null);
  const incoming = blowOf(B), small = GEAR_IDS.find((id) => GEAR[id].bonus);
  const again = low(can('again')); if (again && face(again) <= B.hand[again.die].sides * 0.3) return again;
  const cut = top(can('hit', false)); if (cut) return cut;
  const shot = top(can('hit', true)); if (shot) return shot;
  const split = top(can('split')); if (split && face(split) >= 3 && face(split) <= 8 && small && B.gear[small].used < GEAR[small].uses) return split;
  const guard = top(can('guard')); if (guard && incoming > 0) return guard;
  const bell = top(can('count')); if (bell && incoming > 0) return bell;
  return M.find((m) => m.id === 'end');
}
