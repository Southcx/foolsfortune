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
// An art marked `any` opens when ANY one of its goals is met (the god powers': a count way or a feat way, SPINE.md 2.1), not all.
// ---------------------------------------------------------------------------
import { GOD_POWERS, EPICS, DOMAIN_GLAZE } from './godpowers.js';
import { DOMAINS, expAt } from './domains.js';

export const led = (key, n, label) => ({ key, n, label });
/** The achievement whose completion unlocks an art or a variant ('blink' -> 'art_blink', 'blink.rush' -> 'art_blink_rush'). */
export const achOf = (id) => `art_${id.replace('.', '_')}`;
/** How far a goal has come, from the ledger: [0..1]. */
/** A goal's key read as a counter or a record (`L.hi`: a best kept apart from the counters), whichever it is. */
export const ledOf = (L, key) => Math.max(L?.get?.(key) || 0, L?.best?.(key) || 0);
export const goalFracOf = (L, g) => (g.n > 0 ? Math.min(1, ledOf(L, g.key) / g.n) : 1);
/** How far a set of goals has come: their mean, or for an `any` art the furthest one. */
export const goalsFracOf = (L, goals, any = false) => (!goals.length ? 1 : any ? Math.max(...goals.map((g) => goalFracOf(L, g))) : goals.reduce((n, g) => n + goalFracOf(L, g), 0) / goals.length);

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
    hint: 'Fall 20 m or more and land it, three times. The workshop\'s hole is only 14 m.', // (QA-C, 2026-10-22: no 20 m drop near the start; Roll is a Dunes art)
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
    id: 'slip', key: 'C', name: 'Paint Dive', glyph: '≈', tech: 'slip', input: 'C in paint', station: 'T4',
    blurb: 'Melt into liquid clay and move fast through it: up walls, under gaps, launched out with a jump. Lachryma soaks back in while you are under.',
    hint: 'Paint the world with the Paint Shell first.',
    goals: [led('slip.splat', 6, 'paint splats')],
    variants: [
      { id: 'tide', name: 'Tide', blurb: 'Faster through the paint, and a higher launch out of it.', cfg: { speed: 13, jump: 10 },
        hint: 'Spend a long while under.', goals: [led('time.slip', 90, 'seconds under the paint')] },
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
  {
    // the Solar Skiff's glide (Petra's, R8: courier/skiff/skiff.js). Taken from Breath of the Wild's paraglider and Wind Waker's Deku Leaf:
    // the glide is earned by getting the board into the air, so its goal is the hop that makes the airtime it stretches
    id: 'glide', key: 'Space held', name: 'Skiff Glide', glyph: '⌒', tech: 'skiffGlide', input: 'hold Space in the air on the Solar Skiff',
    blurb: 'On the Solar Skiff, hold Space in the air and the sail catches: a long, slow fall instead of a spin.',
    hint: 'Get the board off the sand. Again and again.',
    goals: [led('skiff.hop', 40, 'hops on the Solar Skiff')],
    variants: [],
  },
];

// ---------------------------------------------------------------------------
// The God Arts: what the hand can do (godhand/arts.js). Same shape as the Movement Arts, learned the
// same way; they run on Lachryma and work only where the Courier's explored area reaches
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

// ---------------------------------------------------------------------------
// The god powers and the epic miracles as God Arts (SPINE.md 2, the owner's ruling of 2026-10-13: "arts only by achievement"). Each
// opens by its COUNT WAY, its domain at the level it used to open at (the grind closes the gap), or its FEAT WAY, a skilled act of the
// same domain that can be done before the power is yours (skill skips the grind). The matter's verbs and the miracles are basic.
// The feats are drafts, tuned in play; each is a ledger key tracking.js already keeps (or tracking/god.js: `god.scoop.best`,
// `god.miracle.<feeling>.great`). Prior art: OSRS's quest-or-level gates; Monster Hunter's key quests beside the HR grind.
// ---------------------------------------------------------------------------
const POWER_FEATS = {
  sculpt: led('god.manifest.len', 10, 'a manifested wall 10 m long'),
  setfast: led('god.sculpt.volume', 20, 'a sculpted creation of 20 m³'),
  totem: led('god.miracle.score', 90, "a miracle's sign drawn at 90 or better"),
  portal: led('grapple.swing.peak', 14, 'a grapple swing at 14 m/s'),
  hasten: led('blade.cuts.best', 8, 'blade mode left with 8 cuts'),
  fold: led('blade.zandatsu', 1, 'a zandatsu'),
  strata: led('map.room', 6, 'six places mapped'),
  course: led('crystal.sweet.run', 10, "a crystal's sweet spot ten times running"),
  read: led('parry.run.best', 5, 'five windups parried running'),
  gust: led('god.throw.speed', 25, 'a thing thrown by the hand at 25 m/s'),
  slab: led('god.scoop.best', 20, '20 m³ scooped in one stroke'),
  herd: led('reprogram.held5', 1, 'a mind reprogrammed with a held five-word macro'),
  take: led('lockheart.three', 1, 'the Lockheart opened with three Possibilikeys'),
  muster: led('god.wave.max', 10, 'wave 10 in a raid'),
  transmute: led('god.cuts.best', 3, 'three things sundered with one stroke'),
  ward: led('sigil.cleared.best', 3, 'three sigils cleared in one Celestial mode'),
  stamp: led('cogitomap.get', 1, 'a Cogitomap brought home'),
};
const OLD_FIVE = new Set(GOD_ARTS.map((a) => a.id));
const countWay = (domain, at) => led(`exp.${domain}`, expAt(at), `${DOMAINS[domain].name} ${at}`);
const powerArt = (id, P, feat, extra = {}) => ({
  realm: 'god', id, name: P.label, glyph: DOMAIN_GLAZE[P.domain]?.glyph || '✦', input: 'the hand: its domain (1 to 7), then the wheel',
  blurb: `${P.does[0].toUpperCase()}${P.does.slice(1)}. ${DOMAINS[P.domain].name}'s.`, power: true, domain: P.domain, variants: [],
  ...(P.at <= 1 ? { basic: true, goals: [], hint: 'Yours from the start.' }
    : { any: true, goals: [countWay(P.domain, P.at), feat], hint: `Reach ${DOMAINS[P.domain].name} ${P.at}, or: ${feat.label}.` }),
  ...extra,
});
export const POWER_ARTS = Object.entries(GOD_POWERS).filter(([id, P]) => !OLD_FIVE.has(id) && P.built && P.domain)
  .map(([id, P]) => powerArt(id, P, POWER_FEATS[id] || led(`god.power.${id}`, 1, 'once')));
export const EPIC_ARTS = Object.entries(EPICS).map(([id, E]) => powerArt(id, { ...E, does: `the epic miracle of the ${E.sign} sign, drawn with Shift` },
  led(`god.miracle.${E.sign}.great`, 1, `its feeling's miracle at full size, its sign at 95, at Dissonance Level 5`)));
GOD_ARTS.push(...POWER_ARTS, ...EPIC_ARTS);

export const ALL_ARTS = [...ABILITIES, ...GOD_ARTS];

/** All the arts by id; BY_TECH covers the Movement Arts only (the rest of the techs (swim, ladders, hanging) are body moves). */
export const BY_ID = Object.fromEntries(ALL_ARTS.map((a) => [a.id, a]));
/** The techs the log counts as used (`tech.<id>` firsts) and "Every Tech, Once" asks for: those that start (a passive one, the
 *  carry, kick, recoil, the prone holster, never does) and are not the body's other business (an emote, a talk, the rhythm mode,
 *  a shatter, an ultimate). */
export const UNLOGGED_TECHS = ['emote', 'talk', 'rhythm', 'death', 'ultimate'];
export const loggedTechs = (techs) => (techs?.list || []).filter((t) => !t.passive && !UNLOGGED_TECHS.includes(t.id)).map((t) => t.id);
export const BY_TECH = Object.fromEntries(ABILITIES.map((a) => [a.tech, a]));
