// ---------------------------------------------------------------------------------------
// LETTERS (the slowest of co-op's three speeds; the glossary: letter). "/letter dovina <words>" sends your words to the division itself:
// the Claude Code session that builds its part of the game (coop/personas.js has each one's). The page keeps the letter in the published
// build's store (`letters/<id>`, the owner's and editors' only) and wakes that session through the owner's own Claude connector
// (`create_trigger` on Claude Code Remote, a minute ahead: the same road the QAIS round takes, debug/qais/qais.js). The session reads it
// and answers in its sibling's document (`siblings/<name>`, coop/channel.js) with `re` set to the letter's id; the page hears that at
// once and says it in the log, out of the channel's five-minute cadence. An answer takes a few real minutes: a session wakes at the
// minute and thinks in turns. Only the owner writes letters (a guest's page has no such connector), one to each division every three
// real minutes (each costs that session a turn). The protocol for the divisions: docs/handoffs/everyone/2026-10-07-from-petra-letters.md.
// Events: party.letter { sibling }, party.unsent { sibling, why: 'owner' | 'away' | 'soon' | 'failed' | 'unknown' }.
//
// Prior art: play-by-mail games (a turn a letter), Animal Crossing's letters to the villagers (answered the next day), and Death
// Stranding's async messages.
//
//   game.letters = new Letters(game)   .send(id, words) -> Promise<bool>   .use({ db, mcp, user }) (tests hand them in)
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';
import { PERSONAS } from './personas.js';
import { BUILD, BUILD_URL } from '../core/progress.js';

const EACH = 180e3, WORDS_MAX = 1000; // (real milliseconds between letters to one division; characters a letter may carry)
const SERVER = 'Claude Code Remote', TOOL = 'create_trigger';
const clean = (s) => String(s ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, ' ').trim().slice(0, WORDS_MAX);

export class Letters {
  constructor(game) {
    this.game = game; this.db = this.mcp = this.user = null; this.sent = {}; this.now = () => Date.now();
    const use = window.claude?.use;
    if (use) Promise.all(['db', 'mcp', 'user'].map((n) => Promise.resolve(use(n)).catch(() => null))).then(([db, mcp, user]) => this.use({ db, mcp, user }));
    game.chat?.add('letter', {
      help: 'write to a division itself (its session answers in a few real minutes): /letter <petra | dovina | wanda | calissa | espada> <words>',
      aliases: ['write'],
      run: (args, rest) => { const [who = ''] = args; this.send(who.toLowerCase(), String(rest || '').replace(/^\S+\s*/, '')); },
    });
  }

  use({ db = null, mcp = null, user = null }) { this.db = db; this.mcp = mcp; this.user = user; return this; }

  /** Send one letter: kept in the store, then the division's session woken a minute ahead. */
  async send(id, words) {
    const g = this.game, emit = (why) => { g.events.emit('party.unsent', { sibling: id || null, why, by: 'courier' }); return false; };
    if (!SIBLINGS.some((s) => s.id === id) || !clean(words)) return emit('unknown');
    if (!this.db || !this.mcp) return emit('away');
    if (!(await this.user?.isOwner?.().catch(() => false))) return emit('owner');
    const now = this.now();
    if (now - (this.sent[id] ?? -Infinity) < EACH) return emit('soon');
    this.sent[id] = now;
    const letter = `L${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`, text = clean(words);
    try {
      await this.db.collection('letters').doc(letter).set({ to: id, text, at: now, build: BUILD });
      const at = new Date(now + 70e3).toISOString().replace(/\.\d+Z$/, 'Z');
      await this.mcp.callTool(SERVER, TOOL, { name: `Letter to ${SIBLINGS.find((s) => s.id === id).name}`, prompt: this.prompt(id, letter, text), persistent_session_id: PERSONAS[id].session, run_once_at: at, initiation: 'human_request' });
    } catch (e) { console.warn('letters: not sent', e); this.sent[id] = -Infinity; return emit('failed'); }
    g.events.emit('party.letter', { sibling: id, by: 'courier' });
    return true;
  }

  prompt(id, letter, text) {
    return `From the owner, a letter written in the game (Fool's Fortune, the build ${BUILD} at ${BUILD_URL}, "/letter ${id}"; kept as letters/${letter} in its store):

"${text}"

Answer it in your own voice, in one line the game says in its log as your sibling's: with ArtifactData on ${BUILD_URL}, read collection "siblings", doc "${id}", then "update" it (with its version) with { "line": "<your answer, at most 120 characters>", "re": "${letter}" }, and, if the letter asks it of your sibling, "order" (follow | hold | scout | guard | free) and "target" (a place id). An answer with a new "re" is said at once. If the letter asks for work on the game, say in your line what you will do. The protocol: docs/handoffs/everyone/2026-10-07-from-petra-letters.md.`;
  }
}
