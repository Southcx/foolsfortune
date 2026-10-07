// ---------------------------------------------------------------------------------------
// THE CROSSING'S SCORE: what a run on the rail is worth, and why (docs/plans/RAIL.md). A crossing pays no cubes (the Emocean is the
// travel layer: emocean.js), so the score is the arcade's own currency: a rank, a medal, the ledger's records and the achievements, and
// the quality that pays Ouranurgy (domains.js, via stageQuality). Every rule rewards a way of playing the genre taught:
//   - A DOWN pays by class (Guppy 100 .. Leviathan 10,000), twice at point blank (DoDonPachi, Mushihime-sama: courage pays), three
//     times when the thing was killed by its own shot sent back (Sin & Punishment).
//   - A CHAIN is three downs of one feeling in a row (Ikaruga; a shoal's fish are one body and never chain): each chain doubles the bonus, 100, 200, 400 .. up to 25,600 (Ikaruga's
//     own cap); a down of another feeling in the middle of a three breaks it to nothing. So the order you kill in is a puzzle.
//   - A VOLLEY (the lock-on: RayStorm, RayCrisis) pays 50, doubling for every lock past the first, but only when every locked target
//     is downed: eight locks, eight downs, 6,400. Greed checked by precision.
//   - ABSORBING a shot of your own feeling (the ship's polarity: Ikaruga) pays 10 and fills the pool that the lances spend.
//   - The tally (Star Fox 64): what the ship still bears is worth 1,000 a hit; the set piece's end pays its own (a brig sunk, a
//     Leviathan driven off or felled).
// The RANK is the score against PAR, the median of an expert's run measured by scripts/rail.mjs (S at par, then halving: A at half, B a
// quarter, C an eighth); the MEDAL is Star Fox's: the stage passed with four in five of what came downed.
//
//   SCORE   chain() -> state   chainDown(state, aspect) -> bonus   volleyBonus(locked, downed)   downScore({ cls, pointBlank, returned })
//   PAR[setPiece]   rankOf(score, setPiece) -> 'S'|'A'|'B'|'C'|'D'   medalOf({ passed, downed, spawned }) -> bool
// ---------------------------------------------------------------------------------------

export const SCORE = {
  cls: [100, 300, 1000, 3000, 10000], // (Guppy .. Leviathan: about three times a class, as their hit points are)
  pointBlank: { within: 4, mult: 2 }, // (metres from the ship's nose: inside a bait ball, every fish is point blank, and that is the joy)
  returned: 3, // (a down by a parried shot)
  chain: { of: 3, base: 100, cap: 25600 },
  volley: { base: 50, max: 8 },
  absorb: 10,
  bears: 1000, // (each hit the ship could still have borne, at the tally)
  end: { sunk: 5000, struck: 3000, driven: 8000, felled: 20000, scattered: 1500 }, // (the set piece's end; `scattered`: the shoal's caller downed)
  part: { port: 500, rigging: 800, boarder: 300, gill: 2000, tooth: 500 },
  rank: [['S', 1], ['A', 0.5], ['B', 0.25], ['C', 0.12]], // (halving bands: the chain doubles, so an expert scores about four times a good player, as in Ikaruga; measured, three-quarter bands ranked every good shoal D)
  medal: 0.8,
};

/** A fresh chain (Ikaruga's): the feeling of the three being counted, how many of it so far, and the chains made. */
export const chain = () => ({ aspect: null, of: 0, links: 0 });
/** A down of `aspect` on the chain (state changed in place): the bonus it pays (0 unless it completes a three). */
export function chainDown(s, aspect) {
  if (s.of === 0 || aspect === s.aspect) { s.aspect = aspect; s.of++; }
  else { s.aspect = aspect; s.of = 1; s.links = 0; } // (another feeling inside a three: the chain is broken)
  if (s.of < SCORE.chain.of) return 0;
  s.of = 0; s.links++;
  return Math.min(SCORE.chain.cap, SCORE.chain.base * 2 ** (s.links - 1));
}
/** A volley's bonus: every target locked must be downed by it. */
export const volleyBonus = (locked, downed) => (locked > 0 && downed >= locked ? SCORE.volley.base * 2 ** (Math.min(locked, SCORE.volley.max) - 1) : 0);
/** One down: its class's worth, doubled at point blank, tripled when its own shot did it. */
export const downScore = ({ cls = 0, pointBlank = false, returned = false }) => SCORE.cls[Math.max(0, Math.min(4, cls))] * (pointBlank ? SCORE.pointBlank.mult : 1) * (returned ? SCORE.returned : 1);

/** Par by setPiece: an expert's median score (scripts/rail.mjs, the 'expert' profile, 2000 runs each, the Margarite run). Re-measured
 *  whenever a number in progress/rail/ moves: `node scripts/rail.mjs --par`. */
export const PAR = { shoal: 102000, pirates: 37000, leviathan: 60500 }; // (measured 2026-10-07, 3000 runs each)
export function rankOf(score, setPiece = 'shoal') {
  const p = PAR[setPiece] || PAR.shoal;
  for (const [r, share] of SCORE.rank) if (score >= p * share) return r;
  return 'D';
}
/** Star Fox 64's medal: the stage passed, with four in five of what came at the ship downed. */
export const medalOf = ({ passed = false, downed = 0, spawned = 0 }) => passed && spawned > 0 && downed / spawned >= SCORE.medal;
