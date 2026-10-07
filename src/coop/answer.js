// ---------------------------------------------------------------------------------------
// A SIBLING ANSWERS (the second of co-op's three speeds; the glossary: asking a sibling). Say "@petra ..." on the chat line (or "@all",
// or a name alone after the @) and the sibling answers in a few seconds, in its division's voice (coop/personas.js), with a line in the
// log and, when your words ask for one, an order it then follows (follow, hold, go <place>, fight, back). The answer is drafted by
// Claude through the published page's `sample` (the viewer's own Claude, the quick tier: a second or two), from the sibling's card, what
// is around you, and the last few things said between you; it remembers nothing else. While it thinks, a "..." mark hangs over the
// sibling (or nothing, when it is not out). The bodies never wait on it: a sibling's mind runs every frame in the page (coop/sibling.js);
// this is its voice and its will, not its feet. The slow speed is the division's own session (coop/letters.js).
// One question at a time, a breath between (`GAP`); never from a timer. Each spends one of the hour's asks (coop/usage.js: the co-op
// meter, `/usage`), given back when it never reached Claude; an answer not back in `TIMEOUT` seconds is let go. Away from the published
// build (the dev server, the headless runs) there is no `sample` and you are told so once.
// Events: party.ask { sibling }, party.say { sibling, line, near, re: 'ask' }, party.order (through party.command), party.unheard
// { sibling, why: 'away' | 'alone' | 'busy' | 'declined' | 'failed' | 'unmet' | 'cap' | 'timeout' | 'limited' }.
//
// Prior art: the companions who answer in character (Mass Effect's squad banter, Dragon's Dogma's pawn chatter), the MMO tell (/t name),
// and the language-model companions of the 2020s (a persona card, the scene and a short memory per call).
//
//   game.answers = new SiblingAnswers(game)   .ask(id, words) -> Promise   .use(sample) (tests hand one in)   .history { id: [turns] }
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';
import { PERSONAS } from './personas.js';
import { wholeOf } from '../render/zones.js';

const GAP = 2.5, KEEP = 6, LINE_MAX = 120, TIMEOUT = 20; // (real seconds between questions; exchanges kept a sibling; characters an answer may say; real seconds an answer may take)
const ANSWER_ORDERS = new Set(['follow', 'hold', 'go', 'fight', 'back', 'warp']);
const UNSPENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'rate_limited', 'invalid_request', 'prompt_too_large', 'capability_disabled', 'capability_removed']); // (refused before Claude: the ask is given back)
const MOODS = new Set(['mirth', 'wonder', 'desire', 'grief', 'dread']);
const clean = (s, n = LINE_MAX) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

export class SiblingAnswers {
  constructor(game) {
    this.game = game; this.sample = null; this.busy = false; this.last = -Infinity; this.history = {}; this.declined = false;
    const use = window.claude?.use;
    if (use) Promise.resolve(use('sample')).then((s) => { this.sample = s; }).catch(() => {});
    game.events.on('chat.say', (e) => this.heard(e.text));
  }

  use(sample) { this.sample = sample; return this; }

  /** A line from the chat: "@name words" (or "@all words") is a question; anything else is not ours. */
  heard(text) {
    const m = /^@(\w+)[\s,:]*(.*)$/s.exec(String(text || '').trim());
    if (!m) return;
    const who = m[1].toLowerCase(), words = m[2].trim() || '...';
    const ids = who === 'all' || who === 'party' ? this.game.party?.list.map((S) => S.id) || [] : [who];
    if (!ids.length) { this.game.events.emit('party.unheard', { sibling: null, why: 'alone', by: 'courier' }); return; }
    if (!SIBLINGS.some((s) => s.id === ids[0])) return; // (not one of the five: an @ for a guest, said aloud as it was)
    this.ask(ids[0], words, ids.slice(1));
  }

  /** What is around you, in a few lines: where, who is out and doing what, what threatens, the hour. */
  scene(id) {
    const g = this.game, P = g.player, S = g.party?.get(id);
    const l = g.cartography?.layerOf?.(P.pos.y), r = g.cartography?.roomAt?.(P.pos.x, P.pos.y, P.pos.z, 40), stuck = S ? Math.max(S.follow.stuck, S.follow.since) : 0;
    const foes = g.creatures?.near?.(P.pos, 18)?.filter((c) => c.alive && !c.ally).map((c) => c.kind) || [];
    const out = (g.party?.list || []).map((x) => `${x.id} (${x.order}${x.fight?.target ? ', fighting' : ''})`);
    return [
      `Where the player is: ${l?.name || 'somewhere'}${r && r.name !== l?.name ? `, ${r.name}` : ''}.`,
      S ? `You are out beside the player, ${S.pos.distanceTo(P.pos).toFixed(0)} m away, told to ${S.order}${S.to ? ` (${S.to.distanceTo(S.pos).toFixed(0)} m from where you were sent)` : ''}.${stuck > 1.5 ? ` You have made no headway for ${stuck.toFixed(0)} s: you are stuck.` : ''}` : 'You are not out with the player; you answer from afar.',
      `The region: ${wholeOf(P.pos) || 'unknown'}.`,
      `Siblings out: ${out.join(', ') || 'none'}.`,
      foes.length ? `Near the player: ${foes.length} foe(s): ${[...new Set(foes)].join(', ')}.` : 'Nothing hostile near.',
      g.weather?.now?.id ? `Weather: ${g.weather.now.id}.` : '',
    ].filter(Boolean).join('\n');
  }

  prompt(id, words) {
    const def = SIBLINGS.find((s) => s.id === id), C = PERSONAS[id], S = this.game.party?.get(id);
    const here = wholeOf(this.game.player.pos), places = (this.game.places?.all?.() || []).filter((p) => wholeOf({ x: p.pos[0], y: p.pos[1], z: p.pos[2] }) === here).slice(0, 40).map((p) => `${p.id}: ${p.name}`).join('; ');
    const said = (this.history[id] || []).map((h) => `${h.who === 'you' ? 'Player' : def.name}: ${h.text}`).join('\n');
    return `You are ${def.name}, ${C.craft}. You are one of five siblings who build the game "Fool's Fortune" with the player, its owner, and you walk inside it as a Courier like theirs.
Your voice: ${C.voice}
Speak to the player as "you" (anyone else speaking of their Courier says "they"). One reply of at most ${LINE_MAX} characters, in your voice: no emoji, no stage directions, no quotation marks around it.

What is around you:
${this.scene(id)}
${said ? `\nSaid between you lately (oldest first):\n${said}\n` : ''}
The player says to you: "${clean(words, 300)}"

Reply with only a JSON object, like {"line": "Measured the floor. It holds.", "order": "none", "target": null, "mood": "wonder"}.
order is what you now do in the game${S ? '' : ' (you are not out, so always "none")'}: "none" (keep on as you are), "follow", "hold" (wait here), "go" (walk to target), "fight" (fight beside them), "back" (come back to them), "warp" (be set down beside them at once: when you are stuck, lost, or asked to teleport). Give an order only when the player asks for one or it plainly fits.
target, with "go": a place id from this list (the places in this region you can walk to), else null. Places (id: name): ${places || 'none known'}. You cannot walk to another region (the Dunes from the workshop, say): the player travels there and you come with them; say so if asked.
mood: one of mirth, wonder, desire, grief, dread.`;
  }

  /** Ask one sibling; `then` are the others an "@all" reaches, asked one after another. */
  async ask(id, words, then = []) {
    const g = this.game, now = performance.now() / 1000;
    if (!g.party?.may(id)) { g.events.emit('party.unheard', { sibling: id, why: 'unmet', by: 'courier' }); return; }
    if (!this.sample) { g.events.emit('party.unheard', { sibling: id, why: this.declined ? 'declined' : 'away', by: 'courier' }); return; }
    if (this.busy || now - this.last < GAP) { g.events.emit('party.unheard', { sibling: id, why: 'busy', by: 'courier' }); return; }
    if (g.coopUsage && !g.coopUsage.take('asks')) { g.events.emit('party.unheard', { sibling: id, why: 'cap', by: 'courier' }); return; }
    this.busy = true; this.last = now;
    const S = g.party.get(id), mark = S && g.glyphs?.pop('dots', S.pos.clone().setY(S.pos.y + 2.1), { color: 0xfbe3cf, size: 0.4, hold: 30, follow: () => S.pos.clone().setY(S.pos.y + 2.1) });
    g.events.emit('party.ask', { sibling: id, by: 'courier' });
    let a = null, late = false;
    const ctl = new AbortController(), timer = setTimeout(() => { late = true; ctl.abort(); }, TIMEOUT * 1000);
    try { a = await this.sample.json(this.prompt(id, words), { modelTier: 'quick', cache: false, signal: ctl.signal }); }
    catch (e) {
      const code = e?.code;
      if (code === 'not_granted' || code === 'sampling_disabled') { this.declined = true; this.sample = null; }
      if (UNSPENT.has(code)) g.coopUsage?.give('asks');
      g.events.emit('party.unheard', { sibling: id, why: late ? 'timeout' : this.declined ? 'declined' : code === 'rate_limited' ? 'limited' : 'failed', by: 'courier' });
    }
    finally { clearTimeout(timer); mark?.close?.(); this.busy = false; this.last = performance.now() / 1000; }
    if (a) this.answered(id, words, a);
    if (a && then.length) setTimeout(() => this.ask(then[0], words, then.slice(1)), GAP * 1000 + 50);
  }

  answered(id, words, a) {
    const g = this.game, S = g.party?.get(id), line = clean(a?.line);
    const H = (this.history[id] ||= []); H.push({ who: 'you', text: clean(words, 200) });
    if (line) { H.push({ who: id, text: line }); g.events.emit('party.say', { sibling: id, line, near: !!S, re: 'ask' }); }
    while (H.length > KEEP * 2) H.shift();
    if (S && MOODS.has(a?.mood)) S.mood = a.mood;
    if (S && ANSWER_ORDERS.has(a?.order)) g.party.command(a.order, id, a.order === 'go' && typeof a.target === 'string' ? a.target : '');
  }
}
