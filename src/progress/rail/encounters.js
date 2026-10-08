// ---------------------------------------------------------------------------------------
// ENCOUNTERS AT SEA: a waypoint that is a rest and an event at once (docs/plans/PASSAGE.md section 13; the owner, 2026-10-08: "I love
// the idea of cinematic encounters at sea like a Rest site hybridized with an Event node"). The ship is mended as at a calm, and a
// short cinematic plays (a sequence: game.cine), ending in a choice with stakes, said in the log and answered in the world (no window
// of words but the dialogue box, when one of the folk speaks). Which encounter resolves on arrival, Slay the Spire's "?" room: its
// portent shows a haven's silhouette, and each encounter's weight rises while it is unseen, so a long voyage meets them all.
//
// Prior art: FTL's events (a choice whose stakes you read from what you carry), Slay the Spire's "?" rooms and rest sites (rest or
// upgrade: one or the other), Sunless Sea's storylets at sea, Skies of Arcadia's discoveries, Wind Waker's sea encounters (the ghost
// ship, the submarines, the merchant on his boat), Outer Wilds' quiet wonders, and the KH2 Gummi routes' set dressing.
//
//   ENCOUNTERS[id] = { weight, mend, needs?, choices: [{ id, does, cost?, gain?, risk?, needs? }] }   pickEncounter(seen, rng, { ghost }) -> id
//   offered(id, ship) -> [choice]   (needs: 'ghost' a run of this sea chart to race, the day's best or a rutter's; 'dive' a ship that
//   dives: PASSAGE.md section 14)
//   apply(state, id, choice, ctx) -> { state, asks: [ask] }   (the choice's effect on the trip's state, progress/rail/trip.js, and what
//   the world must do besides: Petra's triprun.js acts on the asks; ctx = { chart, rng, rutter?, minutes?, ghost?, wordsLeft? })
//   raceRank(rank, beat) -> rank   postedBounty(waypoint) -> cubes   strengthOf(state, waypoint) -> strength   ENCOUNTER (the numbers)
//   (the words, the names and the cinematics are Espada's and Calissa's: these are the mechanics, with working names)
// ---------------------------------------------------------------------------------------
import { SHIPS } from './ships.js';
import { next, rutterWorth, classOf } from '../econ/passage.js';
import { ECON } from '../econ/table.js';

export const ENCOUNTERS = {
  /** A convoy of ghost ships passing in the fog: follow them (the next two waypoints' portents exact) or loot the last (a fight leg's
   *  worth of casks, and the Wreckers' share up for the rest of the passage). */
  ghostConvoy:  { weight: 1, mend: 3, choices: [{ id: 'follow', does: 'the next two waypoints shown exactly' }, { id: 'loot', does: 'casks of crude, the Wreckers drawn to you', gain: { casks: 2 }, risk: { wreckers: 0.15 } }] },
  /** Letty Marque's cutter alongside: take a posted bounty onto this passage, or sell her the rutter you carry at a premium. */
  lettysCutter: { weight: 1, mend: 3, choices: [{ id: 'bounty', does: 'a bounty waypoint placed ahead' }, { id: 'sell', does: 'a rutter sold at 1.25 its worth', needs: 'rutter' }] },
  /** A whale of light singing under the crude: listen (the reckoning raised for the rest of the passage, a Divination act) or follow it
   *  down (a dive into a hidden Umbral leg: a sloop's dare, refused by a ship that cannot dive). */
  lightWhale:   { weight: 1, mend: 3, choices: [{ id: 'listen', does: 'the reckoning of this passage raised by a quarter' }, { id: 'follow', does: 'a hidden Umbral leg, richer', risk: { leg: 'umbral' }, needs: 'dive' }] },
  /** A stranded Contractor on a raft: take them aboard (fuel spent, a hand for the next leg: they man a mount) or leave them (nothing). */
  castaway:     { weight: 1, mend: 3, choices: [{ id: 'rescue', does: 'a crew hand for the next leg', cost: { fuel: 1 }, needs: 'fuel' }, { id: 'leave', does: 'nothing' }] },
  /** The Purser's barge at anchor: trade casks at mid-sea prices, buy fuel, or buy today's rutter of this route. */
  pursersBarge: { weight: 1, mend: 3, choices: [{ id: 'trade', does: 'casks sold and bought at the barge' }, { id: 'rutter', does: 'today\'s rutter of this route, at list' }] },
  /** A mirror-calm where your own best crossing of this route sails beside you as a ghost: race it through the next leg for a rank
   *  bonus, or let it pass. */
  mirrorSea:    { weight: 0.7, mend: 3, needs: 'ghost', choices: [{ id: 'race', does: 'beat your ghost through the next leg: its rank a step up' }, { id: 'pass', does: 'nothing' }] },
  /** A bottle drifting with a paper in it: an ostracon's word, or a note of a waypoint ahead (its portent exact). */
  driftBottle:  { weight: 0.7, mend: 3, choices: [{ id: 'read', does: 'a word glossed, or a portent made exact' }] },
};

/** Which encounter resolves on arrival: weighted, each one's weight doubled for every voyage it has not been met (`seen[id]` is the count of
 *  voyages since; capped at x8), so the sea shows you everything in time (Slay the Spire's "?" odds that rise while unseen). The Glass
 *  only where there is a run of this sea chart to race (`ghost`): a double from another day's sea would sail a different sea. */
export function pickEncounter(seen = {}, rng, { ghost = false } = {}) {
  const ids = Object.keys(ENCOUNTERS).filter((id) => ENCOUNTERS[id].needs !== 'ghost' || ghost), w = ids.map((id) => ENCOUNTERS[id].weight * Math.min(8, Math.pow(2, seen[id] || 0)));
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) { x -= w[i]; if (x <= 0) return ids[i]; }
  return ids[ids.length - 1];
}

/** The choices an encounter offers a ship and what it carries: a ship that cannot dive is never offered the dive, a ship with no rutter
 *  aboard nothing to sell, a tank short of a measure no castaway to feed (`ctx.rutter`, `ctx.fuel`: left out, not judged). */
export const offered = (id, ship = 'sloop', ctx = {}) => (ENCOUNTERS[id]?.choices || []).filter((c) =>
  (c.needs !== 'dive' || SHIPS[ship]?.dive) && (c.needs !== 'rutter' || ctx.rutter === undefined || !!ctx.rutter) && (c.needs !== 'fuel' || ctx.fuel == null || ctx.fuel >= (c.cost?.fuel ?? 0)));

/** The numbers of the effects, each with its reason. */
export const ENCOUNTER = {
  /** Following the ghost convoy shows the next two columns exactly (two: one leg's warning and the next's choice). */
  follow: 2,
  /** Looting it: two casks of the waypoint's feeling (a fight leg's pay in cargo), and every Wreckers leg ahead a sixth stronger. */
  loot: { casks: 2, wreckers: 0.15 },
  /** Letty buys a rutter at a quarter over its worth (her marque's premium: better than the Purser's 1.0, for the trouble). */
  sell: 1.25,
  /** The whale's song: the reckoning a quarter sharper (as heaving to's reckon, TRIP.reckon: the same verb, a second source). */
  listen: 0.25,
  /** Its dive: a hidden Umbral leg, half again the pay of the leg it follows (the dare's price is the danger, so it pays). */
  dive: { pays: 1.5, form: 'umbral' },
  /** The castaway's measure of fuel, and the hand they give: one extra mount slot for the next leg (they man it). */
  rescue: { fuel: 1, slots: 1, legs: 1 },
  /** The barge's counter: casks sold at 0.85 and bought at 1.15 of the Purser's posted price (mid-sea: dearer both ways, but here). */
  barge: { sell: 0.85, buy: 1.15 },
  /** Letty's posted bounty: what clearing the marked leg pays, in real minutes of the aim by the waypoint's class (Guppy 0 .. Leviathan 4),
   *  so it weighs against her other offer, a rutter sold at 1.25 (about 50 to 80 cubes): six minutes of the aim at a Guppy, a quarter
   *  more a class. Over a five-minute passage that is about 1.2 times the aim: a good leg, never a jackpot (the aim's ceiling is 1.5).
   *  Not bountyPay (livelihoods.js): that is a named hunt's, two real hours' aim for a Whale. */
  bounty: { minutes: 6, perClass: 0.25 },
  /** A ghost beaten lifts the crossing's rank one letter (never past S; a coin-fed run is still capped). */
  race: 1,
  /** The bottle: an ostracon's word half the time while any are left to find, else a waypoint ahead made exact. */
  word: 0.5,
};
const RANKS = ['D', 'C', 'B', 'A', 'S'];
/** What Letty's posted bounty pays for clearing a waypoint's leg (ENCOUNTER.bounty). */
export const postedBounty = (w) => Math.round(ECON.perMinute * ENCOUNTER.bounty.minutes * (1 + ENCOUNTER.bounty.perClass * Math.max(0, Math.min(4, Math.round(w?.strength ?? 0)))));
/** A leg's rank after a race: one letter up if the ghost was beaten. */
export const raceRank = (rank, beat) => (beat ? RANKS[Math.min(RANKS.length - 1, RANKS.indexOf(rank) + ENCOUNTER.race)] ?? rank : rank);
/** A waypoint's strength as the trip has made it (the Wreckers drawn to you by a loot), for `schedule`'s `strength`. */
export const strengthOf = (state, w) => (w?.strength ?? 1) + (state?.drawn?.[w?.type] || 0);

/** The waypoints still ahead of the ship on its drafted path (`state.plan`, the passage's ids) or, wanting one, every waypoint after
 *  the current along the chart's lanes, nearest column first. */
function ahead(state, chart) {
  const i = state.plan ? state.plan.indexOf(state.at) : -1;
  if (state.plan && i >= 0) return state.plan.slice(i + 1);
  const out = [], seen = new Set(); let front = next(chart, state.at ?? null);
  while (front.length) { const n = []; for (const id of front) if (!seen.has(id)) { seen.add(id); out.push(id); n.push(...next(chart, id)); } front = n; }
  return out;
}

/** An encounter's choice made: the trip's state after it, and what the world must do besides (each ask a plain object, `ask` its kind):
 *    exact { waypoints }          their portents shown as they are (the sea chart's; ghostConvoy.follow, driftBottle.read)
 *    casks { n, grade }           crude into the hold (ghostConvoy.loot; the hold's limit is the world's)
 *    bounty { waypoint, cubes }   that waypoint sailed as a bounty leg, its feeling kept; cleared, it pays `cubes` (lettysCutter.bounty)
 *    sellRutter { cubes }         the carried rutter given to Letty for this (lettysCutter.sell; ctx.rutter is its worth today)
 *    hiddenLeg { form, pays, after }  a leg added after this waypoint, sailed in that form, its score times `pays` (lightWhale.follow)
 *    crew { slots, legs }         a mount slot more for that many legs (castaway.rescue)
 *    counter { sell, buy }        the Purser's counter at those factors of the posted price (pursersBarge.trade)
 *    buyRutter { route, day, cubes }  today's rutter of this route offered at list (pursersBarge.rutter)
 *    ghost { legs }               the best run of this sea chart sails beside you that many legs; `raceRank` at its end (mirrorSea.race)
 *    ostracon {}                  a word found (driftBottle.read)
 *  An unknown choice changes nothing. Pure: the same state, choice and rng give the same. */
export function apply(state, id, choice, ctx = {}) {
  const s = { ...state }, asks = [], { chart, rng = () => 0.5 } = ctx, E = ENCOUNTER;
  const on = chart ? ahead(s, chart) : [], w = chart?.waypoints?.[s.at];
  switch (`${id}.${choice}`) {
    case 'ghostConvoy.follow': { const cols = [...new Set(on.map((x) => chart.waypoints[x].col))].slice(0, E.follow); asks.push({ ask: 'exact', waypoints: on.filter((x) => cols.includes(chart.waypoints[x].col)) }); break; }
    case 'ghostConvoy.loot': s.drawn = { ...(s.drawn || {}), wreckers: (s.drawn?.wreckers || 0) + E.loot.wreckers }; asks.push({ ask: 'casks', n: E.loot.casks, grade: w?.feel || s.feel || 'mirth' }); break;
    case 'lettysCutter.bounty': { const t = on.find((x) => classOf(chart.waypoints[x].type) === 'threat') ?? on[on.length - 1]; if (t) asks.push({ ask: 'bounty', waypoint: t, cubes: postedBounty(chart.waypoints[t]) }); break; }
    case 'lettysCutter.sell': if (ctx.rutter) asks.push({ ask: 'sellRutter', cubes: Math.round(ctx.rutter * E.sell) }); break;
    case 'lightWhale.listen': s.sharp = (s.sharp || 0) + E.listen; break;
    case 'lightWhale.follow': if (SHIPS[s.ship]?.dive) asks.push({ ask: 'hiddenLeg', form: E.dive.form, pays: E.dive.pays, after: s.at }); break;
    case 'castaway.rescue': if (s.fuel >= E.rescue.fuel) { s.fuel -= E.rescue.fuel; s.crew = (s.crew || 0) + E.rescue.slots; asks.push({ ask: 'crew', slots: E.rescue.slots, legs: E.rescue.legs }); } break;
    case 'pursersBarge.trade': asks.push({ ask: 'counter', ...E.barge }); break;
    case 'pursersBarge.rutter': if (chart) asks.push({ ask: 'buyRutter', route: chart.route, day: chart.day, cubes: Math.round(rutterWorth({ minutes: ctx.minutes ?? 5, rank: 'B', read: 1 }) * ECON.passage.list) }); break;
    case 'mirrorSea.race': if (ctx.ghost) { s.race = { legs: 1, ghost: ctx.ghost }; asks.push({ ask: 'ghost', legs: 1 }); } break;
    case 'driftBottle.read': {
      if ((ctx.wordsLeft ?? 0) > 0 && rng() < E.word) asks.push({ ask: 'ostracon' });
      else if (on.length) asks.push({ ask: 'exact', waypoints: [on[Math.floor(rng() * on.length) % on.length]] });
      break;
    }
    default: break; // (castaway.leave, mirrorSea.pass: nothing)
  }
  return { state: s, asks };
}
