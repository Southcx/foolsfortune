// ---------------------------------------------------------------------------
// What the System can teach. Nothing here is bought with experience points: every skill
// is learned by doing something. The core movement (walk, sprint, slide, jump, wallrun,
// mantle, dash) and the body moves that come with a humanoid (swim, ladders, hanging, poles, grates, balance,
// carrying, pushing) are always yours; the Movement Arts below are earned.
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
    id: 'roll', key: '⇧ crouched', name: 'Roll', glyph: '◌', tech: 'roll', input: 'Sprint (Shift) while crouched; automatic out of a fall of 20 m or more', station: 'T3',
    blurb: 'An evasive roll: press Sprint while crouched and you tumble the way you steer, invulnerable for the first third of it. It also happens by itself out of a fall of 20 m or more, where it mitigates the fall and turns it into speed. Jump out of the second half to keep the speed.',
    hint: 'Fall a long way, and land it. Three times.',
    goals: [count('land', 3, 'drops of 20 m or more', (e) => e.drop >= 20)],
    variants: [
      { id: 'tumble', name: 'Tumble', blurb: 'Rolls out of falls of 12 m, carries more speed, and stays invulnerable a little longer.', cfg: { minDrop: 12, speed: 10, speedPerFall: 0.32, iframes: 0.42, cooldown: 0.5 },
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
    id: 'slip', key: 'C', name: 'Slip Dive', glyph: '≈', tech: 'slip', input: 'C on slip', station: 'T4',
    blurb: 'Melt into liquid clay and move fast through it: up walls, under gaps, launched out with a jump. Lachryma soaks back in while you are under.',
    hint: 'Paint the world with the slip shell first.',
    goals: [count('slip.splat', 6, 'slip splats')],
    variants: [
      { id: 'tide', name: 'Tide', blurb: 'Faster through the slip, and a higher launch out of it.', cfg: { speed: 13, jump: 10 },
        hint: 'Spend a long while under.', goals: [sum('tech.end', 'dur', 90, 'seconds under the slip', (e) => e.id === 'slip')] },
    ],
  },
  {
    id: 'latch', key: 'C at wall', name: 'Wall Latch', glyph: '⊣', tech: 'latch', input: 'C in the air, beside a wall (not looking down)', station: 'R1',
    blurb: 'Cling to any wall by your feet and one hand, the other free for the gun. WASD crawls along it, Space kicks off. It does not last: a couple of seconds a jump, then you start to slide.',
    hint: 'Get used to hanging: catch ledges with your hands, again and again.',
    goals: [count('hang.start', 6, 'ledge and bar hangs')],
    variants: [
      { id: 'grip', name: 'Iron Grip', blurb: 'Hold on longer, and climb faster.', cfg: { budget: 3.6, speed: 3.2 },
        hint: 'Cling to walls until your fingers ache.', goals: [count('latch.start', 15, 'wall latches')] },
    ],
  },
  {
    id: 'kick', key: 'V', name: 'Kick & Parry', glyph: '⇥', tech: 'kick', input: 'V', station: 'H3',
    blurb: 'A quick kick that knocks pots over, sends crates and clapperjars flying, and rings targets. Kick a projectile in its first moments and it is a parry: it goes back the way you look, and you cannot be hit for a beat.',
    hint: 'Break a great many pots. Feet first is fine.',
    goals: [count('break', 15, 'pots broken')],
    variants: [
      { id: 'counter', name: 'Counter', blurb: 'A wider parry window: it catches more, throws it back harder, and covers you longer.', cfg: { parryRadius: 2.7, parryOut: 16, parryIframes: 0.7, parrySpeed: 3.5 },
        hint: 'Turn something back on whatever threw it.', goals: [count('parry', 4, 'parries')] },
    ],
  },
  {
    id: 'recoil', key: 'Shot ↓', name: 'Recoil Jump', glyph: '⇧', tech: 'recoil', input: 'fire the gun, aimed down, in mid-air', station: 'H4',
    blurb: 'In the air, a shot aimed down kicks you up (and back the way the barrel points). Three shots a jump; a charged shot is worth two. A shot costs what a shot costs: Lachryma.',
    hint: 'Shoot from the air. Often.',
    goals: [count('shot', 15, 'shots fired in mid-air', (e) => e.air)],
    variants: [
      { id: 'boost', name: 'Boost', blurb: 'Every shot kicks harder, and one more of them a jump.', cfg: { kick: 6.6, chargedKick: 13, charges: 4 },
        hint: 'Kick yourself up, again and again.', goals: [count('recoil.jump', 25, 'recoil jumps')] },
    ],
  },
];

/** The Movement Arts; the rest of the techs (swim, ladders, hanging) are body moves. */
export const BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));
export const BY_TECH = Object.fromEntries(ABILITIES.map((a) => [a.tech, a]));
