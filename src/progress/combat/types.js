// ---------------------------------------------------------------------------------------
// THE DAMAGE TYPES: what kind of force a blow is, from the lawful end of the line to the chaotic (docs/DESIGN.md, section 10; the owner's
// design document v0.1, section 8). Five, in order: IMPACT (lawful, physical), EGO (lawful, mental: an assault on a sense of self),
// INFLUENCE (neutral, social: persuasion, charm), ILLUSION (chaotic, perceptual) and DELIRIUM (chaotic, entropic: reality coming apart).
// Data only; creatures.strike reads it (Petra wired B1 to B4).
//
// Each type BUILDS a status: enough of it on a target applies that status (Impact's is the stun, through stun.js's poise). Each TRUMPS
// one other: it deals more to a target of that type and builds its status faster. The trumps are a closed cycle (no type unbeaten,
// none beaten twice: v0.1's list left Impact and Delirium unbeaten and Ego beaten twice), keeping three of v0.1's:
//   Impact > Illusion > Ego > Influence > Delirium > Impact
// (force shatters a phantom; a phantom overwhelms a self; a self resists persuasion; persuasion imposes a suggested order on chaos;
// entropy unravels force). And ANNIHILATION, the two ends of the line: Impact on a target carrying Delirium's status, or Delirium on
// one carrying Impact's, hits much harder.
//
// Prior art: the owner's v0.1 (the five types, the Law-Chaos line, the trumps, annihilation); Pokemon's type chart and Shin Megami
// Tensei's affinities (a weakness changes what you reach for); Monster Hunter's status build-up (a hidden meter per status, fed by a
// blow's type); Elden Ring's build-up bars.
//
//   TYPES[id] = { id, name, axis (-2 law .. +2 chaos), builds (status), buildAt, buildDur | poise }   BUILD = { drainPerSec }      TRUMPS[id] -> the type it beats      typeOf(cause) -> id
//   multiplier(type, targetType, targetStatuses) -> { dmg, build }
// ---------------------------------------------------------------------------------------

// Each type's build-up: `buildAt`, the meter's threshold in blows of power 1, and `buildDur`, how long the status then holds (seconds,
// before the mental state scales it). Set by how often the type's tool lands a blow and how strong its status is: a type dealt rarely
// (the Lockheart's Delirium, the Veritome's Ego) builds fast, a type dealt by every shot (Impact) slowly; a status that stops a fight
// (charm) holds briefly, a status that only hampers (blind, doubt) longer. Impact's build-up is poise (stun.js), not a meter: `poise`,
// the share of a full poise one blow of power 1 is worth (twelve plain shots to stun: Impact alone does not stun a slip jelly, which
// bursts at about eight; the Flash's job, three flashes, stays the Flash's).
export const TYPES = {
  impact:    { id: 'impact',    name: 'Impact',    axis: -2, builds: 'stun',      poise: 0.08 },
  ego:       { id: 'ego',       name: 'Ego',       axis: -1, builds: 'doubt',     buildAt: 3, buildDur: 6 },
  influence: { id: 'influence', name: 'Influence', axis: 0,  builds: 'charm',     buildAt: 3, buildDur: 4 },
  illusion:  { id: 'illusion',  name: 'Illusion',  axis: 1,  builds: 'blind',     buildAt: 4, buildDur: 5 },
  delirium:  { id: 'delirium',  name: 'Delirium',  axis: 2,  builds: 'confusion', buildAt: 2, buildDur: 6 },
};
/** How fast a build-up meter drains (blows of power 1 a second): a meter of 4 empties in 16 s, so a status is built by pressure, not by
 *  a blow now and then. */
export const BUILD = { drainPerSec: 0.25 };
export const TYPE_IDS = Object.keys(TYPES);

/** The closed cycle: each type beats exactly one, and is beaten by exactly one. */
export const TRUMPS = { impact: 'illusion', illusion: 'ego', ego: 'influence', influence: 'delirium', delirium: 'impact' };

/** How much a trump and an annihilation are worth (v0.1's suggested +25% and +50%), and how much faster a trump builds its status. */
export const BONUS = { trump: 0.25, trumpBuild: 0.5, annihilation: 0.5 };

/** The type of each `cause` the tools pass to creatures.strike today (a proposal: the owner rules on which tool deals what). Unknown
 *  causes are Impact. Psygun and Sondelass: Impact. Veritome: Ego. Crucibelle: Influence. Soul Brush's drawings and the Dreamvane's
 *  fork: Illusion (the club and the pick are blows: Impact). Lockheart: Delirium. */
export const CAUSE_TYPE = {
  shot: 'impact', charged: 'impact', ricochet: 'impact', homing: 'impact', sliced: 'impact', hooked: 'impact', picked: 'impact',
  bashed: 'impact', slam: 'impact', kick: 'impact', lunge: 'impact', spit: 'impact', explosion: 'impact',
  flash: 'ego', reprogram: 'ego',
  song: 'influence', toll: 'influence',
  fork: 'illusion', empower: 'illusion', brushed: 'illusion',
  nuke: 'delirium', lockheart: 'delirium',
};
export const typeOf = (cause) => CAUSE_TYPE[cause] || 'impact';

/** What a blow of `type` is worth against a target of `targetType` (its own affinity, if it has one) that carries `statuses` (a Set or
 *  array of status names): a damage multiplier and a status build-up multiplier. */
export function multiplier(type, targetType = null, statuses = []) {
  const has = (s) => (statuses instanceof Set ? statuses.has(s) : statuses.includes(s));
  let dmg = 1, build = 1;
  if (targetType && TRUMPS[type] === targetType) { dmg += BONUS.trump; build += BONUS.trumpBuild; }
  if ((type === 'impact' && has(TYPES.delirium.builds)) || (type === 'delirium' && has(TYPES.impact.builds))) dmg += BONUS.annihilation;
  return { dmg, build };
}
