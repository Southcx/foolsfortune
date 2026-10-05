// ---------------------------------------------------------------------------------------
// EMOTIONAL WEATHER AND THE DAY (docs/plans/WEATHER.md; the owner, 2026-10-05). Lachryma is everything and the islands are minds, so the
// weather is an ISLAND'S MOOD, falling as Lachryma: the five aspects of feeling the game already has are its five weathers (MIRTH, WONDER,
// HUNGER, GRIEF, DREAD; and CALM, the mind at rest). Each sits where its crude grade sits on the Law-Chaos line and feeds the damage type
// at that place on it, so a weather touches everything that already speaks in those fives: combat (its type builds its status faster;
// every creature's mental state is swayed), angling (the fish drawn to its aspect bite more), the market (where an aspect falls, its crude
// is plentiful and cheap), the Emocean (danger, and how far ahead the reckoning marks the lanes), the Wells (a ruminating mind refills
// faster in grief and dread), and Divination (the forecast: how far ahead it can be known is a widening).
//
// THE DAY: a game day is a real hour (DESIGN.md section 17; core/calendar.js): night, dawn, day and dusk, a light from 0 to 1. At night
// Lachryma glows: its signatures read further.
//
// How it moves: an island's mood is a slow wave along the line about its own place on it (Margarite, the King's, leans to mirth; the
// Queen's Entropolis to dread), read in blocks of game hours so a spell holds; its strength is another slow wave, calm when low. Moods
// move to their neighbours more than they leap (a continuous wave can only cross the line one aspect at a time). Pure functions of the
// island and the game hour: the same for every player, the same in a replay, and so it can be known ahead.
//
// Prior art: Pokemon's weather (a weather powers a type), FFXI's weather and elemental days (a weather feeds an element and calls its
// creatures), Breath of the Wild (rain and heat change what is easy), Stardew Valley (rain fish), FFXIV's fish windows (weather and time),
// Persona 4 (the fog is the mood of the town, and dangerous), and Majora's Mask and Minecraft (a game clock that makes days testable).
//
//   ASPECTS (mirth .. dread)   TYPE_OF[aspect] -> damage type   weatherAt(island, hour) -> { aspect | null, strength }   hourNow()
//   phaseAt(hour) -> 'night' | 'dawn' | 'day' | 'dusk'   lightAt(hour) -> 0..1
//   game.weather = new Weather(game): .now(island?)  .forecast(island?, hours?)  .phase()  .light()  .update(dt)
//     effects of the weather where the Courier is: .buildMult(type)  .mindShift()  .fishPull(aspect)  .supplyMult(island, grade)
//     .stageDanger()  .leadMult()  .fillMult(island)  .signatureMult()
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import * as calendar from '../core/calendar.js';

const W = ECON.weather;
export const ASPECTS = ['mirth', 'wonder', 'hunger', 'grief', 'dread']; // (Law to Chaos, as the crude's grades sit on the islands)
/** The damage type each weather feeds: the type at its place on the line (progress/combat/types.js). */
export const TYPE_OF = { mirth: 'impact', wonder: 'ego', hunger: 'influence', grief: 'illusion', dread: 'delirium' };

const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24; // (a game hour in real ms: DESIGN.md section 17)
/** The game hour now (fractional), from the calendar's clock (a replay pins it). */
export const hourNow = () => calendar.now() / GAME_HOUR;

const hash01 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const wave = (t, period, phase) => Math.sin(2 * Math.PI * (t / period + phase));

/** An island's weather at a game hour: its aspect (null for calm) and its strength (0 .. 1). */
export function weatherAt(island = 'anagami', hour = hourNow()) {
  const t = Math.floor(hour / W.block) * W.block, law = ECON.islands[island]?.law ?? 0;
  const [p1, p2, p3] = W.periods, ph = (k) => hash01(`weather:${island}:${k}`);
  const mood = Math.max(-2, Math.min(2, law * W.lean + W.swing[0] * wave(t, p1, ph(1)) + W.swing[1] * wave(t, p2, ph(2))));
  const intensity = 0.5 + 0.5 * wave(t, p3, ph(3));
  if (intensity < W.calm) return { aspect: null, strength: 0 };
  return { aspect: ASPECTS[Math.round(mood) + 2], strength: +((intensity - W.calm) / (1 - W.calm)).toFixed(2) };
}

/** The hour of the day's phase: night (20 to 5), dawn (5 to 7), day (7 to 18), dusk (18 to 20). */
export function phaseAt(hour = hourNow()) {
  const h = ((hour % 24) + 24) % 24;
  return h < 5 || h >= 20 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : 'dusk';
}
/** How light it is (0 the dark of night .. 1 noon): the sun's height, never below a starlit floor. */
export const lightAt = (hour = hourNow()) => Math.max(0.08, Math.sin(Math.PI * (((hour % 24) + 24) % 24 - 5) / 15));

export class Weather {
  constructor(game) {
    this.game = game;
    this.last = { key: null, phase: null };
    this.t = 0;
  }
  island() { return this.game.voyage?.sailing ? null : this.game.voyage?.at || 'anagami'; } // (at sea: the sea's own weather, Petra's stage)
  now(island = this.island()) { return island ? weatherAt(island) : { aspect: null, strength: 0 }; }
  phase() { return phaseAt(); }
  light() { return lightAt(); }
  /** What can be known of the weather ahead: one block each, for as many game hours as Divination widens the forecast to. */
  forecast(island = this.island(), hours = W.forecast * (this.game.psyche?.widen?.('divination.forecast') || 1)) {
    const out = [], h0 = hourNow();
    for (let h = Math.floor(h0 / W.block) * W.block + W.block; h <= h0 + hours; h += W.block) out.push({ hour: h, ...weatherAt(island, h) });
    return out;
  }

  // ---------------------------------------------------------------- what the weather where the Courier is does
  /** The build-up of a damage type's status: faster in the weather that feeds it. */
  buildMult(type) { const w = this.now(); return w.aspect && TYPE_OF[w.aspect] === type ? 1 + W.build * w.strength : 1; }
  /** How far the weather sways every creature's mental state (-2 Stoic .. +2 Prismatic; creatures.js adds it). */
  mindShift() { const w = this.now(); return w.aspect ? W.mind[w.aspect] * w.strength : 0; }
  /** How much more the fish drawn to this aspect bite (the angler multiplies a species' affinity for it). */
  fishPull(aspect) { const w = this.now(); return w.aspect === aspect ? 1 + W.fish * w.strength : 1; }
  /** Where an aspect falls its crude is plentiful: the price of that grade on that island, cheaper by the weather's strength. */
  supplyMult(island, grade) { const w = island ? weatherAt(island) : null; return w?.aspect === grade ? 1 - W.supply * w.strength : 1; }
  /** The Emocean: the danger the weather adds to a route (the island left behind), and how far ahead the reckoning still marks a lane. */
  stageDanger(island = this.game.voyage?.sailing?.from || this.island()) { const w = this.now(island); return w.aspect ? W.danger[w.aspect] * w.strength : 0; }
  leadMult(island = this.game.voyage?.sailing?.from || this.island()) { const w = this.now(island); return w.aspect ? 1 + (W.lead[w.aspect] - 1) * w.strength : 1; }
  /** A Well refilling (drawWell's hours scaled): a mind ruminates faster in grief and dread. */
  fillMult(island = this.island()) { const w = this.now(island); return w.aspect ? 1 + (W.fill[w.aspect] - 1) * w.strength : 1; }
  /** At night Lachryma glows: how much further its signatures read (core/signatures.js may scale by it). */
  signatureMult() { return this.phase() === 'night' ? W.night.signature : 1; }

  /** Twice a second: say when the weather where the Courier is, or the day's phase, has turned (events for tracking.js and the others). */
  update(dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.5;
    const island = this.island(), w = this.now(island), key = `${island}:${w.aspect}:${Math.round(w.strength * 4)}`, phase = this.phase();
    if (key !== this.last.key) {
      const was = this.last.key;
      this.last.key = key;
      if (was !== null && island) this.game.events.emit('weather.change', { island, aspect: w.aspect, strength: w.strength, by: 'environment' });
      else if (island) this.game.events.emit('weather.now', { island, aspect: w.aspect, strength: w.strength, by: 'environment' }); // (what it was on arrival)
    }
    if (phase !== this.last.phase) { const was = this.last.phase; this.last.phase = phase; if (was) this.game.events.emit('day.phase', { phase, by: 'environment' }); }
  }
}
