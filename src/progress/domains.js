// ---------------------------------------------------------------------------------------
// THE DOMAINS: the seven skills of the Courier's psyche, six and one (docs/DESIGN.md, section 10; GLOSSARY): Ouranurgy (displacement),
// Manifestation, Divination, Psychokinesis, Possession, Alteration, and Spellscription (transcribing a thing down). Each has a level, 1
// to 99, from EXP; all seven at 99 is "The World", the end of the Fool's Journey. EXP comes from doing the domain's things, and from
// doing them WELL: every source names the event it is earned from, its base EXP, and how the event says how good it was (0 .. 1), and
// a sloppy act earns half the base and a perfect one half again (the pillar: the skill is the verb, so practice and competence drive
// the level together). The bases are relative WEIGHTS within a domain; one PACE scales every domain alike, so 99 takes the same time in
// each (300 hours of middling play at 6 acts a minute, about OSRS's pace for a skill: a placeholder until the owner sets it). A level widens what a domain can do and never does the skill for the player. Data and pure functions; nothing
// reads it yet (docs/plans/SYSTEMS.md, B8).
//
// Prior art: Old School RuneScape's skills (1 to 99 by EXP, earned only by doing the skill; the level as proof), the owner's design
// document v0.1 (the seven skills, the EXP curve floor(level^1.5 * 50 + 100) a level, "The World" ascension), Rhythm Heaven's and Gran
// Turismo's graded results (how well, not only how often).
//
//   DOMAINS[id] = { id, name, does }   SOURCES = [{ event, domain, base, quality(e) -> 0..1 }]   PACE = { hours99, actsPerMin }
//   expFor(e) -> [[domain, exp]]   scaleOf(domain) -> the multiplier that puts a domain's average act on PACE
//   toNext(level) -> exp      expAt(level) -> exp      levelOf(exp) -> 1..99
// ---------------------------------------------------------------------------------------

export const DOMAINS = {
  ouranurgy:      { id: 'ouranurgy',      name: 'Ouranurgy',      does: 'displacement: moving oneself and others through space' },
  manifestation:  { id: 'manifestation',  name: 'Manifestation',  does: 'solidifying thought into structures' },
  divination:     { id: 'divination',     name: 'Divination',     does: 'perceiving the hidden: signatures, habits, the true pitch' },
  psychokinesis:  { id: 'psychokinesis',  name: 'Psychokinesis',  does: 'moving things by will' },
  possession:     { id: 'possession',     name: 'Possession',     does: 'exerting will over other minds' },
  alteration:     { id: 'alteration',     name: 'Alteration',     does: 'reshaping what already is' },
  spellscription: { id: 'spellscription', name: 'Spellscription', does: 'transcribing a thing down: glyphs, macros, maps' },
};
export const MAX_LEVEL = 99;

const q01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

/** Where EXP comes from: the events that already exist, and the quality each one carries (a draft: the owner rules on the mapping). */
export const SOURCES = [
  { event: 'move.blink',      domain: 'ouranurgy',      base: 6,  quality: () => 0.5 },
  { event: 'grapple.swing',   domain: 'ouranurgy',      base: 10, quality: (e) => (e.phase === 'end' ? q01((e.peak || 0) / 14) : null) },
  { event: 'god.manifest',    domain: 'manifestation',  base: 18, quality: (e) => q01((e.len || 0) / 10) },
  { event: 'map.pulse',       domain: 'divination',     base: 8,  quality: () => 0.5 },
  { event: 'crystal.strike',  domain: 'divination',     base: 6,  quality: (e) => (e.by === 'courier' ? (e.sweet ? 1 : q01(e.near)) : null) },
  { event: 'photo.take',      domain: 'divination',     base: 8,  quality: (e) => q01(((e.stars || 1) - 1) / 3) },
  { event: 'god.grab',        domain: 'psychokinesis',  base: 4,  quality: () => 0.5 },
  { event: 'god.throw',       domain: 'psychokinesis',  base: 8,  quality: (e) => q01((e.speed || 0) / 30) },
  { event: 'reprogram.run',   domain: 'possession',     base: 20, quality: (e) => (e.refused ? 0 : q01(e.q)) },
  { event: 'lockheart.drain', domain: 'possession',     base: 6,  quality: () => 0.5 },
  { event: 'god.sunder',      domain: 'alteration',     base: 10, quality: (e) => q01((e.cuts || 1) / 4) },
  { event: 'god.swell',       domain: 'alteration',     base: 8,  quality: () => 0.5 },
  { event: 'god.wring',       domain: 'alteration',     base: 8,  quality: () => 0.5 },
  { event: 'reprogram.run',   domain: 'spellscription', base: 14, quality: (e) => q01(1 - (e.misses || 0) / Math.max(1, (e.chars || 1) / 4)) },
  { event: 'brush.glyph',     domain: 'spellscription', base: 10, quality: (e) => q01((e.sigils || 0) / 3 + 0.4) },
  { event: 'sigil.pop',       domain: 'spellscription', base: 4,  quality: () => 0.5 },
];

/** How long 99 takes in any domain at middling quality (0.5), and how often a domain's acts come. */
export const PACE = { hours99: 300, actsPerMin: 6 };

/** The multiplier that puts a domain's average source on PACE (defined below the curve, which it needs). */
let SCALE = null;
export function scaleOf(domain) {
  if (!SCALE) {
    SCALE = {};
    for (const d of Object.keys(DOMAINS)) {
      const src = SOURCES.filter((x) => x.domain === d), avg = src.reduce((a, x) => a + x.base, 0) / Math.max(1, src.length);
      SCALE[d] = expAt(MAX_LEVEL) / (PACE.hours99 * 60 * PACE.actsPerMin * avg * 1.0);
    }
  }
  return SCALE[domain] || 1;
}

/** The EXP an event is worth, by domain: base x the domain's scale x (0.5 + quality). A source whose quality is null does not count. */
export function expFor(e) {
  const out = [];
  for (const s of SOURCES) {
    if (s.event !== e.name) continue;
    const q = s.quality(e);
    if (q == null) continue;
    out.push([s.domain, Math.round(s.base * scaleOf(s.domain) * (0.5 + q))]);
  }
  return out;
}

/** EXP from one level to the next (v0.1's curve), the total to reach a level, and the level an EXP total stands at. */
export const toNext = (level) => Math.floor(Math.pow(level, 1.5) * 50 + 100);
const TOTAL = [0, 0];
for (let l = 2; l <= MAX_LEVEL; l++) TOTAL[l] = TOTAL[l - 1] + toNext(l - 1);
export const expAt = (level) => TOTAL[Math.max(1, Math.min(MAX_LEVEL, level))];
export function levelOf(exp = 0) {
  let l = 1;
  while (l < MAX_LEVEL && exp >= TOTAL[l + 1]) l++;
  return l;
}
