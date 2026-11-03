// ---------------------------------------------------------------------------------------
// THE SHELF OF TRACKS (G307; docs/plans/TRACK-EDITOR.md 10, W5; the rules progress/trackshelf.js): the tracks you keep from others, each
// as its share code, in the save (section `trackShelf`, scope player: progress, reset with the build). A code pasted into the editor
// goes on the shelf on its own; a validated track of yours goes on by the race board's SHELVE (to pass on, or to ride in an endless run).
// The shelf is a keeper only: it rides nothing (world/raceway/endless.js does), it builds nothing (the editor's slots and the lot do).
//
// Prior art: Super Mario Maker 2's course world bookmarks, Trackmania's favourites; progress/trackshelf.js.
//
//   game.trackShelf = new TrackShelf(game)   .entries [{ hash, name, code, best }]   .add(code) -> bool   .addDef(def) -> bool   .drop(hash)
//   .defOf(hash) -> def | null   events: shelf.add { title, size, by }, shelf.drop { by }   save section 'trackShelf'
// ---------------------------------------------------------------------------------------
import { readCode, shareCode } from '../../progress/trackdef.js';
import { shelfAdd, shelfDrop } from '../../progress/trackshelf.js';

export class TrackShelf {
  constructor(game) {
    this.game = game; this.entries = [];
    game.save?.section('trackShelf', {
      scope: 'player', version: 1,
      dump: () => ({ entries: this.entries }),
      load: (d) => { this.entries = (Array.isArray(d?.entries) ? d.entries : []).filter((e) => e && typeof e.hash === 'string' && typeof e.code === 'string' && readCode(e.code)).slice(0, 10).map((e) => ({ hash: e.hash, name: String(e.name || 'Track').slice(0, 32), code: e.code, best: Number.isFinite(e.best) ? e.best : null })); },
      reset: () => { this.entries = []; },
    });
  }
  /** A share code onto the shelf; false if it is not a code, is there already, or the shelf is full (said by the caller's refusal). */
  add(code) { const def = readCode(code); return def ? this.addDef(def, code) : false; }
  addDef(def, code = shareCode(def)) {
    const r = shelfAdd(this.entries, def, code); this.last = r.why || null; if (!r.ok) return false;
    this.entries = r.entries; this.game.save?.dirty('trackShelf');
    this.game.events?.emit('shelf.add', { title: def.name, size: this.entries.length, by: 'courier' }); return true;
  }
  drop(hash) { const n = this.entries.length; this.entries = shelfDrop(this.entries, hash); if (this.entries.length === n) return false; this.game.save?.dirty('trackShelf'); this.game.events?.emit('shelf.drop', { size: this.entries.length, by: 'courier' }); return true; }
  defOf(hash) { const e = this.entries.find((x) => x.hash === hash); return e ? readCode(e.code) : null; }
  /** Keep the best endless pace of a track (its one-lap seconds). */
  note(hash, seconds) { const e = this.entries.find((x) => x.hash === hash); if (e && (e.best == null || seconds < e.best)) { e.best = +seconds.toFixed(2); this.game.save?.dirty('trackShelf'); } }
}
