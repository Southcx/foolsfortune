// ---------------------------------------------------------------------------------------
// THE CROSSING: the Emocean's rail shooter as a score (docs/plans/RAIL.md; the owner, 2026-10-07: "a love letter to the genre"). One
// crossing is one hop's stage, 100 bars of Wanda's Crude Sea (src/music/emocean.js), and this module is its SCORE in the musical sense:
// which VIEW the camera holds in each ACT, when it SWINGS to the next, which SET PIECE fills the second half, and what each BEAT of it
// asks of the player. Data and pure functions; the rail, the camera, the ship and the creatures are Petra's; the look Calissa's; the
// cue Wanda's; the names Espada's.
//
// THE RULES IT KEEPS (each one is checked by scripts/rail.mjs):
//   - Everything falls on a bar line (Rez): a view swings on a bar, a wave enters on a bar, a beat begins on a bar.
//   - A SWING takes one bar and ends on the act's first bar; nothing new enters during a swing (a player never meets a threat while the
//     ground under their thumbs is turning).
//   - Each act teaches one thing, then the set piece asks for all of them (Star Fox 64's training-then-test; Ikaruga's chapter shape).
//   - The day changes lanes and which set piece, never the order of an act (an arcade stage is learnable: it is the same stage).
//
// THE VIEWS (one ship, five cameras, each the genre's own grammar): chase (Star Fox 64: behind the ship, a free reticle at two depths),
// above (Ikaruga, Mushihime-sama, DoDonPachi: straight down on the crude sea, the gun along the scroll, threats as patterns), side
// (Einhander, R-Type, Gradius: the 2.5D duel, the gun along the scroll), free (Sin & Punishment: the ship on the rail, the reticle loose
// over the whole screen, things coming at the camera), astern (Panzer Dragoon's look back, the Star Fox 64 all-range turn: facing the
// way you came, something chasing). In chase and free the mouse aims; in above and side the gun fires along the scroll and the mouse
// rests (a real shmup's honesty: your position is your aim).
//
// THE SET PIECES (bars 62 to 96 on a short hop; a long crossing chains up to three, with a breather between: LEG below): the SHOAL (a
// boid school that boils up and strikes in pulses, Piranha-fashion), the PIRATES (a brig astern, then alongside: a broadside duel), and
// the ROGUE LEVIATHAN (rare: a deck, so it is certain within its count; when it comes it is the last). Pirates come for cargo, so their
// chance rises with every cask aboard: risk scales with what you carry (Sid Meier's Pirates!, Sunless Sea). Their numbers are in
// progress/rail/setpieces.js. When the ship has borne all it can, THE CONTINUE (below) is an arcade's coin.
//
// Prior art, the love letter: Star Fox 64 (two-minute stages, a hit counter and a medal, a breather, the all-range turn), Ikaruga
// (polarity, chains of three, chapters that each teach one idea), Einhander (the 2.5D camera that swings mid-stage, gunpods taken off
// the enemy), Sin & Punishment (the free reticle, the sword that sends shots back), Mushihime-sama and DoDonPachi (the bullet pattern
// as choreography, point-blank pay), RayStorm and RayCrisis (the lock-on sweep, its doubling bonus), Kingdom Hearts 1 and 2's Gummi
// Ship (the world map's hop as a rail stage, set pieces as the stage's heart), Rez (everything on the beat), Panzer Dragoon (the look
// round, the sea-beast that runs alongside), Thunder Force (the musical boss), and Radiant Silvergun (the stage as one composition).
//
//   BARS   VIEWS[id]   SWING   ACTS[{ id, from, to, view, teaches }]   SET_PIECES[id] = { beats: [{ bar, view?, beat, does }], keep }
//   LEG   legsOf(distance, danger) -> 1..3   barsOf(legs)   legStart(k)   setPiecesOf({ route, day, casks, danger, leviathan, legs }) -> [..]
//   timeline(pieces) -> { acts, beats, bars }   viewAt(bar, timeline | piece)   swings(timeline | piece)   script(from, to, day, opts)
//   CONTINUE   SHRINE_ISLAND   shipLaw(from, to, share)   continueCost(from, to, share, shrine, continues) -> cubes
// ---------------------------------------------------------------------------------------
import { STAGE, stagePlan, routeId, hop, ROLE_CLASS, NODES, CHART, LEG, legsOf, barsOf, legStart } from '../econ/emocean.js';
import { fuel } from '../econ/islands.js';
import { ECON } from '../econ/table.js';
import { PIRATES } from './setpieces.js';

/** Bars in a crossing of one set piece: Wanda's Crude Sea is 100 bars of 1.5 real s (src/music/emocean.js STAGE_BARS); a wave's `at` is
 *  bar / BARS. A longer crossing chains set pieces (LEG, below). */
export const BARS = 100;
export const BAR_S = STAGE.seconds / BARS;

/** The five views. `aim`: 'free' (the mouse moves the reticle) or 'scroll' (the gun fires along the way the world scrolls). `plane`: the
 *  plane the ship moves in (screen: up/down/left/right on the screen; sea: over the water seen from above; wall: up/down and along). */
export const VIEWS = {
  chase:  { aim: 'free',   plane: 'screen', faces: 'ahead',  prior: 'Star Fox 64' },
  above:  { aim: 'scroll', plane: 'sea',    faces: 'down',   prior: 'Ikaruga, Mushihime-sama, DoDonPachi' },
  side:   { aim: 'scroll', plane: 'wall',   faces: 'abeam',  prior: 'Einhander, R-Type, Gradius' },
  free:   { aim: 'free',   plane: 'screen', faces: 'ahead',  prior: 'Sin & Punishment' },
  astern: { aim: 'free',   plane: 'screen', faces: 'behind', prior: 'Panzer Dragoon, Star Fox 64 (all-range)' },
};
/** A swing between views: it takes `bars` and ends on the new act's first bar; nothing enters from its start to its end. */
export const SWING = { bars: 1 };

/** The first half, the same every crossing: each act teaches one thing (and the cue's sections are these acts: src/music/emocean.js). */
export const ACTS = [
  { id: 'launch',   from: 0,  to: 9,   view: 'chase', teaches: 'the ship: moving in the box, the two reticles, the barrel roll' },
  { id: 'schools',  from: 9,  to: 26,  view: 'chase', teaches: 'the gun, and the lock-on sweep (a school is eight in a line)' },
  { id: 'pincer',   from: 26, to: 36,  view: 'above', teaches: 'polarity: shots of your feeling are drunk, the other one hurts' },
  { id: 'darters',  from: 36, to: 50,  view: 'free',  teaches: 'the parry: darters spit outlined shots at the camera; V sends them back' },
  { id: 'breather', from: 50, to: 62,  view: 'chase', teaches: 'the sea itself: flotsam to gather, the reckoning\'s marks, a breath' },
  { id: 'setpiece', from: 62, to: 96, view: null,    teaches: 'everything at once' },
  { id: 'arrive',   from: 96, to: 100, view: 'chase', teaches: 'nothing: the tally, and the island in sight' },
];

/** The second half: one set piece, each its own little stage with its own views (bars 62 to 96). `keep`: the authored STAGE waves past
 *  bar 62 that still come (the shoal keeps them as its escort; the pirates and the Leviathan clear the sea for themselves). */
export const SET_PIECES = {
  shoal: {
    keep: true,
    beats: [
      { bar: 62, view: 'above',  beat: 'boil',    does: 'the crude boils under the ship: the shoal rises and balls round you, tightening a bar at a time' },
      { bar: 70, view: 'chase',  beat: 'frenzy',  does: 'the ball strikes in pulses from every side; its caller glows: down the caller and the shoal scatters' },
      { bar: 84, view: 'chase',  beat: 'heavy',   does: 'what the shoal was running from: the heavy and its escort (the authored waves)' },
    ],
  },
  pirates: {
    keep: false,
    beats: [
      { bar: 62, view: 'astern', beat: 'sails',     does: 'a brig astern, closing; its bow chasers lob outlined shot: parry it back into her bow' },
      { bar: 70, view: 'side',   beat: 'broadside', does: 'alongside: the gunports open a bar before each volley; boarders swing across; cut the rigging with a full lock' },
      { bar: 84, view: 'chase',  beat: 'ram',       does: 'crippled or not, she comes about to ram: hole her hull or out-run her' },
      { bar: 92, view: null,     beat: 'colours',   does: 'she strikes her colours or limps off; what she carried floats astern' },
    ],
  },
  leviathan: {
    keep: false,
    beats: [
      { bar: 62, view: 'free',  beat: 'heave',     does: 'the sea heaves; it breaches across the rail ahead: roll through the spray' },
      { bar: 70, view: 'side',  beat: 'abreast',   does: 'it runs alongside: four gills glow; its fins sweep (roll), it spits outlined globs (parry them into the gills)' },
      { bar: 80, view: 'above', beat: 'sound',     does: 'it sounds: its shadow grows under the ship; be out of the ring when it breaches' },
      { bar: 88, view: 'free',  beat: 'maw',       does: 'face to face, the maw open: lock its teeth, parry its spit down its throat; at bar 96 it dives away or is felled' },
    ],
  },
};

/** A small hash (FNV-1a with murmur3's finaliser) to 0..1: the day's dice, the same for everyone that day. */
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// (a LONG CROSSING's legs, its bars and where each set piece begins: LEG, legsOf, barsOf, legStart, in progress/econ/emocean.js, re-exported)
export { LEG, legsOf, barsOf, legStart };

/** Which set pieces fill this crossing, in order. Each leg rolls the day's dice for the pirates (who come once at most, their chance
 *  rising with the casks aboard and the leg's danger); the rest are shoals; the rogue Leviathan, when its deck came up at the pier
 *  (progress/rail/setpieces.js leviathanDeck), is the last (the climax). Same route, day and cargo: the same crossing (an arcade's
 *  honesty: read it, and come back tomorrow). */
export function setPiecesOf({ route = '', day = 0, casks = 0, danger = 0, leviathan = false, legs = 1 } = {}) {
  const out = [];
  for (let k = 0; k < legs; k++) {
    const roll = hash01(k ? `pirates:${route}:${Math.floor(day)}:${k}` : `pirates:${route}:${Math.floor(day)}`);
    out.push(!out.includes('pirates') && roll < PIRATES.chance(casks, danger + LEG.deeper * k) ? 'pirates' : 'shoal');
  }
  if (leviathan) out[legs - 1] = 'leviathan';
  return out;
}
/** The first set piece alone (the crossing of one leg): kept for callers that ask for one. */
export const setPieceOf = (o = {}) => setPiecesOf({ ...o, legs: 1 })[0];

/** The acts of a crossing of these set pieces, with absolute bars, and its beats placed in their legs. */
export function timeline(pieces = ['shoal']) {
  const list = typeof pieces === 'string' ? [pieces] : pieces, L = list.length, total = barsOf(L);
  const acts = ACTS.filter((a) => a.from < LEG.first).map((a) => ({ ...a }));
  const beats = [];
  list.forEach((sp, k) => {
    const at = legStart(k), shift = at - LEG.first;
    acts.push({ id: 'setpiece', leg: k, setPiece: sp, from: at, to: at + LEG.setPiece, view: null, teaches: 'everything at once' });
    for (const b of SET_PIECES[sp].beats) beats.push({ ...b, bar: b.bar + shift, leg: k, setPiece: sp });
    if (k < L - 1) acts.push({ id: 'breather', leg: k, from: at + LEG.setPiece, to: at + LEG.setPiece + LEG.breather, view: 'chase', teaches: 'the flotsam mends the ship; a breath before the next', mends: LEG.mend });
  });
  acts.push({ ...ACTS[ACTS.length - 1], from: total - LEG.arrive, to: total });
  return { acts, beats, bars: total, pieces: list };
}

/** The view the camera holds at a bar (the swing toward the next one runs through the bar before it). `t`: a timeline, or a set piece's
 *  name (a crossing of one). */
export function viewAt(bar, t = 'shoal') {
  const T = t.acts ? t : timeline(t);
  const act = T.acts.find((a) => bar >= a.from && bar < a.to) || T.acts[T.acts.length - 1];
  if (act.id !== 'setpiece') return act.view;
  let v = 'chase';
  for (const b of T.beats) if (b.leg === act.leg && bar >= b.bar && b.view) v = b.view;
  return v;
}

/** Every swing of a crossing: where the view changes, from what to what (each takes SWING.bars, ending at `bar`). */
export function swings(t = 'shoal') {
  const T = t.acts ? t : timeline(t), out = [];
  let was = viewAt(0, T);
  for (let bar = 1; bar < T.bars; bar++) { const v = viewAt(bar, T); if (v !== was) { out.push({ bar, from: was, to: v }); was = v; } }
  return out;
}

/** The whole crossing as it will play: its set pieces, acts, swings, beats and waves (the authored STAGE through stagePlan for the first
 *  half; each shoal leg keeps the authored escort, its class read at that leg's danger). `opts`: { casks, leviathan, wx, open, pieces }
 *  (wx: weather.js stageWx of the island left; pieces: the set pieces forced, for the simulator). */
export function script(from, to, day = 0, { casks = 0, leviathan = false, wx = null, open, pieces = null } = {}) {
  const waves = stagePlan(from, to, day, wx, open), h = hop(from, to, 'sloop', open || (() => true));
  if (!waves || !h) return null;
  const route = routeId(from, to), danger = h.danger + (wx?.danger || 0), legs = pieces ? pieces.length : legsOf(h.distance, danger);
  const list = pieces || setPiecesOf({ route, day, casks, danger, leviathan, legs }), T = timeline(list);
  const first = waves.filter((w) => w.at * BARS < LEG.first).map((w) => ({ ...w, bar: Math.round(w.at * BARS) }));
  const escorts = list.flatMap((sp, k) => (SET_PIECES[sp].keep ? waves.filter((w) => w.at * BARS >= LEG.first).map((w) => ({ ...w, cls: ROLE_CLASS[w.role](danger + LEG.deeper * k), bar: Math.round(w.at * BARS) + legStart(k) - LEG.first, leg: k })) : []));
  return {
    route, day, danger, legs: list.length, bars: T.bars, seconds: T.bars * BAR_S, setPieces: list, setPiece: list[0],
    acts: T.acts.map((a) => ({ ...a, view: a.view ?? viewAt(a.from, T) })),
    swings: swings(T),
    beats: T.beats.map((b) => ({ ...b, view: b.view ?? viewAt(b.bar, T) })),
    waves: [...first, ...escorts],
  };
}

/** THE CONTINUE (the owner, 2026-10-07: "at a cube cost proportional to how far you are from your respawn point"): when the ship has
 *  borne all it can, an arcade's coin. Pay, and it is mended whole and flies on; decline, and it breaks up (a quarter of the cargo
 *  lost, spills as ever: voyage.js) and you are made whole at your last Shrine. Its price is the fuel back from where the ship is to
 *  the island of that Shrine, plus a repair, doubling with each continue in one crossing (a run fed coins is not a free run). A
 *  continued crossing keeps its score, but never ranks above C and never medals (the high-score table's honesty). */
export const CONTINUE = { repair: 2, double: 2, rankCap: 'C' }; // (repair: minutes of play)
/** Where each Shrine is (world/shrines.js SHRINES, Petra's): the island a shatter would make you whole on. */
export const SHRINE_ISLAND = { workshop: 'anagami', dunemaw: 'anagami', pier: 'anagami', margarite: 'margarite' };
/** Where the ship is on the line at a share 0..1 of the crossing, and how far that is (hop distance units) from an island. */
export const shipLaw = (from, to, share) => NODES[from].law + (NODES[to].law - NODES[from].law) * Math.max(0, Math.min(1, share));
export function continueCost(from, to, share, shrine = 'workshop', continues = 0) {
  const home = NODES[SHRINE_ISLAND[shrine] || 'anagami'], d = Math.abs(shipLaw(from, to, share) - home.law) * CHART.perLaw;
  return Math.round((ECON.perMinute * CONTINUE.repair + fuel(d)) * CONTINUE.double ** continues);
}
