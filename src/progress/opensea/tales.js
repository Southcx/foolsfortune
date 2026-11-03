// ---------------------------------------------------------------------------------------
// TALL TALES (docs/plans/OPEN-SEA.md 15.6, built; GAPS.md G161): three authored chains through the open sea, each a story the sea tells in
// pieces: a riddle read, an islet's secret, a herd, a beast. A tale is a QUEST (progress/quests.js), not a chain of its own, and the
// decision is the plan's: QUESTS.md 2 already gives what a tall tale needs (steps taken in order, each a predicate over the ledger, only the
// next one said, a journal, a splash and a jingle on its start and end, the recap), and a second journal beside the first would be two of one
// thing. quests.js spreads TALES into QUESTS; what a tale adds is only its steps, its teller and its reward:
//   reward   a TITLE (seaachievements.js: one achievement a tale, a predicate over its steps) and a LOOK (cosmetics.js `seaLooks`, a pennant
//            for the ship; Calissa draws it, a note in docs/handoffs/calissa/), never cubes and never a number (a tale pays the stories it
//            sends you through: every step is a thing the sea already pays for). Quest points as any quest.
//   Steps read the ledger's counts, which are cumulative: a sailor who has already read a bottle finds that step struck through when the tale
//   opens (RuneScape's diary does the same). A tale is a map of what to try, and a veteran's is short.
//
// The tellers, the tales' names and every line are placeholders for Espada (docs/handoffs/espada/2026-11-03-from-dovina-open-sea.md); the
// System speaks them in its own plain voice (CLARITY.md 14), the tale's flavour only in `trouble`.
//
// Prior art: Sea of Thieves' Tall Tales (a book of authored voyages that send you through riddle, island, creature and cargo, a commendation
// and a cosmetic at the end), the Wind Waker's Tingle charts, RuneScape's quest diary; the riddles are the drift bottle's (isletpuzzles.js).
//
//   TALES[i] = a quest (id 'tale.<slug>', name, who, points, trouble, begin, steps[{ say, did, done(L) }], reward: { title, look })
//   taleDone(id, L) -> bool   taleSteps(id, L) -> number done   TALE_LOOKS (the look ids, one a tale)
// ---------------------------------------------------------------------------------------
const n = (L, key) => Math.max(L?.get?.(key) || 0, L?.best?.(key) || 0);
const sum = (L, ...keys) => keys.reduce((s, k) => s + n(L, k), 0);
const beasts = (L) => sum(L, 'seaserpent.down', 'seabeast.down');

export const TALES = [
  {
    id: 'tale.bottle', name: 'The Bottle\'s Cargo', who: 'A bottle on the swell', points: 1,
    trouble: 'Someone corked a note and a promise into a bottle and set it adrift. The promise was never kept. The sea has had it a long time.',
    begin: 'Any drift bottle on the open sea. Sail alongside it and press the use key.',
    steps: [
      { say: 'Read the note in a drift bottle.', did: 'You read the note. It names an islet.', done: (L) => n(L, 'sea.bottle') >= 1 },
      { say: 'Dig up the cache the note points to. The Dreamvane\'s dowse finds it.', did: 'A buried cache, dug. Someone\'s savings, sat in the sand.', done: (L) => n(L, 'sea.dig') >= 1 },
      { say: 'Make a singing stone\'s phrase answer on the Crucibelle.', did: 'The stone answered. Something rose out of the sand.', done: (L) => n(L, 'sea.echo') >= 1 },
      { say: 'Photograph a herd at sea. The dock board says where one is today.', did: 'A herd on a plate. The board pays for those.', done: (L) => n(L, 'sea.herd') >= 1 },
      { say: 'Sink a sea serpent, or any of the sea\'s beasts.', did: 'The beast is down. The promise is kept, in its way.', done: (L) => beasts(L) >= 1 },
    ],
    reward: { title: 'Bottle Bearer', look: 'bottle' },
  },
  {
    id: 'tale.ladle', name: 'The Ladle with No Bottom', who: 'A monk on the water', points: 1,
    trouble: 'A monk rises out of calm night water and asks sailors for a ladle. Whoever gives him one is drowned in the water it fills. He wants to be given something that cannot fill.',
    begin: 'Haul a crate up from any wreck, then read a stele on an islet.',
    steps: [
      { say: 'Haul a crate up from a wreck with the Sondelass worn.', did: 'A crate, aboard. The wreck remembers who sank it.', done: (L) => n(L, 'sea.salvage') >= 1 },
      { say: 'Read a stele on an islet.', did: 'Three words on a stone, in a sentence. One of them is a ladle.', done: (L) => n(L, 'sea.stele.read') >= 1 },
      { say: 'Record 3 habits on plates. Creatures show them only under their own conditions.', did: 'Three habits recorded. Habits are where the stories come from.', done: (L) => n(L, 'sea.habit') >= 3 },
      { say: 'Drink the umibozu\'s pour with the Lockheart\'s gulp until its hands let go.', did: 'A ladle with no bottom, and the Lockheart drank it. The hands let go.', done: (L) => n(L, 'seabeast.free.gulp') >= 1 },
      { say: 'Sink the umibozu.', did: 'The monk goes under. Nobody drowned.', done: (L) => n(L, 'seabeast.down.seaMonk') >= 1 },
    ],
    reward: { title: 'Ladle Bearer', look: 'ladle' },
  },
  {
    id: 'tale.song', name: 'The Wind That Was Asked', who: 'An old sailor at the quay', points: 1,
    trouble: 'An old sailor says the wind is a creature too, and creatures can be asked. Nobody believes her, because she never leaves the quay.',
    begin: 'Fit or make any ship\'s part at a quay, then sail until the sea is charted a little.',
    steps: [
      { say: 'Make a ship\'s part from its pieces at a quay (/shippart make).', did: 'A part, made from pieces. The sailor nods once.', done: (L) => n(L, 'ship.make') >= 1 },
      { say: 'Play the wind a song on the Crucibelle at the helm.', did: 'The wind turned. An hour of it, for a price.', done: (L) => n(L, 'sea.windsong') >= 1 },
      { say: 'Complete a square of the open sea: everything in it found, taken and salvaged.', did: 'A square, finished. The sailor\'s chart has one more tick.', done: (L) => n(L, 'sea.square.done') >= 1 },
      { say: 'Tow a stunned beast home alive to a quay.', did: 'A creature, asked and not killed. That is the point the old sailor was making.', done: (L) => n(L, 'seabeast.captured') >= 1 },
    ],
    reward: { title: 'Wind Asker', look: 'song' },
  },
];

export const TALE_LOOKS = Object.fromEntries(TALES.map((t) => [t.id, t.reward.look]));
export const taleOf = (id) => TALES.find((t) => t.id === id) || null;
export const taleSteps = (id, L) => (taleOf(id)?.steps || []).filter((s) => s.done(L)).length;
export const taleDone = (id, L) => { const t = taleOf(id); return !!t && t.steps.every((s) => s.done(L)); };
