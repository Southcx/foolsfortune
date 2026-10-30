// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE SONDELASS'S CUTLASS STRING (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8). Each changes a
// cutlass blow (cause `sliced`, the Sondelass in hand in its cutlass form) as it lands:
//   8  Gentle Edge     Soul Brush sub: the lent Flick wets the blade; for a string's worth of blows each calms instead of hurting
//   11 Appraised Cut   Veritome sub: a blow on a kind you have photographed lands as the type that beats its own (TRUMPS)
//   13 Reaper's Draw   Lockheart sub: a blow that downs a creature drinks its Lachryma into the coffin
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Undertale's spare (a fight won without a wound), Pokémon's type chart read from the Pokédex (Appraised Cut: the
// photograph is the appraisal), Bloodborne's blood echoes drawn from the kill, Dark Souls' Drain weapons.
//
//   cutlassSpecials(PS) -> part { lend(tool), strike(c, cause, type) -> mods | null, update(raw) }   CUTLASS_PLAY
// ---------------------------------------------------------------------------------------
import { TRUMPS } from '../../progress/combat/types.js';
import { familiarityOf } from '../../progress/familiarity.js';

/** The placeholders, each against a number the game already has. */
export const CUTLASS_PLAY = {
  // Gentle Edge: 6 blows (a cutlass string and its pause string's end); 6 real s; calm 3 real s a blow, held as the Flash's stun x4
  gentle: { n: 8, blows: 6, life: 6, calm: 3 },
  // Reaper's Draw: a down drinks half its full health into the coffin (a slip jelly's 40 fills a plain coffin's measure of 40 by half),
  // 20 at most (a crystal shard's near-half of the measure)
  reap: { n: 13, perHp: 0.5, most: 20 },
  appraise: { n: 11 },
};
/** The type that beats a type (TRUMPS read backwards). */
const BEATS = Object.fromEntries(Object.entries(TRUMPS).map(([a, b]) => [b, a]));

export function cutlassSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let gentle = null;
  const cutlass = () => g.belt?.inHand?.id === 'sondelass' && g.techs?.get?.('sondelass')?.form === 'cutlass';
  return {
    lend(tool) { if (tool === 'soulbrush' && PS.live(P().gentle.n) && cutlass()) { gentle = { left: P().gentle.blows, until: PS.now + P().gentle.life }; PS.said(P().gentle.n); } },
    strike(c, cause, type) {
      if (cause !== 'sliced' || !cutlass() || c.ally) return null;
      let mods = null;
      if (gentle && gentle.left > 0 && PS.now < gentle.until && PS.live(P().gentle.n)) { // (a calming blow: no wound, its calm put on; still worn its way round)
        gentle.left--; const G = P().gentle;
        mods = { dmg: 0, build: 0, after: (t) => { if (t.alive) g.creatures?.apply(t, 'calm', G.calm, 1, 'courier'); } };
      }
      if (PS.live(P().appraise.n) && c.affinity && BEATS[c.affinity] && BEATS[c.affinity] !== type && familiarityOf(g.ledger, c.kind).photo >= 1) {
        mods = { ...mods, type: BEATS[c.affinity] }; // (photographed: the blow is the kind that beats it)
        if (!this.appraised) { this.appraised = true; PS.said(P().appraise.n); }
      }
      if (PS.live(P().reap.n)) {
        const was = mods?.after, R = P().reap;
        mods = { ...mods, after: (t) => { was?.(t); if (t.alive) return; const n = Math.min(R.most, (t.maxHp || 0) * R.perHp), LH = g.techs?.get?.('lockheart'); if (n > 0 && LH?.feed?.(n, 'reap') > 0) PS.said(R.n); } };
      }
      return mods;
    },
    update() { if (gentle && (gentle.left <= 0 || PS.now > gentle.until)) gentle = null; },
  };
}
