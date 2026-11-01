// ---------------------------------------------------------------------------------------
// STEALTH: how seen and how heard the Courier is, and how a Figment keeps watch (docs/plans/STEALTH.md; South, 2026-11-01: "consider it an
// update to Figment AI and behavior and part of a bigger 'pokemon snapification' of how the veritome works ... our 'mental safari' tool,
// hunting down and snapping pictures of Figments"). The minds already see in a cone with a line of sight, fill an awareness from a
// glimpse ("?" at 0.35) to certainty ("!" at 1), and hear stimuli (creatures/ai/: senses.js, memory.js, stimuli.js). What they lacked is
// the Courier's side and the watcher's rhythm; this module is both, as modifiers on the minds' one substrate (CLAUDE.md: base change bad,
// modifiers good), each with a source you can see: your posture and pace, the ground under your feet, the hour's light, the weather, the
// tool in your hand, and the creature's own head going up and down.
//
// Every system teaches something real without saying so (DESIGN.md 22). What it teaches here is fieldcraft:
//   - soft ground is quiet and hard ground carries (a stalker keeps to sand and grass; metal and grates ring out);
//   - stillness hides you better than cover does (a still shape is hard to see; movement is what an eye catches);
//   - move while its head is down, freeze when it comes up (deer stalking; the vigilance bouts of foraging animals);
//   - after a fright an animal stays wary a long time and watches more (the "caution" after an alarm);
//   - rain covers your sound (noise against the ambient, Splinter Cell's rule and the real one);
//   - a candid picture is worth more than a posed one (wildlife photography's ethic: if it moves away, you were too close).
//
// Prior art (cited in the plan, STEALTH.md 2): Thief and The Dark Mod (loud and quiet surfaces, the light gem, alert stages with forget
// times growing by stage), Mark of the Ninja (noise drawn as rings, the cone's edge forgiving, the rules shown), Metal Gear Solid (alert,
// evasion, caution), Splinter Cell (noise against the ambient), Assassin's Creed (detection fills from a glimpse), Breath of the Wild
// (the sneak and wildlife that spooks), New Pokemon Snap (behaviour unseen is behaviour worth photographing), and ethology: Hediger's
// flight zones, the flight-initiation meta-analysis (Stankowich and Blumstein 2005: a direct or fast approach flushes sooner), the
// vigilance-bout literature.
//
//   EXPOSE { posture, pace, light, weather, inHand }   exposureOf({ posture, speed, sliding, inHand, light, aspect, strength, indoors })
//   STEP { surface, gait }   stepNoise({ surface, speed, posture, aspect, strength }) -> radius m (0: silent)   LAND   landNoise(fall)
//   VIGIL { up, down, scanEvery, scanFor, caution }   vigilAt(t, seed, wary, caution) -> { up, k }
//   CANDID   candidOf(aware) -> { k, word }   (the photo's multiplier for a subject that did not know)
//   const S = new Stealth(game)   S.loud  (the brain's sight multiplier for the Courier, this frame)   S.update(dt)
//   events: stealth.candid { kind, d, by }   stealth.spook { kind, d, cause, by }
// ---------------------------------------------------------------------------------------
import { lightAt } from './weather.js';

/** How much easier the Courier is to see, as a multiplier on a mind's sight gain (1 = as today's default standing walk). Each factor is
 *  one thing you can see in the world. Numbers ours unless named:
 *  - posture: crouched a smaller, lower shape (0.6); prone hardly a shape at all (0.3) (Thief's crouch; the Dark Mod's crouch halves it);
 *  - pace: still 0.4 (movement is what an eye catches: the Dark Mod's visibility is tuned so a still, lit body is seen about one time in
 *    five a second; ours keeps the old 0.55 for a still stand and goes lower only with the posture), walking 0.85, running 1.15, a sprint or
 *    a slide 1.35;
 *  - light: the hour's light (lightAt: 0.08 starlit .. 1 noon) mapped to 0.45 .. 1 (Thief's light gem, Mark of the Ninja's dark);
 *    roofed places at their lamps' 0.8;
 *  - weather: a feeling's weather that hides (Grief's rain, Dread's fog) at its strength;
 *  - a tool in the hand: 1.15 (the old rule kept). */
export const EXPOSE = {
  posture: { stand: 1, crouch: 0.6, prone: 0.3 },
  pace: { still: 0.4, walk: 0.85, run: 1.15, sprint: 1.35 },
  paceAt: { walk: 0.5, run: 4, sprint: 6.5 },
  light: { floor: 0.45, roofed: 0.8 },
  weather: { grief: 0.25, dread: 0.4, gall: 0.1 },
  inHand: 1.15,
};

/** The Courier's sight multiplier now. Stand still upright and it is 0.4 by pace (today's 0.55 was the posture and pace in one). */
export function exposureOf({ posture = 'stand', speed = 0, sliding = false, inHand = false, light = 1, aspect = null, strength = 0, indoors = false } = {}) {
  const E = EXPOSE;
  const pace = sliding || speed > E.paceAt.sprint ? E.pace.sprint : speed > E.paceAt.run ? E.pace.run : speed > E.paceAt.walk ? E.pace.walk : E.pace.still;
  const lit = indoors ? E.light.roofed : E.light.floor + (1 - E.light.floor) * Math.max(0, Math.min(1, light));
  const veil = 1 - (E.weather[aspect] || 0) * Math.max(0, Math.min(1, strength));
  return (E.posture[posture] ?? 1) * pace * lit * veil * (inHand ? E.inHand : 1);
}

/** A footstep's noise as a stimulus's radius in metres: the gait's reach times the ground's ring. Soft ground is quiet (sand, grass, moss),
 *  hard ground carries (stone, wood), metal and grates ring, wet paint and crude splash. A crouched step is half, a prone one silent.
 *  Rain or a storm covers it (Grief's rain, Fury's hail: noise against the ambient). Surfaces are audio/moves.js STEP's names. */
export const STEP = {
  surface: { sand: 0.55, grass: 0.6, moss: 0.5, clay: 0.8, stone: 1, lachrymite: 1.1, wood: 1.2, water: 1.3, paint: 1.4, crude: 1.4, metal: 1.6, grate: 1.6 },
  gait: { walk: 3, run: 7, sprint: 11 }, // (m: a walk is heard about a room away on stone, a sprint across a yard)
  posture: { stand: 1, crouch: 0.5, prone: 0 },
  cover: { grief: 0.45, fury: 0.35, dread: 0.15 }, // (the weather's own sound over yours, at its strength)
};
export function stepNoise({ surface = 'stone', speed = 0, posture = 'stand', aspect = null, strength = 0 } = {}) {
  const S = STEP, E = EXPOSE.paceAt;
  const reach = speed > E.sprint ? S.gait.sprint : speed > E.run ? S.gait.run : speed > E.walk ? S.gait.walk : 0;
  const cover = 1 - (S.cover[aspect] || 0) * Math.max(0, Math.min(1, strength));
  return +(reach * (S.surface[surface] ?? 1) * (S.posture[posture] ?? 1) * cover).toFixed(2);
}
/** A landing's noise (m): nothing under a hop's fall speed, then growing with it (a fall's impact speed, m/s, `move.land`'s `fall`). */
export const LAND = { quiet: 5, perMs: 1.4, max: 18 };
export const landNoise = (fall = 0) => Math.min(LAND.max, Math.max(0, (Math.abs(fall) - LAND.quiet) * LAND.perMs));

/** A Figment's watch: head down (feeding, idling, its own business) and then up to scan, as foraging animals take vigilance bouts. While
 *  its head is down it sees you at `down` of its sight; on the scan at `up`. A wary individual scans more often (its `bold` trait below
 *  1); after a fright it stays on `caution` for a while, scanning twice as often and seeing more with its head down (Metal Gear's caution,
 *  the Dark Mod's longer forget time a stage up). Seconds are real seconds. */
export const VIGIL = { up: 1, down: 0.3, scanEvery: [4, 9], scanFor: [1.2, 2.4], caution: 60, cautionDown: 0.65, cautionEvery: 0.5 };
const hash = (n) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
/** Where in its watch a creature is at time t: its own bout lengths and offset from its seed, so two are never in step. wary 0.4 .. 1.6
 *  (1 the kind's mean; above scans more often). */
export function vigilAt(t, seed = 1, wary = 1, caution = false) {
  const V = VIGIL, w = Math.max(0.4, wary) * (caution ? 1 / V.cautionEvery : 1);
  const every = (V.scanEvery[0] + hash(seed * 31) * (V.scanEvery[1] - V.scanEvery[0])) / w, scan = V.scanFor[0] + hash(seed * 17) * (V.scanFor[1] - V.scanFor[0]);
  const into = (t + hash(seed) * (every + scan)) % (every + scan), up = into >= every;
  return { up, k: up ? V.up : caution ? V.cautionDown : V.down };
}

/** A photograph's subject that did not know you were there is worth more (New Pokemon Snap: the behaviour seen unseen is the prize; real
 *  wildlife photography's candid shot). Read from the subject's awareness of the Courier when the plate was taken. */
export const CANDID = [
  { below: 0.35, k: 1.5, word: 'candid' }, // (it never knew)
  { below: 1, k: 1.1, word: 'curious' }, // (its "?": it had turned to look)
  { below: Infinity, k: 0.8, word: 'aware' }, // (its "!": it knew, and is posing or bolting)
];
export const candidOf = (aware = 0) => CANDID.find((r) => aware < r.below);

/** The running half: the Courier's exposure each frame (the brain's `loud`, creatures/ai/brain.js reads `game.stealth.loud`), footsteps
 *  and landings made noise stimuli the minds already hear (creatures/ai/stimuli.js), and each creature's watch stamped on it as
 *  `c.vigil` (its sight multiplier, senses.js reads it; `c.vigil.up` is its head up, the body's tell, Calissa's to animate). A creature's
 *  fright (its "!" at you: the minds stamp `c.noticedT`) puts it on caution. */
export class Stealth {
  constructor(game) {
    this.game = game; this.loud = 1; this.t = 0; this.caution = new WeakMap(); this.noticed = new WeakMap();
    const ev = game.events;
    ev?.on?.('move.step', (e) => this.noise(stepNoise({ surface: e.surface, speed: this.speed(), posture: this.posture(), ...this.sky() }), 0.6));
    ev?.on?.('move.land', (e) => this.noise(landNoise(e.fall), 0.9));
  }
  speed() { const v = this.game.player?.vel; return v ? Math.hypot(v.x, v.z) : 0; }
  posture() { const P = this.game.player; return P?.posture || (P?.crouching ? 'crouch' : 'stand'); }
  sky() { const w = this.game.weather?.here?.(this.game.player?.pos); return { aspect: w?.aspect ?? null, strength: w?.strength ?? 0, indoors: !!w && w.exposure !== 'open' }; }
  noise(radius, strength) {
    const g = this.game, P = g.player; if (!(radius > 0.3) || !P || g.god?.active) return;
    g.ai?.stimuli?.emit?.('noise', P.pos, { radius, strength, by: 'courier', source: P, ttl: 0.8 });
  }
  update(dt) {
    const g = this.game, P = g.player; this.t += dt; if (!P) return;
    const sky = this.sky();
    this.loud = exposureOf({ posture: this.posture(), speed: this.speed(), sliding: !!P.sliding, inHand: !!g.belt?.inHand, light: lightAt(), ...sky });
    for (const c of g.creatures?.near?.(P.pos, 60) || []) {
      if (!c.brain || c.training) continue;
      if (c.noticedT != null && this.noticed.get(c) !== c.noticedT) { this.noticed.set(c, c.noticedT); this.caution.set(c, this.t + VIGIL.caution); } // (its "!" at you: the minds stamp noticedT)
      const until = this.caution.get(c) || 0, v = vigilAt(this.t, c.id || 1, 2 - (c.traits?.bold ?? 1), until > this.t);
      if (!c.vigil) c.vigil = { up: v.up, k: v.k }; else { c.vigil.up = v.up; c.vigil.k = v.k; }
    }
  }
}
