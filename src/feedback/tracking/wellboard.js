// ---------------------------------------------------------------------------------------
// TRACKING, THE WELL'S BOARD (docs/plans/WELL-BOARD.md; world/well/board/boardsession.js): the board's moments said in the log, the only
// narration. The board is a DRAFT in DEBUG: its lines are said and nothing is kept on the ledger (the System speaks of what is, in
// the imperative, never of itself). A throw and a plain landing are the board's to show; the log says what changed: a piece of haul,
// a crack, a mend, an item, a power, a card, a battle, a duel, a door opened, the run's end. The words are placeholders for Espada's.
//
//   board.open { seed, endless, rivals }   board.haul { tier, why }   board.crack { cracks, why }   board.mend { cracks }
//   board.warded { why }   board.item { item, how }   board.power { power, sides }   board.arcana { card }
//   board.battle { foe, won, flawless, rounds }   board.duel { rival, won }   board.door { depth }
//   board.out { how, deepest, haul, floors, cubes, place, seats }   (each with `by`)
//
//   wellBoardRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { ITEMS, ARCANA, POWERS } from '../../progress/wellboard/items.js';

const WHY = { fight: 'a fight', genre: 'a trial', cache: 'a cache', foe: 'the FOE', hazard: 'a hazard', stray: 'a stray', arcana: 'a card', snare: 'a snare', duel: 'a duel' };
const FOE = { fight: 'The fight', stray: 'The stray', foe: 'The FOE' }, ORD = ['', 'First', 'Second', 'Third', 'Fourth'];

export function wellBoardRules({ on, log }) {
  const say = (kind, text, key, throttle = 0.2) => log.say(kind, text, { key, throttle });
  on('board.open', (e) => say('info', `The Well's board, a draft. ${e.endless ? 'The endless Well: no last floor.' : 'Three floors and the FOE.'}${e.rivals ? ` Rivals: ${e.rivals}.` : ''} A die is a move, a power's price, or a blow in a battle. Nothing here is counted.`, 'board.open', 2));
  on('board.haul', (e) => say('gain', `Haul: a material of tier ${e.tier}, from ${WHY[e.why] || e.why}.`, 'board.haul'));
  on('board.crack', (e) => say('warn', `A crack, from ${WHY[e.why] || e.why}. Cracks: ${e.cracks}.`, 'board.crack'));
  on('board.mend', (e) => say('info', `A crack mended. Cracks: ${e.cracks}.`, 'board.mend'));
  on('board.warded', (e) => say('info', `Your ward turned ${WHY[e.why] || e.why} aside.`, 'board.warded'));
  on('board.item', (e) => say(e.how === 'used' ? 'info' : 'gain', `${ITEMS[e.item].label}, ${e.how}. ${ITEMS[e.item].line}`, `board.item.${e.how}`));
  on('board.power', (e) => say('info', `${POWERS[e.power].label}: the d${e.sides} is spent.`, 'board.power'));
  on('board.arcana', (e) => { const c = ARCANA.find((x) => x.id === e.card); say(c.tone === 'bad' ? 'warn' : 'info', `${c.numeral}, ${c.label}. ${c.line}`, 'board.arcana'); });
  on('board.battle', (e) => say(e.won ? 'gain' : 'warn', e.won ? `${FOE[e.foe] || 'The battle'} is won in ${e.rounds} round${e.rounds === 1 ? '' : 's'}${e.flawless ? ', flawless' : ''}.` : `${FOE[e.foe] || 'The battle'} is lost.`, 'board.battle'));
  on('board.duel', (e) => say(e.won ? 'gain' : e.won === false ? 'warn' : 'info', e.won == null ? `A duel with ${e.rival}: a draw.` : e.won ? `A duel with ${e.rival}: won.` : `A duel with ${e.rival}: lost.`, 'board.duel'));
  on('board.door', (e) => say('info', `Floor ${e.depth}: two floors cleared. Its door is open.`, 'board.door'));
  on('board.out', (e) => {
    const how = { up: 'Walked up.', foe: 'The FOE is down. Walked up.', over: 'A rival downed the FOE.', whistle: 'Out by the Wake Whistle.', fall: 'Fell. The haul is lost.' }[e.how];
    say(e.how === 'fall' ? 'warn' : 'record', `The board's run is over. ${how}${e.seats > 1 ? ` ${ORD[e.place]} of ${e.seats}.` : ''} Deepest floor: ${e.deepest}. Pieces home: ${e.haul}. Worth: ${e.cubes} cubes (not paid: a draft).`, 'board.out', 1);
  });
}
