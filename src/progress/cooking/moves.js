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
//   MOVES { id: { label, line, gesture, clock, rate, heart, width: [w0, wMax], over, unit, tells: [[at, words]], moments?, tradeoff, attr } }   FISH_TELLS
//   widthOf(move, practice) -> half-width   scoreOf(move, value, practice) -> { score 0..1, hit (inside the heart), ruined }
//   tellAt(move, value) -> words   pullOver(gluten) -> the pull's snap for that dough
// ---------------------------------------------------------------------------------------

export const MOVES = {
  // the bread family's three (SPIRIT-COOKING.md 5: bread first, the clay world's own)
  knead: {
    label: 'KNEAD', line: 'Fold and push in time. Stop when a stretched piece lets the light through without tearing.',
    gesture: 'beat', clock: 'real', beat: 0.75, perBeat: 0.06, offBeat: 0.02, // (a fold, a push and a quarter turn about every 0.75 s, a baker's pace; on the beat it builds three times as fast)
    heart: 0.8, width: [0.12, 0.2], over: 1, unit: 'gluten built, 1 overworked',
    tells: [[0, 'Shaggy. The dough tears and sticks to the board.'], [0.45, 'Smooth. The dough springs back slowly when pressed.'], [0.68, 'Windowpane. A stretched piece lets light through without tearing.'], [0.92, 'Too tight. The dough tears instead of stretching. Let it rest.']],
    tradeoff: 'Underworked bread is dense; overworked is tough.', attr: 'dexterity',
  },
  proof: {
    label: 'PROOF', line: 'Leave it somewhere warm. Press a floured finger in: ready when the dent springs back slowly.',
    gesture: 'wait', clock: 'game', rate: 1, // (doubled in about a game hour at the hearth's warmth: real bulk proof is hours at 21-23 C; the game hour is 150 real s)
    heart: 0.5, width: [0.1, 0.16], over: 0.85, unit: 'risen, 0.5 doubled, 0.85 collapsing',
    tells: [[0, 'The dent springs straight back. Not ready.'], [0.38, 'The dent fills back slowly. Ready.'], [0.62, 'The dent stays. Over-proofed.'], [0.85, 'Collapsed. It rose too long and sank.']],
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
    tells: [[0, 'Thick as a biscuit. No light comes through.'], [0.4, 'Even, but the light stops at it.'], [0.62, 'Thin enough. Print shows through the sheet.'], [0.88, 'Paper thin. The edges are starting to tear.']],
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
    moments: { hold: 'The strands hold. Fold again.', snap: 'A strand snapped. The dough needs more rest.' }, // (said as a pull lands or a strand breaks: Espada's, 2026-11-02)
    tradeoff: 'Finer noodles need more gluten: knead well first or they snap.', attr: 'dexterity',
  },
  boil: {
    label: 'BOIL', line: 'Boil in water salted like the sea. Bite one: take it out while a thin white thread is left at its heart.', stage: '3d',
    gesture: 'hold', clock: 'real', rate: 1 / 20, // (fresh pasta's 2 to 3 minutes and dried pasta's 9 to 12 as 20 real s; water at about 1% salt, 10 g a litre)
    heart: 0.78, width: [0.06, 0.12], over: 1, unit: 'doneness by the bite, 1 mush',
    tells: [[0, 'Raw. It snaps.'], [0.45, 'It bends, chalky all through.'], [0.68, 'Al dente. A thin white core at the bite.'], [0.88, 'Soft all the way through. Overcooked.'], [0.97, 'Mush.']],
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
  // the rice, broth, tea, sauce, sweet, ferment and smoke families' moves (G222 to G225, 2026-11-03), played in the hearth's window by
  // progress/cooking/plays.js. Each is a real technique, each tell what a cook really reads, none a thermometer.
  simmer: {
    label: 'SIMMER', line: 'Do nothing, correctly: keep the dial low so the pot barely trembles. A bubble that rolls is a boil, and a boil ruins it.',
    gesture: 'dial', clock: 'real', run: 12, warm: 3, lag: 0.35, start: 0.75, boilFor: 1.5, // (the pot's wall answers the dial late, a donabe slowly; a boiled kombu turns bitter: the pot starts too hot and the cook turns it down)
    heart: 0.6, width: [0.1, 0.18], over: 0.8, unit: 'heat held, 0.8 the boil',
    tells: [[0, 'Barely warm. Nothing moves.'], [0.35, 'The first wisp of steam.'], [0.55, 'A few bubbles at the pot\'s edge: a trembling simmer.'], [0.72, 'Bubbles rising steadily. Too far for kombu.'], [0.8, 'A rolling boil.']],
    tradeoff: 'A longer, lower simmer is deeper; a hotter one is quicker and nearer bitter.', attr: 'focus',
  },
  rice: {
    label: 'RICE', line: 'Rinse the rice and pour the water off until it runs almost clear. Then set the water to the line on the pot.',
    gesture: 'rinse', clock: 'real', perRinse: 0.16, // (each wash clears a share of what is left: starch dust clouds the first water)
    heart: 0.85, width: [0.1, 0.15], over: 1.01, unit: 'rinse water clear',
    tells: [[0, 'The water is milk-white.'], [0.4, 'Cloudy. It still clouds the pot.'], [0.78, 'Almost clear, a faint haze.'], [0.95, 'Clear as water.']],
    tradeoff: 'None: rice is the honest move.', attr: 'perception',
  },
  steep: {
    label: 'STEEP', line: 'Watch the water, not a clock. Pour when the bubbles are the right size for the leaf.',
    gesture: 'wait', clock: 'real', rate: 1 / 22, finish: 'POUR', // (water heating from cold to the boil in 22 real s: shrimp eyes, crab eyes, fish eyes, a rope of pearls, the boil)
    heart: 0.55, width: [0.08, 0.14], over: 1, unit: 'water heat by its bubbles',
    tells: [[0, 'Still water, a few tiny beads on the pot: "shrimp eyes".'], [0.3, 'Bubbles the size of crab eyes. The first wisp of steam.'], [0.5, 'Fish eyes, with a hush: the water is hot, not boiling.'], [0.72, 'A rope of pearls rising from the bottom.'], [0.9, 'Rolling boil. It will scald the leaf.']],
    tradeoff: 'Hotter water is stronger and more bitter.', attr: 'perception',
  },
  sugar: {
    label: 'SUGAR', line: 'Boil the syrup and drop a spoon of it in cold water to read it. Take it off at the stage you want.',
    gesture: 'test', clock: 'real', rate: 1 / 18, finish: 'TAKE IT OFF', blind: true, // (the cold-water test: you only know the stage when you drop a spoon in)
    heart: 0.5, width: [0.06, 0.12], over: 0.95, unit: 'syrup stage (soft ball 112-116 C .. hard crack 146-154 C)',
    tells: [[0, 'The spoon dissolves. Still only sugar water.'], [0.25, 'A thread, no more.'], [0.42, 'A soft ball: it holds, and flattens in the fingers.'], [0.6, 'A hard ball, firm and chewy.'], [0.75, 'Hard crack: it snaps like glass.'], [0.92, 'Amber going dark. It smells of caramel, then smoke.']],
    tradeoff: 'A harder stage keeps longer and is less tender.', attr: 'perception',
  },
  roux: {
    label: 'ROUX', line: 'Equal flour and fat, stirred. Keep it moving or it scorches. Stop at the colour you want.',
    gesture: 'stir', clock: 'real', rate: 1 / 22, stirGap: 1.5, scorchK: 2.2, finish: 'STOP', // (white to dark in 22 real s; left unstirred the bottom catches and it browns twice as fast)
    heart: 0.5, width: [0.08, 0.15], over: 1, unit: 'colour, white to dark',
    tells: [[0, 'White, smelling of raw flour.'], [0.25, 'Blond, a biscuit smell.'], [0.45, 'Peanut-butter brown. Nutty.'], [0.7, 'Dark chocolate. A quarter of white\'s thickening.'], [0.92, 'Scorched. It smells burnt.']],
    tradeoff: 'Darker is more flavour and less body.', attr: 'focus',
  },
  emulsion: {
    label: 'EMULSION', line: 'Pour the oil in a thin thread while you whisk. Pour only as fast as the whisk can take it.',
    gesture: 'pour', clock: 'real', oilRate: 0.09, whiskTap: 0.2, whiskDecay: 0.6, split: 1.2, // (oil into yolk: whisked faster than poured it holds; poured faster than whisked it breaks; the rescue is a fresh yolk and a spoon of water)
    heart: 0.5, width: [0.1, 0.18], over: 1.01, unit: 'oil taken, held by the whisk',
    tells: [[0, 'Yolk and a few drops of oil.'], [0.25, 'Pale and loose. It is taking the oil.'], [0.45, 'Glossy and thick, ribbons off the whisk.'], [0.75, 'Stiff, nearly too much oil.']],
    tradeoff: 'The one rhythm move: a rescue costs a yolk.', attr: 'dexterity',
  },
  ferment: {
    label: 'FERMENT', line: 'Koji works on its own clock, warm. Set the warmth now and then; take it out before it spores.',
    gesture: 'tend', clock: 'game', rate: 0.25, modes: { cool: { mult: 0.6, label: 'COOLER' }, steady: { mult: 1, label: 'STEADY' }, warm: { mult: 1.6, label: 'WARMER' } }, // (a game hour: 0.25; real koji is about 48 h at 30 C, and above 36 C it spores)
    heart: 0.5, width: [0.1, 0.16], over: 0.85, unit: 'koji at 30 C, 0.85 sporing',
    tells: [[0, 'Rice and white threads, a sweet smell of chestnut.'], [0.3, 'A white bloom, warm to the hand. It smells of apples.'], [0.5, 'Fully white, sweet and mushroomy. Ready.'], [0.72, 'Yellow-green flecks. It is starting to spore.'], [0.85, 'Spored. Bitter and spent.']],
    tradeoff: 'Longer is deeper and sweeter, with less bite.', attr: 'focus',
  },
  smoke: {
    label: 'SMOKE', line: 'Keep the fire low and fed. Thin blue smoke is good; white, heavy smoke is bad.',
    gesture: 'feed', clock: 'real', run: 14, warm: 2, fall: 0.07, feed: 0.14, start: 0.4, white: 0.8, whiteFor: 2, // (a smouldering fire dies back and is fed a little at a time)
    heart: 0.4, width: [0.1, 0.16], over: 0.9, unit: 'fire low and fed, thin blue smoke',
    tells: [[0, 'Nearly out. Only a thread of grey.'], [0.25, 'Thin blue smoke curling up. Good.'], [0.55, 'Thicker. It is turning white.'], [0.8, 'Heavy white smoke. It will taste bitter.']],
    tradeoff: 'Longer is stronger and drier.', attr: 'focus',
  },
};

/** A move as a dish asks it: some hearts move with the family or the leaf (kombu comes out at the first wisp, a mint tea is brewed gentle,
 *  a bitter leaf hot, honey candy to the hard crack). A copy; MOVES itself is never changed. */
const HEARTS = { 'broth.steep': 0.4, 'steep.mint': 0.45, 'steep.bitterleaf': 0.7, 'sugar.honey': 0.7 };
export function moveFor(move, family = null, addin = null) {
  const M = MOVES[move], h = HEARTS[`${family}.${move}`] ?? HEARTS[`${move}.${addin}`];
  return h == null ? M : { ...M, heart: h };
}

/** The rice's second half: the water against the rice, 1 : 1.1 to 1.2 (the line on the pot). Scored as a move's value, 0.8 to 1.5. */
export const WATER_LINE = { heart: 1.15, width: [0.1, 0.2], over: 9, min: 0.8, max: 1.5 };

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
/** A landed fish's freshness read on its flesh (the seafood family's add-in; Espada's lines, 2026-11-02): fresh while its catch is this
 *  game day's, past after (the stage draws it, Calissa's). */
export const FISH_TELLS = { fresh: 'Fresh. The flesh is clear and bright with its feeling.', past: 'Dull and milky. Past its best.' };

export function tellAt(M, value) { let w = M.tells?.[0]?.[1] || ''; for (const [at, words] of M.tells || []) if (value >= at) w = words; return w; }

/** Where the pull snaps for dough kneaded to `gluten` (the knead's value): short gluten snaps early, a dough at the windowpane (0.8) can
 *  take all eight doublings. The pull's `over` for that dough. */
export const pullOver = (gluten = 0.8) => Math.min(1, 0.5 + 0.5 * Math.min(1, Math.max(0, gluten) / 0.8));

/** Practice a move earns from one cooking of it: more for a good one (skill skips grind), some for any (grind closes the gap). */
export const practiceFrom = (score) => 3 + 7 * score;
