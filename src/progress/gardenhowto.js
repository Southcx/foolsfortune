// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S HOW-TO (South, 2026-10-30, by Petra: "The Spirit garden is a notorious culprit of lacking any form of
// tutorialization"; docs/plans/SEEDS-SLABS-SCANS.md 6): the garden taught in seven short steps, in Raku's tables' way
// (progress/casino/howto.js), each step a nine-year-old's words pointing at the part of the garden it is about (`show`: a spot the
// runtime turns the camera to and rings: jar, hand, shed, ring, lotus, shrine, bench). It plays on the first entry (until finished or
// skipped once: the ledger's `garden.howto`, never a flag) and again on `/howto` in the garden. `card` is the garden on one card.
// `say` is the desk's words, `touch` the phone's where they differ; `{use}` is said for the device (progress/devicewords.js deviceText).
// The words are Espada's (2026-10-30); the order and what each step shows are the design.
//
// The order is the first visit's own: you are the Jar (move), you are the hand (the arts), the shed has your first seed, let it go in
// the ring (the god hand's first real act), the lotus takes you to the Athanor, the plate shrine has your first spirit slab (GIFT: the
// clay's starter, Spectrobes: Origins' first fossil, Pokemon's starter), the bench carves it. The first path (progress/goals.js FIRST)
// walks the same three acts as goals: enter, plant, carve (gw1 .. gw3).
//
// Prior art: Animal Crossing: New Horizons' first day (Tom Nook walks you through one tent, one tool, one plant, then lets go), Super
// Mario Galaxy's Comet Observatory (one dome opened in front of you before the rest), Spectrobes: Origins' first excavation (a guided
// dig of a fossil handed to you), Hearthstone's one-rule-a-step first games.
//
//   GARDEN_HOWTO { title, steps: [{ say, touch?, show }], card: [line] }   GIFT { kind, stars }   gardenHowtoSeen(game) -> bool
// ---------------------------------------------------------------------------------------

export const GARDEN_HOWTO = {
  title: 'Your Spirit Garden',
  steps: [
    { say: 'This is the world inside your Pneuka Jar. Here you play as the Jar. Use WASD to hop and Space to jump. Each small world is a planetoid.',
      touch: 'This is the world inside your Pneuka Jar. Here you play as the Jar. With WALK on, tap the ground to hop there.', show: 'jar' },
    { say: 'You also control the god hand. It follows the cursor. Press 1 to 0 to choose what it does: 1 grabs and throws, 2 to 7 shape the clay, 8 pours water, 9 places, 0 paints.',
      touch: 'You also control the god hand. It follows your finger. Tap a tile at the edge of the screen to choose what it does. GRAB picks things up and throws them. The others shape, water, place and paint.', show: 'hand' },
    { say: 'The shed is your storeroom. Press {use} at the shed to take your first seed.', show: 'shed' },
    { say: 'Carry the seed into open sky, away from the planetoids, and let go. It becomes a new planetoid in the ring. Feed it to make it grow.', show: 'ring' },
    { say: 'Hop onto a launch lotus to fly to another planetoid. This one goes to the Athanor.', show: 'lotus' },
    { say: 'Your first spirit slab is at the plate shrine on the Athanor. A spirit slab is a creature set in stone. Press {use} at the shrine and choose it.', show: 'shrine' },
    { say: 'Carve the creature out before the stone sets. Press 1 to 7 to choose a tool. The brush never cracks the fossil. The blast is fast but rough. A clean carving makes a stronger spirit.',
      touch: 'Carve the creature out before the stone sets. Tap a tile to choose a tool. The brush never cracks the fossil. The blast is fast but rough. A clean carving makes a stronger spirit.', show: 'bench' },
  ],
  card: [
    'You are your Pneuka Jar (move) and the god hand (1 to 0: grab, shape, water, place, paint).',
    "A planetoid's seed waits in the shed: let it go in the open sky and it is a new planetoid. Feed it to grow it.",
    'Launch lotuses throw you between planetoids.',
    'Photograph a creature with the Veritome, and the plate shrine sets the photo into a spirit slab.',
    'Carve a slab at the bench below the shrine to summon its spirit: cleaner is stronger.',
    'The shrine also reads a real barcode or QR code: a slab or a material, three new codes a game day.',
  ],
};

/** The clay's starter: the first entry to the garden gives one spirit slab, so the plate shrine and the bench are taught on the first
 *  visit with nothing to fetch (a new save has no appraised photo; the darkroom and the Veritome come later). A clapperjar, the clay folk's
 *  lowest tier and Anagami's own; one star, so it sets in 120 real s (slabs.js secondsOf), time enough to learn the brush and the pick.
 *  Given, never made: its slab.make carries `from: 'gift'` and `by: 'environment'`, so it counts nothing; carving it is the Courier's. */
export const GIFT = { kind: 'clapperjar', stars: 1 };

/** Has the garden's how-to been finished or skipped once (the ledger's count, kept per build)? */
export const gardenHowtoSeen = (game) => (game.ledger?.get?.('garden.howto') || 0) > 0;
