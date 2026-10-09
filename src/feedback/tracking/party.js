// ---------------------------------------------------------------------------------------
// TRACKING, THE PARTY: what the log says when a sibling is called or dismissed, what you tell them (coop/party.js), what a division's
// session has its sibling say (coop/channel.js), a sibling's answer (coop/answer.js), a letter (coop/letters.js), and a guest's coming,
// going and words (coop/guests.js). Nothing is counted yet: what a
// sibling earns or costs is Dovina's to rule (docs/plans/COOP.md). Words: Espada's (speech as `Name : words`, the log's habit).
//
//   partyRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const NAMES = { petra: 'Petra', dovina: 'Dovina', wanda: 'Wanda', calissa: 'Calissa', espada: 'Espada' };
const nameOf = (id) => NAMES[id] || id;

const ORDER_LINE = { warp: 'step through to your side', follow: 'follow you', hold: 'hold where they stand', go: 'go on ahead', fight: 'make for the fight', back: 'come back to you', scout: 'scout ahead', guard: 'keep close and guard you', free: 'go as they please' };

export function partyRules({ on, log }) {
  on('party.meet', (e) => log.say('gain', `You meet ${nameOf(e.sibling)}.`));
  on('party.call', (e) => log.say('info', `${nameOf(e.sibling)} joins your party.`, { key: 'party.call', win: 1, fmt: (n) => `${n} siblings join your party.` }));
  on('party.dismiss', (e) => log.say('info', `${nameOf(e.sibling)} leaves your party.`, { key: 'party.dismiss', win: 1, fmt: (n) => `${n} siblings leave your party.` }));
  on('party.refuse', (e) => log.say('warn', e.why === 'unmet' ? `You have not met ${nameOf(e.sibling)} yet.` : e.why === 'far' ? `${e.sibling ? nameOf(e.sibling) : 'Your siblings'} cannot walk to ${e.place} from here: travel there, and they come with you.` : 'Your party is full: two siblings at once.', { key: 'party.refuse', throttle: 1 }));
  on('sibling.stuck', (e) => log.say('info', e.fix === 'warp' ? `${nameOf(e.sibling)} was stuck, and steps through to where you sent them.` : `${nameOf(e.sibling)} cannot get there, and comes back to you.`, { key: `sib.stuck.${e.sibling}`, throttle: 4 })); // (coop/follow.js: every goal has a give-up)
  on('party.order', (e) => log.say('info', e.sibling ? `${nameOf(e.sibling)} will ${ORDER_LINE[e.order] || e.order}.` : `Your siblings ${ORDER_LINE[e.order] || e.order}.`, { key: `party.order.${e.sibling || 'all'}`, throttle: 0.5 }));
  // the siblings in a fight (coop/fight.js): what they do for you is said; nothing of it is counted as yours, but a foe you struck that
  // one of them finishes is yours (creature.credit: Dovina's ledger counts it)
  const FOE = (k) => (k === 'slipjelly' ? 'the slip jelly' : k === 'clapperjar' ? 'the clapperjar' : 'it');
  on('sibling.hit', (e) => { if (e.by !== 'courier') return; if (e.down) log.say('warn', `${nameOf(e.sibling)} shatters, and is made whole at your side.`, { key: `sib.down.${e.sibling}`, throttle: 2 }); else log.say('battle', `You strike ${nameOf(e.sibling)}.`, { key: `sib.hit.${e.sibling}`, throttle: 3 }); }); // (friendly fire, coop/sibling.js; words a stand-in, Espada's)
  on('sibling.parry', (e) => log.say('battle', `${nameOf(e.sibling)} parries ${FOE(e.kind)}'s blow.`, { key: 'sib.parry', throttle: 3 }));
  on('sibling.flash', (e) => log.say('battle', `${nameOf(e.sibling)} flashes ${FOE(e.kind)}.`, { key: 'sib.flash', throttle: 4 }));
  on('creature.credit', (e) => log.say('battle', `${nameOf(e.who)} finishes what you struck.`, { key: 'sib.credit', throttle: 2 }));
  on('party.say', (e) => log.say('say', `${nameOf(e.sibling)}${e.re === 'letter' ? ' (by letter)' : e.near ? '' : ' (from afar)'} : ${e.line}`)); // (an answer: coop/answer.js, seconds; a division's own words: coop/channel.js, a letter's answer among them)
  const UNHEARD = { away: () => 'No one can answer you here: asking your siblings needs the published game.', alone: () => 'No one is with you to hear that.', busy: () => 'Let them answer first.', declined: () => 'Your siblings cannot answer: Claude is not allowed on this page.', failed: (n) => `${n} did not catch that. Ask again.`, unmet: (n) => `You have not met ${n} yet.`, cap: () => 'You have asked your siblings all this real hour allows (/usage).', timeout: (n) => `${n} took too long to answer, and let it go. Ask again.`, limited: () => 'Claude is busy: ask again in a moment.' };
  on('party.unheard', (e) => log.say('warn', (UNHEARD[e.why] || UNHEARD.failed)(nameOf(e.sibling)), { key: 'party.unheard', throttle: 1 })); // (asking a sibling: coop/answer.js)
  on('party.letter', (e) => log.say('info', `Your letter to ${nameOf(e.sibling)} is on its way. An answer takes a few real minutes.`)); // (coop/letters.js)
  const UNSENT = { owner: () => "Only the game's owner can send letters.", away: () => 'Letters go only from the published game.', soon: (n) => `You wrote to ${n} a moment ago. Give it three real minutes.`, failed: (n) => `Your letter to ${n} could not be sent.`, cap: () => 'You have sent all the letters this real hour allows (/usage).', waiting: (n) => `${n} has not answered your last letter yet.`, same: (n) => `You have just sent ${n} those words.`, unsure: (n) => `Your letter to ${n} may not have gone. Wait for an answer before writing again.`, unknown: () => 'Write to one of them: /letter <petra | dovina | wanda | calissa | espada> <words>.' };
  on('party.unsent', (e) => log.say('warn', (UNSENT[e.why] || UNSENT.failed)(nameOf(e.sibling)), { key: 'party.unsent', throttle: 1 }));
  on('party.letter.late', (e) => log.say('info', `${nameOf(e.sibling)} has not answered your letter in a real quarter hour. You may write again.`));
  on('usage.report', (e) => log.say('system', `This real hour: ${e.asks} of ${e.asksCap || 'no'} asks, ${e.letters} of ${e.lettersCap || 'no'} letters.${e.waiting.length ? ` Waiting on ${e.waiting.map(nameOf).join(', ')}.` : ''}`));
  on('usage.cap', (e) => log.say('system', e.cap ? `You may now ${e.kind === 'asks' ? 'ask your siblings' : 'send letters'} ${e.cap} times a real hour.` : e.kind === 'asks' ? 'Asking your siblings is off.' : 'Letters are off.'));
  on('guest.say', (e) => log.say('say', e.sibling ? `${nameOf(e.sibling)} (to ${e.guest}) : ${e.line}` : `${e.guest} : ${e.line}`)); // (over the room: coop/guests.js)
  on('guest.join', (e) => log.say('info', `${e.guest} is here with you.`)); // (a guest over the room: coop/guests.js)
  on('guest.leave', (e) => log.say('info', `${e.guest} has gone.`));
  on('party.list', (e) => log.say('system', e.siblings.length ? `With you: ${e.siblings.map(nameOf).join(', ')}.` : e.met?.length ? `No one is with you. Call ${e.met.map(nameOf).join(', ')} at a Shrine (or /sib <name> call).` : 'No one is with you yet: your siblings wait where their crafts live.'));
}
