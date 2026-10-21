// ---------------------------------------------------------------------------------------
// THE CROSSING'S SET_PIECES, IN NUMBERS: the shoal, the pirates and the rogue Leviathan (docs/plans/RAIL.md; their order and views are
// progress/rail/crossing.js). Every number here answers to a reason, said beside it, and the ones that can be measured are measured by
// scripts/rail.mjs (density per bar, hits a player at each skill takes, the pirates' worth to a cargo). Counts of shots are psygun
// shots (one a sixteenth note at full auto); a lance (the lock-on's homing shot) is worth `LANCE` shots.
//
// THE SHOAL is a boid school (Craig Reynolds, "Flocks, Herds and Schools", 1987: separation, alignment, cohesion), given a mood that
// turns it from a school into a bait ball and then a frenzy (the sardine run's bait ball; the piranha's pulse; Finding Nemo's moonfish
// as one body). Its flocking is an AI part Petra builds once (creatures/ai/, docs/AI.md); its numbers and moods are here.
// THE PIRATES come for cargo: their chance rises with every cask aboard, and what they carry is crude (Sid Meier's Pirates!, Sunless
// Sea, Assassin's Creed IV's boarding, Wind Waker's cannon duels, Skies of Arcadia's ship battles: a ship as a boss with parts).
// THE ROGUE LEVIATHAN is rare and certain: a deck, so it comes within its count (progress/econ/deck.js); it is driven off, not killed,
// unless felled (Panzer Dragoon's sea-beasts, Sin & Punishment's leviathan, Shadow of the Colossus's Phalanx, Moby-Dick), and once
// driven off it is a bounty for Letty Marque to post.
//
//   LANCE   WAVES   SHOAL   PIRATES (.chance(casks, danger))   LEVIATHAN   CHARYBDIS   charybdisHurt(form, y) -> times   leviathanDeck(danger, aspect?) -> n   lootField(island) -> field
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** A lance (one target of a lock-on volley) is worth this many shots: a full volley of eight is a second and a half of full auto in
 *  one release, which is what makes the sweep worth its Lachryma. */
export const LANCE = 4;

/** The authored waves' fire (progress/econ/emocean.js STAGE: roles, not creatures): shots each one fires a bar, the share of them
 *  outlined (parryable), how many bars it stays before it is gone, and its hit points in shots by class (Guppy .. Leviathan). A darter's
 *  shots are all outlined because the darters' act teaches the parry; a heavy's half, so the parry is a choice under its fire. The first
 *  half is a lesson (Star Fox's Corneria): measured, at a darter's shot a bar a novice came out of it with two hits of six spent. */
export const WAVES = {
  fire: { school: 0.25, darter: 0.5, heavy: 2 }, outlined: { school: 0, darter: 1, heavy: 0.5 }, stay: { school: 2, darter: 1, heavy: 10 },
  hp: [1, 3, 12, 40, 150],
};

/** THE BOSS LAW (the owner, 2026-10-21: "rethink having them flee based on a time metric and make the player have to properly fight it
 *  out? Taking a boss down in 10 seconds feels quite lame"; docs/plans/RAIL-FLOW.md 5). A boss leaves only when beaten: its leg's cue
 *  holds its peak (Wanda's hold, looping on the bar) until it falls. It is about `shots` of the gun across its parts and core: an
 *  expert (39.5 shots a bar landed, Petra's charybdistest) takes about 30 bars, 45 real s; a good player (24 a bar) about 75 s; a novice
 *  two minutes. Cross-referenced (RAIL-FLOW.md 11): Ikaruga's bosses fall to experts in 17 to 25 s inside a 100 s limit and time out;
 *  the owner wants them fought out, so ours run about twice an Ikaruga expert's time and never leave. Past `enrage` real s it quickens
 *  (its patterns' gaps times `quicken`), never flees. Each part owns one attack and breaking it moves the boss to its next phase (Star Fox 64's bosses). */
export const BOSS = { shots: [1100, 1300], enrage: 180, quicken: 2 / 3 };

export const SHOAL = {
  /** How many: 48 at the Guppy class, 24 more a class (Guppy 48, Barracuda 72): enough to read as one body and to fill the bait ball's
   *  ring at 10 m with a fish every 1.3 m; instanced (render/propbatch.js), one draw call. */
  count: (cls) => 48 + 24 * cls,
  /** Reynolds' three rules: [radius in m, weight]. Separation's radius is about a body length; cohesion's reaches across the ball. */
  boids: { sep: [0.8, 1.6], align: [3, 1.0], coh: [4.5, 0.8], speed: 12, burst: 22, turn: 6 }, // (m/s cruise, m/s strike, rad/s)
  /** The bait ball: the school rings the ship and tightens a bar at a time, never closer than `min` (a ring you can still shoot out of). */
  ball: { radius: 10, tighten: 0.6, min: 5 },
  /** The frenzy: every bar a strike group leaves the ball for where the ship will be (`lead` real s ahead); the group turns its
   *  flanks a quarter bar first (the sardine's silver turn: a motion, never a flash), so a strike is read before it comes. */
  frenzy: { every: 1, group: (cls) => 4 + 2 * cls, lead: 0.35, telegraph: 0.25 },
  /** While its caller lives the crude keeps feeding the ball: `perBar` more fish rise each bar (so the caller is the set piece's key:
   *  shoot the ball and it refills; shoot the caller and it breaks). The fish of a ball are one body, so they do not chain (score.js:
   *  a ball of ninety would be ninety links for free; measured, it scored ten times a pirate crossing). */
  reinforce: { perBar: 6 },
  /** Five bites are one hit on what the ship bears: one fish is a nuisance, a strike group that lands is a wound. */
  bite: { perHit: 5 }, // (measured: at four, a novice came through the shoal one crossing in three, and it is the common setPiece)
  /** A fish is one shot; the caller (twice the size, its own glow: Calissa's) 40, and it is hurt only while the ball is scattered (the
   *  fish close round it otherwise): break the ball, then two bars to bring it down (a good player's 48 shots). Was 4, one lance: the
   *  owner's "10 seconds" boss (RAIL-FLOW.md 5). Down the caller, or a third of the shoal within a
   *  bar, or toll the bell in it, and the shoal scatters for two bars before it reforms (what a predator does to a real one). */
  fish: { hp: 1 }, caller: { hp: 40, size: 2, guarded: true }, // (the caller falls to one lance: the lock-on is the answer the shoal teaches)
  scatter: { share: 0.3, within: 1, bars: 2 },
};

export const PIRATES = {
  /** The chance a crossing meets them: a tenth on an empty hold, six hundredths more a cask, a little more on a wild route, never more
   *  than six in ten (a full sloop of 8 casks: 0.58; the day's dice decide, so the same day and cargo meet the same sea). */
  chance: (casks = 0, danger = 0) => Math.min(0.6, 0.1 + 0.06 * casks + 0.05 * Math.max(0, danger)),
  /** The brig, as a boss with parts (Skies of Arcadia): its hull, four points of rigging (one lance each cuts one), six gunports. */
  brig: { hull: 720, rigging: 4, riggingHp: 60, ports: 6, portHp: 40 }, // (BOSS: 240 in ports, 240 in rigging, 720 in the hull; was 420, 32 and 30, sunk or limping off at 30 bars)
  /** Astern (bars 62 to 70): the bow chasers lob a shot every two bars, slow (16 m/s) and outlined: parried back, it holes her bow. */
  chaser: { every: 2, speed: 16, parry: true, returned: 6 },
  /** Alongside (70 to 84): a volley every two bars from the open ports, the ports opening a bar before (the windup's outline on each);
   *  round shot is too heavy to turn (`parry: false`: roll or move). A volley is a wall with gaps (Mushihime-sama's lesson: a pattern is
   *  a path), so it catches the ship at most once, and every port shut widens the gaps: its chance to catch you is the share still open
   *  (measured: a novice crossing at 0.18 a shot was a massacre, 39% passed). Boarders swing across on ropes every four bars, two at a time: each
   *  one that stands on your deck for a bar takes a cask (shoot it, hook it, kick it off). */
  broadside: { every: 2, telegraph: 1, shotsPerPort: 3, speed: 20, parry: false },
  boarders: { every: 4, count: 2, swing: 1, stay: 1, steals: 1 }, // (three crossings of two: measured, one every two bars took a novice's whole hold)
  /** At bar 84 she comes about to ram: a bar and a half to see it coming; it costs two of what the ship bears unless her hull is holed
   *  or you boost clear. */
  ram: { eta: 1.5, hits: 2 },
  /** How it ends (the boss law: she does not limp off on a clock): holed (hull to 0) she sinks and her hold floats astern; dismasted
   *  first (all the rigging cut) she strikes her colours when holed and pays both. Her phases by parts: the broadside and boarders while
   *  her ports stand; three ports shut, she comes about (the bow chasers and the ram); her rigging cut, no more boarders (their ropes
   *  hang from it). Casks of crude, gathered by flying through them (or the hook). */
  loot: { sunk: 2, struck: 1 }, comeAbout: 3, // (ports shut that turn her about)
};

export const LEVIATHAN = {
  /** One in `deck` crossings, certain by the last: 12 on a calm route, 3 fewer a step of danger, at least 4, at most 16; under the pall
   *  (dread's weather, the sea's worst mood) half as many. The Margarite run (danger -0.5): 14; Anagami to Entropolis (1.5): 8. */
  deck: { base: 12, perDanger: 3, min: 4, max: 16, pall: 0.5 },
  /** Its parts: four gills (open three bars in four, as it breathes, in every phase it is near, not only abreast), six teeth guarding
   *  its maw, the throat (hurt by its spits parried down it, and by the gun once every gill is shut). It is felled, never driven off on a
   *  clock (the boss law): each gill shut makes it sound sooner and surface angrier (a phase a gill); with the gills gone it opens its
   *  maw, the teeth before the throat. 400 + 180 + 500 shots: about 31 bars for an expert at the gills' uptime. */
  gills: { count: 4, hp: 100, open: 3, of: 4 }, teeth: { count: 6, hp: 30 }, throat: { spits: 5, hp: 500 },
  /** Its blows: the breach across the rail (a bar's warning: the sea bulges), the fin sweep while it runs alongside (a windup bar, too
   *  heavy to parry: roll), the spit (every bar, outlined: parried into an open gill it does 5), and the one breach from under at bar
   *  84 (its shadow grows two bars; leave the 8 m ring). Every big blow has a bar or more of warning: it is a spectacle to read, not a
   *  wall (measured: with fins in the maw too and two breaches from under, 6% of novices came through). */
  breach: { warn: 1, hits: 2 }, fin: { every: 2, windup: 1, hits: 1, parry: false }, spit: { every: 1, parry: true, returned: 5 },
  sound: { grow: 2, radius: 8, hits: 2, at: 84 },
  /** What it leaves, felled: three shards of Lachrymite (`mat.shard`) and Letty's bounty on it (livelihoods.js bountyPay(4)). It is not
   *  driven off any more (the boss law); `driven` stays for a ship that fails mid-fight and limps home. */
  pay: { driven: 1, felled: 3 },
};

/** CHARYBDIS, the maelstrom's Egregore (Homer's whirlpool; the owner, 2026-10-08: "it fights you in both worlds"): held at the
 *  whirlpool's heart at the leg's peak (Petra's world/emocean/charybdis.js), it rises out of the maelstrom (the Astral) and dives back
 *  in (the Umbral) by turns of `bars`, `rise` metres over the crude and `depth` under it, a `swing` of a bar between.
 *  HOW IT IS HURT (Dovina's ruling, the point of the leg): only from the world it is in. A shot of the Astral form strikes it risen, of
 *  the Umbral form dived; the other glances off (no harm, the resist mark). Crossing the surface (within `band` metres of it) it is
 *  open to both and takes `surface` times: **the surface strike**, Ikaruga's polarity switch made a timing (catch it as it breaches or
 *  sounds). So the leg asks you to follow it down and up on its beat, and a ship that cannot dive (the tanker, the galleon) can hurt it
 *  only risen and at the surface: half the window, the price of a heavy hull (PASSAGE.md 11).
 *  `hp` in shots (a lance is LANCE shots): measured (Petra's scripts/charybdistest.mjs, 2026-10-08), a scripted expert who follows it
 *  in both worlds deals about 39 a bar (the gun fires every sixteenth: the Astral's spread of three, the Umbral's heavy shot of 2.5), so
 *  150 (a Leviathan's class, the first guess) fell in 3.8 bars of the 24. 480 is half the peak for that expert: one rise and dive and a
 *  half seen through, the fight's shape met before it ends; a player less sure of the switch takes most of the peak; a ship that cannot
 *  dive gets only the risen bars and the surface, about the whole peak even for the expert. Measured against `bar` in charybdistest.
 *  What it leaves: felled, two crystal shards and its class's down pay (the leg's score); driven off (alive when the peak ends), nothing
 *  more: it is in every maelstrom, so unlike Old Nobody it is no bounty (Letty posts the rogue, not the sea's own). */
export const CHARYBDIS = {
  bars: 4, rise: 7, depth: -6, swing: 1,
  hp: 640, surface: 2, band: 1.5, // (the core; with its parts, 1200, the whole is BOSS.shots: 480 fell to an expert in 12 bars, 18 s, the owner's "10 seconds")
  /** Its look's parts made parts (vfx/charybdis.js: Calissa's): six eyes, each aiming one of its aimed attacks (an eye shut, that aim
   *  gone), and two baleen combs, each a wall of its whirl (a comb broken, a gap in the wall). Hurt by the world rule as its core is. */
  eyes: { count: 6, hp: 40 }, combs: { count: 2, hp: 160 },
  pay: { felled: 2, driven: 0 }, // (driven: only a ship that fails mid-fight; it is not driven off on a clock any more)
};
/** How much a shot of the ship's `form` ('astral' | 'umbral') hurts Charybdis at height `y` (metres over the crude): 1 in its own world,
 *  0 in the other (it glances), CHARYBDIS.surface while it crosses the surface. */
export const charybdisHurt = (form, y) => (Math.abs(y) <= CHARYBDIS.band ? CHARYBDIS.surface : (y > 0) === (form !== 'umbral') ? 1 : 0);

/** The size of the Leviathan's deck on a route of this danger, under this weather's aspect (weather.js: 'dread' is the pall). */
export function leviathanDeck(danger = 0, aspect = null) {
  const D = LEVIATHAN.deck;
  const n = Math.max(D.min, Math.min(D.max, Math.round(D.base - D.perDanger * danger)));
  return aspect === 'dread' ? Math.max(D.min, Math.round(n * D.pall)) : n;
}

/** What crude the pirates carry: the field of the island left behind (crude is named for its field: the owner, 2026-10-11). */
export const lootField = (island) => ECON.islands[island]?.field || 'dunemaw';
