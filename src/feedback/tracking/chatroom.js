// ---------------------------------------------------------------------------------------
// TRACKING, THE CHATROOM: the rules that hear the chatroom (coop/chatroom.js, COOP.md C7 and C8) and say it in the log: a line as
// "<Name> : <text>" in the writer's colour (a division's: ui/siblingline.js), a writer dropped for speed once, a line not sent. Nothing
// in the chatroom is counted (C7). tracking/rules.js calls it. Words placeholders for Espada's.
//
//   chatroomRules({ on, log })
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from '../../coop/party.js';

const nameOf = (id) => SIBLINGS.find((s) => s.id === id)?.name || null;
const UNSENT = {
  away: 'The chatroom is in the published game only.', who: 'The chatroom cannot tell who you are: open the published game signed in.',
  soon: 'Give the chatroom a moment between lines.', empty: 'Say something: /say <words>.', failed: 'Your line did not reach the chatroom.',
};

export function chatroomRules({ on, log }) {
  on('chat.line', (e) => {
    const who = e.from === 'owner' ? (e.mine ? 'You' : 'The host') : nameOf(e.from) || 'A guest';
    const to = e.to && e.to !== 'all' ? ` (to ${e.to === 'owner' ? (e.mine ? 'the host' : 'you') : nameOf(e.to) || e.to})` : '';
    log.say('say', `${who}${to} : ${e.text}`, { who: nameOf(e.from) ? e.from : null });
  });
  on('chat.dropped', (e) => log.say('warn', `${nameOf(e.from) || (e.from === 'owner' ? 'The host' : 'A guest')} writes faster than the chatroom allows: some lines were left unsaid.`, { key: `chat.drop.${e.from}`, throttle: 60 }));
  on('chat.unsent', (e) => log.say('warn', UNSENT[e.why] || UNSENT.failed, { key: 'chat.unsent', throttle: 2 }));
}
