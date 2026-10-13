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
  rift: { domain: 'ouranurgy', label: 'Rift', at: 15, built: false, does: 'a linked pair of holes: what goes in one comes out the other' },
  fold: { domain: 'ouranurgy', label: 'Fold', at: 35, built: false, does: 'two patches of ground trade places' },
  hasten: { domain: 'ouranurgy', label: 'Hasten / Stay', at: 15, built: false, does: 'matter\'s time over a patch runs four times as fast, or stops' },
  sculpt: { domain: 'manifestation', label: 'Sculpt', at: 15, built: false, does: 'raise a ramp, an arch or a bridge' },
  fire: { domain: 'manifestation', label: 'Fire', at: 35, built: false, does: 'harden a creation until the mending' },
  totem: { domain: 'manifestation', label: 'Totem', at: 60, built: false, does: 'hold a miracle\'s weather on one spot for a game hour' },
  strata: { domain: 'divination', label: 'Strata', at: 15, built: false, does: 'see the layers under the hand' },
  course: { domain: 'divination', label: 'Course', at: 35, built: false, does: 'see where a pour will run before it falls' },
  read: { domain: 'divination', label: 'Read', at: 60, built: false, does: 'see a creature\'s next intent from above' },
  gust: { domain: 'psychokinesis', label: 'Gust', at: 15, built: false, does: 'a stroke of wind' },
  slab: { domain: 'psychokinesis', label: 'Slab', at: 35, built: false, does: 'lift a slab of ground and set it down elsewhere' },
  herd: { domain: 'possession', label: 'Herd', at: 15, built: false, does: 'creatures near a drawn line walk it' },
  take: { domain: 'possession', label: 'Take', at: 35, built: false, does: 'play a creature from above' },
  muster: { domain: 'possession', label: 'Muster', at: 60, built: false, does: 'hatched clapperjars carry matter where the hand points' },
  transmute: { domain: 'alteration', label: 'Transmute', at: 15, built: false, does: 'sand to clay and back; a pool to your draught\'s feeling' },
  ward: { domain: 'spellscription', label: 'Ward', at: 15, built: false, does: 'a circle creatures cannot cross' },
  stamp: { domain: 'spellscription', label: 'Stamp', at: 35, built: false, does: 'copy a patch of terrain and press it down elsewhere' },
};

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
