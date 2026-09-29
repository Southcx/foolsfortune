// ---------------------------------------------------------------------------
// What the System can teach. Nothing here is bought with experience points: every skill
// is learned by doing something. The core movement (walk, sprint, slide, jump, wallrun,
// mantle, dash) and the body moves that come with a humanoid (swim, ladders) are always
// yours; the abilities below sit on the belt.
//
// A goal is one of:
//   count(event, n)              do it n times (`when` filters the event's details)
//   feat(event, when)            do it once, well enough
//   sum(event, field, target)    add up a number over many events (distance, time)
//   chain([a, b], within, n)     a then b inside `within` seconds, n times
// An ability or variant unlocks when all of its goals are met. Variants only start to
// count once their ability is yours. `cfg` is laid over the tech's tuning while the variant
// is selected; nothing else about the tech changes.
//
// Events come from game.events (see the emit calls in player.js, moves/, movers.js).
// ---------------------------------------------------------------------------

export const count = (event, n, label, when) => ({ type: 'count', event, n, label, when });
export const feat = (event, label, when) => ({ type: 'feat', event, n: 1, label, when });
export const sum = (event, field, target, label, when) => ({ type: 'sum', event, field, n: target, label, when });
export const chain = (steps, within, n, label) => ({ type: 'chain', steps, within, n, label });

export const ABILITIES = [
  {
    id: 'blink', key: 'E', name: 'Blink', glyph: '⟿', tech: 'blink', input: 'E', station: 'T5',
    blurb: 'A flash of a dodge along your move keys, leaving an afterimage. Two charges that come back on a timer.',
    hint: 'It comes to those who dash: the air dash, again and again.',
    goals: [count('dash', 20, 'air dashes')],
    variants: [
      { id: 'rush', name: 'Rush Blink', blurb: 'Further and faster: 8 m a blink, slower to recharge.', cfg: { distance: 8, recharge: 2.4 },
        hint: 'Blink until it is a habit.', goals: [count('blink', 30, 'blinks')] },
      { id: 'flicker', name: 'Flicker', blurb: 'Three short charges, quick to return: 4 m each.', cfg: { distance: 4, charges: 3, recharge: 1.1 },
        hint: 'Two blinks so close together they are one.', goals: [chain(['blink', 'blink'], 0.9, 8, 'a blink right after a blink')] },
    ],
  },
  {
    id: 'slam', key: 'C↓', name: 'Slam', glyph: '⤓', tech: 'slam', input: 'C in the air, looking down', station: 'T3',
    blurb: 'Drive straight down. The landing throws out a shockwave; Space right after is a big jump, C with a direction turns the fall into a slide.',
    hint: 'Fall from a real height, and land hard. Three times.',
    follows: ['Space: slam jump', 'C + direction: slam slide'],
    goals: [count('land', 3, 'drops of 12 m or more', (e) => e.drop >= 12)],
    variants: [
      { id: 'quake', name: 'Quake Slam', blurb: 'A wider, harder shockwave.', cfg: { radius: 4.8, velocity: 12, breakFrac: 0.6 },
        hint: 'Practice makes the ground tremble.', goals: [count('slam.impact', 40, 'slams')] },
      { id: 'super', name: 'Super Slam', blurb: 'The whole floor answers: a huge, ring-shaped shockwave, a bigger slam jump and a longer window to use it.',
        cfg: { radius: 7.5, breakFrac: 0.9, velocity: 15, jumpMax: 2.6, jumpPerMetre: 0.08, window: 0.45, speed: 30 },
        hint: 'Something about a great height, and a target that will not hold still.', station: 'K1',
        goals: [feat('target.hit', 'slam onto a moving target from 50 m up', (e) => e.cause === 'slam' && e.drop >= 50 && e.moving)] },
    ],
  },
  {
    id: 'roll', key: 'C', name: 'Roll', glyph: '◌', tech: 'roll', input: 'hold C into a hard landing', station: 'T3',
    blurb: 'Turn a fall into forward speed instead of a stop. Jump out of the second half of it.',
    hint: 'Take hard landings, and get used to them.',
    goals: [count('land', 5, 'hard landings', (e) => e.fall >= 9)],
    variants: [
      { id: 'tumble', name: 'Tumble', blurb: 'Rolls from lower falls, and carries more speed.', cfg: { minFall: 6, speed: 7, speedPerFall: 0.32 },
        hint: 'Roll until it is second nature.', goals: [count('tech.end', 15, 'rolls', (e) => e.id === 'roll')] },
    ],
  },
  {
    id: 'stomp', key: '↓', name: 'Stomp', glyph: '⇩', tech: 'stomp', input: 'land on a pot', station: 'T6',
    blurb: 'Come down on a pot from above: it shatters under you and throws you back up, air jump restored.',
    hint: 'Break a lot of pots. Some of them will teach you something.',
    goals: [count('break', 25, 'pots broken')],
    variants: [
      { id: 'spring', name: 'Spring Stomp', blurb: 'A higher bounce.', cfg: { bounce: 11 },
        hint: 'A staircase of pots, one after another.', goals: [chain(['stomp', 'stomp', 'stomp'], 4, 1, 'three stomps in a row')] },
    ],
  },
  {
    id: 'wallclimb', key: 'W→', name: 'Wall Climb', glyph: '⇑', tech: 'wallclimb', input: 'jump into a wall, W held', station: 'T5',
    blurb: 'Run up a wall a few steps, then kick off. Once a jump, and never after a wallrun.',
    hint: 'Spend time on walls: wallruns, and the jumps off them.',
    goals: [count('wallrun.end', 8, 'wallruns', (e) => e.dur >= 0.3), count('jump', 4, 'wall jumps', (e) => e.kind === 'wall')],
    variants: [
      { id: 'scale', name: 'Scale', blurb: 'Faster up the wall, and higher on the kick.', cfg: { speed: 8, time: 0.6, kickUp: 6.8 },
        hint: 'Climb until the wall gives in.', goals: [count('tech.end', 20, 'climbs', (e) => e.id === 'wallclimb')] },
    ],
  },
  {
    id: 'slip', key: 'C', name: 'Slip Dive', glyph: '≈', tech: 'slip', input: 'C on slip', station: 'T4',
    blurb: 'Melt into liquid clay and move fast through it: up walls, under gaps, launched out with a jump. Lachryma soaks back in while you are under.',
    hint: 'Paint the world with the slip shell first.',
    goals: [count('slip.splat', 6, 'slip splats')],
    variants: [
      { id: 'tide', name: 'Tide', blurb: 'Faster through the slip, and a higher launch out of it.', cfg: { speed: 13, jump: 10 },
        hint: 'Spend a long while under.', goals: [sum('tech.end', 'dur', 90, 'seconds under the slip', (e) => e.id === 'slip')] },
    ],
  },
];

/** Every slot on the belt is one of these; the rest of the techs (swim, ladders) are body moves. */
export const BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));
export const BY_TECH = Object.fromEntries(ABILITIES.map((a) => [a.tech, a]));
