// ---------------------------------------------------------------------------------------
// THE SIBLINGS' CHANNEL: how a division's session steers its own sibling in your world (docs/plans/COOP.md C6). A session cannot join
// the page live; it writes to the published build's store instead (the artifact's `db`, which every division reaches with
// `ArtifactData` on the build's URL), and the page hears the write at once. One document a sibling in the collection `siblings`,
// its id the sibling's (`petra`, `dovina`, `wanda`, `calissa`, `espada`):
//
//   { order: 'follow' | 'hold', say: '<a line, 200 characters at most>', n: <a number raised with each new line> }
//
// An order is applied to that sibling while it is in the party; a line (new when `n` changes) goes to the log as theirs (the event
// `party.say`, its words as data: the log draws text, never markup). What a session may write beyond this, and how often, is Dovina's
// to rule (COOP.md); a document that says nothing new changes nothing. Away from the published build (the dev server, the headless
// runs) there is no store and nothing is heard.
//
// Prior art: the async co-op of Death Stranding's strand (others' marks reach your world without them in it) and Dark Souls' messages
// (a few words from another player, set in your world).
//
//   new SiblingChannel(game)   (main.js; it reads game.party)   .heard (the documents' last `n`, for the tests)
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from './party.js';

const SAY_MAX = 200;
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, '').trim().slice(0, SAY_MAX);

export class SiblingChannel {
  constructor(game) {
    this.game = game; this.heard = {}; this.first = true;
    const use = window.claude?.use;
    if (!use) return;
    Promise.resolve(use('db')).then((db) => { if (db) this.listen(db); }).catch(() => {});
  }

  listen(db) {
    db.collection('siblings').onSnapshot((snap) => this.read(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }

  /** The documents as they stand: orders applied, new lines said. The first answer only notes where each line stands (nothing old is said again). */
  read(docs) {
    const g = this.game, ids = new Set(SIBLINGS.map((s) => s.id));
    for (const d of docs) {
      if (!ids.has(d.id)) continue;
      const S = g.party?.get(d.id);
      if (S && (d.order === 'follow' || d.order === 'hold')) S.order = d.order;
      const n = Number(d.n) || 0, line = clean(d.say);
      if (this.first || n === this.heard[d.id]) { this.heard[d.id] = n; continue; }
      this.heard[d.id] = n;
      if (line) g.events.emit('party.say', { sibling: d.id, line, near: !!S });
    }
    this.first = false;
  }
}
