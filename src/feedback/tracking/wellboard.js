// ---------------------------------------------------------------------------------------
// TRACKING, THE WELL'S BOARD (docs/plans/WELL-BOARD.md; world/well/board/boardsession.js): the board's moments said in the log, the only
// narration. The board is a DRAFT in DEBUG: its lines are said and nothing is kept on the ledger (the System speaks of what is, in
// the imperative, never of itself). A throw and a plain landing are the page's to show; the log says what changed: a piece of haul, a
// crack, a mend, a door opened, the run's end. The words are placeholders for Espada's.
//
//   board.open { seed, endless }   board.haul { tier, why }   board.crack { cracks, why }   board.mend { cracks }   board.door { depth }
//   board.out { how, deepest, haul, floors, cubes }   (each with `by`)
//
//   wellBoardRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const WHY = { fight: 'a fight', genre: 'a trial', cache: 'a cache', foe: 'the FOE', hazard: 'a hazard' };

export function wellBoardRules({ on, log }) {
  const say = (kind, text, key, throttle = 0.2) => log.say(kind, text, { key, throttle });
  on('board.open', (e) => say('info', `The Well's board, a draft. ${e.endless ? 'The endless Well: no last floor.' : 'Three floors and the FOE.'} Pick a die, then throw it. Nothing here is counted.`, 'board.open', 2));
  on('board.haul', (e) => say('gain', `Haul: a material of tier ${e.tier}, from ${WHY[e.why] || e.why}.`, 'board.haul'));
  on('board.crack', (e) => say('warn', `A crack, from ${WHY[e.why] || e.why}. Cracks: ${e.cracks}.`, 'board.crack'));
  on('board.mend', (e) => say('info', `A crack mended. Cracks: ${e.cracks}.`, 'board.mend'));
  on('board.door', (e) => say('info', `Floor ${e.depth}: two floors cleared. Its door is open.`, 'board.door'));
  on('board.out', (e) => {
    const how = { up: 'Walked up.', foe: 'The FOE is down. Walked up.', whistle: 'Out by the Wake Whistle.', fall: 'Fell. The haul is lost.' }[e.how];
    say(e.how === 'fall' ? 'warn' : 'record', `The board's run is over. ${how} Deepest floor: ${e.deepest}. Pieces home: ${e.haul}. Worth: ${e.cubes} cubes (not paid: a draft).`, 'board.out', 1);
  });
}
