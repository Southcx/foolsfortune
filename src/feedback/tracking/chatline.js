// ---------------------------------------------------------------------------------------
// TRACKING, THE CHAT LINE AND THE EMOTES: what is said in the CHAT tab and the emotes played. Moved out of tracking.js whole, the words
// unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   chatLineRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { EMOTES } from '../../courier/emotes.js';

export function chatLineRules({ on, L, log }) {
  // the chat line and the emotes (chat.js, emotes.js): said in the CHAT tab, FFXI's way ("Name : words")
  on('chat.say', (e) => { L.inc('chat.say'); log.say('say', `Courier : ${e.text}`); });
  on('chat.emote', (e) => { L.inc('chat.emote'); log.say('emote', `The Courier ${e.text.replace(/[.!?]?$/, (m) => m || '.')}`); });
  on('emote.start', (e) => { L.inc('emote.total'); L.inc(`emote.${e.emote}`); const E = EMOTES[e.emote]; if (E) log.say('emote', E.line); });
}
