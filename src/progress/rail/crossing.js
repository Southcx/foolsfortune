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
// THE SET_PIECES (bars 62 to 96, one a crossing): the SHOAL (a boid school that boils up and strikes in pulses, Piranha-fashion), the
// PIRATES (a brig astern, then alongside: a broadside duel), and the ROGUE LEVIATHAN (rare: a deck, so it is certain within its count).
// Pirates come for cargo, so their chance rises with every cask aboard: risk scales with what you carry (Sid Meier's Pirates!, Sunless
// Sea). The numbers of each are in progress/rail/setpieces.js.
//
// Prior art, the love letter: Star Fox 64 (two-minute stages, a hit counter and a medal, a breather, the all-range turn), Ikaruga
// (polarity, chains of three, chapters that each teach one idea), Einhander (the 2.5D camera that swings mid-stage, gunpods taken off
// the enemy), Sin & Punishment (the free reticle, the sword that sends shots back), Mushihime-sama and DoDonPachi (the bullet pattern
// as choreography, point-blank pay), RayStorm and RayCrisis (the lock-on sweep, its doubling bonus), Kingdom Hearts 1 and 2's Gummi
// Ship (the world map's hop as a rail stage, set pieces as the stage's heart), Rez (everything on the beat), Panzer Dragoon (the look
// round, the sea-beast that runs alongside), Thunder Force (the musical boss), and Radiant Silvergun (the stage as one composition).
//
//   BARS   VIEWS[id]   SWING   ACTS[{ id, from, to, view, teaches }]   SET_PIECES[id] = { beats: [{ bar, view?, beat, does }], keep }
//   setPieceOf({ route, day, casks, danger, leviathan }) -> 'shoal' | 'pirates' | 'leviathan'
//   viewAt(bar, setPiece) -> view id      swings(setPiece) -> [{ bar, from, to }]      script(from, to, day, opts) -> the whole crossing
// ---------------------------------------------------------------------------------------
import { STAGE, stagePlan, routeId, hop } from '../econ/emocean.js';
import { PIRATES } from './setpieces.js';

/** Bars in a crossing: Wanda's Crude Sea is 100 bars of 1.5 real s (src/music/emocean.js STAGE_BARS); a wave's `at` is bar / BARS. */
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

/** Which setPiece fills this crossing. The rogue Leviathan when its deck came up (`leviathan`, drawn by the voyage at the pier:
 *  progress/rail/setpieces.js leviathanDeck), else pirates when the day's dice fall under their chance (which rises with the casks
 *  aboard), else the shoal. Same route, day and cargo: the same set piece (an arcade's honesty: read it, and come back tomorrow). */
export function setPieceOf({ route = '', day = 0, casks = 0, danger = 0, leviathan = false } = {}) {
  if (leviathan) return 'leviathan';
  return hash01(`pirates:${route}:${Math.floor(day)}`) < PIRATES.chance(casks, danger) ? 'pirates' : 'shoal';
}

/** The view the camera holds at a bar (the swing toward the next one runs through the bar before it). */
export function viewAt(bar, setPiece = 'shoal') {
  const E = SET_PIECES[setPiece] || SET_PIECES.shoal;
  const act = ACTS.find((a) => bar >= a.from && bar < a.to) || ACTS[ACTS.length - 1];
  if (act.id !== 'setpiece') return act.view;
  let v = 'chase';
  for (const b of E.beats) if (bar >= b.bar && b.view) v = b.view;
  return v;
}

/** Every swing of a crossing: where the view changes, from what to what (each takes SWING.bars, ending at `bar`). */
export function swings(setPiece = 'shoal') {
  const out = [];
  let was = viewAt(0, setPiece);
  for (let bar = 1; bar < BARS; bar++) { const v = viewAt(bar, setPiece); if (v !== was) { out.push({ bar, from: was, to: v }); was = v; } }
  return out;
}

/** The whole crossing as it will play: its set piece, its acts, its swings, its beats, and its waves (the authored STAGE through
 *  stagePlan, the set piece's own past bar 62). `opts`: { casks, leviathan, wx, open } (wx: weather.js stageWx of the island left). */
export function script(from, to, day = 0, { casks = 0, leviathan = false, wx = null, open } = {}) {
  const waves = stagePlan(from, to, day, wx, open), h = hop(from, to, 'sloop', open || (() => true));
  if (!waves || !h) return null;
  const route = routeId(from, to), danger = h.danger + (wx?.danger || 0);
  const setPiece = setPieceOf({ route, day, casks, danger, leviathan }), E = SET_PIECES[setPiece];
  return {
    route, day, setPiece, danger,
    acts: ACTS.map((a) => ({ ...a, view: a.view ?? viewAt(a.from, setPiece) })),
    swings: swings(setPiece),
    beats: E.beats.map((b) => ({ ...b, view: b.view ?? viewAt(b.bar, setPiece) })),
    waves: waves.filter((w) => E.keep || w.at * BARS < 62).map((w) => ({ ...w, bar: Math.round(w.at * BARS) })),
  };
}
