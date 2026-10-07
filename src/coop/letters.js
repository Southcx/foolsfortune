// ---------------------------------------------------------------------------------------
// LETTERS (the slowest of co-op's three speeds; the glossary: letter). "/letter dovina <words>" sends your words to the division itself:
// the Claude Code session that builds its part of the game (coop/personas.js has each one's). The page keeps the letter in the published
// build's store (`letters/<id>`, the owner's and editors' only) and wakes that session through the owner's own Claude connector
// (`create_trigger` on Claude Code Remote, a minute ahead: the same road the QAIS round takes, debug/qais/qais.js). The session reads it
// and answers in its sibling's document (`siblings/<name>`, coop/channel.js) with `re` set to the letter's id; the page hears that at
// once and says it in the log, out of the channel's five-minute cadence. An answer takes a few real minutes: a session wakes at the
// minute and thinks in turns. Only the owner writes letters (a guest's page has no such connector), one to each division every three
// real minutes (each costs that session a turn). The protocol for the divisions: docs/handoffs/everyone/2026-10-07-from-petra-letters.md.
// The safeguards (each letter spends your connector and a session's turn): the hour's cap (coop/usage.js, `/usage`); one letter waiting
// on each division until it answers or is `LATE` (said once in the log, then you may write again); the same words twice are not sent;
// a wake not confirmed in `TIMEOUT` seconds is counted as sent (it may have gone) and said so, never sent again by itself.
// Events: party.letter { sibling }, party.letter.late { sibling }, party.unsent { sibling, why: 'owner' | 'away' | 'soon' | 'failed' |
// 'unknown' | 'cap' | 'waiting' | 'same' | 'unsure' }.
//
// Prior art: play-by-mail games (a turn a letter), Animal Crossing's letters to the villagers (answered the next day), and Death
// Stranding's async messages.
//
//   game.letters = new Letters(game)   .send(id, words) -> Promise<bool>   .use({ db, mcp, user }) (tests hand them in)
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';
import { PERSONAS } from './personas.js';
import { BUILD, BUILD_URL } from '../core/progress.js';

const EACH = 180e3, LATE = 15 * 60e3, TIMEOUT = 30e3, WORDS_MAX = 1000; // (real milliseconds between letters to one division; before an unanswered one is late; a wake may take; characters a letter may carry)
const SERVER = 'Claude Code Remote', TOOL = 'create_trigger';
const clean = (s) => String(s ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, ' ').trim().slice(0, WORDS_MAX);

export class Letters {
  constructor(game) {
    this.game = game; this.db = this.mcp = this.user = null; this.sent = {}; this.last = {}; this.now = () => Date.now();
    game.events.on('party.say', (e) => { const W = this.waiting; if (e.re === 'letter' && W[e.sibling] && (!e.letter || e.letter === W[e.sibling].letter)) { delete W[e.sibling]; game.coopUsage?.dirty(); } }); // (answered)
    const use = window.claude?.use;
    if (use) setInterval(() => this.check(), 30e3); // (wall-clock: a letter late is a real quarter hour, not the game's)
    if (use) Promise.all(['db', 'mcp', 'user'].map((n) => Promise.resolve(use(n)).catch(() => null))).then(([db, mcp, user]) => this.use({ db, mcp, user }));
    game.chat?.add('letter', {
      help: 'write to a division itself (its session answers in a few real minutes): /letter <petra | dovina | wanda | calissa | espada> <words>',
      aliases: ['write'],
      run: (args, rest) => { const [who = ''] = args; this.send(who.toLowerCase(), String(rest || '').replace(/^\S+\s*/, '')); },
    });
  }

  use({ db = null, mcp = null, user = null }) { this.db = db; this.mcp = mcp; this.user = user; return this; }
  get waiting() { return this.game.coopUsage?.waiting || (this._waiting ||= {}); } // (kept with the meter, so a reload remembers)

  /** A letter unanswered a quarter hour is said to be late, once; you may then write again. */
  check() {
    const now = this.now();
    for (const [id, w] of Object.entries(this.waiting)) {
      if (!w.late && now - w.at > LATE) { w.late = true; this.game.coopUsage?.dirty(); this.game.events.emit('party.letter.late', { sibling: id, by: 'courier' }); }
      if (now - w.at > 24 * 3600e3) delete this.waiting[id];
    }
  }

  /** Send one letter: kept in the store, then the division's session woken a minute ahead. */
  async send(id, words) {
    const g = this.game, emit = (why) => { g.events.emit('party.unsent', { sibling: id || null, why, by: 'courier' }); return false; };
    if (!SIBLINGS.some((s) => s.id === id) || !clean(words)) return emit('unknown');
    if (!this.db || !this.mcp) return emit('away');
    if (!(await this.user?.isOwner?.().catch(() => false))) return emit('owner');
    const now = this.now(), text = clean(words), W = this.waiting;
    this.check();
    if (W[id] && !W[id].late) return emit('waiting');
    if (now - (this.sent[id] ?? -Infinity) < EACH) return emit('soon');
    if (this.last[id] === text) return emit('same');
    if (g.coopUsage && !g.coopUsage.take('letters')) return emit('cap');
    this.sent[id] = now; this.last[id] = text;
    const letter = `L${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    const within = (p) => Promise.race([p, new Promise((_, no) => setTimeout(() => no({ code: 'timeout' }), TIMEOUT))]);
    let woke = false;
    try {
      await within(this.db.collection('letters').doc(letter).set({ to: id, text, at: now, build: BUILD }));
      const at = new Date(now + 70e3).toISOString().replace(/\.\d+Z$/, 'Z');
      woke = true; // (from here a timeout cannot say the wake did not happen)
      await within(this.mcp.callTool(SERVER, TOOL, { name: `Letter to ${SIBLINGS.find((s) => s.id === id).name}`, prompt: this.prompt(id, letter, text), persistent_session_id: PERSONAS[id].session, run_once_at: at, initiation: 'human_request' }));
    } catch (e) {
      console.warn('letters: not sent', e);
      if (woke && e?.code === 'timeout') { W[id] = { letter, at: now, late: false }; g.coopUsage?.dirty(); return emit('unsure'); } // (it may have gone: wait for an answer)
      this.sent[id] = -Infinity; this.last[id] = null; g.coopUsage?.give('letters'); return emit('failed');
    }
    W[id] = { letter, at: now, late: false }; g.coopUsage?.dirty();
    g.events.emit('party.letter', { sibling: id, by: 'courier' });
    return true;
  }

  prompt(id, letter, text) {
    return `From the owner, a letter written in the game (Fool's Fortune, the build ${BUILD} at ${BUILD_URL}, "/letter ${id}"; kept as letters/${letter} in its store):

"${text}"

Answer it in your own voice (your sibling's card in the game: ${PERSONAS[id].voice}), in one line the game says in its log as your sibling's: with ArtifactData on ${BUILD_URL}, read collection "siblings", doc "${id}", then "update" it (with its version) with { "line": "<your answer, at most 120 characters>", "re": "${letter}" }, and, if the letter asks it of your sibling, "order" (follow | hold | scout | guard | free) and "target" (a place id). An answer with a new "re" is said at once. If the letter asks for work on the game, say in your line what you will do. The protocol: docs/handoffs/everyone/2026-10-07-from-petra-letters.md.`;
  }
}
