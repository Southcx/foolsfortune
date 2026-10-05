// ---------------------------------------------------------------------------------------
// EMOTIONAL WEATHER AND THE DAY (docs/plans/WEATHER.md; the owner, 2026-10-05). Lachryma is everything and the islands are minds, so the
// weather is a PLACE'S MOOD, falling as Lachryma (LORE.md, "Emotional weather": an island precipitated out of the Emocean, and its weather
// is the same thing, small and daily; the mood is its ego's). The five aspects of feeling the game already has are its five weathers
// (MIRTH, WONDER, DESIRE, GRIEF, DREAD; and CALM, the glaze holding). Each sits where its crude grade sits on the Law-Chaos line and feeds
// the damage type at that place on it, so a weather touches everything that already speaks in those fives: combat (its type builds its
// status faster; every creature's mental state drifts), angling (the fish drawn to its aspect bite more), the market (where an aspect
// falls, its crude is plentiful and cheap), the Emocean (a route's danger, and how far ahead the reckoning marks the lanes), the Wells (a
// ruminating mind refills faster in grief and dread), and Divination (the forecast: how far ahead it can be known is a widening).
//
// WHERE: weather is asked by place, never by where the Courier happens to be (creatures fight away from the Courier; in co-op, players
// stand on different islands). A PLACE is an island (its climate from its law) or a Well (a mind of its own, deep). here(pos) maps a
// position through the zones (render/zones.js) to a place and an EXPOSURE: open (the dunes: everything), roofed (the workshop, the
// basement, the circuits: the mood without the rain), deep (a Well: the Well's own mood). The open Emocean, with no ego, is blank.
//
// THE DAY: a game day is a real hour (core/calendar.js, DAY_MS): night, dawn, day and dusk; at night Lachryma glows.
//
// How it moves: a place's mood is a slow wave along the line about its own place on it (Margarite, Magnus's, leans to mirth; Entropolis,
// Entra's, to dread), read in blocks of game hours so a spell holds; its strength another slow wave, calm when low. A continuous wave
// crosses the line one aspect at a time, so moods move to their neighbours. Pure functions of the place and the game hour, seeded by
// their names (no stream is drawn from): the same for every player, the same in a replay, and the forecast agrees by construction.
//
// Prior art: Pokemon's weather (a weather powers a type), FFXI's weather and elemental days, Breath of the Wild (rain and heat change
// what is easy), Stardew Valley (rain fish), FFXIV's fish windows, Persona 4's fog (the town's mood, and dangerous), Majora's Mask and
// Minecraft (a game clock that makes days testable), and Wind Waker (the sea's weather as a thing you sail through).
//
//   ASPECTS (on the line)   DISPLAY_ORDER (as shown: wonder, mirth, desire, grief, dread)   TYPE_OF[aspect] -> damage type   NAMES[aspect]   weatherAt(place, ms?) -> { aspect | null, strength, phase, dayPhase }
//   phaseAt(ms?) 'night'|'dawn'|'day'|'dusk'   lightAt(ms?) 0..1   placeOf(pos) -> { place, exposure } | null   stageWx(island, ms?) -> { danger, lead }
//   fillHours(place, fromMs, toMs) -> effective hours of refill   supplyMult(island, grade, ms?)
//   game.weather = new Weather(game): .here(pos)  .at(place, ms?)  .sky(ms?, place?)  .forecast(place, hours?)  .update(dt)
//     effects where a thing stands: .buildMult(type, pos)  .mindDrift(pos) (per second)  .fishPull(aspect, pos)  .signatureMult(pos)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { DAY_MS, now as calNow } from '../core/calendar.js';
import { zoneOf } from '../render/zones.js';

const W = ECON.weather, GAME_HOUR = DAY_MS / 24;
export const ASPECTS = ['mirth', 'wonder', 'desire', 'grief', 'dread']; // (Law to Chaos, as the crude's grades sit on the islands)
/** The order the five are SHOWN in, anywhere a player sees them (the owner, 2026-10-05; GLOSSARY): most positive to most negative. */
export const DISPLAY_ORDER = ['wonder', 'mirth', 'desire', 'grief', 'dread'];
/** The damage type each weather feeds: the type at its place on the line (progress/combat/types.js). */
export const TYPE_OF = { mirth: 'impact', wonder: 'ego', desire: 'influence', grief: 'illusion', dread: 'delirium' };
/** Espada's names (LORE.md, "Emotional weather"; proposals for the owner). */
export const NAMES = { mirth: "the fox's wedding", wonder: 'the aurora', desire: 'the wanting wind', grief: 'the long rain', dread: 'the pall', calm: 'fair' };

/** Each zone's place and exposure (Petra's table: render/zones.js). */
const ZONE_PLACE = {
  dunes: ['anagami', 'open'], beach: ['anagami', 'open'], workshop: ['anagami', 'roofed'], basement: ['anagami', 'roofed'], circuits: ['anagami', 'roofed'],
  well: ['well:dunemaw', 'deep'],
};
/** Where a place sits on the line: an island by its law, a Well by its own leaning (a mind ruminating leans to grief). */
const lawOf = (place) => ECON.islands[place]?.law ?? W.wells[place?.slice(5)] ?? 0;

const hour = (ms) => ms / GAME_HOUR;
const hash01 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const wave = (t, period, phase) => Math.sin(2 * Math.PI * (t / period + phase));

/** The hour of the day's phase: night (20 to 5), dawn (5 to 7), day (7 to 18), dusk (18 to 20). */
export function phaseAt(ms = calNow()) {
  const h = ((hour(ms) % 24) + 24) % 24;
  return h < 5 || h >= 20 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : 'dusk';
}
/** How light it is (0.08 the starlit floor .. 1 noon). */
export const lightAt = (ms = calNow()) => Math.max(0.08, Math.sin(Math.PI * ((((hour(ms) % 24) + 24) % 24) - 5) / 15));

/** A place's weather at a moment: its aspect (null for calm), its strength (0 .. 1), and the day (phase 0 .. 1 through it, and its name). */
export function weatherAt(place = 'anagami', ms = calNow()) {
  const h = hour(ms), day = { phase: +((((h % 24) + 24) % 24) / 24).toFixed(4), dayPhase: phaseAt(ms) };
  if (!place) return { aspect: null, strength: 0, ...day }; // (the open Emocean: no ego, no mood)
  const t = Math.floor(h / W.block) * W.block, [p1, p2, p3] = W.periods, ph = (k) => hash01(`weather:${place}:${k}`);
  const mood = Math.max(-2, Math.min(2, lawOf(place) * W.lean + W.swing[0] * wave(t, p1, ph(1)) + W.swing[1] * wave(t, p2, ph(2))));
  const intensity = 0.5 + 0.5 * wave(t, p3, ph(3));
  if (intensity < W.calm) return { aspect: null, strength: 0, ...day };
  return { aspect: ASPECTS[Math.round(mood) + 2], strength: +((intensity - W.calm) / (1 - W.calm)).toFixed(2), ...day };
}

/** The place and exposure a position is in (null: between places, or at sea). */
export function placeOf(pos) { const z = pos && zoneOf(pos); return z && ZONE_PLACE[z] ? { place: ZONE_PLACE[z][0], exposure: ZONE_PLACE[z][1] } : null; }

/** The Emocean: what the weather of the island a ship leaves does to the stage (pass it to stagePlan and reckonLead). */
export function stageWx(island, ms = calNow()) {
  const w = weatherAt(island, ms);
  return w.aspect ? { danger: W.danger[w.aspect] * w.strength, lead: 1 + (W.lead[w.aspect] - 1) * w.strength } : { danger: 0, lead: 1 };
}
/** Where an aspect falls its crude is plentiful: the price of that grade on that island, cheaper by the weather's strength. */
export function supplyMult(island, grade, ms = calNow()) { const w = weatherAt(island, ms); return w.aspect === grade ? 1 - W.supply * w.strength : 1; }
/** A Well refilling over a stretch of time: the effective hours, the weather's pull summed game hour by game hour (a mind ruminates
 *  faster in grief and dread). drawWell takes these in place of the raw hours. */
export function fillHours(place, fromMs, toMs) {
  if (!(toMs > fromMs)) return 0;
  let eff = 0, t = fromMs, n = 0;
  while (t < toMs && n++ < 5000) {
    const next = Math.min(toMs, (Math.floor(t / GAME_HOUR) + 1) * GAME_HOUR), w = weatherAt(place, t);
    eff += (next - t) / 3600000 * (w.aspect ? 1 + (W.fill[w.aspect] - 1) * w.strength : 1);
    t = next;
  }
  if (t < toMs) eff += (toMs - t) / 3600000; // (a very long absence: the rest at the plain rate)
  return eff;
}

export class Weather {
  constructor(game) {
    this.game = game;
    this.last = { key: null, phase: null };
    this.t = 0;
  }
  at(place, ms = calNow()) { return weatherAt(place, ms); }
  /** Where a position stands: its place, its exposure, and that place's weather (nothing falls on a roofed place, but its mood is there). */
  here(pos) { const p = placeOf(pos); return p ? { ...p, ...weatherAt(p.place) } : { place: null, exposure: 'open', ...weatherAt(null) }; }
  /** The sky as data (Petra's render/daylight.js and Calissa's sky read the same numbers): the day's phase and the weather over a place. */
  sky(ms = calNow(), place = this.here(this.game.player?.pos).place) { const w = weatherAt(place, ms); return { phase: w.phase, dayPhase: w.dayPhase, light: lightAt(ms), aspect: w.aspect, strength: w.strength }; }
  /** What can be known of a place's weather ahead: a block each, as far as Divination widens the forecast. */
  forecast(place = this.here(this.game.player?.pos).place, hours = W.forecast * (this.game.psyche?.widen?.('divination.forecast') || 1)) {
    const out = [], h0 = hour(calNow());
    for (let h = Math.floor(h0 / W.block) * W.block + W.block; h <= h0 + hours; h += W.block) out.push({ hour: h, ...weatherAt(place, h * GAME_HOUR) });
    return out;
  }

  // ---------------------------------------------------------------- what the weather where a thing stands does
  /** A damage type's build-up, faster in the weather that feeds it (creatures.build, after the mind's take). */
  buildMult(type, pos) { const w = this.here(pos); return w.aspect && TYPE_OF[w.aspect] === type ? 1 + W.build * w.strength : 1; }
  /** How fast a creature's mental state drifts (per second; + toward Prismatic, - toward Stoic): a rate, never a jump. */
  mindDrift(pos) { const w = this.here(pos); return w.aspect ? W.mind[w.aspect] * w.strength * W.mindRate : 0; }
  /** How much more the fish drawn to this aspect bite (a multiplier on the bite chance). */
  fishPull(aspect, pos) { const w = this.here(pos); return w.aspect === aspect ? 1 + W.fish * w.strength : 1; }
  /** At night Lachryma glows: how much further its signatures read (the Dreamvane's range); a Well's dark is always night. */
  signatureMult(pos) { const p = placeOf(pos); return p?.exposure === 'deep' || phaseAt() === 'night' ? W.night.signature : 1; }

  /** Twice a second: say when the weather where the Courier stands, or the day's phase, has turned (for tracking.js, the sound, the sky). */
  update(dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.5;
    const w = this.here(this.game.player?.pos), key = `${w.place}:${w.aspect}:${Math.round(w.strength * 4)}`, phase = phaseAt();
    if (key !== this.last.key) {
      const was = this.last.key;
      this.last.key = key;
      if (w.place) this.game.events.emit(was !== null ? 'weather.change' : 'weather.now', { island: w.place, exposure: w.exposure, aspect: w.aspect, strength: w.strength, by: 'environment' });
    }
    if (phase !== this.last.phase) { const was = this.last.phase; this.last.phase = phase; if (was) this.game.events.emit('day.phase', { phase, by: 'environment' }); }
  }
}
