// ---------------------------------------------------------------------------------------
// THE DOMAINS: the seven skills of the Courier's psyche, six and one (docs/DESIGN.md, section 10; GLOSSARY): Ouranurgy (displacement),
// Manifestation, Divination, Psychokinesis, Possession, Alteration, and Spellscription (transcribing a thing down). Each has a level, 1
// to 99, from EXP; all seven at 99 is "The World", the end of the Fool's Journey. EXP comes from doing the domain's things, and from
// doing them WELL: every source names the event it is earned from, its base EXP, and how the event says how good it was (0 .. 1), and
// and the weight of quality is steep on purpose (the owner, 2026-10-04: "a god-gamer should progress much faster"): SKILL's curve gives
// a rote act 0.4 of the base, a middling one about 1, and a masterful one 5, so the grind to "The World" is about 2,100 hours and a
// player who plays ambitiously and well gets there in about 400. A source's quality should measure ambition as well as accuracy (the
// fragile formation's sweet spot, the long macro typed clean, the four-star photograph), never repetition. The bases are relative WEIGHTS within a domain; one PACE scales every domain alike, so 99 takes the same time in
// each (300 hours of middling play at 6 acts a minute, about OSRS's pace for a skill: a placeholder until the owner sets it). A level widens what a domain can do and never does the skill for the player. Data and pure functions; progress/psyche.js
// earns it in play (docs/plans/SYSTEMS.md, B8).
//
// Prior art: Old School RuneScape's skills (1 to 99 by EXP, earned only by doing the skill; the level as proof), the owner's design
// document v0.1 (the seven skills, the EXP curve floor(level^1.5 * 50 + 100) a level, "The World" ascension), Rhythm Heaven's and Gran
// Turismo's graded results (how well, not only how often).
//
//   DOMAINS[id] = { id, name, does }   SOURCES = [{ event, domain, base | acts, quality(e) -> 0..1 }]   PACE = { hours99, actsPerMin }
//   SKILL = { floor, ceil, power }   skillWeight(q) -> floor .. ceil   expFor(e) -> [[domain, exp]]   scaleOf(domain) -> on PACE
//   toNext(level) -> exp      expAt(level) -> exp      levelOf(exp) -> 1..99
//   WIDEN[key] = { domain, mult | plus, at99, does }      widenAt(key, level) -> a multiplier, or a bonus to a count
// ---------------------------------------------------------------------------------------
import { stageQuality } from './econ/emocean.js';

export const DOMAINS = {
  ouranurgy:      { id: 'ouranurgy',      name: 'Ouranurgy',      does: 'the rules of the space around you: displacement through it, and time slowed or stopped in it (the owner, 2026-10-08)' },
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
  { event: 'map.surveyed',    domain: 'divination',     base: 8,  quality: (e) => q01((e.gained || 0) * 4) }, // (a quarter newly charted is masterful; a pulse over charted ground is rote: Petra, 2026-10-08)
  { event: 'crystal.strike',  domain: 'divination',     base: 6,  quality: (e) => (e.by === 'courier' ? (e.sweet ? 1 : q01(e.near)) : null) },
  // (Calissa, 2026-10-08: the continuous score once photo.take carries it, halved for a kind the Compendium already holds as well:
  // 24 plates of one pot must not pay 24 times; until then the stars)
  { event: 'photo.take',      domain: 'divination',     base: 8,  quality: (e) => (e.score != null ? q01((e.score - 50) / 200) * (e.fresh === false ? 0.5 : 1) : q01(((e.stars || 1) - 1) / 3)) },
  // a parry read from a blow's windup (blows only): a blow is answered only inside its window (BLOW_WINDOW, 0.25 real seconds, Petra
  // a564e9b), so the later in it, the better: at the strike 1, at the window's opening 0.4 (the rote floor). Projectiles, by how close they came (`d` of the parry's reach) once the event carries it.
  { event: 'move.parry',      domain: 'divination',     base: 6,  quality: (e) => (e.by !== 'courier' ? null : e.what === 'blow' ? (e.lead == null ? 0.5 : 0.4 + 0.6 * q01(1 - e.lead / 0.25)) : e.d != null && e.reach ? q01(1 - e.d / e.reach) : null) },
  { event: 'god.grab',        domain: 'psychokinesis',  base: 4,  quality: () => 0.5 },
  { event: 'god.throw',       domain: 'psychokinesis',  base: 8,  quality: (e) => q01((e.speed || 0) / 30) },
  { event: 'drill.end',       domain: 'psychokinesis',  base: 12, quality: (e) => (e.tuned?.length ? null : e.run?.shots ? q01((e.run.hits || 0) / e.run.shots) : null) }, // (the Throwing Room; a tuned game earns nothing: Petra)
  // time slowed or stopped is Ouranurgy (the owner, 2026-10-08): blade mode's cuts and zandatsu, the reprogramming's stilled window,
  // Celestial mode's canvas; quality is what was done in the stilled time (cuts, a clean macro, sigils drawn), never how long it was held
  { event: 'blade.exit',      domain: 'ouranurgy',      base: 12, quality: (e) => q01((e.cuts || 0) / 8 + (e.zandatsu ? 0.4 : 0)) },
  { event: 'creature.zandatsu', domain: 'ouranurgy',    base: 10, quality: () => 1 },
  { event: 'reprogram.run',   domain: 'ouranurgy',      base: 8,  quality: (e) => (e.refused ? 0 : q01(e.q)) },
  { event: 'brush.canvas',    domain: 'ouranurgy',      base: 6,  quality: (e) => (e.open ? null : q01((e.drawings || 0) / 3)) },
  { event: 'reprogram.run',   domain: 'possession',     base: 20, quality: (e) => (e.refused ? 0 : q01(e.q)) },
  { event: 'lockheart.drain', domain: 'possession',     base: 6,  quality: () => 0.5 },
  { event: 'god.sunder',      domain: 'alteration',     base: 10, quality: (e) => q01((e.cuts || 1) / 4) },
  { event: 'god.swell',       domain: 'alteration',     base: 8,  quality: () => 0.5 },
  { event: 'god.wring',       domain: 'alteration',     base: 8,  quality: () => 0.5 },
  { event: 'garden.sculpt',   domain: 'alteration',     base: 4,  quality: (e) => (e.by !== 'courier' ? null : e.q != null ? q01(e.q) : 0.3) }, // (q: the water led to pool, Petra's to emit)
  { event: 'brush.inscribe',  domain: 'alteration',     base: 6,  quality: () => 0.5 },                  // (an inscription changes what a thing is: Calissa)
  { event: 'reprogram.run',   domain: 'spellscription', base: 14, quality: (e) => q01(1 - (e.misses || 0) / Math.max(1, (e.chars || 1) / 4)) },
  // (Calissa: `fit`, how neat the drawing was, once emitted; wash lays slip on the world and is Manifestation's; sigil.pop always fires
  // beside a glyph, so it no longer pays twice)
  { event: 'brush.glyph',     domain: 'spellscription', base: 10, quality: (e) => (e.technique === 'wash' ? null : e.fit != null ? q01(e.fit * Math.min(1, ((e.n || 0) + (e.sigils || 0)) / 3)) : q01((e.sigils || 0) / 3 + 0.4)) },
  { event: 'brush.glyph',     domain: 'manifestation',  base: 6,  quality: (e) => (e.technique === 'wash' ? q01((e.n || 0) / 12) : null) },
  // keeping time (the owner: staying on tempo is transcribing actions to time; Wanda's measures)
  { event: 'song.play',       domain: 'spellscription', base: 8,  quality: (e) => q01(e.fever) },
  { event: 'rhythm.score',    domain: 'spellscription', acts: 12, quality: (e) => q01(e.accuracy) }, // (a song of about two real minutes: as many acts as the time)
  // the slice's big acts (docs/plans/SLICE.md), counted in `acts`: as many of the domain's ordinary acts as the time they take, so a
  // layer pays EXP at the same rate a minute as the rest of play (a two-minute stage is 12 acts at PACE) and does not skew the scale
  { event: 'emocean.stage',   domain: 'ouranurgy',      acts: 12, quality: (e) => (e.by === 'courier' ? stageQuality(e) : null) },
  { event: 'emocean.reckon',  domain: 'divination',     acts: 4,  quality: (e) => (e.by === 'courier' && e.q != null ? q01(e.q) : null) },
  { event: 'well.charted',    domain: 'divination',     acts: 6,  quality: (e) => (e.by === 'courier' && e.charted != null ? q01(e.charted) : null) },
];

/** How long 99 takes in any domain at middling quality (0.5: the grind), and how often a domain's acts come. */
export const PACE = { hours99: 300, actsPerMin: 6 };

/** How much quality weighs: floor + (ceil - floor) x quality^power. Rote (0) 0.4, middling (0.5) about 1, masterful (1) 5. */
export const SKILL = { floor: 0.4, ceil: 5, power: 3 };
export const skillWeight = (q) => SKILL.floor + (SKILL.ceil - SKILL.floor) * Math.pow(Math.max(0, Math.min(1, q)), SKILL.power);

/** The multiplier that puts a domain's average source on PACE (defined below the curve, which it needs). */
let SCALE = null;
export function scaleOf(domain) {
  if (!SCALE) {
    SCALE = {};
    for (const d of Object.keys(DOMAINS)) {
      const src = SOURCES.filter((x) => x.domain === d && x.base != null), avg = src.reduce((a, x) => a + x.base, 0) / Math.max(1, src.length);
      SCALE[d] = expAt(MAX_LEVEL) / (PACE.hours99 * 60 * PACE.actsPerMin * avg * skillWeight(0.5));
    }
  }
  return SCALE[domain] || 1;
}

/** A source's base: its own, or (a big act) `acts` times its domain's average ordinary base. */
function baseOf(s) {
  if (s.base != null) return s.base;
  const src = SOURCES.filter((x) => x.domain === s.domain && x.base != null);
  return s.acts * src.reduce((a, x) => a + x.base, 0) / Math.max(1, src.length);
}

/** The EXP an event is worth, by domain: base x the domain's scale x skillWeight(quality). A source whose quality is null does not count. */
export function expFor(e) {
  const out = [];
  for (const s of SOURCES) {
    if (s.event !== e.name) continue;
    const q = s.quality(e);
    if (q == null) continue;
    out.push([s.domain, Math.round(baseOf(s) * scaleOf(s.domain) * skillWeight(q))]);
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

/** WIDENING (the owner, 2026-10-05: "lock it in for now"; DESIGN.md section 10): what a domain's level widens, never accuracy. Each knob
 *  is read by the tool it names, as a MULTIPLIER of the tool's own number (`mult`: 1 at level 1 to `at99` at 99) or a BONUS added to a
 *  count (`plus`: 0 at level 1 to `at99`, in whole steps). Linear in the level for now: the system will grow. A tool asks
 *  `game.psyche.widen(key)`, so switching the domain off (or level 1) restores the tool exactly. */
export const WIDEN = {
  'ouranurgy.reach':      { domain: 'ouranurgy',      mult: true, at99: 1.5, does: 'blink and grapple reach (an art: the core movement is untouched)' },
  'ouranurgy.still':      { domain: 'ouranurgy',      mult: true, at99: 1.3, does: 'how long time stays slowed or stopped (blade mode, the reprogramming window, Celestial mode)' },
  'ouranurgy.lane':       { domain: 'ouranurgy',      mult: true, at99: 1.5, does: "the ship's lane-change speed on the rail" },
  'manifestation.span':   { domain: 'manifestation',  mult: true, at99: 1.5, does: 'how long a manifested structure stands' },
  'manifestation.count':  { domain: 'manifestation',  plus: true, at99: 2,   does: 'how many manifested structures stand at once' },
  'divination.survey':    { domain: 'divination',     mult: true, at99: 1.6, does: "a survey pulse's radius (charting, the Well's floors)" },
  'divination.reveal':    { domain: 'divination',     mult: true, at99: 1.5, does: 'the radius veiled crystal is revealed in' },
  'divination.reckon':    { domain: 'divination',     mult: true, at99: 1.5, does: "how far ahead a reckoning marks a wave's lane (RECKON.lead)" },
  'divination.forecast':  { domain: 'divination',     mult: true, at99: 4,   does: 'how far ahead the weather can be known (progress/weather.js forecast)' },
  'psychokinesis.weight': { domain: 'psychokinesis',  mult: true, at99: 2,   does: 'how heavy a thing the god hand can lift' },
  'psychokinesis.throw':  { domain: 'psychokinesis',  mult: true, at99: 1.5, does: 'how far the god hand throws' },
  'possession.macro':     { domain: 'possession',     mult: true, at99: 1.5, does: 'how long a macro a mind will take' },
  'possession.hold':      { domain: 'possession',     plus: true, at99: 2,   does: 'how many Figments a Lockheart holds when summoning' },
  'alteration.cuts':      { domain: 'alteration',     plus: true, at99: 3,   does: 'how many cuts a sunder makes' },
  'alteration.swell':     { domain: 'alteration',     mult: true, at99: 1.5, does: 'how far a swell or a wring reshapes' },
  'spellscription.slots': { domain: 'spellscription', plus: true, at99: 3,   does: 'how many macros the Veritome keeps' },
  'spellscription.copy':  { domain: 'spellscription', plus: true, at99: 3,   does: 'how many copies of a Cogitomap can be transcribed (the owner: Spellscription duplicates maps)' },
};
/** A knob's value at a level: a multiplier (1 .. at99) or a bonus (0 .. at99, whole). */
export function widenAt(key, level = 1) {
  const w = WIDEN[key];
  if (!w) return 1;
  const f = (Math.max(1, Math.min(MAX_LEVEL, level)) - 1) / (MAX_LEVEL - 1);
  return w.plus ? Math.round(w.at99 * f) : 1 + (w.at99 - 1) * f;
}
