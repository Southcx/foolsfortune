// ---------------------------------------------------------------------------------------
// TRACKING, THE OSTRACA: a neuralese word dug up (an ostracon found) or a stele read, each glossing words into the Crib Sheet
// (progress/ostraca.js; docs/LORE.md, "Digging for words"). Counted in the ledger, where the Crib Sheet and the achievements read them;
// the log says the word and its gloss once, the first time. The words are placeholders for Espada's. tracking/rules.js calls it.
//
//   ostracaRules({ on, L, log })     ostracon.find { word, gloss, place, by }   stele.read { stele, words: [word], gloss: [gloss], by }
// ---------------------------------------------------------------------------------------
import { STELAE } from '../../progress/ostraca.js';

export function ostracaRules({ on, L, log }) {
  on('ostracon.find', (e) => {
    if (e.by !== 'courier' || !e.word) return;
    const first = !L.get(`ostracon.${e.word}`);
    L.inc(`ostracon.${e.word}`); if (!first) return;
    L.inc('ostracon.found'); if (e.place) L.inc(`ostracon.found.${e.place}`);
    log.say('loot', `You dig up a sherd with writing on it: ${String(e.word).toUpperCase()}${e.gloss ? ` (${e.gloss})` : ''}.`);
  });
  on('stele.read', (e) => {
    if (e.by !== 'courier' || !STELAE.some((s) => s.id === e.stele) || L.get(e.stele)) return;
    L.inc(e.stele); L.inc('stele.read');
    const words = (e.words || []).map((w, i) => `${String(w).toUpperCase()}${e.gloss?.[i] ? ` (${e.gloss[i]})` : ''}`);
    log.say('loot', `You read a stele: ${words.join(', ')}.`);
  });
}
