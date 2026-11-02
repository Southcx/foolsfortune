// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, THE MOVES: each a real technique held near its heart (docs/plans/SPIRIT-COOKING.md 4). A move drives one value with
// one gesture and is judged where you stop it: how near its heart, inside a band that practice widens toward a ceiling and never moves
// (Soul Alchemy's swatch rule, SOUL-ALCHEMY.md 3.2). The tell is the interface: the cook reads what the food does (a windowpane of
// dough, a finger's dent springing back, a crust's colour, a hollow knock), never a thermometer.
//
// `value` runs 0..1 on each move's own scale (`unit` says what 1 is). `heart` is where it should stop; `width` the band's half-width at
// no practice and at full; `over` where it is ruined (black, collapsed, tight); `clock` 'real' for a move played in the minigame, 'game'
// for one that runs on the game clock while you do other things (a proof). `rate` is how fast the value climbs a real second (a game
// move: a game hour). Each number answers to the real process it names.
//
// Prior art: Cooking Mama (each step a gesture under 10 s, the dish the average of its steps), Battle Chef Brigade (a dish judged on
// its parts), the windowpane test and the poke test of every bread book (Hamelman's Bread, 2004; Forkish's Flour Water Salt Yeast,
// 2012), the hollow knock (bread is done at about 96 C inside: the crust rings), steam in the first ten minutes for oven spring.
//
//   MOVES { id: { label, line, gesture, clock, rate, heart, width: [w0, wMax], over, unit, tells: [[at, words]], tradeoff, attr } }
//   widthOf(move, practice) -> half-width   scoreOf(move, value, practice) -> { score 0..1, hit (inside the heart), ruined }
//   tellAt(move, value) -> words   pullOver(gluten) -> the pull's snap for that dough
// ---------------------------------------------------------------------------------------

export const MOVES = {
  // the bread family's three (SPIRIT-COOKING.md 5: bread first, the clay world's own)
  knead: {
    label: 'KNEAD', line: 'Fold and push in time. Stop when a stretched piece lets the light through without tearing.',
    gesture: 'beat', clock: 'real', beat: 0.75, perBeat: 0.06, offBeat: 0.02, // (a fold, a push and a quarter turn about every 0.75 s, a baker's pace; on the beat it builds three times as fast)
    heart: 0.8, width: [0.12, 0.2], over: 1, unit: 'gluten built, 1 overworked',
    tells: [[0, 'Shaggy. It tears as soon as you pull it.'], [0.45, 'Smoother. A stretched piece tears before it thins.'], [0.68, 'Windowpane. A stretched piece lets light through without tearing.'], [0.92, 'Tight. It fights back and tears.']],
    tradeoff: 'Underworked bread is dense; overworked is tough.', attr: 'dexterity',
  },
  proof: {
    label: 'PROOF', line: 'Leave it somewhere warm. Press a floured finger in: ready when the dent springs back slowly.',
    gesture: 'wait', clock: 'game', rate: 1, // (doubled in about a game hour at the hearth's warmth: real bulk proof is hours at 21-23 C; the game hour is 150 real s)
    heart: 0.5, width: [0.1, 0.16], over: 0.85, unit: 'risen, 0.5 doubled, 0.85 collapsing',
    tells: [[0, 'Barely risen. The dent springs straight back.'], [0.38, 'Puffy. The dent springs back slowly.'], [0.62, 'Overblown. The dent stays.'], [0.85, 'Collapsed. It rose too long and sank.']],
    tradeoff: 'A longer proof is more flavour and risks collapse.', attr: 'focus',
  },
  bake: {
    label: 'BAKE', line: 'Steam it early for the rise, then take it out when the crust is deep brown and it knocks hollow.',
    gesture: 'hold', clock: 'real', rate: 1 / 24, steamUntil: 0.25, // (a loaf's 35-45 minutes as 24 real s; steam belongs in the first quarter, its first ten minutes: oven spring)
    heart: 0.72, width: [0.08, 0.14], over: 1, unit: 'crust colour, 1 burnt',
    tells: [[0, 'Pale and soft.'], [0.4, 'Golden. It knocks dull.'], [0.62, 'Deep brown, and it knocks hollow.'], [0.85, 'Dark at the edges. It smells of scorch.'], [0.97, 'Black.']],
    tradeoff: 'A darker crust is more flavour, nearer burnt.', attr: 'focus',
  },
  // the pasta, noodle and seafood families' moves (South, 2026-11-02: "Make it fully fleshed out minigame featuring the Godhand working
  // the dough, in 3d ... Pasta themed! Italian-Japanese cooking ... SOULSEAFOOD BECAUSE THEY FISH IN LACHRYMA"; played on Calissa's 3D
  // stage, `stage: '3d'`). Each is a real technique and each tell is what a cook really reads.
  roll: {
    label: 'ROLL', line: 'Roll it thinner pass by pass. Hold it to the light: stop when you can see your hand through it.', stage: '3d',
    gesture: 'roll', clock: 'real', perPass: 0.09, // (a pass through the rollers, or a long push of the pin; a pasta machine's nine settings, the heart its seventh: about 0.8 mm)
    heart: 0.72, width: [0.08, 0.15], over: 1, unit: 'thinness, 1 torn',
    tells: [[0, 'Thick as a biscuit. No light comes through.'], [0.4, 'Even, but the light stops at it.'], [0.62, 'Held to the light, you can see your hand through it.'], [0.88, 'Paper thin. The edges are starting to tear.']],
    tradeoff: 'Thinner is silkier and cooks faster, nearer torn.', attr: 'dexterity',
  },
  laminate: {
    label: 'LAMINATE', line: 'Fold the sheet and roll it again; each fold doubles its layers. Stop when it is smooth as satin, square at the edges.', stage: '3d',
    gesture: 'fold', clock: 'real', perFold: 0.125, // (a fold a press: 4 folds, 16 layers, at the heart; 8, overworked)
    heart: 0.5, width: [0.1, 0.17], over: 1, unit: 'folds over 8 (layers = 2^folds)',
    tells: [[0, 'Ragged edges, a rough face.'], [0.25, 'The edges straighten.'], [0.45, 'Smooth as satin, square at the edges.'], [0.75, 'Tight and rubbery. It springs back from the roller.']],
    tradeoff: 'More folds is more bite, until it fights you.', attr: 'dexterity',
  },
  cut: {
    label: 'CUT', line: 'Cut ribbons a finger wide, every one the same.', stage: '3d',
    gesture: 'strokes', clock: 'real', // (value: the ribbons' width against the asked, 0.5 even and right: tagliatelle about 6 mm)
    heart: 0.5, width: [0.1, 0.18], over: 1.01, unit: 'ribbon width against the asked',
    tells: [[0, 'Thread-thin, like angel hair.'], [0.3, 'Narrow: tagliolini.'], [0.42, 'Even ribbons, a finger wide.'], [0.65, 'Broad: pappardelle.'], [0.85, 'Ragged and uneven.']],
    tradeoff: 'The cut sets how the sauce clings.', attr: 'dexterity',
  },
  pull: {
    label: 'PULL', line: 'Stretch the rope, fold it in two and stretch again: each pull doubles the strands. Stop before it snaps.', stage: '3d',
    gesture: 'stretch', clock: 'real', perPull: 0.125, // (a doubling a pull: 1 rope, 2, 4 .. 256 strands at 8; lamian, hand-pulled noodles)
    heart: 0.75, width: [0.07, 0.13], over: 1, unit: 'doublings over 8 (strands = 2^pulls)',
    tells: [[0, 'One thick rope.'], [0.25, 'Four strands, thick as a finger.'], [0.5, 'Sixteen strands, round as chopsticks.'], [0.7, 'Sixty-four strands, thin as string.'], [0.9, 'Two hundred and fifty-six, thread-fine. It is near snapping.']],
    tradeoff: 'Finer noodles need more gluten: knead well first or they snap.', attr: 'dexterity',
  },
  boil: {
    label: 'BOIL', line: 'Boil in water salted like the sea. Bite one: take it out while a thin white thread is left at its heart.', stage: '3d',
    gesture: 'hold', clock: 'real', rate: 1 / 20, // (fresh pasta's 2 to 3 minutes and dried pasta's 9 to 12 as 20 real s; water at about 1% salt, 10 g a litre)
    heart: 0.78, width: [0.06, 0.12], over: 1, unit: 'doneness by the bite, 1 mush',
    tells: [[0, 'Raw. It snaps.'], [0.45, 'It bends, chalky all through.'], [0.68, 'A thin white thread at its heart: l\'anima, the soul. Al dente.'], [0.88, 'Soft all through. Overcooked.'], [0.97, 'Mush.']],
    tradeoff: 'Al dente keeps its bite and its soul; a minute more and both are gone.', attr: 'focus',
  },
  sear: {
    label: 'SEAR', line: 'Skin down in a hot pan. Do not move it: it lets go of the pan by itself when the crust is made.', stage: '3d',
    gesture: 'hold', clock: 'real', rate: 1 / 14, // (Maillard browning at 140 to 165 C: a fillet's skin crisps in about 3 to 4 minutes, as 14 real s)
    heart: 0.65, width: [0.08, 0.14], over: 1, unit: 'browning (Maillard 140-165 C), 1 black',
    tells: [[0, 'Grey, stuck to the pan.'], [0.4, 'The skin tightens. It still clings.'], [0.58, 'Golden, and it lets go of the pan by itself.'], [0.82, 'Dark. The edge smokes.'], [0.96, 'Black.']],
    tradeoff: 'A deeper crust is more flavour, nearer burnt.', attr: 'focus',
  },
  bleed: {
    label: 'BLEED', line: 'The fish thrashes and stills in turns. Press the spike behind its eye in the still moment: a quick, calm end.', stage: '3d',
    gesture: 'press', clock: 'real', period: 2.4, // (ikejime: the thrash and stillness come round every 2.4 real s; the press's moment in it is the value, 0.5 the stillness)
    heart: 0.5, width: [0.08, 0.14], over: 1.01, unit: 'the moment between thrashes, 0.5 its stillness',
    tells: [[0, 'It thrashes.'], [0.3, 'It slows.'], [0.42, 'Still. Strike now.'], [0.6, 'It gathers itself again.']],
    tradeoff: 'A calm end keeps the flesh sweet: rigor comes later and less lactic acid sours it.', attr: 'focus',
  },
  // the other families' moves, as data for the rounds after (SPIRIT-COOKING.md 4's table): not played yet
  simmer:   { label: 'SIMMER', gesture: 'keep', clock: 'real', heart: 0.6, width: [0.1, 0.18], over: 0.8, unit: 'heat, 0.8 the boil', attr: 'focus', later: true },
  sugar:    { label: 'SUGAR', gesture: 'test', clock: 'real', heart: 0.5, width: [0.06, 0.12], over: 1, unit: 'syrup stage (soft ball 112-116 C .. hard crack 146-154 C)', attr: 'perception', later: true },
  roux:     { label: 'ROUX', gesture: 'stir', clock: 'real', heart: 0.5, width: [0.08, 0.15], over: 1, unit: 'colour, white to dark', attr: 'focus', later: true },
  emulsion: { label: 'EMULSION', gesture: 'pour', clock: 'real', heart: 0.5, width: [0.1, 0.18], over: 0.9, unit: 'pour against whisk, 0.9 split', attr: 'dexterity', later: true },
  rice:     { label: 'RICE', gesture: 'rinse', clock: 'real', heart: 0.85, width: [0.1, 0.15], over: 1.01, unit: 'rinse water clear', attr: 'perception', later: true },
  ferment:  { label: 'FERMENT', gesture: 'tend', clock: 'game', heart: 0.5, width: [0.1, 0.16], over: 0.85, unit: 'koji at 30 C, 0.85 sporing', attr: 'focus', later: true },
  steep:    { label: 'STEEP', gesture: 'wait', clock: 'real', heart: 0.55, width: [0.08, 0.14], over: 1, unit: 'water heat by its bubbles', attr: 'perception', later: true },
  smoke:    { label: 'SMOKE', gesture: 'keep', clock: 'real', heart: 0.4, width: [0.1, 0.16], over: 0.9, unit: 'fire low and fed, thin blue smoke', attr: 'focus', later: true },
};

/** A move's band now: its width at no practice, grown toward its ceiling by practice (0..100). Never its heart. */
export const widthOf = (M, practice = 0) => M.width[0] + (M.width[1] - M.width[0]) * Math.max(0, Math.min(100, practice)) / 100;
/** The heart: a true move is within a third of the band's narrowest width (the plan's "a heart in every move": Soul Alchemy's true firing). */
export const heartOf = (M) => M.width[0] / 3;

/** A move stopped at `value`: its score (1 at the heart, falling to 0 at the band's edge and past it a floor while not ruined, so doing it
 *  at all still pays: the design law), whether it was true, whether ruined (past `over`). */
export function scoreOf(M, value, practice = 0) {
  const d = Math.abs(value - M.heart), w = widthOf(M, practice), ruined = value >= M.over;
  if (ruined) return { score: 0, hit: false, ruined: true };
  const score = d <= w ? 1 - 0.4 * (d / w) : Math.max(0.15, 0.6 - 0.9 * (d - w)); // (inside the band 0.6..1; outside it falls off but keeps 0.15)
  return { score: +score.toFixed(3), hit: d <= heartOf(M), ruined: false };
}

/** What the food shows at `value`: the tell's words (the last step it has passed). */
export function tellAt(M, value) { let w = M.tells?.[0]?.[1] || ''; for (const [at, words] of M.tells || []) if (value >= at) w = words; return w; }

/** Where the pull snaps for dough kneaded to `gluten` (the knead's value): short gluten snaps early, a dough at the windowpane (0.8) can
 *  take all eight doublings. The pull's `over` for that dough. */
export const pullOver = (gluten = 0.8) => Math.min(1, 0.5 + 0.5 * Math.min(1, Math.max(0, gluten) / 0.8));

/** Practice a move earns from one cooking of it: more for a good one (skill skips grind), some for any (grind closes the gap). */
export const practiceFrom = (score) => 3 + 7 * score;
