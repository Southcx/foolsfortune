// ---------------------------------------------------------------------------
// What the System can teach. Nothing here is bought with experience points: every skill
// is learned by doing something. The core movement (walk, sprint, slide, jump, wallrun,
// mantle, dash) and the body moves that come with a humanoid (swim, ladders, hanging, poles, grates, balance,
// carrying, pushing) are always yours; the Movement Arts below are earned.
//
// A goal is a number the ledger already keeps (src/progress/stats.js, written by feedback/tracking.js) and how far it must go:
//   led(key, n, label)           the ledger's `key` reaches n (a count, a sum of seconds, a chain counted by tracking.js)
// Each art and variant is the reward of an ACHIEVEMENT (achievements.js: `art_<id>`, with `unlocks`), the one way skills are unlocked
// (the owner's rule), so a goal is a predicate over the ledger like every achievement, and retroactive: the System unlocks an art when
// its achievement is done. A variant unlocks once its ability is yours (its goals can only be met with the ability in hand anyway).
// `cfg` is laid over the tech's tuning while the variant is selected; nothing else about the tech changes.
// ---------------------------------------------------------------------------

export const led = (key, n, label) => ({ key, n, label });
/** The achievement whose completion unlocks an art or a variant ('blink' -> 'art_blink', 'blink.rush' -> 'art_blink_rush'). */
export const achOf = (id) => `art_${id.replace('.', '_')}`;
/** How far a goal has come, from the ledger: [0..1]. */
export const goalFracOf = (L, g) => (g.n > 0 ? Math.min(1, (L?.get(g.key) || 0) / g.n) : 1);

export const ABILITIES = [
  {
    id: 'blink', key: 'E', name: 'Blink', glyph: '⟿', tech: 'blink', input: 'E', station: 'T5',
    blurb: 'A flash of a dodge along your move keys, leaving an afterimage. Two charges that come back on a timer.',
    hint: 'It comes to those who dash: the air dash, again and again.',
    goals: [led('move.dash', 20, 'air dashes')],
    variants: [
      { id: 'rush', name: 'Rush Blink', blurb: 'Further and faster: 8 m a blink, slower to recharge.', cfg: { distance: 8, recharge: 2.4 },
        hint: 'Blink until it is a habit.', goals: [led('move.blink', 30, 'blinks')] },
      { id: 'flicker', name: 'Flicker', blurb: 'Three short charges, quick to return: 4 m each.', cfg: { distance: 4, charges: 3, recharge: 1.1 },
        hint: 'Two blinks so close together they are one.', goals: [led('chain.blink2', 8, 'a blink right after a blink')] },
    ],
  },
  {
    id: 'slam', key: 'C↓', name: 'Slam', glyph: '⤓', tech: 'slam', input: 'C in the air, looking down', station: 'T3',
    blurb: 'Drive straight down. The landing throws out a shockwave; Space right after is a big jump, C with a direction turns the fall into a slide.',
    hint: 'Fall from a real height, and land hard. Three times.',
    follows: ['Space: slam jump', 'C + direction: slam slide'],
    goals: [led('land.drop12', 3, 'drops of 12 m or more')],
    variants: [
      { id: 'quake', name: 'Quake Slam', blurb: 'A wider, harder shockwave.', cfg: { radius: 4.8, velocity: 12, breakFrac: 0.6 },
        hint: 'Practice makes the ground tremble.', goals: [led('move.slam', 40, 'slams')] },
      { id: 'super', name: 'Super Slam', blurb: 'The whole floor answers: a huge, ring-shaped shockwave, a bigger slam jump and a longer window to use it.',
        cfg: { radius: 7.5, breakFrac: 0.9, velocity: 15, jumpMax: 2.6, jumpPerMetre: 0.08, window: 0.45, speed: 30 },
        hint: 'Something about a great height, and a target that will not hold still.', station: 'K1',
        goals: [led('target.slam.moving50', 1, 'slam onto a moving target from 50 m up')] },
    ],
  },
  {
    id: 'roll', key: '⇧ crouched', name: 'Roll', glyph: '◌', tech: 'roll', input: 'Sprint (Shift) while crouched; automatic out of a fall of 20 m or more', station: 'T3',
    blurb: 'An evasive roll: press Sprint while crouched and you tumble the way you steer, invulnerable for the first third of it. It also happens by itself out of a fall of 20 m or more, where it mitigates the fall and turns it into speed. Jump out of the second half to keep the speed.',
    hint: 'Fall a long way, and land it. Three times.',
    goals: [led('land.drop20', 3, 'drops of 20 m or more')],
    variants: [
      { id: 'tumble', name: 'Tumble', blurb: 'Rolls out of falls of 12 m, carries more speed, and stays invulnerable a little longer.', cfg: { minDrop: 12, speed: 10, speedPerFall: 0.32, iframes: 0.42, cooldown: 0.5 },
        hint: 'Roll until it is second nature.', goals: [led('roll.end', 15, 'rolls')] },
    ],
  },
  {
    id: 'stomp', key: '↓', name: 'Stomp', glyph: '⇩', tech: 'stomp', input: 'land on a pot', station: 'T6',
    blurb: 'Come down on a pot from above: it shatters under you and throws you back up, air jump restored.',
    hint: 'Break a lot of pots. Some of them will teach you something.',
    goals: [led('break.total', 25, 'pots broken')],
    variants: [
      { id: 'spring', name: 'Spring Stomp', blurb: 'A higher bounce.', cfg: { bounce: 11 },
        hint: 'A staircase of pots, one after another.', goals: [led('chain.stomp3', 1, 'three stomps in a row')] },
    ],
  },
  {
    id: 'slip', key: 'C', name: 'Slip Dive', glyph: '≈', tech: 'slip', input: 'C on slip', station: 'T4',
    blurb: 'Melt into liquid clay and move fast through it: up walls, under gaps, launched out with a jump. Lachryma soaks back in while you are under.',
    hint: 'Paint the world with the Paint Shell first.',
    goals: [led('slip.splat', 6, 'slip splats')],
    variants: [
      { id: 'tide', name: 'Tide', blurb: 'Faster through the slip, and a higher launch out of it.', cfg: { speed: 13, jump: 10 },
        hint: 'Spend a long while under.', goals: [led('time.slip', 90, 'seconds under the slip')] },
    ],
  },
  {
    id: 'latch', key: 'C at wall', name: 'Wall Latch', glyph: '⊣', tech: 'latch', input: 'C in the air, beside a wall (not looking down)', station: 'R1',
    blurb: 'Cling to any wall by your feet and one hand, the other free for the gun. WASD crawls along it, Space kicks off. It does not last: a couple of seconds a jump, then you start to slide.',
    hint: 'Get used to hanging: catch ledges with your hands, again and again.',
    goals: [led('move.hang.start', 6, 'ledge and bar hangs')],
    variants: [
      { id: 'grip', name: 'Iron Grip', blurb: 'Hold on longer, and climb faster.', cfg: { budget: 3.6, speed: 3.2 },
        hint: 'Cling to walls until your fingers ache.', goals: [led('move.latch.start', 15, 'wall latches')] },
    ],
  },
  {
    id: 'kick', key: 'V', name: 'Kick & Parry', glyph: '⇥', tech: 'kick', input: 'V', station: 'H3',
    blurb: 'A quick kick that knocks pots over, sends crates and clapperjars flying, and rings targets. Kick a projectile in its first moments and it is a parry: it goes back the way you look, and you cannot be hit for a beat.',
    hint: 'Break a great many pots. Feet first is fine.',
    goals: [led('break.total', 15, 'pots broken')],
    variants: [
      { id: 'counter', name: 'Counter', blurb: 'A wider parry window: it catches more, throws it back harder, and covers you longer.', cfg: { parryRadius: 2.7, parryOut: 16, parryIframes: 0.7, parrySpeed: 3.5 },
        hint: 'Turn something back on whatever threw it.', goals: [led('move.parry', 4, 'parries')] },
    ],
  },
  {
    id: 'recoil', key: 'Shot ↓', name: 'Recoil Jump', glyph: '⇧', tech: 'recoil', input: 'fire the gun, aimed down, in mid-air', station: 'H4',
    blurb: 'In the air, a shot aimed down kicks you up (and back the way the barrel points). Three shots a jump; a charged shot is worth two. A shot costs what a shot costs: Lachryma.',
    hint: 'Shoot from the air. Often.',
    goals: [led('shot.air', 15, 'shots fired in mid-air')],
    variants: [
      { id: 'boost', name: 'Boost', blurb: 'Every shot kicks harder, and one more of them a jump.', cfg: { kick: 6.6, chargedKick: 13, charges: 4 },
        hint: 'Kick yourself up, again and again.', goals: [led('move.recoil', 25, 'recoil jumps')] },
    ],
  },
];

// ---------------------------------------------------------------------------
// The God Arts: what the hand can do (godhand/arts.js). Same shape as the Movement Arts, learned the
// same way; they run on Lachryma and work only where the courier's Zone of Influence reaches
// (cartography.js). `basic` arts are known from the start. Events: god.grab / god.throw /
// god.sunder / god.swell / god.wring / god.manifest, and map.pulse / map.room from the cartography.
// ---------------------------------------------------------------------------
export const GOD_ARTS = [
  {
    realm: 'god', id: 'telekinesis', key: '1', name: 'Telekinesis', glyph: '⤒', basic: true, input: 'hold left click on something loose',
    blurb: 'Lift anything loose (pots, crates, clapperjars, a mortar ball in flight) and throw it as fast as the hand was moving. Holding costs Lachryma, more for heavier things; let go when it runs dry. Works on sensed ground.',
    hint: 'The first thing the hand ever learned.',
    goals: [],
    variants: [
      { id: 'heavy', name: 'Heavy Hand', blurb: 'Holding is cheaper, and the throw is harder.', cfg: { drain: 1.8, massDrain: 0.07 },
        hint: 'Throw a great many things.', goals: [led('god.throw', 30, 'things thrown')] },
    ],
  },
  {
    realm: 'god', id: 'sunder', key: '2', name: 'Sunder', glyph: '╱', input: 'left click and drag across the ground',
    blurb: 'Draw a blade across the ground: everything it passes through, in the air above the line, is cut in two along that plane. A cut costs Lachryma, a little more for every extra thing it takes. Works on charted ground.',
    hint: 'Cut pots with the psygun\'s slice shell, again and again.',
    goals: [led('break.cause.sliced', 8, 'pots sliced')],
    variants: [
      { id: 'guillotine', name: 'Guillotine', blurb: 'A longer, taller blade.', cfg: { maxLen: 18, height: 4.8 },
        hint: 'Sunder until it is a habit.', goals: [led('god.sunder', 15, 'cuts')] },
    ],
  },
  {
    realm: 'god', id: 'swell', key: '3', name: 'Swell', glyph: '⤢', input: 'left click a pot or crate and drag up / down',
    blurb: 'Grow or shrink a pot or crate: drag up to swell it, down to shrink it. Its weight follows its size. Costs Lachryma while you reshape it. Works on charted ground.',
    hint: 'Lift and throw things with the hand, again and again.',
    goals: [led('god.throw', 10, 'things thrown by the hand')],
    variants: [
      { id: 'colossus', name: 'Colossus', blurb: 'Swell things to four times their size.', cfg: { max: 4, min: 0.25 },
        hint: 'Reshape a dozen things.', goals: [led('god.swell', 12, 'things swelled')] },
    ],
  },
  {
    realm: 'god', id: 'wring', key: '4', name: 'Wring', glyph: '↺', input: 'left click a pot and drag',
    blurb: 'Wring the clay: drag sideways to twist a pot about its axis, up to scallop its walls. It stays the same clay. Costs Lachryma while you work it. Works on understood ground only.',
    hint: 'Know two places well: map them, and survey them.',
    goals: [led('map.room', 2, 'places mapped')],
    variants: [
      { id: 'wringer', name: 'Wringer', blurb: 'Twist it round twice, scallop it deep.', cfg: { twist: 7, lobe: 0.5 },
        hint: 'Wring a dozen pots.', goals: [led('god.wring', 12, 'pots wrung')] },
    ],
  },
  {
    realm: 'god', id: 'manifest', key: '5', name: 'Manifest', glyph: '▲', input: 'left click, drag and hold',
    blurb: 'Raise a wall of clay from the floor: press, drag for its length, hold for its height. It stands for a while, then crumbles; whatever stands where it rises is lifted with it. Costs Lachryma by its size. Works on understood ground only.',
    hint: 'Map four places, and survey ten times.',
    goals: [led('map.room', 4, 'places mapped'), led('map.pulse', 10, 'surveys')],
    variants: [
      { id: 'bastion', name: 'Bastion', blurb: 'Taller, longer, and it stands for a minute and a half.', cfg: { maxH: 6, maxLen: 14, life: 90 },
        hint: 'Raise a great many walls.', goals: [led('god.manifest', 12, 'walls raised')] },
    ],
  },
];
export const ALL_ARTS = [...ABILITIES, ...GOD_ARTS];

/** All the arts by id; BY_TECH covers the Movement Arts only (the rest of the techs (swim, ladders, hanging) are body moves). */
export const BY_ID = Object.fromEntries(ALL_ARTS.map((a) => [a.id, a]));
export const BY_TECH = Object.fromEntries(ABILITIES.map((a) => [a.tech, a]));
