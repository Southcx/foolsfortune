// ---------------------------------------------------------------------------------------
// THE SIGHT'S WAYPOINT (docs/plans/OVERLAY.md 16; the instrument's look is Calissa's, `game.sight.waypoint` read by her needle): what the
// Sight's needle points to. The owner, 2026-10-17: it points to the waypoint you calibrate to or know of, "Jack Sparrow's compass". So
// it points only at what you know, and it spins when you have not told it what you want.
//
// Calibrating is showing it what you want, three ways:
//   a place you know of: a room you have charted (`room.<id>` firsts), or a cradle whose seal is in your Seal Book (`seal.book.<id>`)
//   a kind of creature you know (familiarity 1 or more): the nearest living one on the ground you have explored, else it spins
//   home: the last Shrine whose seal you received (the Seal Book's latest Shrine page)
// Uncalibrated, or calibrated to something it cannot find, the needle spins slowly: the compass when you do not know what you want.
// One waypoint at a time; it is not kept by the save (a session's want, not a record).
//
// Prior art: Jack Sparrow's compass (it points to what you want most), Pirates of the Caribbean's "you don't know what you want"; the
// Legend of Zelda's map pins; Breath of the Wild's Sheikah Sensor, calibrated by showing it a photographed subject (the Compendium).
//
//   game.sight = new Sight(game)   .calibrate({ place } | { kind } | { home: true }) -> { ok, why? }   .clear()   .waypoint -> { name, pos, from, id } | null
//   sightCommands(game)   (`/sight <place or kind>`, `/sight home`, `/sight off`)
// ---------------------------------------------------------------------------------------
import { familiarityOf } from './familiarity.js';

const knownPlace = (L, id) => !!(L?.has?.(`room.${id}`) || L?.has?.(`seal.book.${id}`));

export class Sight {
  constructor(game) { this.game = game; this.want = null; }

  /** Point the needle at what you want; refused, with the reason, when you do not know it. */
  calibrate(src = {}) {
    const g = this.game, L = g.ledger;
    if (src.home) {
      const pages = Object.keys(L?.firsts || {}).filter((k) => k.startsWith('seal.book.shrine')).sort((a, b) => L.firsts[a] - L.firsts[b]);
      if (!pages.length) return { ok: false, why: 'You have sealed no Shrine yet.' };
      return this.set({ from: 'home', id: pages[pages.length - 1].slice('seal.book.'.length) });
    }
    if (src.place) {
      if (!g.places?.get(src.place)) return { ok: false, why: 'No such place.' };
      if (!knownPlace(L, src.place)) return { ok: false, why: 'You do not know where that is yet.' };
      return this.set({ from: 'place', id: src.place });
    }
    if (src.kind) {
      if (familiarityOf(L, src.kind).level < 1) return { ok: false, why: 'You do not know that creature yet.' };
      return this.set({ from: 'kind', id: src.kind });
    }
    return { ok: false, why: 'Show it a place or a creature you know.' };
  }
  set(want) { this.want = want; this.game.events?.emit('sight.calibrate', { from: want.from, id: want.id, by: 'courier' }); return { ok: true }; }
  clear() { if (this.want) this.game.events?.emit('sight.calibrate', { from: 'off', id: null, by: 'courier' }); this.want = null; }

  /** Where the needle points now, or null (it spins). */
  get waypoint() {
    const w = this.want, g = this.game; if (!w) return null;
    if (w.from === 'kind') {
      const P = g.player?.pos; if (!P) return null;
      let best = null, bd = Infinity;
      for (const c of g.creatures?.list || []) { if (c.kind !== w.id || c.alive === false) continue; const d = c.pos.distanceToSquared(P); if (d < bd) { bd = d; best = c; } }
      return best ? { name: best.name || w.id, pos: best.pos.clone(), from: 'kind', id: w.id } : null;
    }
    const pos = g.places?.pos(w.id) ?? g.cradles?.list?.find((c) => c.id === w.id || c.book === w.id)?.pos?.clone?.() ?? null;
    return pos ? { name: g.places?.get(w.id)?.name || w.id, pos, from: w.from, id: w.id } : null;
  }
}

/** The chat line's way to calibrate it (until the Sight's own window does). */
export function sightCommands(game) {
  game.chat?.add?.('sight', { help: 'point the Sight at a place or creature you know: /sight <place or kind>, /sight home, /sight off', run: ([what]) => {
    const s = game.sight; if (!s) return;
    if (!what || what === 'off') { s.clear(); return; }
    const r = what === 'home' ? s.calibrate({ home: true }) : game.places?.get(what) ? s.calibrate({ place: what }) : s.calibrate({ kind: what });
    if (!r.ok) game.log?.say('system', r.why, { key: 'sightno', throttle: 2 });
  } });
}
