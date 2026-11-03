// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S FOLDS IN PLAY (docs/plans/OPEN-SEA.md 15.6; GAPS.md G159, G160): the two folds of the genre research that need the room's
// clock and the ship to be real: a song for the wind (progress/opensea/windsong.js) and a beast taken in tow (progress/opensea/capture.js).
// Dovina's, kept beside the room (opensea.js constructs it and calls its hooks), so the room file stays within its budget. The rules and
// every price are in the progress modules; this is the state they need and the events that tell the log.
//
//   THE SONG   three of the Crucibelle's notes played at the helm within `WINDSONG.gap` real s of each other (crucibelle.note { degree }),
//              or `/windsong <east|west|north|south>`: refused unless opened (a count of squares charted or fair squares), rested, and the
//              pool pays its share. It then rewrites the room's wind for a game hour (`wind(base, hour)`); nothing is saved (a song is for
//              the hour; a reload is a new hour's wind).
//   THE TOW    the harpoon's pull (Petra's seamounts.js emits `seabeast.tow { id, hp, depth, tethered }` for a tethered beast it has worn
//              down and stunned) takes the beast in tow if capture.js `towOk`; the helm slows (helm.mods 'tow'); a hit to the hull
//              (`sea.hull`) or `CAPTURE.tow.secs` real seconds breaks the tether (`seabeast.lost`); at a quay `/deliver live|statue`
//              hands it over. Until Petra's harpoon emits the pull, `/tow <beast>` in DEBUG stands in for a beast that would qualify.
//
// Prior art: The Wind Waker's Wind's Requiem, Monster Hunter's capture (see the progress modules).
//
//   new SeaFolds(room)   .wind(base, hour) -> wind   .sing(id) -> bool   .arrive()   .deliver(how) -> bool   .fair(burnK)   .update(dt)   .tow
//   events: sea.windsong { song, cost, until }, sea.windsong.refuse { why }, seabeast.towing { id }, seabeast.tow.refuse { id, why },
//   seabeast.lost { id, why }, seabeast.tow.arrive { id }, seabeast.captured { id, how, cubes, statue }, sea.sail.fair
// ---------------------------------------------------------------------------------------
import { SONGS, WINDSONG, songOf, called, songOpen, costOf, after, ready, blowing } from '../../progress/opensea/windsong.js';
import { CAPTURE, towOk, towMods, towLeft, livePay, statueOf } from '../../progress/opensea/capture.js';
import { now } from '../../core/calendar.js';

const hourNow = () => now() / 150000; // (a game hour is 150 real s: the room's own reading, opensea.js sail())

export class SeaFolds {
  constructor(room) {
    this.room = room; const g = this.game = room.game;
    this.notes = []; this.noteT = 0; this.song = null; this.tow = null; this.towT = 0;
    g.events?.on?.('crucibelle.note', (e) => this.note(e));
    g.events?.on?.('seabeast.tow', (e) => this.pull(e));
    g.events?.on?.('sea.hull', () => this.lose('hull'));
  }

  // ---- the song
  note(e) {
    if (!this.room.sailing || e.by !== 'courier' || !e.degree) return;
    const t = now() / 1000; if (t - this.noteT > WINDSONG.gap) this.notes.length = 0;
    this.noteT = t; this.notes.push(e.degree); if (this.notes.length > 3) this.notes.shift();
    const id = songOf(this.notes); if (id) { this.notes.length = 0; this.sing(id); }
  }
  /** Sing a song by id (a phrase played, or the chat line). True if the wind turned. */
  sing(id) {
    const g = this.game, S = SONGS[id], h = hourNow(), no = (why) => { g.events?.emit('sea.windsong.refuse', { why, by: 'courier' }); return false; };
    if (!S) return no('song');
    if (!this.room.sailing) return no('helm');
    if (!songOpen(g.ledger)) return no('closed');
    if (!ready(this.song, h)) return no('rest');
    const cost = costOf(g.lachryma?.max ?? 100);
    if (g.lachryma && !g.lachryma.spend(cost, 'song')) return no('pool');
    this.song = after(id, h); this.room.windT = 0; // (the wind asked for again at once)
    g.events?.emit('sea.windsong', { song: id, cost, until: this.song.until, by: 'courier' });
    return true;
  }
  /** The room's wind under a song, or as it is. */
  wind(base, hour) { return blowing(this.song, hour) ? called(base, this.song.song) : base; }
  /** A square sailed with the sail carrying 0.6 of it or more: a wind used well, the song's feat way (burnK: wind.js 1 - 0.8 share). */
  fair(burnK) { if (burnK <= 1 - 0.8 * 0.6) this.game.events?.emit('sea.sail.fair', { by: 'courier' }); }

  // ---- the tow
  pull(e) {
    const g = this.game; if (e.by !== 'courier' || !this.room.sailing) return;
    if (this.tow) return;
    const ok = towOk({ id: e.id, hp: e.hp, depth: e.depth, tethered: e.tethered !== false });
    if (!ok.ok) return void g.events?.emit('seabeast.tow.refuse', { id: e.id, why: ok.why, by: 'courier' });
    this.tow = { id: e.id }; this.towT = 0; this.room.helm?.mods?.set('tow', towMods());
    g.events?.emit('seabeast.towing', { id: e.id, by: 'courier' });
  }
  lose(why) {
    if (!this.tow) return; const id = this.tow.id; this.tow = null; this.room.helm?.mods?.delete('tow');
    this.game.events?.emit('seabeast.lost', { id, why, by: 'courier' });
  }
  /** Moored at a quay with a beast in tow: told, so the log can say what to do. */
  arrive() { if (this.tow) this.game.events?.emit('seabeast.tow.arrive', { id: this.tow.id, by: 'courier' }); }
  /** Hand the beast over at the quay: `live` for the fee, `statue` for the Spirit Garden's keepsake (once a beast). */
  deliver(how) {
    const g = this.game, no = (why) => { g.events?.emit('seabeast.deliver.refuse', { why, by: 'courier' }); return false; };
    if (!this.tow) return no('none');
    if (!this.room.moored?.quay) return no('quay');
    const id = this.tow.id;
    if (how === 'statue') {
      const piece = statueOf(id); if (!piece || g.decor?.owns?.(piece)) return no('owned');
      g.decor?.give?.(piece, 'capture');
      g.events?.emit('seabeast.captured', { id, how: 'statue', cubes: 0, statue: piece, by: 'courier' });
    } else {
      const cubes = livePay(id); g.cubes?.earn(cubes, 'capture');
      g.events?.emit('seabeast.captured', { id, how: 'live', cubes, statue: null, by: 'courier' });
    }
    this.tow = null; this.room.helm?.mods?.delete('tow'); return true;
  }

  update(dt) {
    if (!this.chatted && this.game.chat?.add) { this.chatted = true; this.chat(this.game); } // (the chat may come after the room at boot)
    if (!this.tow) return;
    if (!this.room.helm || !this.room.sailing && !this.room.moored) return this.lose('left');
    if (this.room.sailing && !towLeft(this.towT += dt)) this.lose('rope'); // (the tether holds while sailing: a quay moored to stops the clock)
  }

  chat(g) {
    const arg = (a) => (Array.isArray(a) ? a[0] : String(a || '').trim().split(/\s+/)[0]);
    g.chat?.add?.('windsong', { help: 'play the wind a song at the helm: /windsong east|west|north|south (or three notes on the Crucibelle)', run: (args) => {
      const id = arg(args); if (!id) return g.log?.say?.('info', `Songs: ${Object.entries(SONGS).map(([k, s]) => `${k} (${s.notes.join('-')})`).join(', ')}. Opened by charting ${WINDSONG.open.count} squares or sailing ${WINDSONG.open.feat} fair ones.`);
      this.sing(id);
    } });
    g.chat?.add?.('deliver', { help: 'hand a beast in tow over at a quay: /deliver live (the fee) or /deliver statue (a keepsake for the Spirit Garden)', run: (args) => {
      const how = arg(args); if (how !== 'live' && how !== 'statue') return g.log?.say?.('info', this.tow ? 'Deliver it: /deliver live for the fee, /deliver statue for the Spirit Garden.' : 'No beast in tow.');
      this.deliver(how);
    } });
    g.chat?.add?.('tow', { help: `DEBUG: take a beast in tow as the harpoon would (${Object.keys(CAPTURE.beasts).join(', ')})`, run: (args) => (g.mode === 'debug' ? this.pull({ id: arg(args) || 'seaSerpent', hp: 0.2, depth: 2, tethered: true, by: 'courier' }) : g.log?.say?.('info', 'The harpoon takes a beast in tow.')) });
  }
}
