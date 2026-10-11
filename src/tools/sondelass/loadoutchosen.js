// ---------------------------------------------------------------------------------------
// THE MELEE LOADOUT CHOSEN (docs/plans/MELEE-LOADOUT.md section 2 and phase 3): the Sondelass's string and specials as the Courier set
// them in the loadout editor (loadouteditor.js), kept in the save, and handed to the combo engine checked (tools/moveset.js reads it
// through cutlass.js: `loadout: () => game.sondelassLoadout.get()`).
//
//   THE SAVE      one section, `sondelassLoadout`, scope player (core/save.js): { string: [ids], specials: { tap, forward, back } } as set,
//                 or null for never set (the default plays). Marked dirty on every change.
//   THE CHECK     get() is what plays: every slot's id checked against the catalogue (SONDELASS_MOVES: the row is there, of the slot's
//                 kind, and playable) and against what the Courier knows (loadoutopen.js), the string cut to the slots open. A move no
//                 longer known or a row gone falls back to the default for its slot (SONDELASS_LOADOUT; a slot past the default's four is
//                 left empty and the string closes up); a forward or back special falls back to empty (the tap's). It never throws. The
//                 choice itself is kept as set, so a move lent in DEBUG comes back when the lend does.
//   A CHANGE      set(slot, move): `slot` 1..8 (the string's) or 'tap' | 'forward' | 'back' (RMB's); `move` an id the Courier knows, or
//                 null to empty a slot past the fourth or a forward or back special. Built on what plays now, so what is kept is what
//                 was shown. Emits `loadout.set { tool, slot, move, label, by: 'courier' }` (its log line: feedback/tracking/moves.js).
//
// Prior art: God Hand's Combo Tree (a chain of slots, each filled from the techniques learned), redux-persist's named slices (one
// section, written whole), and the console rule that a save that no longer fits falls back to a default rather than failing to load.
//
//   const K = new SondelassLoadout(game)   K.get() -> { string, specials }   K.set(slot, move) -> bool   K.chosen   K.reset()
// ---------------------------------------------------------------------------------------
import { SONDELASS_MOVES, SONDELASS_LOADOUT } from './sondelassloadout.js';
import { SLOTS, slotsOpen, moveStatus } from './loadoutopen.js';
import { labelOf } from './loadoutwords.js';

export const SECTION = 'sondelassLoadout';
const DIRS = ['tap', 'forward', 'back'];
const str = (x) => (typeof x === 'string' && x ? x : null);

/** What was kept, in its shape only (ids are checked when they are played: get()). Null for nothing usable. */
function shape(d) {
  if (!d || typeof d !== 'object') return null;
  const string = Array.isArray(d.string) ? d.string.slice(0, SLOTS.most).map(str) : null;
  const sp = d.specials && typeof d.specials === 'object' ? d.specials : {};
  return { string, specials: Object.fromEntries(DIRS.map((k) => [k, str(sp[k])])) };
}

export class SondelassLoadout {
  constructor(game, { catalogue = SONDELASS_MOVES, base = SONDELASS_LOADOUT } = {}) {
    this.game = game; this.cat = catalogue; this.base = base;
    this.chosen = null; this.rev = 0; this.memo = null;
    game.save?.section(SECTION, {
      scope: 'player', version: 1,
      dump: () => this.chosen,
      load: (d) => { this.chosen = shape(d); this.rev++; },
      reset: () => { this.chosen = null; this.rev++; },
    });
  }

  /** Can this id stand in a slot of this kind: a row of the catalogue, of the kind, playable, and known? */
  fits(id, kind) {
    const r = id && this.cat[id];
    if (!r || r.kind !== kind) return false;
    if (kind === 'normal' ? !r.play : !(r.wraps || r.play)) return false;
    return moveStatus(this.game, r).known;
  }

  /** What plays: the choice checked (see the header). Kept until the choice, the ledger, the lend or the mode changes. */
  get() {
    const g = this.game, key = `${this.rev}|${g?.ledger?.version ?? 0}|${g?.mode}|${!!g?.lend?.has?.('moves')}`;
    if (this.memo?.key === key) return this.memo.out;
    let out;
    try { out = this.check(this.chosen); } catch { out = this.check(null); } // (never a throw into the engine: a bad save plays the default)
    this.memo = { key, out };
    return out;
  }
  check(c) {
    const B = this.base, open = slotsOpen(this.game).n, want = c?.string || B.string, string = [];
    for (let i = 0; i < Math.min(open, Math.max(want.length, B.string.length)); i++) {
      if (this.fits(want[i], 'normal')) string.push(want[i]);
      else if (i < B.string.length && this.fits(B.string[i], 'normal')) string.push(B.string[i]); // (the default for that slot)
    }
    const specials = {};
    for (const d of DIRS) {
      const id = c?.specials ? c.specials[d] : B.specials[d];
      specials[d] = this.fits(id, 'special') ? id : this.fits(B.specials[d], 'special') && (d === 'tap' || !c?.specials) ? B.specials[d] : null;
    }
    return { string, specials };
  }

  /** Put `move` in `slot` (see the header). False, and nothing kept, for a slot not open, a move not known or of the other kind, an
   *  empty base slot, or no change. */
  set(slot, move) {
    const cur = this.get(), string = cur.string.slice(), specials = { ...cur.specials };
    move = str(move);
    if (DIRS.includes(slot)) {
      if (move ? !this.fits(move, 'special') : slot === 'tap') return false;
      if (specials[slot] === move) return false;
      specials[slot] = move;
    } else {
      const i = Math.round(+slot) - 1;
      if (!(i >= 0) || i >= slotsOpen(this.game).n) return false;
      if (move) {
        if (!this.fits(move, 'normal')) return false;
        const at = Math.min(i, string.length); // (an empty slot is filled in order: the string has no holes)
        if (string[at] === move) return false;
        string[at] = move; slot = at + 1;
      } else {
        if (i < this.base.string.length || i >= string.length) return false; // (the first four always hold a move)
        string.splice(i, 1);
      }
    }
    this.chosen = { string, specials }; this.rev++;
    this.game.save?.dirty?.(SECTION);
    this.game.events?.emit('loadout.set', { tool: 'sondelass', slot, move, label: move ? labelOf(this.cat[move]) : null, by: 'courier' });
    return true;
  }

  /** Back to the default loadout (kept as never set). */
  reset() { this.chosen = null; this.rev++; this.game.save?.dirty?.(SECTION); }
}
