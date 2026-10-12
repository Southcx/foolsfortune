// ---------------------------------------------------------------------------------------
// THE CASTER SHELLS AS DATA: all hundred (docs/plans/CASTER-SHELLS.md), each a recipe the shell runner (Petra's, tools/psygun/) reads:
// how it flies (a CARRIER), what it does where it lands (PAYLOADS), what it leaves (a FIELD), its TIER (what it costs and how many a
// chamber holds) and its numbers. The eleven that exist keep their numbers and ids (TYPE-00 to TYPE-10); TYPE-07 is the Paint shell
// (the owner, 2026-10-12: renamed from Slip, its old id kept as `was` so the ledger and the kit still find it). Labels are working
// genre words for Espada's lore names; looks and sounds are in the plan. Data and pure functions only.
//
// Prior art: Ratchet & Clank, Going Commando, Up Your Arsenal (the arsenal, and the Omega mods: an effect is a part, not a gun); Outlaw
// Star's Caster (numbered sealed spells, rare and costly; the rare three drawing on the shooter's life: the toll); Noita's wands (a
// shot built from parts); Monster Hunter's bowguns (a gun loads only some ammo, so many of each: kinds.js's chambers).
//
//   TIERS[1..4] = { name, worth, share, lachryma, toll }   CASTER_SHELLS = [{ no, id, label, tier, family, carrier, payloads, field,
//   needs, n, from, was?, backfire? }]   FAMILIES   shellByNo(n)   shellById(id)   worthOfShell(id)   fireCost(id) -> { lachryma, crack }
//   tollShatters(cracked) -> bool   chamberHolds(id, cap) -> n   typeLabel(no) -> 'TYPE-07'
// ---------------------------------------------------------------------------------------

/** The four tiers (CASTER-SHELLS.md section 2). `worth` in cubes (`worthOf`; a tier IV is never sold, its worth is for the Codex);
 *  `share` of the psygun's `cap` a chamber holds (IV and III a fixed count); `lachryma` drawn from the pool to fire; `toll` true: paid in
 *  the vessel instead, a cracked region, and the fourth with three cracked shatters (the owner ruled it: the cracks mend as the vessel's
 *  do when you ease off spending Lachryma). */
export const TIERS = {
  1: { name: 'common', worth: 6, share: 1, lachryma: 4, toll: false },
  2: { name: 'uncommon', worth: 20, share: 0.5, lachryma: 10, toll: false },
  3: { name: 'rare', worth: 80, holds: 2, lachryma: 25, toll: false },
  4: { name: "the Caster's own", worth: 400, holds: 1, lachryma: 0, toll: true, sold: false },
};

/** The families, by number (CASTER-SHELLS.md section 3), named with no article (the owner, 2026-10-12, through Espada). */
export const FAMILIES = [
  { id: 'founding', from: 0, to: 10, label: 'the founding eleven' },
  { id: 'edge', from: 11, to: 20, label: 'Edge' },
  { id: 'ember', from: 21, to: 30, label: 'Ember' },
  { id: 'storm', from: 31, to: 40, label: 'Storm' },
  { id: 'pull', from: 41, to: 50, label: 'Pull' },
  { id: 'clock', from: 51, to: 60, label: 'Clock' },
  { id: 'will', from: 61, to: 70, label: 'Will' },
  { id: 'company', from: 71, to: 80, label: 'Company' },
  { id: 'feelings', from: 81, to: 90, label: 'Feelings' },
  { id: 'caster', from: 91, to: 99, label: "Caster's own" },
];
const familyOf = (no) => FAMILIES.find((f) => no >= f.from && no <= f.to).id;

// One row: number, id, label, tier, carrier, payloads, field, needs (the plan's new mechanics Mn and shaders Sn), numbers, prior art.
// The numbers (`n`) are the runner's: power (a hit, as creatures.strike's; a slip jelly bursts at 8), r (radius, m), dur (real s),
// count (projectiles, targets, bounces or bodies), status (the one applied), type (the damage type), and what a row needs besides.
const S = (no, id, label, tier, carrier, payloads, field, needs, n, from, extra = {}) =>
  ({ no, id, label, tier, family: familyOf(no), carrier, payloads, field, needs, n, from, ...extra });

export const CASTER_SHELLS = [
  // ---- the founding eleven (exist: shells.js, specials.js, casters.js; their numbers are the runner's to carry over)
  S(0, 'slicer', 'Cleave', 1, 'bolt', ['cut'], null, [], { range: 40 }, 'the slicing plane'),
  S(1, 'push', 'Push', 1, 'cone', ['blast'], null, [], { r: 6 }, 'force'),
  S(2, 'well', 'Singularity', 2, 'lob', ['pull', 'blast'], null, [], { r: 6, dur: 2.5 }, 'Gravity Bomb'),
  S(3, 'mark', 'Mark', 1, 'bolt', ['status'], null, [], { status: 'stun' }, 'the mark'),
  S(4, 'bomb', 'Bomb', 1, 'lob', ['blast'], 'pool', [], { power: 4, r: 3 }, 'Bomb Glove'),
  S(5, 'ricochet', 'Bank', 1, 'bounce', ['type'], null, [], { count: 4 }, 'the bank shot'),
  S(6, 'homing', 'Seek', 1, 'seek', ['type'], null, [], {}, 'Seeker Gun'),
  S(7, 'paint', 'Paint', 1, 'lob', ['paint'], 'pool', [], { r: 2.5 }, 'Splatoon', { was: 'slip' }),
  S(8, 'groove', 'Groove', 2, 'lob', ['status'], 'zone', [], { r: 8, dur: 6, status: 'calm' }, 'a mirror ball'),
  S(9, 'anchor', 'Anchor', 2, 'bolt', ['pin'], null, [], { dur: 8 }, 'the anchor'),
  S(10, 'hatch', 'Hatch', 2, 'bolt', ['charm', 'summon'], null, [], {}, 'kintsugi'),
  // ---- Edge (Impact)
  S(11, 'ricochetSaw', 'Ricochet Saw', 1, 'bounce', ['blast', 'chain'], null, ['M2'], { power: 1.6, count: 5, type: 'impact' }, 'Chopper, Disc Blade Gun'),
  S(12, 'skipstone', 'Skipstone', 1, 'bounce', ['blast'], null, [], { power: 1.2, r: 1.5, count: 5, water: 2 }, 'Bouncer'),
  S(13, 'splitter', 'Splitter', 2, 'bolt', ['type', 'split'], null, ['M1'], { power: 2, count: 7, type: 'impact' }, 'Flux and Splitter Rifle'),
  S(14, 'hailstorm', 'Hailstorm', 1, 'cone', ['blast'], null, [], { power: 0.4, count: 24, spread: 25 }, 'N60 Storm, Blitz Gun'),
  S(15, 'piercer', 'Piercer', 2, 'beam', ['type'], null, ['S1'], { power: 5, wall: 3, dur: 2, type: 'impact' }, 'Flux Rifle'),
  S(16, 'mallet', 'Mallet', 2, 'lob', ['blast', 'status'], null, [], { power: 5, r: 3, status: 'stun' }, 'Walloper'),
  S(17, 'cartwheel', 'Cartwheel', 1, 'bounce', ['status', 'mass'], null, ['M8'], { power: 1, dur: 4, status: 'soft', squash: 0.2 }, "the Bouncer's roll"),
  S(18, 'pinball', 'Pinball', 2, 'bounce', ['blast'], null, [], { power: 1, dur: 6, gain: 1.15 }, 'the arcade'),
  S(19, 'petalRain', 'Petal Rain', 2, 'lob', ['split', 'blast'], null, ['M1'], { power: 0.5, count: 40, r: 5, hang: 0.5 }, 'Zodiac, in small'),
  S(20, 'stake', 'Stake', 3, 'bolt', ['pin', 'type'], null, [], { power: 6, dur: 6, type: 'impact' }, "Trigun's Cross Punisher"),
  // ---- Ember (molten clay and crude)
  S(21, 'flamer', 'Flamer', 1, 'cone', ['type', 'world'], null, ['S1'], { power: 0.6, dur: 4, r: 5 }, 'Pyrocitor'),
  S(22, 'meteor', 'Meteor', 2, 'call', ['blast'], 'pool', ['M10', 'S9'], { power: 4, count: 3, r: 2.5, delay: 1 }, 'Lava Gun to Meteor Gun'),
  S(23, 'lavaLamp', 'Lava Lamp', 2, 'seek', ['blast', 'split'], null, ['S9', 'M1'], { power: 3, count: 3, speed: 3 }, "the Lava Gun's glob"),
  S(24, 'napalm', 'Napalm', 2, 'lob', ['crude'], 'pool', [], { power: 0.8, r: 3, dur: 8, delay: 1 }, 'the Napalm mod'),
  S(25, 'detonator', 'Detonator', 1, 'bolt', ['blast'], null, [], { power: 5, r: 3 }, 'Nitro Launcher'),
  S(26, 'glassmaker', 'Glassmaker', 2, 'lob', ['world'], null, ['M12'], { size: 4, breaks: 3 }, 'sand and heat'),
  S(27, 'bisque', 'Bisque', 3, 'bolt', ['morph', 'status'], null, ['S4', 'M7'], { dur: 5, status: 'halt', shatter: 2 }, 'firing'),
  S(28, 'cinder', 'Cinder', 1, 'swarm', ['type'], null, [], { power: 0.4, dur: 10 }, "the Pyrocitor's sparks"),
  S(29, 'volcano', 'Volcano', 3, 'deploy', ['blast'], 'pool', ['M4', 'S1', 'S9'], { power: 3, dur: 8, every: 1, r: 2 }, "the Lava Gun's ground"),
  S(30, 'slagRain', 'Slag Rain', 2, 'lob', ['blast'], 'cloud', ['S9'], { power: 0.5, r: 6, dur: 3 }, 'volcanic ash'),
  // ---- Storm (lightning)
  S(31, 'teslaNode', 'Tesla Node', 1, 'deploy', ['chain'], null, ['S3', 'M2'], { power: 0.8, count: 2, every: 0.5, dur: 6 }, 'Tesla Claw'),
  S(32, 'chainBolt', 'Chain Bolt', 2, 'bolt', ['chain', 'status'], null, ['S3'], { power: 3, count: 8, falloff: 0.8, status: 'stun' }, 'Shock Cannon'),
  S(33, 'ballLightning', 'Ball Lightning', 2, 'seek', ['chain'], null, ['S3'], { power: 0.6, r: 4, speed: 2, dur: 8 }, 'Plasma Coil'),
  S(34, 'thunderhead', 'Thunderhead', 3, 'call', ['chain'], 'cloud', ['S3', 'M10'], { power: 4, every: 1.5, dur: 9 }, 'Plasma Storm, Zodiac'),
  S(35, 'lightningRod', 'Lightning Rod', 1, 'bolt', ['status'], null, [], { dur: 10, bend: 6 }, 'a conductor'),
  S(36, 'faradayCage', 'Faraday Cage', 3, 'deploy', ['status'], 'wall', ['S3', 'M4'], { size: 3, dur: 6, status: 'halt', power: 1 }, 'Shield Charger, inside out'),
  S(37, 'capacitor', 'Capacitor', 2, 'beam', ['type'], null, ['S3'], { power: 2, full: 12, charge: 2.5, height: 20 }, 'the charge'),
  S(38, 'staticCling', 'Static Cling', 2, 'bolt', ['status'], null, [], { r: 8, dur: 6, status: 'slow', power: 0.5 }, 'magnetism'),
  S(39, 'lodestone', 'Lodestone', 2, 'bolt', ['world'], null, [], { dur: 30 }, "the grapnel's need"),
  S(40, 'twelve', 'Twelve', 3, 'bolt', ['status', 'dispel'], null, ['S3'], { r: 6, dur: 10, status: 'sleep' }, 'Outlaw Star #12'),
  // ---- Pull (gravity, space and portals)
  S(41, 'inhaler', 'Inhaler', 2, 'cone', ['pull'], null, [], { count: 5, r: 6 }, 'Suck Cannon'),
  S(42, 'slingshot', 'Slingshot', 2, 'lob', ['pull', 'split'], null, ['M1'], { r: 6, dur: 1.5, fling: 18 }, 'Gravity Bomb, Vortex Cannon'),
  S(43, 'rift', 'Rift', 3, 'lob', ['space'], 'rift', ['S5', 'M5'], { dur: 6, drop: 8 }, 'Rift Inducer'),
  S(44, 'portal', 'Portal', 3, 'bolt', ['space'], 'rift', ['S5', 'M5'], { pair: true, dur: 30 }, 'the portal gun'),
  S(45, 'upfall', 'Upfall', 2, 'lob', ['mass'], 'column', ['M8'], { r: 6, dur: 5 }, 'gravity flip'),
  S(46, 'balloon', 'Balloon', 1, 'bolt', ['mass', 'status'], null, ['M8'], { dur: 6 }, 'weightlessness'),
  S(47, 'leadweight', 'Leadweight', 1, 'bolt', ['mass', 'status'], null, ['M8'], { dur: 6, status: 'slow' }, 'weight'),
  S(48, 'moonlet', 'Moonlet', 3, 'self', ['pull'], null, [], { r: 3, dur: 12, holds: 8 }, 'orbiting shields'),
  S(49, 'swap', 'Swap', 2, 'bolt', ['space'], null, [], { range: 40 }, 'the swapper'),
  S(50, 'shrinker', 'Shrinker', 2, 'bolt', ['mass'], null, ['M8'], { dur: 8, scale: 0.33 }, 'the shrink ray'),
  // ---- Clock (time)
  S(51, 'stasis', 'Stasis', 3, 'lob', ['time'], 'zone', ['S2', 'S7', 'M6'], { r: 5, dur: 5, scale: 0 }, 'time stop'),
  S(52, 'slowField', 'Slow Field', 2, 'lob', ['time'], 'zone', ['S2', 'S7', 'M6'], { r: 6, dur: 8, scale: 0.25 }, 'slow time'),
  S(53, 'overdrive', 'Overdrive', 2, 'self', ['time'], null, [], { dur: 6, tools: 1.5 }, 'haste (the tools only: the core movement is untouched)'),
  S(54, 'rewind', 'Rewind', 3, 'bolt', ['time'], null, ['M9', 'S7'], { back: 3 }, 'rewind'),
  S(55, 'echo', 'Echo', 2, 'self', ['time'], null, ['M9'], { dur: 5, lag: 1 }, 'afterimages'),
  S(56, 'weatherAway', 'Weather Away', 2, 'bolt', ['status', 'world'], null, ['S4'], { dur: 4, status: 'soft' }, 'entropy'),
  S(57, 'bloom', 'Bloom', 2, 'lob', ['world', 'dispel'], null, ['M12'], { r: 5 }, 'youth'),
  S(58, 'stopMotion', 'Stop-Motion', 2, 'lob', ['time'], 'zone', ['M6', 'S7'], { r: 8, dur: 8, onBeat: 2 }, 'the metronome'),
  S(59, 'bookmark', 'Bookmark', 2, 'self', ['space'], null, ['M9'], { dur: 10 }, 'a save state'),
  S(60, 'lastWord', 'Last Word', 3, 'bolt', ['type'], null, ['M9'], { delay: 3, repeat: 1 }, 'delayed damage'),
  // ---- Will (Ego, Influence, Illusion)
  S(61, 'infector', 'Infector', 2, 'bolt', ['charm'], null, [], { dur: 8, jumps: true }, 'Infector, Infecto-Bomb'),
  S(62, 'tauntDoll', 'Taunt Doll', 1, 'deploy', ['decoy', 'blast'], null, ['M4'], { r: 15, dur: 6, power: 3 }, 'Taunter'),
  S(63, 'double', 'Double', 2, 'deploy', ['decoy'], null, ['S8'], { dur: 10 }, 'Decoy Glove, a mirage'),
  S(64, 'pottify', 'Pottify', 2, 'bolt', ['morph'], null, ['M7'], { dur: 10 }, 'Morph-O-Ray, Sheepinator, Qwack-O-Ray'),
  S(65, 'brainwash', 'Brainwash', 3, 'bolt', ['charm'], null, [], { dur: 'fight' }, 'the Brainwash mod'),
  S(66, 'stageFright', 'Stage Fright', 2, 'lob', ['status'], null, [], { r: 10, dur: 5, status: 'doubt' }, 'humiliation'),
  S(67, 'paranoia', 'Paranoia', 1, 'bolt', ['status'], null, [], { dur: 8, status: 'confusion' }, 'confusion'),
  S(68, 'lullaby', 'Lullaby', 1, 'lob', ['status'], 'cloud', [], { r: 5, dur: 6, status: 'sleep' }, 'sleep'),
  S(69, 'mindSwap', 'Mind Swap', 3, 'bolt', ['space'], null, ['M11'], { dur: 12, pair: true }, 'the body swap'),
  S(70, 'forgetMe', 'Forget Me', 2, 'bolt', ['status'], null, [], { dur: 10, status: 'forget' }, 'the forget status'),
  // ---- Company (summons and things set down; never a sibling or a spirit: the owner, 2026-10-12)
  S(71, 'shabti', 'Shabti', 2, 'lob', ['summon'], null, [], { count: 3, dur: 20, power: 0.8 }, 'Synthenoid'),
  S(72, 'agents', 'Agents', 2, 'swarm', ['blast'], null, [], { count: 6, power: 2, r: 1.5 }, 'Glove of Doom, Agents of Doom'),
  S(73, 'droneHalo', 'Drone Halo', 2, 'self', ['summon'], null, [], { count: 3, dur: 15, power: 0.5 }, 'Drone Device'),
  S(74, 'turret', 'Turret', 2, 'deploy', ['blast'], null, ['M4'], { dur: 20, power: 0.6, every: 0.4 }, 'Mini-Turret Glove'),
  S(75, 'hydra', 'Hydra', 3, 'bolt', ['type'], null, [], { count: 6, power: 3 }, 'Spitting Hydra, Tempest'),
  S(76, 'holowall', 'Holowall', 2, 'deploy', [], 'wall', ['S2', 'S8', 'M4'], { w: 4, h: 2.5, dur: 10 }, 'Holoshield Glove'),
  S(77, 'barrier', 'Barrier', 3, 'self', ['status'], 'dome', ['S2', 'S3', 'M4'], { r: 2, dur: 6, power: 1 }, 'Shield Charger, Tesla Barrier'),
  S(78, 'golem', 'Golem', 3, 'lob', ['summon', 'world'], null, ['M12'], { dur: 30, power: 3, h: 3 }, 'the golem'),
  S(79, 'minefield', 'Minefield', 1, 'deploy', ['blast'], null, ['M4'], { count: 6, r: 2, arm: 1, power: 3, dur: 60 }, 'Mine Glove'),
  S(80, 'marionette', 'Marionette', 3, 'bolt', ['summon'], null, [], { dur: 20 }, 'Agents of Dread, a puppeteer'),
  // ---- Feelings (each needs its feeling known: FEELINGS-AWAKENING.md)
  S(81, 'wonder', 'Wonder', 2, 'lob', ['feel', 'status'], null, [], { r: 20, dur: 4, status: 'halt', reveal: 40, feeling: 'wonder' }, 'the vantage'),
  S(82, 'mirth', 'Mirth', 2, 'lob', ['feel', 'status'], null, [], { r: 10, dur: 3, status: 'stun', feeling: 'mirth' }, 'the pratfall'),
  S(83, 'desire', 'Desire', 2, 'lob', ['feel', 'pull'], null, [], { r: 20, dur: 5, feeling: 'desire' }, 'the lure'),
  S(84, 'fury', 'Fury', 2, 'bolt', ['feel'], null, [], { dur: 8, both: 2, feeling: 'fury' }, 'the berserk'),
  S(85, 'gall', 'Gall', 2, 'lob', ['feel'], 'cloud', [], { r: 5, dur: 6, feeling: 'gall' }, 'nausea'),
  S(86, 'grief', 'Grief', 2, 'bolt', ['feel', 'status'], null, [], { dur: 8, status: 'slow', feeling: 'grief' }, 'the weeping'),
  S(87, 'dread', 'Dread', 2, 'lob', ['feel', 'status'], null, [], { r: 15, dur: 6, status: 'flee', feeling: 'dread' }, 'the dark'),
  S(88, 'agate', 'Agate', 3, 'bolt', ['feel'], null, [], { feelings: 2 }, 'the agate'),
  S(89, 'calm', 'Calm', 3, 'beam', ['dispel'], null, [], { r: 8, fair: 1 }, 'Outlaw Star #3 and #5'),
  S(90, 'prismatic', 'Prismatic', 3, 'bolt', ['feel'], null, [], { feelings: 7 }, 'the wheel of feelings'),
  // ---- Caster's own (tier IV: the toll)
  S(91, 'zodiac', 'Zodiac', 4, 'call', ['blast'], null, ['M10'], { count: 12, power: 10 }, 'Zodiac'),
  S(92, 'ryno', 'RYNO', 4, 'swarm', ['blast'], null, [], { count: 24, power: 4, r: 2 }, 'the RYNO I to III'),
  S(93, 'visibomb', 'Visibomb', 4, 'steer', ['blast'], null, ['M3', 'S8'], { dur: 8, power: 14, r: 5 }, 'Visibomb Gun'),
  S(94, 'insideOut', 'Inside Out', 4, 'lob', ['pull', 'space'], null, ['S6'], { r: 3 }, 'Outlaw Star #4'),
  S(95, 'leyline', 'Leyline', 4, 'bolt', ['space'], null, ['S6', 'M10'], { up: 30, dur: 4 }, 'Outlaw Star #9'),
  S(96, 'thirteen', 'Thirteen', 4, 'beam', ['type'], null, [], { power: 60, types: 'all' }, 'Outlaw Star #13', { backfire: true }),
  S(97, 'corrupt', 'Corrupt', 4, 'bolt', ['morph', 'status'], null, ['S10'], { dur: 6, status: 'confusion' }, ".hack's data drain"),
  S(98, 'godHand', 'God Hand', 4, 'lob', ['space'], null, [], { r: 3, throw: 30 }, 'the god hand'),
  S(99, 'theFool', 'The Fool', 4, 'bolt', [], null, [], { pick: 'any', times: 2 }, "the game's name"),
];

const BY_NO = new Map(CASTER_SHELLS.map((s) => [s.no, s]));
const BY_ID = new Map(CASTER_SHELLS.flatMap((s) => (s.was ? [[s.id, s], [s.was, s]] : [[s.id, s]])));
export const shellByNo = (no) => BY_NO.get(no) || null;
/** A shell by its id, or by the id it had (`slip`, the Paint shell's). */
export const shellById = (id) => BY_ID.get(id) || null;
export const typeLabel = (no) => `TYPE-${String(no).padStart(2, '0')}`;

/** A shell's worth in cubes: its tier's (catalogue.js worthOf asks here for a `shell.<id>`). */
export const worthOfShell = (id) => TIERS[shellById(id)?.tier || 1].worth;
/** What firing it costs: Lachryma from the pool, or (tier IV) a cracked region of the vessel. */
export function fireCost(id) {
  const t = TIERS[shellById(id)?.tier || 1];
  return { lachryma: t.lachryma, crack: !!t.toll };
}
/** The toll's limit: a tier IV fired with three regions already cracked shatters the Courier (of four: mask, torso, arms, legs). */
export const tollShatters = (cracked) => cracked >= 3;
/** How many of a shell a chamber holds, given the psygun's `cap` (kinds.js): commons the cap, uncommons half, rares 2, the Caster's 1. */
export function chamberHolds(id, cap) {
  const t = TIERS[shellById(id)?.tier || 1];
  return t.holds ?? Math.max(1, Math.round(cap * t.share));
}
