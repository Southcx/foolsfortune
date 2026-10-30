// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE SONDELASS'S CUTLASS STRING (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and
// numbers Dovina's, progress/toolpairs.js SPECIAL_PLAY). Each changes a cutlass blow (cause `sliced`, the Sondelass in hand in its cutlass
// form) as it lands:
//   8  Gentle Edge     Soul Brush sub: for `life` after the lent Flick, the blows hurt at `hurt` and build calm at `calm` of their power
//   11 Appraised Cut   Veritome sub: a blow on a kind you know at familiarity `known` or more lands as the type that beats its own (TRUMPS:
//                      the chart's own x`mult`)
//   13 Reaper's Draw   Lockheart sub: a creature downed by the cutlass gives its Lachryma straight to the coffin, `share` of a drain's done
//                      at once, up to the coffin's measure
//
// Prior art: Undertale's spare (a fight won without a wound), Pokémon's type chart read from the Pokédex (Appraised Cut), Bloodborne's
// blood echoes drawn from the kill, Dark Souls' Drain weapons (Reaper's Draw).
//
//   cutlassSpecials(PS) -> part { lend(tool), strike(c, cause, type, power) -> mods | null, update(raw) }; each act said with its place
//   (pair.special, pair.hit: tools/pairspecials.js) for its look (vfx/pairspeciallooks.js)
// ---------------------------------------------------------------------------------------
import { TRUMPS } from '../../progress/combat/types.js';
import { familiarityOf } from '../../progress/familiarity.js';
import { HOOVER } from '../lockheart/lockheart.js';

/** Petra's, where the rows are silent: calm put on at `CALM_AT` of its build (a string of four light blows of power 1 at 0.5: "a string of
 *  four calms a slip jelly"), held as long as Gentle Edge's life; a drain lasts as long as a mind stays laid low (its `stunFor`, 4.5 real s
 *  when unsaid: stun.js's depth 1). */
const CALM_AT = 2, DOWN_S = 4.5;
/** The type that beats a type (TRUMPS read backwards). */
const BEATS = Object.fromEntries(Object.entries(TRUMPS).map(([a, b]) => [b, a]));

export function cutlassSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let gentle = null;
  const calm = new WeakMap(); // (a creature's calm build-up from Gentle Edge's blows)
  const cutlass = () => g.belt?.inHand?.id === 'sondelass' && g.techs?.get?.('sondelass')?.form === 'cutlass';
  return {
    lend(tool) { if (tool === 'soulbrush' && PS.live(P().gentleEdge.n) && cutlass()) { gentle = { until: PS.now + P().gentleEdge.life }; PS.said(P().gentleEdge.n, { dur: P().gentleEdge.life }); } },
    strike(c, cause, type, power = 1) {
      if (cause !== 'sliced' || !cutlass() || c.ally) return null;
      let mods = null;
      if (gentle && PS.now < gentle.until && PS.live(P().gentleEdge.n)) { // (a calming blow: a quarter of its wound, its calm built)
        const G = P().gentleEdge, b = (calm.get(c) || 0) + power * G.calm;
        mods = { dmg: G.hurt, after: (t) => {
          PS.hit(G.n, { target: t }); if (!t.alive) return;
          if (b >= CALM_AT) { calm.set(t, 0); g.creatures?.apply(t, 'calm', G.life, 1, 'courier'); } else calm.set(t, b);
        } };
      }
      const A = P().appraisedCut;
      if (PS.live(A.n) && c.affinity && BEATS[c.affinity] && BEATS[c.affinity] !== type && familiarityOf(g.ledger, c.kind).level >= A.known) {
        mods = { ...mods, type: BEATS[c.affinity] }; // (known well enough: the blow is the kind that beats it, the chart's own trump)
        PS.said(A.n, { target: c }); PS.hit(A.n, { target: c });
      }
      if (PS.live(P().reapersDraw.n)) {
        const was = mods?.after, R = P().reapersDraw;
        mods = { ...mods, after: (t) => {
          was?.(t); if (t.alive) return;
          const LH = g.techs?.get?.('lockheart'); if (!LH) return;
          const n = Math.min(R.share * HOOVER.drain * (t.stunFor || DOWN_S), Math.max(0, LH.fill - LH.charge)); // (a drain's worth at once, up to the measure)
          if (n > 0 && LH.feed?.(n, 'reap') > 0) PS.said(R.n, { target: t }); // (drunk into the coffin from where it fell)
        } };
      }
      return mods;
    },
    update() { if (gentle && PS.now > gentle.until) gentle = null; },
  };
}
