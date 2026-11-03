// ---------------------------------------------------------------------------------------
// TRACKING, THE OPEN SEA'S FOLDS: the rules that hear a song for the wind (progress/opensea/windsong.js) and a beast in tow
// (progress/opensea/capture.js), both run by world/opensea/seafolds.js, and keep their counts for the forge, the achievements and the tall
// tales (progress/opensea/tales.js). The words are placeholders for Espada's. tracking/rules.js calls it.
//
//   seaFoldsRules({ on, L, log })   events: sea.windsong, sea.windsong.refuse, sea.sail.fair, seabeast.towing, seabeast.tow.refuse,
//   seabeast.lost, seabeast.tow.arrive, seabeast.deliver.refuse, seabeast.captured
// ---------------------------------------------------------------------------------------
const BEAST = { seaSerpent: 'the sea serpent', wolfWhale: 'the akhlut', seaMonk: 'the umibozu' };
const beast = (id) => BEAST[id] || 'the beast';
const cap = (s) => `${s[0].toUpperCase()}${s.slice(1)}`;
const WHY_SONG = { closed: 'You do not know how to ask the wind yet. Chart more of the sea, or sail with the wind behind you.', rest: 'The wind has only just been asked. Wait a game hour or two.', pool: 'Not enough in the pool to ask the wind.', helm: 'The wind is asked at the helm.', song: 'No such song.' };
const WHY_TOW = { kind: 'That one cannot be taken alive.', tether: 'It has to be tethered by the harpoon first.', hp: 'It is not worn down enough to tow. Under a third of its health.', stun: 'It has to be stunned first, down to the second depth.' };
const WHY_LOST = { hull: 'Your hull was hit. The tether parts', rope: 'The tether is spent. It parts', left: 'You left the water. The tether parts' };

export function seaFoldsRules({ on, L, log }) {
  on('sea.windsong', (e) => { if (e.by !== 'courier') return; L.inc('sea.windsong'); L.inc(`sea.windsong.${e.song}`); log.say('info', `You play the wind a song. It will blow ${e.song} for a game hour. The pool pays ${e.cost}.`, { key: 'sea.windsong', throttle: 2 }); });
  on('sea.windsong.refuse', (e) => { if (e.by === 'courier') log.say('warn', WHY_SONG[e.why] || 'The wind will not listen.', { key: 'sea.windsong.no', throttle: 4 }); });
  on('sea.sail.fair', (e) => { if (e.by === 'courier') L.inc('sea.sail.fair'); });
  on('seabeast.towing', (e) => { if (e.by !== 'courier') return; L.inc('seabeast.towing'); log.say('battle', `${cap(beast(e.id))} is in tow. You are slower. Get it to a quay and keep your hull whole.`, { key: 'sb.tow', throttle: 2 }); });
  on('seabeast.tow.refuse', (e) => { if (e.by === 'courier') log.say('info', WHY_TOW[e.why] || 'It cannot be towed.', { key: 'sb.tow.no', throttle: 4 }); });
  on('seabeast.lost', (e) => { if (e.by !== 'courier') return; L.inc('seabeast.lost'); log.say('warn', `${WHY_LOST[e.why] || 'The tether parts'}. ${cap(beast(e.id))} slips away.`, { key: 'sb.lost', throttle: 2 }); });
  on('seabeast.tow.arrive', (e) => { if (e.by === 'courier') log.say('info', `At the quay with ${beast(e.id)} in tow. /deliver live for the fee, /deliver statue for a statue in the Spirit Garden.`, { key: 'sb.arrive', throttle: 4 }); });
  on('seabeast.deliver.refuse', (e) => { if (e.by === 'courier') log.say('warn', e.why === 'owned' ? 'You already have that statue. Deliver it live instead.' : e.why === 'quay' ? 'Beasts are handed over at a quay.' : 'No beast in tow.', { key: 'sb.deliver.no', throttle: 3 }); });
  on('seabeast.captured', (e) => {
    if (e.by !== 'courier') return; L.inc('seabeast.captured'); L.inc(`seabeast.captured.${e.id}`);
    log.say('gain', e.how === 'statue' ? `Taken alive: ${beast(e.id)} is a statue in your Spirit Garden's shed.` : `Taken alive: ${beast(e.id)}. Paid ${e.cubes} cubes.`, { key: 'sb.captured', throttle: 1 });
  });
}
