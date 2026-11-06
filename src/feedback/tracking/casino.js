// ---------------------------------------------------------------------------------------
// TRACKING, RAKU'S BAZAAR (docs/plans/CASINO.md): the casino's moments said in the log (the only text feedback) and kept on the ledger:
// the chips bought and cashed, a seat taken, a table's big moments (a Major Arcana flipped, a steal, a Fate Clause, a four, Death, a lock,
// an upgrade, a d20 fused, a Supernova, a bluff called, a reveal, Entropy Tactics' tile turned by 21, fatigue and reshuffle), and each game's end with what it won or cost. The words are placeholders for Espada's.
//
//   bazaar.enter   casino.chips { buy | cash, n }   casino.sit { game, practice }   casino.howto { game, skipped }   casino.play { game, what, who,
//   ... }   casino.result { game, won, net, forfeit, practice }   (each with `by`; practice counts nothing but itself)
//
//   casinoRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const NAMES = { querent: 'Querent', zodiac: 'Zodiac', eventhorizon: 'Event Horizon', supernova: 'Supernova Run', nebula: 'Nebula Bluff', charity: 'Charity Gamble', entropy: 'Entropy Tactics' };

export function casinoRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('bazaar.enter', () => { L.inc('bazaar.visit'); say('info', "Raku's Bazaar. Buy Raku chips at the cage. Press F at a table to sit.", 'bazaar', 20); });
  on('casino.chips', (e) => { if (e.buy) { L.inc('casino.chips.bought', e.n); say('info', `Bought: ${e.n} chips. Balance: ${e.balance}.`, 'chips'); } else { L.inc('casino.chips.cashed', e.n); if (e.win > 0) L.inc('casino.chips.won', e.win); say('record', `Cashed: ${e.n} chips${e.held ? `. ${e.held} stay as chips (this game day's winnings cap is reached)` : ''}.`, 'chips'); } });
  on('casino.sit', (e) => {
    if (e.practice) { L.inc(`casino.${e.game}.practised`); say('info', `Seated at ${NAMES[e.game]} for practice. No chips at stake.`, 'sit'); return; }
    L.inc('casino.sit'); L.inc(`casino.${e.game}.played`); say('info', `Seated at ${NAMES[e.game]}. Stake: ${e.stake} chips.`, 'sit');
  });
  on('entropy.class', (e) => say('info', `At Entropy Tactics you sit as ${e.label}. ${e.passive} ${e.does}`, 'arcana')); // (world/entropy/entropyroom.js /arcana)
  on('casino.howto', (e) => { L.inc(`casino.${e.game}.howto`); }); // (seen once, finished or skipped: the how-to no longer opens by itself; progress/casino/howto.js)
  on('casino.play', (e) => {
    const w = e.who === 'you' ? 'You' : e.who;
    if (e.what === 'flip') say('info', `${w} ${e.who === 'you' ? 'flipped' : 'flipped'} ${e.arcana}.`, `flip.${e.who}`, 0.3);
    else if (e.what === 'steal') say('info', `${w} ${e.who === 'you' ? 'stole' : 'stole'} from ${e.from === 'you' ? 'you' : e.from}.`, 'steal', 0.3);
    else if (e.what === 'fate') say('warn', `${w} ${e.who === 'you' ? 'declared' : 'declared'} the Fate Clause. One card from winning, by ${e.how}.`, 'fate', 0.3);
    else if (e.what === 'four') say('info', `${w} ${e.who === 'you' ? 'set' : 'set'} aside four of a kind${e.blessing ? ": Heaven's blessing" : ''}.`, 'four', 0.3);
    else if (e.what === 'death') say('warn', 'Death: the round begins again.', 'death', 0.3);
    else if (e.what === 'hand') { if (e.who === 'you') { L.inc('casino.querent.hands'); L.hi('casino.querent.best', e.value); } say('record', `${w} ${e.who === 'you' ? 'won' : 'won'} the round for ${e.value}: ${(e.notes || []).join(', ')}.`, 'hand', 0.3); }
    else if (e.what === 'lock') say('info', `${w} ${e.who === 'you' ? 'locked' : 'locked'} tile ${e.tile} (${e.ability}).`, 'lock', 0.3);
    else if (e.what === 'upgrade') say('info', `${w} ${e.who === 'you' ? 'raised' : 'raised'} the attack die to a d${e.sides}.`, 'upgrade', 0.3);
    else if (e.what === 'fuse20') say('info', `${w} ${e.who === 'you' ? 'fused' : 'fused'} a d20.`, 'fuse20', 0.3);
    else if (e.what === 'nova') { if (e.who === 'you') L.inc('casino.supernova.novas'); say('record', `Supernova! ${w} ${e.who === 'you' ? 'doubled your' : 'doubled their'} points to ${e.points}. Every hand resets to 4 d6.`, 'nova', 0.3); }
    else if (e.what === 'callout') { if (e.who === 'you' && e.bluff) L.inc('casino.nebula.caught'); say(e.bluff ? 'record' : 'warn', `${w} ${e.who === 'you' ? 'called' : 'called'} ${e.on === 'you' ? 'your' : `${e.on}'s`} claim of ${e.claim}: ${e.bluff ? `a bluff (${e.worth})` : `it was true (${e.worth})`}.`, 'callout', 0.3); }
    else if (e.what === 'deposits') say('info', `The jar held ${e.total} against a line of ${e.line}: ${e.winners.length ? `${e.winners.join(', ')} bet right${e.share ? `, ${e.share} chips each` : ''}.` : 'no one was right; it carries over.'}`, 'deposits', 0.3);
    else if (e.what === 'liar') say('info', `${w} ${e.who === 'you' ? 'said' : 'said'} ${e.said} and had dropped ${e.dropped}.`, 'liar', 0.3);
    else if (e.what === 'summon') say('info', `${w} ${e.who === 'you' ? 'summoned' : 'summoned'} a ${e.kind}.`, 'summon', 0.3);
    else if (e.what === 'tile') say('info', `${w} made 21 at column ${e.at[0] + 1}, row ${e.at[1] + 1}: the tile turns ${e.who === 'you' ? 'yours' : 'theirs'}.`, 'tile', 0.3);
    else if (e.what === 'tokenhit') say('info', `${w} ${e.who === 'you' ? 'hit' : 'hits'} ${e.who === 'you' ? 'their' : 'your'} token for ${e.dmg}${e.mult === 2 ? ' (double: the opposite suit)' : ''}${e.down ? ': it falls.' : `: ${e.left} health left.`}`, 'tokenhit', 0.3);
    else if (e.what === 'fatigue') say('warn', `${w} ${e.who === 'you' ? 'take' : 'takes'} fatigue: ${e.n} health.`, 'fatigue', 0.3);
    else if (e.what === 'reshuffle') say('info', `${w} ${e.who === 'you' ? 'reshuffle' : 'reshuffles'} the discard pile into the deck for ${e.n} health.`, 'reshuffle', 0.3);
    else if (e.what === 'push') say('info', `${w} ${e.who === 'you' ? 'pushed' : 'pushed'} the bomb: ${e.tiles ? `${e.tiles} tile${e.tiles === 1 ? '' : 's'}` : 'it held'} (${e.atk} against ${e.def}).`, 'push', 0.3);
    else if (e.what === 'countdown') say('info', `${w} ${e.who === 'you' ? 'counted' : 'counted'} the bomb down to ${e.counter}.`, 'countdown', 0.3);
    else if (e.what === 'boom') say('warn', `The Grand Bomb goes off${e.zone === 'you' ? ' on your tile' : e.zone ? ` on ${e.zone}'s tile` : ' on nobody\'s tile'}.`, 'boom', 0.3);
    else if (e.what === 'reveal') say('info', `Raises over. Hands shown: ${e.shown.join(', ')}.`, 'reveal', 0.3);
  });
  on('casino.result', (e) => {
    if (e.practice) { L.inc('casino.practised'); say('info', `Practice at ${NAMES[e.game]}: ${e.won ? 'won' : 'lost'}. Nothing was at stake.`, 'result'); return; } // (practice games finished: Raku's Whisper opens at three, progress/knacks.js)
    if (e.won) { L.inc('casino.won'); L.inc(`casino.${e.game}.won`); }
    if (e.net > 0) L.inc('casino.net.won', e.net); else L.inc('casino.net.lost', -e.net);
    say(e.won ? 'record' : 'info', e.forfeit ? `Left ${NAMES[e.game]}. The stake is forfeit.` : `${NAMES[e.game]}: ${e.won ? 'won' : 'lost'}, ${e.net >= 0 ? `+${e.net}` : e.net} chips.`, 'result');
  });
}
