// ---------------------------------------------------------------------------------------
// THE SIBLINGS' CHANNEL: how a division's session steers its own sibling in your world (Dovina's rulings, docs/plans/COOP.md: "what a
// session may write"). A session cannot join the page live; it writes to the published build's store instead (the artifact's `db`,
// which every division reaches with `ArtifactData` on the build's URL), and the page hears the write at once. One document a sibling,
// `siblings/<name>` (collection `siblings`, its id the sibling's: `petra`, `dovina`, `wanda`, `calissa`, `espada`). The page reads
// these fields and no others:
//
//   order   'follow' | 'hold' | 'scout' | 'guard' | 'free'      applied while that sibling is out; at most one a real minute
//   target  a place id (world/places.js) or null                   with `order: 'scout'` (or alone) it goes there
//   line    120 characters at most, said once in the log as "<Name>: <line>"; at most one every five real minutes
//   mood    one of the five feelings (mirth, wonder, desire, grief, dread): kept on the sibling for its look (Calissa's)
//   re      the id of the owner's letter this answers (coop/letters.js): a line with a new `re` is said at once, out of the cadence
//
// A line is new when its text changes; the first answer only notes where each document stands (nothing old is said again). What comes
// faster than the cadence is dropped. Never anything economic: no items, cubes, ledger, save or records (the page reads none). Away from
// the published build (the dev server, the headless runs) there is no store and nothing is heard. The cadence is wall-clock time (real
// minutes, not the game's): this is not the simulation.
//
// Prior art: the async co-op of Death Stranding's strand (others' marks reach your world without them in it) and Dark Souls' messages
// (a few words from another player, set in your world).
//
//   new SiblingChannel(game)   (main.js; it reads game.party)   .read(docs) (a snapshot's documents; tests feed it by hand)
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';

const LINE_MAX = 120, ORDER_EVERY = 60e3, LINE_EVERY = 300e3; // (characters; real milliseconds between orders, between lines)
const ORDERS = new Set(['follow', 'hold', 'scout', 'guard', 'free']);
const MOODS = new Set(['mirth', 'wonder', 'desire', 'grief', 'dread']);
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, '').trim().slice(0, LINE_MAX);

export class SiblingChannel {
  constructor(game) {
    this.game = game; this.seen = {}; this.first = true; this.now = () => Date.now();
    const use = window.claude?.use;
    if (!use) return;
    Promise.resolve(use('db')).then((db) => { if (db) db.collection('siblings').onSnapshot((snap) => this.read(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))), () => {}); }).catch(() => {});
  }

  /** The documents as they stand: orders applied, new lines said, at a human cadence. */
  read(docs) {
    const g = this.game, ids = new Set(SIBLINGS.map((s) => s.id)), now = this.now();
    for (const d of docs) {
      if (!ids.has(d.id)) continue;
      const S = g.party?.get(d.id), was = (this.seen[d.id] ||= { order: null, line: null, orderAt: -Infinity, lineAt: -Infinity });
      const order = ORDERS.has(d.order) ? d.order : null, target = typeof d.target === 'string' ? d.target : null, line = clean(d.line);
      if (S && MOODS.has(d.mood)) S.mood = d.mood;
      if (this.first) { Object.assign(was, { order: `${order}|${target}`, line, re: typeof d.re === 'string' ? d.re.slice(0, 40) : null }); continue; }
      // an order (with its target), once a real minute
      const key = `${order}|${target}`;
      if (order && key !== was.order && now - was.orderAt >= ORDER_EVERY) {
        was.order = key; was.orderAt = now;
        if (S) { const to = target && g.places?.get?.(target)?.at?.(); S.order = to ? 'go' : order === 'free' ? 'follow' : order; S.to = to || null; g.events.emit('party.order', { order, sibling: d.id, from: 'session', by: 'courier' }); }
      }
      // a line, once every five real minutes
      const re = typeof d.re === 'string' ? d.re.slice(0, 40) : null, answer = re && re !== was.re; // (an answer to a letter: said at once)
      if (line && (answer || (line !== was.line && now - was.lineAt >= LINE_EVERY))) { was.line = line; was.lineAt = now; was.re = re; g.events.emit('party.say', { sibling: d.id, line, near: !!S, re: answer ? 'letter' : 'store', ...(answer ? { letter: re } : {}) }); }
    }
    this.first = false;
  }
}
