// ---------------------------------------------------------------------------------------
// TRACKING, THE PARTY: what the log says when a sibling is called or dismissed, what you tell them (coop/party.js), what a division's
// session has its sibling say (coop/channel.js), and a guest's coming and going (coop/guests.js). Nothing is counted yet: what a
// sibling earns or costs is Dovina's to rule (docs/plans/COOP.md). Words are placeholders for Espada's.
//
//   partyRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const NAMES = { petra: 'Petra', dovina: 'Dovina', wanda: 'Wanda', calissa: 'Calissa', espada: 'Espada' };
const nameOf = (id) => NAMES[id] || id;

const ORDER_LINE = { follow: 'follow you', hold: 'hold where they stand', go: 'go on ahead', fight: 'make for the fight', back: 'come back to you', scout: 'scout ahead', guard: 'keep close and guard you', free: 'go as they please' };

export function partyRules({ on, log }) {
  on('party.meet', (e) => log.say('gain', `You meet ${nameOf(e.sibling)}.`));
  on('party.call', (e) => log.say('info', `${nameOf(e.sibling)} joins you.`, { key: 'party.call', win: 1, fmt: (n) => `${n} siblings join you.` }));
  on('party.dismiss', (e) => log.say('info', `${nameOf(e.sibling)} goes home.`, { key: 'party.dismiss', win: 1, fmt: (n) => `${n} siblings go home.` }));
  on('party.refuse', (e) => log.say('warn', e.why === 'unmet' ? `You have not met ${nameOf(e.sibling)} yet.` : 'Your party is full: two siblings at once.', { key: 'party.refuse', throttle: 1 }));
  on('party.order', (e) => log.say('info', e.sibling ? `${nameOf(e.sibling)} will ${ORDER_LINE[e.order] || e.order}.` : `Your siblings ${ORDER_LINE[e.order] || e.order}.`, { key: `party.order.${e.sibling || 'all'}`, throttle: 0.5 }));
  on('party.say', (e) => log.say('info', `${nameOf(e.sibling)}${e.near ? '' : ' (from afar)'}: ${e.line}`)); // (a division's own words, through the store: coop/channel.js)
  on('guest.join', (e) => log.say('info', `${e.guest} is here with you.`)); // (a guest over the room: coop/guests.js)
  on('guest.leave', (e) => log.say('info', `${e.guest} has gone.`));
  on('party.list', (e) => log.say('system', e.siblings.length ? `With you: ${e.siblings.map(nameOf).join(', ')}.` : e.met?.length ? `No one is with you. Call ${e.met.map(nameOf).join(', ')} at a Shrine (or /sib <name> call).` : 'No one is with you yet: your siblings wait where their crafts live.'));
}
