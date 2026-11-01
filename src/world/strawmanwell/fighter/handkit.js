// ---------------------------------------------------------------------------------------
// THE ARENA'S KIT BY THE HAND (FIGHTER.md 8; South, 2026-11-01: the melee tools' combos on Smash's two buttons): what the Courier's
// fighter fights with, read from the tool in the hands (game.belt.inHand) and, bare-handed, the bare set chosen at the KIT lectern
// (standard, or the brawler). The moves are progress/fighterkits.js's; this module only reads the world for it: the belt, and the
// Sondelass's melee loadout (its string and its RMB specials, as their combat/moves.js rows, with the catalogue's clips for the poses).
// It is asked each fixed step and answers the same object until something it reads changes, so the kernel never rebuilds a kit mid-move.
//
// Prior art: Super Smash Bros.' items that change a fighter's moves while held (the Beam Sword's own jab and smashes, the Home-Run
// Bat's smash), here every tool; the loadout editor's string as the kit's (God Hand's combo tree feeding the jabs).
//
//   const H = new HandKit(game)   H.kit() -> kit | null (the fighter's `kit`: { tool, reach, moves, boxes?, poses? })   H.choices() -> [ids]
//   H.choose(id) ('standard' | 'brawler' | a worn tool's id: drawn, or the hands emptied)   H.label() -> [title, sub]   H.variant
// ---------------------------------------------------------------------------------------
import { kitFor } from '../../../progress/fighterkits.js';
import { SONDELASS_MOVES } from '../../../tools/sondelass/sondelassloadout.js';

const BARE = ['standard', 'brawler'];
const rowOf = (id) => (id ? SONDELASS_MOVES[id]?.rule || id : null);
const LABEL = { standard: 'BARE HANDS', brawler: 'BRAWLER', psygun: 'THE PSYGUN', sondelass: 'THE SONDELASS', soulbrush: 'THE SOUL BRUSH',
  veritome: 'THE VERITOME', dreamvane: 'THE DREAMVANE', crucibelle: 'THE CRUCIBELLE', lockheart: 'THE LOCKHEART' };

export class HandKit {
  constructor(game) { this.game = game; this.variant = 'standard'; this.memo = null; }

  /** The tool in the hands, by id, or null. */
  get hand() { return this.game.belt?.inHand?.id || null; }

  /** The fighter's kit now (the same object while nothing it reads has changed). */
  kit() {
    const tool = this.hand, L = tool === 'sondelass' ? this.game.sondelassLoadout?.get?.() : null;
    const key = `${tool}|${this.variant}|${L ? JSON.stringify(L) : ''}`;
    if (this.memo?.key === key) return this.memo.kit;
    let kit;
    if (tool === 'sondelass') {
      const str = (L?.string || ['c1', 'c2', 'c3', 'c4']).map(rowOf), sp = L?.specials || { tap: 'stinger' };
      kit = kitFor(tool, { string: str, specials: { tap: rowOf(sp.tap), forward: rowOf(sp.forward), back: rowOf(sp.back) } });
      if (kit) { // (the catalogue's own clips for the loadout's slots: the keys pose to the kit's frames, KEY-POSES.md 2)
        const ids = L?.string || ['c1', 'c2', 'c3', 'c4'], poses = {};
        ['jab1', 'jab2', 'jab3', 'ftilt'].forEach((slot, i) => { const c = SONDELASS_MOVES[ids[i]]?.clip; if (c) poses[slot] = { clip: c, limb: 'R' }; });
        const tap = SONDELASS_MOVES[sp.tap]?.clip; if (tap) poses.nspecial = { clip: tap, limb: 'R' };
        kit.poses = poses;
        if (!sp.back) kit.boxes = { ...(kit.boxes || {}), dspecial: [[0, 0.6, 1.8]] }; // (the Tidecutter's ring, about its 4.2 m with the blade's reach)
      }
    } else kit = kitFor(tool, { variant: this.variant });
    if (kit && kit.moves.nspecial && !kit.moves.nspecial.chargeShot && kit.moves.nspecial.special !== 'shot') {
      const r = kit.moves.nspecial.radius; // (a special that is not the shot needs a box of its own: a lunge's ahead, an area's round)
      kit.boxes = { ...(kit.boxes || {}), nspecial: r ? [[0, 0.8, Math.min(3, r * 0.5)]] : [[0.85, 1.0, 0.45]] };
    }
    for (const slot of ['nspecial', 'sspecial']) if (kit?.moves[slot]?.special === 'lunge') kit.boxes = { ...(kit.boxes || {}), [slot]: [[0.75, 1.05, 0.42]] }; // (a lunge's box rides ahead of it)
    this.memo = { key, kit };
    return kit;
  }

  /** What the KIT lectern cycles: the two bare sets, then the worn tools (the belt's main and sub). */
  choices() {
    const B = this.game.belt, worn = [B?.main, B?.sub].filter(Boolean);
    return [...BARE, ...worn];
  }
  /** What the hands hold now, as the lectern's choice. */
  current() { return this.hand || this.variant; }
  /** The next choice: a bare set empties the hands, a tool is drawn (the belt's own draw: the others put away first). */
  next() {
    const C = this.choices(), i = C.indexOf(this.current());
    return this.choose(C[(i + 1) % C.length]);
  }
  choose(id) {
    const B = this.game.belt;
    if (BARE.includes(id)) { this.variant = id; B?.inHand?.stow?.(); return id; }
    const t = B?.get?.(id); if (!t) return null;
    B.draw(t); return id;
  }
  label() { const c = this.current(); return ['KIT', LABEL[c] || String(c).toUpperCase()]; }
}
