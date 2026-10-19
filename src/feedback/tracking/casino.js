// ---------------------------------------------------------------------------------------
// TRACKING, RAKU'S BAZAAR (docs/plans/CASINO.md): the casino's moments said in the log (the only text feedback) and kept on the ledger:
// the chips bought and cashed, a seat taken, a table's big moments (a Major Arcana flipped, a steal, a Fate Clause, a four, Death, a lock,
// an upgrade, a d20 fused, a Supernova, a bluff called, a reveal), and each game's end with what it won or cost. The words are placeholders for Espada's.
//
//   bazaar.enter   casino.chips { buy | cash, n }   casino.sit { game, practice }   casino.howto { game, skipped }   casino.play { game, what, who,
//   ... }   casino.result { game, won, net, forfeit, practice }   (each with `by`; practice counts nothing but itself)
//
//   casinoRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const NAMES = { querent: 'Querent', zodiac: 'Zodiac', eventhorizon: 'Event Horizon', supernova: 'Supernova Run', nebula: 'Nebula Bluff' };

export function casinoRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('bazaar.enter', () => { L.inc('bazaar.visit'); say('info', "Raku's Bazaar. Raku chips at the cage; F at a table to sit.", 'bazaar', 20); });
  on('casino.chips', (e) => { if (e.buy) { L.inc('casino.chips.bought', e.n); say('info', `You buy ${e.n} chips. You hold ${e.balance}.`, 'chips'); } else { L.inc('casino.chips.cashed', e.n); if (e.win > 0) L.inc('casino.chips.won', e.win); say('record', `You cash ${e.n} chips${e.held ? `; ${e.held} stay chips (today's winnings are cashed)` : ''}.`, 'chips'); } });
  on('casino.sit', (e) => {
    if (e.practice) { L.inc(`casino.${e.game}.practised`); say('info', `You sit down at ${NAMES[e.game]} to practise: no chips at stake.`, 'sit'); return; }
    L.inc('casino.sit'); L.inc(`casino.${e.game}.played`); say('info', `You sit down at ${NAMES[e.game]} for ${e.stake} chips.`, 'sit');
  });
  on('casino.howto', (e) => { L.inc(`casino.${e.game}.howto`); }); // (seen once, finished or skipped: the how-to no longer opens by itself; progress/casino/howto.js)
  on('casino.play', (e) => {
    const w = e.who === 'you' ? 'You' : e.who;
    if (e.what === 'flip') say('info', `${w} ${e.who === 'you' ? 'flip' : 'flips'} ${e.arcana}.`, `flip.${e.who}`, 0.3);
    else if (e.what === 'steal') say('info', `${w} ${e.who === 'you' ? 'steal' : 'steals'} from ${e.from === 'you' ? 'you' : e.from}.`, 'steal', 0.3);
    else if (e.what === 'fate') say('warn', `${w} ${e.who === 'you' ? 'declare' : 'declares'} the Fate Clause: one card from winning, by ${e.how}.`, 'fate', 0.3);
    else if (e.what === 'four') say('info', `${w} ${e.who === 'you' ? 'set' : 'sets'} aside four of a kind${e.blessing ? ": Heaven's blessing" : ''}.`, 'four', 0.3);
    else if (e.what === 'death') say('warn', 'Death: the round begins again.', 'death', 0.3);
    else if (e.what === 'hand') { if (e.who === 'you') { L.inc('casino.querent.hands'); L.hi('casino.querent.best', e.value); } say('record', `${w} ${e.who === 'you' ? 'win' : 'wins'} the round for ${e.value}: ${(e.notes || []).join(', ')}.`, 'hand', 0.3); }
    else if (e.what === 'lock') say('info', `${w} ${e.who === 'you' ? 'lock' : 'locks'} tile ${e.tile} (${e.ability}).`, 'lock', 0.3);
    else if (e.what === 'upgrade') say('info', `${w} ${e.who === 'you' ? 'raise' : 'raises'} the attack die to a d${e.sides}.`, 'upgrade', 0.3);
    else if (e.what === 'fuse20') say('info', `${w} ${e.who === 'you' ? 'fuse' : 'fuses'} a d20.`, 'fuse20', 0.3);
    else if (e.what === 'nova') { if (e.who === 'you') L.inc('casino.supernova.novas'); say('record', `Supernova! ${w} ${e.who === 'you' ? 'double your' : 'doubles their'} points to ${e.points}; every hand goes back to four d6.`, 'nova', 0.3); }
    else if (e.what === 'callout') { if (e.who === 'you' && e.bluff) L.inc('casino.nebula.caught'); say(e.bluff ? 'record' : 'warn', `${w} ${e.who === 'you' ? 'call' : 'calls'} ${e.on === 'you' ? 'your' : `${e.on}'s`} claim of ${e.claim}: ${e.bluff ? `a bluff (${e.worth})` : `it holds (${e.worth})`}.`, 'callout', 0.3); }
    else if (e.what === 'reveal') say('info', `The raises run out; every hand is shown: ${e.shown.join(', ')}.`, 'reveal', 0.3);
  });
  on('casino.result', (e) => {
    if (e.practice) { L.inc('casino.practised'); say('info', `Practice at ${NAMES[e.game]}: ${e.won ? 'you win' : 'you lose'}. Nothing was at stake.`, 'result'); return; } // (practice games finished: Raku's Whisper opens at three, progress/knacks.js)
    if (e.won) { L.inc('casino.won'); L.inc(`casino.${e.game}.won`); }
    if (e.net > 0) L.inc('casino.net.won', e.net); else L.inc('casino.net.lost', -e.net);
    say(e.won ? 'record' : 'info', e.forfeit ? `You rise from ${NAMES[e.game]}; the stake stays on the table.` : `${NAMES[e.game]}: ${e.won ? 'you win' : 'you lose'}, ${e.net >= 0 ? `+${e.net}` : e.net} chips.`, 'result');
  });
}
