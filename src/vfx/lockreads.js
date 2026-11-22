// ---------------------------------------------------------------------------------------
// WHAT THE LOCK READS (plain name; South, 2026-11-22: "the lock on should function uniquely depending on your main tool ... with unarmed and
// Sondelass lock-on, it should be just the bracket reticule, but with the Veritome, it should have the full spread of information"): the
// lines of a creature's tag (vfx/creaturetags.js) the lock shows, by the tool in the hands. Each tool sees what it acts on, nothing more:
//   nothing drawn, the Sondelass   no tag: the target mark's gold prism and its blades alone (a blade wants only where to cut)
//   the psygun     the name and HP (a marksman's readout: how much is left)
//   the Soul Brush the name, WEAK and AGITATION (the paint answers a type and a feeling's heat)
//   the Dreamvane  the name, NOW and STATUS (the dowser and the net: what it is doing, whether it is aware, stunned or asleep)
//   the Crucibelle the name, STATUS and AGITATION (the bard plays to a mood: sleep, haste, the heat to calm)
//   the Lockheart  the name, HP and AGITATION (the drain wants the agitation's band and a body low enough to take)
//   the Veritome   every line (the book that sees: the full spread, as its raised lens always shows)
// The Veritome's raised lens and a flare's reveal keep their own reads (the lens every line; a flare's finds as the psygun's lock). The
// settings `visual.creatureTags` and `visual.creatureTagsMinimal` still rule over this (off is off).
// Prior art: Metroid Prime's visors (each sees its own layer of the same target), Monster Hunter's scoutflies (more as you learn it),
// Zelda's Z-target (the lock itself a bracket only, the reading left to the lens).
//
//   lockReads(game) -> null (no tag) | 'all' | [line keys]     LOCK_READS
// ---------------------------------------------------------------------------------------

export const LOCK_READS = {
  none: null, sondelass: null,
  psygun: ['name', 'health'],
  soulbrush: ['name', 'weak', 'emo'],
  dreamvane: ['name', 'habit', 'statuses'],
  crucibelle: ['name', 'statuses', 'emo'],
  lockheart: ['name', 'health', 'emo'],
  veritome: 'all',
};

/** The lines the lock shows now, by the tool in the hands (the belt's), or none drawn. */
export function lockReads(game) {
  const id = game?.belt?.inHand?.id ?? 'none';
  return id in LOCK_READS ? LOCK_READS[id] : null;
}
