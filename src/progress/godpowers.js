// ---------------------------------------------------------------------------------------
// THE GOD HAND'S POWERS, AS DATA (docs/plans/GODHAND.md section 8): every power of the hand belongs to one of the seven domains
// (progress/domains.js; no new domains, ever), pays that domain's experience (the `god.<power>` sources in domains.js) and opens by
// its level, as the house opens arts: by achievement, never by purchase. The first five (the God Arts that were) are open from the
// start; the matter's verbs, the miracles and the domains' other powers open at a level of their domain; the seven epic miracles at 80.
// A lent `arts` category (DEBUG's lend panel) or the all-arts switch opens all of them, uncounted.
// Also the seven miracles' signs (the Soul Brush's gesture reader's shapes, soulbrush/gesture.js) and the epics' numbers.
// Data and pure functions: nothing here touches three.js.
//
// Prior art: OSRS (a skill's level opens what you can do with it); Black & White (a miracle cast by drawing its sign); the house's own
// MOVES table (progress/combat/moves.js: unlocks as ledger predicates).
//
//   GOD_POWERS[id] = { id, domain, label, at, built, cost?, does }   powerOpen(id, game) -> bool   MIRACLE_SIGNS[shape+sigil] -> feeling
//   MIRACLES[feeling] = { label, status, dur, sizes }   EPICS[id] = { domain, label, sign, r, dur, jar }   EPIC_EVERY (real s)
// ---------------------------------------------------------------------------------------

/** `at`: the domain's level that opens it (1 open from the start); `built`: whether the hand has it yet (the rest are in GODHAND.md
 *  section 8 and come in later rounds). `cost`: Lachryma, where the power names one. */
export const GOD_POWERS = {
  // the God Arts that were (godhand/arts.js): open from the start
  telekinesis: { domain: 'psychokinesis', label: 'Telekinesis', at: 1, built: true, does: 'lift and throw' },
  sunder: { domain: 'alteration', label: 'Sunder', at: 1, built: true, does: 'draw a blade' },
  swell: { domain: 'alteration', label: 'Swell', at: 1, built: true, does: 'grow or shrink' },
  wring: { domain: 'alteration', label: 'Wring', at: 1, built: true, does: 'twist the clay' },
  manifest: { domain: 'manifestation', label: 'Manifest', at: 1, built: true, does: 'raise clay' },
  // the matter's verbs (GODHAND.md section 3)
  scoop: { domain: 'psychokinesis', label: 'Scoop', at: 1, built: true, does: 'take matter up and pour it out', made: 0.5 },
  shape: { domain: 'alteration', label: 'Shape', at: 1, built: true, does: 'raise or lower the ground; Shift to level it', made: 0.5 },
  carve: { domain: 'alteration', label: 'Carve', at: 1, built: true, does: 'cut a channel' },
  // the seven miracles: Spellscription's (GODHAND.md section 4), each also needing its feeling known
  miracle: { domain: 'spellscription', label: 'Miracles', at: 1, built: true, does: 'draw a feeling\'s sign to call its weather down' },
  // the domains' other powers (GODHAND.md section 8): the order listed is the order they open
  rift: { domain: 'ouranurgy', label: 'Rift', at: 15, built: true, does: 'a linked pair of holes: what goes in one comes out the other' },
  fold: { domain: 'ouranurgy', label: 'Fold', at: 35, built: true, does: 'two patches of ground trade places' },
  hasten: { domain: 'ouranurgy', label: 'Hasten / Stay', at: 15, built: true, does: 'matter\'s time over a patch runs four times as fast, or stops' },
  sculpt: { domain: 'manifestation', label: 'Sculpt', at: 15, built: true, does: 'raise a pillar, an arch, a bridge or a ramp of clay', made: 0.6 },
  fire: { domain: 'manifestation', label: 'Fire', at: 35, built: true, does: 'harden a creation until the mending' },
  totem: { domain: 'manifestation', label: 'Totem', at: 60, built: true, does: 'hold a miracle\'s weather on one spot for a game hour' },
  strata: { domain: 'divination', label: 'Strata', at: 15, built: true, does: 'see the layers under the hand' },
  course: { domain: 'divination', label: 'Course', at: 35, built: true, does: 'see where a pour will run before it falls' },
  read: { domain: 'divination', label: 'Read', at: 60, built: true, does: 'see a creature\'s next intent from above' },
  gust: { domain: 'psychokinesis', label: 'Gust', at: 15, built: true, does: 'a stroke of wind' },
  slab: { domain: 'psychokinesis', label: 'Slab', at: 35, built: true, does: 'lift a slab of ground and set it down elsewhere' },
  herd: { domain: 'possession', label: 'Herd', at: 15, built: true, does: 'creatures near a drawn line walk it' },
  take: { domain: 'possession', label: 'Take', at: 35, built: true, does: 'play a creature from above' },
  muster: { domain: 'possession', label: 'Muster', at: 60, built: true, does: 'hatched clapperjars carry matter where the hand points' },
  transmute: { domain: 'alteration', label: 'Transmute', at: 15, built: true, does: 'sand to clay and back; a pool to your draught\'s feeling' },
  ward: { domain: 'spellscription', label: 'Ward', at: 15, built: true, does: 'a circle creatures cannot cross' },
  stamp: { domain: 'spellscription', label: 'Stamp', at: 35, built: true, does: 'copy a patch of terrain and press it down elsewhere' },
};

/** The domains' other powers (GODHAND.md 8), each an event `god.<id>` (godhand/powers.js; counted in feedback/tracking/god.js). */
export const POWER_EVENTS = ['rift', 'fold', 'hasten', 'fire', 'totem', 'strata', 'course', 'read', 'gust', 'slab', 'herd', 'take', 'muster', 'transmute', 'ward', 'stamp'];

/** Each domain's kiln glaze (Calissa, 2026-10-13: glazes, not hues, since the seven feelings own the wheel's hues): its tile's two colours
 *  (`a` to `b`), the mark colour on the ground and the radar's tip (`mark`), and its glyph (unicode until her pixel icons). */
export const DOMAIN_GLAZE = {
  ouranurgy: { glaze: 'Ru celadon', a: '#9cc3b8', b: '#9cc3b8', mark: 0x9cc3b8, glyph: '☁' }, // (a cloud with a spiral)
  manifestation: { glaze: 'fire-flashed shino', a: '#e8d6c0', b: '#d9814a', mark: 0xd9814a, glyph: '✍' }, // (a hand drawing a shape from a dot)
  divination: { glaze: 'yohen tenmoku', a: '#1a1418', b: '#b9b4e8', mark: 0xb9b4e8, glyph: '◉' }, // (an eye in a ring; violet-silver spots, off Wonder's colour)
  psychokinesis: { glaze: 'oxblood', a: '#8e1f1f', b: '#8e1f1f', mark: 0x8e1f1f, glyph: '⟫' }, // (three arcs pushing out)
  possession: { glaze: 'Jun ware', a: '#7d93c4', b: '#8a4f9e', mark: 0x7d93c4, glyph: '◐' }, // (a mask)
  alteration: { glaze: 'flambé', a: '#a8324a', b: '#4a5fa8', mark: 0xa8324a, glyph: '↻' }, // (a looped arrow)
  spellscription: { glaze: 'cobalt on porcelain', a: '#f2efe6', b: '#2a4fa0', mark: 0x2a4fa0, glyph: '✎' }, // (a brush stroke)
};
export const DOMAIN_COLOUR = Object.fromEntries(Object.entries(DOMAIN_GLAZE).map(([d, g]) => [d, g.mark]));

/** The seven domains in the hand's order (keys 1 to 7 on the hand pick one; DOMAINS' own order, progress/domains.js). */
export const DOMAIN_ORDER = ['ouranurgy', 'manifestation', 'divination', 'psychokinesis', 'possession', 'alteration', 'spellscription'];

/** THE RAMP (GODHAND.md section 11): the endgame first. At 99 in a domain its powers are Creative mode (Minecraft's): matter made from
 *  nothing is free, the reach and the sizes are the island's, a fired creation stands for good. Each row is a number's value where its
 *  power opens and at 99, `[open, at99]`; between them it follows the level on RAMP_CURVE, so most of the gain comes late (OSRS's
 *  curve: the last levels are the ones that change what you can do). What never loosens: the Zone of Influence (only ground you know),
 *  the island's mending (but a fired creation), one epic a game hour and its toll in the jar, and the island noticing (rejection,
 *  heat at a tenth). */
export const RAMP = {
  scoop: { carry: [20, 400], made: [0.5, 0] },
  shape: { rate: [1.4, 6], r: [1.6, 6], made: [0.5, 0] },
  carve: { w: [1.4, 5], depth: [1.2, 6], len: [18, 64] },
  sculpt: { len: [16, 64], scale: [1, 3], made: [0.6, 0] },
  miracle: { cost: [1, 0.2], size: [1, 2] },
  rift: { pairs: [1, 4], dur: [60, 1200], r: [1.5, 4] },
  fold: { side: [4, 24] },
  hasten: { r: [4, 20], scale: [4, 16], dur: [20, 300] },
  fire: { hold: [150, 3600], r: [3, 12] }, // (real seconds a fired creation stands; at 99, for good: FIRE_FOREVER)
  totem: { n: [1, 5], dur: [150, 3600], r: [6, 16] },
  strata: { len: [12, 60] },
  course: { steps: [80, 600] },
  read: { r: [20, 80] },
  gust: { len: [10, 40], power: [6, 24] },
  slab: { side: [3, 16] },
  herd: { r: [6, 24], n: [4, 30], dur: [20, 120] },
  take: { dur: [20, 600] },
  muster: { n: [2, 12], rate: [0.5, 6], dur: [60, 900] },
  transmute: { r: [2, 10] },
  ward: { n: [1, 6], r: [6, 18], dur: [60, 1200] },
  stamp: { side: [4, 24], made: [0.5, 0] },
  heat: { scale: [1, 0.1] }, // (rejection's heat from a domain's acts, by that domain's level from 1)
};
export const RAMP_CURVE = 1.6;
export const FIRE_FOREVER = 99;

/** A ramped number for a power now, by its domain's level (a lend opens a power, and leaves its numbers where the level has them). */
export function rampOf(id, key, game) {
  const row = RAMP[id]?.[key]; if (!row) return undefined;
  const p = GOD_POWERS[id], domain = p?.domain, at = p?.at ?? 1;
  const level = domain ? game?.psyche?.level?.(domain) ?? 1 : 1;
  const t = Math.max(0, Math.min(1, (level - at) / Math.max(1, 99 - at)));
  return (row[0] + (row[1] - row[0]) * Math.pow(t, RAMP_CURVE)) * (game?.bracelet?.mod?.(domain, key) ?? 1); // (the bracelet's charms: progress/bracelet.js)
}
/** Rejection's heat scale for an act of a domain (RAMP.heat over that domain's level from 1). */
export function heatScale(domain, game) {
  const level = game?.psyche?.level?.(domain) ?? 1, t = Math.max(0, Math.min(1, (level - 1) / 98));
  return (RAMP.heat.scale[0] + (RAMP.heat.scale[1] - RAMP.heat.scale[0]) * Math.pow(t, RAMP_CURVE)) * (game?.bracelet?.heat?.(domain) ?? 1); // (QUIET)
}

/** Open for this Courier now: its domain's level, or a lend. */
export function powerOpen(id, game) {
  const p = GOD_POWERS[id] || EPICS[id];
  if (!p) return false;
  if (game?.system?.lendAll || game?.lend?.has?.('arts')) return true;
  const level = game?.psyche?.level?.(p.domain) ?? 1;
  return level >= (p.at ?? 80);
}

/** The miracles' signs: the gesture reader's shape (and, for a line, its sigil) to a feeling. Read as the feeling looks: Wonder a peak
 *  (^), Mirth a grin (V), Desire a heart, Fury a bolt, Gall a churning spiral, Grief a falling tear (|), Dread the eclipse's disc (a
 *  circle). */
export const MIRACLE_SIGNS = { caret: 'wonder', vee: 'mirth', heart: 'desire', bolt: 'fury', spiral: 'gall', 'line|': 'grief', circle: 'dread' };
export const signOf = (rec) => (rec ? MIRACLE_SIGNS[rec.name === 'line' ? `line${rec.sigil === '|' ? '|' : '—'}` : rec.name] || null : null);

/** A miracle by its feeling (GODHAND.md section 4): its label (working words, Espada's), the status it puts on creatures under it, how
 *  long it lasts and how wide, small to great (the sign's drawn size sets which: a sign the height of a fifth of the view is small, of
 *  three fifths great), and its Lachryma, small to great. */
export const MIRACLES = {
  wonder: { label: 'Aurora', status: 'halt', r: [6, 20], dur: [10, 30], cost: [10, 40] },
  mirth: { label: 'Fizz', status: 'stun', r: [6, 20], dur: [10, 30], cost: [10, 40] },
  desire: { label: 'Pull', status: null, r: [6, 20], dur: [10, 30], cost: [10, 40] },
  fury: { label: 'Storm', status: null, r: [6, 20], dur: [10, 30], cost: [12, 45], every: 1.2, power: 3 },
  gall: { label: 'Blight', status: 'halt', r: [6, 20], dur: [10, 30], cost: [10, 40], every: 1.5, retch: 0.6, corrode: 0.04 },
  grief: { label: 'Rain', status: 'slow', r: [6, 20], dur: [10, 30], cost: [10, 40], rain: 0.012 },
  dread: { label: 'Eclipse', status: 'flee', r: [6, 20], dur: [10, 30], cost: [10, 40] },
};

/** The seven epic miracles (GODHAND.md section 5): one a domain, drawn as the sign with Shift held, paid in the jar (`jar`, a share of
 *  its strength), one a game hour (EPIC_EVERY, real seconds); open at 80 of their domain. */
export const EPICS = {
  stoppedHour: { domain: 'ouranurgy', label: 'Stopped Hour', sign: 'dread', r: 40, dur: 10, jar: 0.25, at: 80 },
  volcano: { domain: 'manifestation', label: 'Volcano', sign: 'fury', r: 12, dur: 30, jar: 0.25, at: 80, cone: 5, lava: 0.7 },
  prophecy: { domain: 'divination', label: 'Prophecy', sign: 'wonder', r: 60, dur: 4, jar: 0.25, at: 80 },
  maelstrom: { domain: 'psychokinesis', label: 'Maelstrom', sign: 'desire', r: 25, dur: 12, jar: 0.25, at: 80, lift: 9, swirl: 14 },
  stampede: { domain: 'possession', label: 'Stampede', sign: 'mirth', r: 40, dur: 15, jar: 0.25, at: 80 },
  earthquake: { domain: 'alteration', label: 'Earthquake', sign: 'gall', r: 30, dur: 8, jar: 0.25, at: 80, heave: 0.6 },
  deluge: { domain: 'spellscription', label: 'Deluge', sign: 'grief', r: 30, dur: 20, jar: 0.25, at: 80, rate: 0.05 },
};
export const EPIC_BY_SIGN = Object.fromEntries(Object.entries(EPICS).map(([id, e]) => [e.sign, id]));
export const EPIC_EVERY = 150; // (a game hour: 150 real seconds)
