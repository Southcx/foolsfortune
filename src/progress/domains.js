// ---------------------------------------------------------------------------------------
// THE DOMAINS: the seven skills of the Courier's psyche, six and one (docs/DESIGN.md, section 10; GLOSSARY): Ouranurgy (displacement),
// Manifestation, Divination, Psychokinesis, Possession, Alteration, and Spellscription (transcribing a thing down). Each has a level, 1
// to 99, from EXP; all seven at 99 is "The World", the end of the Fool's Journey. EXP comes from doing the domain's things, and from
// doing them WELL: every source names the event it is earned from, its base EXP, and how the event says how good it was (0 .. 1), and
// and the weight of quality is steep on purpose (the owner, 2026-10-04: "a god-gamer should progress much faster"): SKILL's curve gives
// a rote act 0.4 of the base, a middling one about 1, and a masterful one 5, so the grind to "The World" (all seven at 99, 300 hours each) is about 2,100 hours and a
// player who plays ambitiously and well gets there in about 400. A source's quality should measure ambition as well as accuracy (the
// fragile formation's sweet spot, the long macro typed clean, the four-star photograph), never repetition. The bases are relative WEIGHTS within a domain; one PACE scales every domain alike, so 99 takes the same time in
// each (300 hours of middling play at 6 acts a minute, about OSRS's pace for a skill: a placeholder until the owner sets it). A level widens what a domain can do and never does the skill for the player. Data and pure functions; progress/psyche.js
// earns it in play (docs/plans/SYSTEMS.md, B8).
//
// Prior art: Old School RuneScape's skills (1 to 99 by EXP, earned only by doing the skill; the level as proof), the owner's design
// document v0.1 (the seven skills, the EXP curve floor(level^1.5 * 50 + 100) a level, "The World" ascension), Rhythm Heaven's and Gran
// Turismo's graded results (how well, not only how often).
//
//   DOMAINS[id] = { id, name, does }   SOURCES = [{ event, domain, base | acts | acts(e), quality(e) -> 0..1 }]   PACE = { hours99, actsPerMin }
//   SKILL = { floor, ceil, power }   skillWeight(q) -> floor .. ceil   expFor(e) -> [[domain, exp]]   scaleOf(domain) -> on PACE
//   toNext(level) -> exp      expAt(level) -> exp      levelOf(exp) -> 1..99
//   (widening: progress/godpowers.js RAMP.tools, widenOf(key, level))
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
/** The domain a creature downed on foot trains, by the killing blow's damage type (combat/types.js). */
export const DOWN_DOMAIN = { impact: 'psychokinesis', ego: 'divination', influence: 'possession', illusion: 'manifestation', delirium: 'alteration' };
/** A race's quality by its medal (no medal: by place among the rivals). */
const RACE_Q = { gold: 1, silver: 0.7, bronze: 0.45 };

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
  // a564e9b), so the later in it, the better: at the strike 1, at the window's opening 0.4 (the rote floor). Held Breath's longer window
  // scores against 0.25 all the same: an answer it alone made possible pays the rote rate (the assist never does the skill: Dovina, 2026-10-08) Projectiles, by how close they came (`d` of the parry's reach) once the event carries it.
  { event: 'move.parry',      domain: 'divination',     base: 6,  quality: (e) => (e.by !== 'courier' ? null : e.what === 'blow' ? (e.lead == null ? 0.5 : 0.4 + 0.6 * q01(1 - e.lead / 0.25)) : e.d != null && e.reach ? q01(1 - e.d / e.reach) : null) },
  // a Figment attack telegraph's windup read (creatures.js `windup.read`; FIGMENT-TELEGRAPHS.md 2): out of its area or looking away; a
  // parry is move.parry's above, never paid twice
  { event: 'windup.read',     domain: 'divination',     base: 6,  quality: (e) => (e.by !== 'courier' || e.how === 'parried' ? null : 0.6) },
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
  // a fish landed: two minds on one line (the owner, 2026-10-11; ANGLING.md 5), an act per 10 real seconds of fight, quality the pulls
  // answered; every landing pays, kept or let go (South, 2026-10-29: "Wouldn't catching a fish award Possession experience no matter
  // what?"); letting it go pays half again on top, and keeping it pays its cubes
  { event: 'angle.catch',     domain: 'possession',     acts: (e) => Math.max(1, Math.round((e.dur || 0) / 10)), quality: (e) => (e.by === 'courier' ? q01(e.ans ?? 0.5) : null) },
  { event: 'angle.release',   domain: 'possession',     acts: (e) => 0.5 * Math.max(1, Math.round((e.secs || 0) / 10)), quality: (e) => (e.by === 'courier' ? q01(e.answered ?? 0.5) : null) },
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
  // the god hand's matter, miracles and epics (docs/plans/GODHAND.md 3 to 5, 8): a big move is ambitious; a clean sign is masterful
  { event: 'god.scoop',       domain: 'psychokinesis',  base: 6,  quality: (e) => (e.by === 'courier' ? q01((e.moved || 0) / 20) : null) },
  { event: 'god.pour',        domain: 'psychokinesis',  base: 6,  quality: (e) => (e.by === 'courier' ? q01((e.moved || 0) / 20) : null) },
  { event: 'god.shape',       domain: 'alteration',     base: 8,  quality: (e) => (e.by === 'courier' ? q01((e.moved || 0) / 15) : null) },
  { event: 'god.carve',       domain: 'alteration',     base: 8,  quality: (e) => (e.by === 'courier' ? q01((e.moved || 0) / 15) : null) },
  { event: 'god.sculpt',      domain: 'manifestation',  base: 12, quality: (e) => (e.by === 'courier' ? q01((e.volume || 0) / 12) : null) },
  // the domains' other god powers (GODHAND.md 8): quality is how much the act took on (a long portal, a full slab, a crowd herded)
  ...[['portal', 'ouranurgy', 10, (e) => e.len / 40], ['fold', 'ouranurgy', 12, (e) => e.moved / 60], ['hasten', 'ouranurgy', 6, (e) => e.r / 20],
    ['setfast', 'manifestation', 8, (e) => e.chunks / 6], ['totem', 'manifestation', 12, () => 0.6],
    ['strata', 'divination', 4, (e) => e.len / 30], ['course', 'divination', 3, (e) => e.steps / 120], ['read', 'divination', 4, (e) => e.n / 6],
    ['gust', 'psychokinesis', 6, (e) => (e.hit + e.moved) / 6], ['slab', 'psychokinesis', 8, (e) => e.moved / 40],
    ['herd', 'possession', 8, (e) => e.n / 8], ['take', 'possession', 8, () => 0.5], ['muster', 'possession', 10, (e) => e.n / 8],
    ['transmute', 'alteration', 6, (e) => e.r / 10], ['ward', 'spellscription', 8, (e) => e.r / 18], ['stamp', 'spellscription', 10, (e) => e.side / 24],
  ].map(([id, domain, base, q]) => ({ event: `god.${id}`, domain, base, quality: (e) => (e.by === 'courier' ? q01(q(e)) : null) })),
  { event: 'god.miracle',     domain: 'spellscription', base: 12, quality: (e) => (e.by === 'courier' ? q01(e.score) * (0.6 + 0.4 * q01(e.size)) : null) },
  ...['ouranurgy', 'manifestation', 'divination', 'psychokinesis', 'possession', 'alteration', 'spellscription'].map((d) => (
    { event: 'god.epic',      domain: d,                acts: 10, quality: (e) => (e.by === 'courier' && e.domain === d ? 1 : null) })),
  // EVERY MODE TRAINS A DOMAIN (South, 2026-10-29: "evaluate the progression systems for the seven domains, and which ones are still
  // unwired"; docs/plans/DOMAIN-SOURCES.md). Until now a fight on foot, the Raceway, the open sea, the Spirit Garden's tending and the
  // spirits paid no domain at all, and Psychokinesis, Manifestation and Alteration were the god hand's alone. Each source below hears
  // an event that already exists; its quality is a field the event already carries.
  //
  // a creature downed on foot trains the domain of the force that downed it (the killing blow's damage type, combat/types.js
  // CAUSE_TYPE): Impact (the psygun, the Sondelass, the kick) Psychokinesis, Ego (the Flash, reprogramming) Divination, Influence (the
  // Crucibelle's song and toll) Possession, Illusion (the Soul Brush, the Dreamvane's fork) Manifestation, Delirium (the Lockheart)
  // Alteration. Its acts by its size (a clapperjar 1, a slip jelly 2, the Great Slip Jelly 7); masterful when the blow was the
  // right one (a trump, an annihilation), middling otherwise
  ...Object.entries(DOWN_DOMAIN).map(([type, domain]) => (
    { event: 'creature.struck', domain, acts: (e) => Math.min(8, 1 + Math.floor((e.maxHp || 1) / 8)), quality: (e) => (e.by === 'courier' && e.kill && e.type === type ? (e.because === 'annihilation' ? 1 : e.k > 1 ? 0.85 : 0.5) : null) })),
  // the Raceway: a race run is displacement through space (Ouranurgy), its acts its time, its quality its medal (a validate run pays
  // track.validate instead; practice and the test lap pay nothing); a trick combo banked is the board moved by will (Psychokinesis), by
  // its multiplier (x5 masterful); a made track validated is a thought made solid (Manifestation), a new geometry's only (`fresh`, Petra's
  // to add: until then every validate pays, its acts few); a haunt is traps possessed (Possession), held its masterful end
  { event: 'race.finish',     domain: 'ouranurgy',      acts: (e) => Math.max(1, Math.round((e.seconds || 0) / 10)), quality: (e) => (e.by !== 'courier' || e.validate || e.mode === 'practice' || e.mode === 'trim' ? null : RACE_Q[e.medal] ?? (e.of > 1 ? 0.45 * (1 - (e.place - 1) / e.of) + 0.1 : 0.3)) },
  { event: 'skiff.combo.bank', domain: 'psychokinesis', base: 6,  quality: (e) => (e.by === 'courier' && e.n >= 2 ? q01(((e.mult || 1) - 1) / 4) : null) },
  { event: 'track.validate',  domain: 'manifestation',  acts: 4,  quality: (e) => (e.by === 'courier' && e.fresh !== false ? 0.6 : null) },
  { event: 'haunt.end',       domain: 'possession',     acts: (e) => Math.max(1, Math.round((e.seconds || 0) / 10)), quality: (e) => (e.by !== 'courier' || e.why !== 'done' ? null : e.held ? 0.7 + 0.3 * q01((e.wrecks || 0) / 3) : 0.35) },
  // the open sea (OPEN-SEA.md 12 to 15): a crate hauled up on the line is a thing moved by will (Psychokinesis, by its tier); a beast
  // sunk the same (the ship's gun and broadside); a habit caught on a plate, a cache dowsed out, a line-up closed and a square completed
  // are the hidden perceived (Divination); a stone's phrase sung back is time transcribed (Spellscription)
  { event: 'sea.salvage',     domain: 'psychokinesis',  base: 8,  quality: (e) => (e.by === 'courier' ? q01(0.3 + 0.2 * (e.tier || 0)) : null) },
  { event: 'seaserpent.down', domain: 'psychokinesis',  acts: 12, quality: (e) => (e.by === 'courier' ? 0.6 : null) },
  { event: 'seabeast.down',   domain: 'psychokinesis',  acts: 16, quality: (e) => (e.by === 'courier' ? 0.7 : null) },
  { event: 'sea.habit',       domain: 'divination',     base: 8,  quality: (e) => (e.by === 'courier' ? (e.first ? 0.9 : 0.3) : null) },
  { event: 'sea.dig',         domain: 'divination',     base: 8,  quality: (e) => (e.by === 'courier' ? q01(0.4 + 0.2 * (e.tier || 0)) : null) },
  { event: 'sea.lineup',      domain: 'divination',     acts: 4,  quality: (e) => (e.by === 'courier' ? 0.8 : null) },
  { event: 'sea.square.done', domain: 'divination',     acts: 6,  quality: (e) => (e.by === 'courier' ? 1 : null) },
  { event: 'sea.echo',        domain: 'spellscription', base: 8,  quality: (e) => (e.by === 'courier' ? 0.7 : null) },
  // the Spirit Garden (GARDEN-COZY.md): a planetoid tended is reshaped (Alteration, by the harmony it reached), a bed inoculated the
  // same (the mycelium transmutes); a spirit bound, a wish granted and a farewell given are will over another mind (Possession: a
  // farewell the whole bond's end, masterful)
  { event: 'garden.tend',     domain: 'alteration',     base: 4,  quality: (e) => (e.by === 'courier' ? q01(e.h ?? 0.5) : null) },
  { event: 'spore.inoculate', domain: 'alteration',     base: 6,  quality: (e) => (e.by === 'courier' ? 0.5 : null) },
  { event: 'spirit.bind',     domain: 'possession',     acts: 3,  quality: (e) => (e.by === 'courier' ? q01(0.4 + 0.15 * (e.cls || 0)) : null) },
  { event: 'spirit.wish.done', domain: 'possession',    acts: 2,  quality: (e) => (e.by === 'courier' ? q01((e.bond ?? 50) / 100) : null) },
  { event: 'spirit.farewell', domain: 'possession',     acts: 10, quality: (e) => (e.by === 'courier' ? 1 : null) },
  // the world's Lachryma (PAINT.md): paint laid is thought made to stand in the world (Manifestation, by its area); a blot mopped up is
  // the world restored (Alteration, by how far it had grown); the Dreamvane's dowse turning a find up is the hidden perceived
  // (Divination), its fork caught back the thrown thing called home (Psychokinesis)
  { event: 'brush.paint',     domain: 'manifestation',  base: 4,  quality: (e) => (e.by === 'courier' ? q01((e.area || 0) / 20) : null) },
  { event: 'stain.wash',      domain: 'alteration',     base: 6,  quality: (e) => (e.by === 'courier' ? q01(0.3 + 0.25 * (e.stage || 0)) : null) },
  { event: 'dreamvane.unearth', domain: 'divination',   base: 6,  quality: (e) => (e.by === 'courier' ? q01((e.n || 1) / 3) : null) },
  { event: 'fork.catch',      domain: 'psychokinesis',  base: 4,  quality: (e) => (e.by === 'courier' ? 0.5 : null) },
  // an aberrant's secret found (secrets.js; its end, never a step): the hidden read (Divination), masterful; the powers it took paid
  // their own domains (duel.power below)
  { event: 'duel.secret',     domain: 'divination',     acts: 6,  quality: (e) => (e.by === 'courier' && !e.practice && e.done ? 1 : null) },
  // a thrown hit (progress/sandbox.js IMPACT; world/impacts.js; Dawn of Mana's world as a weapon): moving things by will at a creature,
  // Psychokinesis's; its quality the energy it carried (a heavy crate's 600 J masterful), a strike (three with one throw) a big act
  { event: 'impact.hit',      domain: 'psychokinesis',  base: 6,  quality: (e) => (e.by === 'courier' ? q01((e.energy || 0) / 600) : null) },
  { event: 'impact.strike',   domain: 'psychokinesis',  acts: 4,  quality: (e) => (e.by === 'courier' ? q01((e.n || 2) / 4) : null) },
  // a mimicry puzzle solved (progress/mimicry.js; docs/plans/MIMICRY.md): a big act a domain its powers trained, its quality the stars;
  // MATCH and UNDO also train Divination (the steps were read, never shown), and every solve Spellscription a little (the ground copied
  // down from what was shown: transcribing a thing). The repeat of a puzzle already solved is half the act.
  ...['ouranurgy', 'manifestation', 'psychokinesis', 'alteration'].map((d) => (
    { event: 'mimic.solve',   domain: d,                acts: (e) => (e.first ? 4 : 2) * (e.tier || 1), quality: (e) => (e.by === 'courier' && (e.domains || []).includes(d) ? q01(e.stars / 3) : null) })),
  { event: 'mimic.solve',     domain: 'divination',     acts: (e) => (e.first ? 4 : 2) * (e.tier || 1), quality: (e) => (e.by === 'courier' && e.mode !== 'mimic' ? q01(e.stars / 3) : null) },
  { event: 'mimic.solve',     domain: 'spellscription', acts: (e) => (e.first ? 2 : 1) * (e.tier || 1), quality: (e) => (e.by === 'courier' ? q01(e.stars / 3) : null) },
  // a duel's power cast (duel/powers.js; PUZZLE-DUELS.md 26.1): the hand's power in a puzzle duel trains its domain as it does in the
  // world; its quality the gems the cast cleared (12 a masterful one), a cast that cleared none middling at best; a practice duel none
  ...['ouranurgy', 'manifestation', 'divination', 'psychokinesis', 'possession', 'alteration', 'spellscription'].map((d) => (
    { event: 'duel.power',    domain: d,                base: 6, quality: (e) => (e.by === 'courier' && !e.practice && e.domain === d ? 0.35 + 0.65 * q01((e.cleared ?? 2) / 12) : null) })),
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

/** A source's base: its own, or (a big act) `acts` (a number, or of the event: a fight's length) times its domain's average ordinary base. */
function baseOf(s, e) {
  if (s.base != null) return s.base;
  const src = SOURCES.filter((x) => x.domain === s.domain && x.base != null);
  return (typeof s.acts === 'function' ? s.acts(e) : s.acts) * src.reduce((a, x) => a + x.base, 0) / Math.max(1, src.length);
}

/** The EXP an event is worth, by domain: base x the domain's scale x skillWeight(quality). A source whose quality is null does not count. */
export function expFor(e) {
  const out = [];
  for (const s of SOURCES) {
    if (s.event !== e.name) continue;
    const q = s.quality(e);
    if (q == null) continue;
    out.push([s.domain, Math.round(baseOf(s, e) * scaleOf(s.domain) * skillWeight(q))]);
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

/** WIDENING now lives in the ramp's one table (progress/godpowers.js RAMP.tools, on the ramp's curve: docs/plans/SPINE.md 1.1);
 *  `game.psyche.widen(key)` reads it there. */
