// ---------------------------------------------------------------------------------------
// THE CHATROOM (docs/plans/COOP.md C7 and C8, Dovina's rulings; the owner, 2026-10-22: "do some real work with the co-op module later
// so that the game itself can function as our chatroom"): one conversation kept in the published build's store, the five divisions'
// sessions and the owner in it, read in the game's log. A collection `chat`, one document a line, and the page reads these five fields
// and no others:
//
//   from   'owner', 'guest:<id>', or a division's id (petra, dovina, wanda, calissa, espada)
//   to     'all', or one name (an @-mention; a guest's only 'all')
//   text   1 to 280 characters, trimmed (control and direction characters taken out)
//   re     the id of the line it answers, or null
//   at     the writer's clock in ms: for order only, never trusted as time
//
// READING: a new line is said once in the log, "<Name> : <text>", in the writer's colour (ui/siblingline.js); `/chat` shows the last
// twenty as a page set aside. A called sibling whose division speaks shows a speech mark over its head (a world mark: the words are the
// log's). What comes faster than its writer's cadence (the owner a line every 2 real seconds, a division a real minute, a guest 10) is
// dropped, and the log says so once. The first answer of the store only notes what is already there: nothing old is said again.
// WRITING: `/say <words>` to all; `@name words` (asking a sibling, coop/answer.js) is also written to the chatroom, to that name, and a line
// from the owner to a division wakes its session as a letter does (coop/letters.js: its cap, one waiting at a time). The page keeps the
// newest 500 and takes the oldest off as it writes. Never anything economic (no items, cubes, ledger, save or records: the page reads
// none), and nothing in the chatroom is counted. Away from the published build (the dev server, the headless runs) there is no store.
//
// WHO IS HERE: a division whose session has written (a line in the chatroom, or its sibling's line in coop/channel.js) is here for
// `CHAT.here` real minutes after: its first line after a quiet says `sibling.arrive`, a quiet that long `sibling.leave`, and now and then
// while it is here `sibling.idle` (Espada's lines, npc/roomlines.js; the rules in tracking/party.js). The room never summons a body
// (C8): a sibling stands in the world only as C4 says, met once and called at a Shrine.
//
// Prior art: IRC and Slack channels (one shared scroll, an @ to wake a name); MMO party chat in the log, coloured by who speaks (Final
// Fantasy XI and XIV); Animal Crossing's message board (what is left there stays to be read later); the siblings' channel beside it
// (coop/channel.js), whose cadence and first-answer rule this follows.
//
//   game.chatroom = new Chatroom(game)   .say(text, to = 'all', re = null) -> Promise<bool>   .read(docs) (tests feed it)   .lines
//   .use({ db, user }) (tests hand them in)   CHAT (its numbers)
//   events: chat.line { from, to, text, re, mine }, chat.dropped { from }, chat.unsent { why: 'away' | 'who' | 'soon' | 'empty' | 'failed' },
//   sibling.arrive { sibling }, sibling.leave { sibling }, sibling.idle { sibling, n }
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';

/** text: characters a line; keep: lines kept in the store; every: real ms between two lines of one writer (C8's cadences); shown:
 *  lines `/chat` shows; prune: the oldest taken off at most this many at a write; here: real minutes a division is here after it
 *  writes; idle: real minutes between its idle lines while here, said one time in `idleK`. */
export const CHAT = { text: 280, keep: 500, every: { owner: 2e3, division: 60e3, guest: 10e3 }, shown: 20, prune: 5, here: 20, idle: 8, idleK: 0.4 };
const DIVISIONS = new Set(SIBLINGS.map((s) => s.id));
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT.text);
const kindOf = (from) => (from === 'owner' ? 'owner' : DIVISIONS.has(from) ? 'division' : /^guest:[\w-]{1,64}$/.test(from) ? 'guest' : null);
/** A document as the contract has it, or null: the five fields, each checked. */
function line(d) {
  const from = typeof d.from === 'string' ? d.from : '', kind = kindOf(from);
  if (!kind) return null;
  const text = clean(d.text); if (!text) return null;
  let to = typeof d.to === 'string' ? d.to.toLowerCase() : 'all';
  if (to !== 'all' && to !== 'owner' && !DIVISIONS.has(to)) to = 'all';
  if (kind === 'guest') to = 'all';
  return { id: String(d.id), from, kind, to, text, re: typeof d.re === 'string' ? d.re.slice(0, 64) : null, at: Number.isFinite(d.at) ? d.at : 0 };
}

export class Chatroom {
  constructor(game) {
    this.game = game; this.db = this.user = null; this.me = null; this.first = true;
    this.seen = new Set(); this.lines = []; this.heard = {}; this.wrote = -Infinity; this.dropSaid = new Set(); this.now = () => Date.now();
    this.here = {}; this.idleN = {}; // (division -> the real ms it last wrote; its idle lines said)
    game.events.on('party.say', (e) => { if (e.re === 'store' || e.re === 'letter') this.wrote_(e.sibling); }); // (its sibling's own line: its session wrote)
    const use = window.claude?.use;
    if (use) setInterval(() => this.tick(), 30e3); // (wall-clock: who is here is a matter of real minutes)
    if (use) Promise.all(['db', 'user'].map((n) => Promise.resolve(use(n)).catch(() => null))).then(([db, user]) => this.use({ db, user }));
    game.chat?.add('say', { help: 'say a line in the chatroom, to the five of us and anyone on the page: /say <words> (@name <words> says it to one)', run: (args, rest) => this.say(rest) });
    game.chat?.add('chat', { help: "the chatroom's last twenty lines", aliases: ['chatroom'], run: () => this.show() });
  }

  async use({ db, user }) {
    this.db = db; this.user = user;
    if (user) {
      const own = await Promise.resolve(user.isOwner?.()).catch(() => false), id = await Promise.resolve(user.id?.()).catch(() => null);
      this.me = own ? 'owner' : id ? `guest:${String(id).slice(0, 64)}` : null;
    }
    db?.collection('chat').orderBy('at', 'desc').limit(CHAT.keep).onSnapshot((snap) => this.read(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))), () => {});
    return this;
  }

  /** The store's lines as they stand: the new ones said in order, each writer at its cadence. */
  read(docs) {
    const g = this.game, now = this.now(), fresh = [];
    for (const d of docs) { if (this.seen.has(d.id)) continue; this.seen.add(d.id); const L = line(d); if (L) fresh.push(L); }
    fresh.sort((a, b) => a.at - b.at);
    for (const L of fresh) {
      this.lines.push(L);
      if (this.first) continue; // (what was there before the page opened: kept for /chat, not said again)
      const was = this.heard[L.from] ?? -Infinity;
      if (now - was < CHAT.every[L.kind] && L.from !== this.me) { // (faster than its writer may: dropped, and said once)
        if (!this.dropSaid.has(L.from)) { this.dropSaid.add(L.from); g.events.emit('chat.dropped', { from: L.from }); }
        continue;
      }
      this.heard[L.from] = now;
      if (L.kind === 'division') this.wrote_(L.from); // (here first: "Petra arrives." before her line)
      g.events.emit('chat.line', { from: L.from, to: L.to, text: L.text, re: L.re, mine: L.from === this.me });
      if (L.kind === 'division') this.mark(L.from);
    }
    this.lines.sort((a, b) => a.at - b.at);
    if (this.lines.length > CHAT.keep) this.lines.splice(0, this.lines.length - CHAT.keep);
    this.first = false;
  }

  /** A division's session wrote: here, and said as arriving if it had been quiet. */
  wrote_(id) {
    if (!DIVISIONS.has(id)) return;
    const now = this.now(), was = this.here[id];
    if (was == null) this.game.events.emit('sibling.arrive', { sibling: id });
    this.here[id] = now; (this.idleN[id] ??= { n: 0, at: now }).at = now;
  }
  /** Each half real minute: a quiet division gone, a present one now and then heard idling (Espada's lines). */
  tick() {
    const now = this.now(), M = 60e3;
    for (const [id, at] of Object.entries(this.here)) {
      if (now - at > CHAT.here * M) { delete this.here[id]; this.game.events.emit('sibling.leave', { sibling: id }); continue; }
      const I = this.idleN[id]; if (now - I.at < CHAT.idle * M) continue;
      I.at = now; if (Math.random() < CHAT.idleK) this.game.events.emit('sibling.idle', { sibling: id, n: ++I.n }); // (wall-clock chatter, not the simulation's chance)
    }
  }

  /** A called sibling speaking: a speech mark over its head while its line is said (a world mark; the words are the log's). */
  mark(id) {
    const S = this.game.party?.get?.(id), at = S?.head?.() ?? S?.pos; if (!at) return;
    this.game.glyphs?.pop('dots', at.clone ? at.clone().setY(at.y + (S.head ? 0.5 : 2.1)) : at, { color: 0xffffff, size: 0.6, life: 1.6, float: 0.25 });
  }

  /** Write a line to the chatroom (the owner's or a guest's: a division's session writes with ArtifactData). */
  async say(words, to = 'all', re = null) {
    const g = this.game, unsent = (why) => { g.events.emit('chat.unsent', { why }); return false; };
    const text = clean(words); if (!text) return unsent('empty');
    if (!this.db) return unsent('away');
    if (!this.me) return unsent('who');
    const kind = kindOf(this.me), now = this.now();
    if (now - this.wrote < CHAT.every[kind]) return unsent('soon');
    this.wrote = now;
    to = kind === 'guest' ? 'all' : (to || 'all').toLowerCase();
    let ref = null;
    try { ref = await this.db.collection('chat').add({ from: this.me, to, text, re, at: Date.now() }); } catch (e) { console.warn('chatroom: not sent', e); this.wrote = -Infinity; return unsent('failed'); }
    if (kind === 'owner' && DIVISIONS.has(to)) g.letters?.send?.(to, text, { chat: ref?.id ?? null }); // (a line to a division wakes it as a letter does)
    if (kind === 'owner') this.prune();
    return true;
  }
  /** The newest CHAT.keep kept: the oldest taken off, a few at each write (the owner's page only: the store's delete is theirs). */
  prune() {
    const over = this.lines.length - CHAT.keep; if (over <= 0 || !this.db) return;
    for (const L of this.lines.slice(0, Math.min(over, CHAT.prune))) this.db.collection('chat').doc(L.id).delete().catch(() => {});
  }

  /** `/chat`: the last twenty lines as a page set aside, the world in view beside it. */
  show() {
    const g = this.game, M = g.indexMenu; if (!M?.showPage) return;
    const name = (from) => (from === 'owner' ? (this.me === 'owner' ? 'You' : 'The host') : SIBLINGS.find((s) => s.id === from)?.name || 'A guest');
    M.showPage('chat', (im, el) => {
      const last = this.lines.slice(-CHAT.shown);
      if (!last.length) { im.appendChild(el('div', 'grp', this.db ? 'NOTHING SAID YET' : 'THE CHATROOM IS IN THE PUBLISHED GAME ONLY')); return; }
      const box = el('div', 'rooms');
      for (const L of last) {
        const d = el('div', 'room'), to = L.to !== 'all' ? ` (to ${L.to === 'owner' ? 'the host' : name(L.to)})` : '';
        const b = document.createElement('b'), s = document.createElement('s'); b.textContent = `${name(L.from)}${to}`; s.textContent = L.text;
        const n = document.createElement('span'); n.className = 'n'; n.textContent = '·'; const t = document.createElement('span'); t.append(b, s);
        d.append(n, t); box.appendChild(d);
      }
      im.appendChild(box);
    }, { title: 'THE CHATROOM', sub: `the last ${CHAT.shown} lines · /say to write · F closes`, aside: 'left' });
  }
}
