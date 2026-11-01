// ---------------------------------------------------------------------------------------
// EACH TOOL'S MOVEKIT IN THE ARENA (South, 2026-11-01: "create a full super smash bros style movekit per lachryma tool type, including
// the five special (directional plus neutral) and five normal attacks. Be creative with giving each lachryma tool it's identity, use
// specific references that complement each lachryma tool"; FIGHTER.md 8, 9). Calissa's moves, under the permission
// progress/fighterkits.js's header records ("You have my permission to come up with new moves and chains"): every tool held in the
// Arena fills ten slots of its own.
//   the five normals   the jab (its string of one to three), the forward tilt, the up tilt, the down tilt, the dash attack
//   the five specials  neutral, forward (side, toward the stick), back (side, away: `bspecial`, the body turned to strike behind, as
//                      Smash's B-reversed side special turns it), up (always a recovery), down
// A slot fighterkits.js's SLOTS fills from the tool's combat/moves.js row keeps that row (the world's combo is the Arena's jab: one
// move in both places); these fill the rest. Numbers ours, each against the Melee character its reference is closest to, inside the
// kit's own ceiling (fighterkits.js CAP 30%) and frame rule (a startup, its active frames, the total; `late` the weaker hit after).
// The specials' behaviours are the kernel's own (fighter/kernel.js): 'shot' (a projectile: `shot` its speed, lift, gravity, size,
// life, `back` thrown behind), 'lunge' (a dash its distance over its active frames), 'recover' (the rise: `rise` x the jump, `drift`),
// 'reflect' (`reflect` its window), 'dive', 'hook' (a tether).
//
// EACH TOOL'S IDENTITY AND ITS SOURCES
//   psygun      the gunslinger: Revolver Ocelot's twirls and ricochets (Metal Gear Solid), Samus's charge shot, the Western's
//               "dance!" at the boots, Equilibrium's gun kata (point blank), TF2's rocket jump, Lucky Luke's draw
//   sondelass   the pirate's blade, rod and hook: Marth's tipper reach, Dante's Stinger (Devil May Cry), Link's hookshot, the
//               keelhaul (dragged under the keel), One Piece's sea; its loadout's string as the jab (fighterkits.js)
//   soulbrush   the calligrapher's club and its paint: Okami's Celestial Brush (Power Slash, Cherry Bomb, Galestorm, Bloom), Splatoon's
//               Super Jump and Splashdown, the Inkling's roller
//   veritome    the camera that is a book: Fatal Frame's Camera Obscura (the Zero Shot, the capture circle), Pokemon Snap's pester
//               ball, Robin's tomes (Elwind's rise on the pages), the paparazzo's rush
//   dreamvane   the pole that dowses, picks and reads the sky: Sun Wukong's Ruyi Jingu Bang (it thrusts out long), the staff's
//               leg sweep, Poseidon's trident thrown, Raiden's lightning (Mortal Kombat) called down a rod, the pole vault, the
//               water witch's geyser
//   crucibelle  the bell and its notes: the temple bell of Dojoji (the Noh play: the bell dropped over the dancer), Quasimodo on the
//               bell rope (The Hunchback of Notre-Dame), the town crier's hand bell, Kirby's Mike, Ocarina of Time's songs, Fox's
//               reflector as the toll that sends shots back
//   lockheart   the coffin on a chain (keys/lockheart.js FIGHTER): the thurible (the Botafumeiro), the meteor hammer and rope dart,
//               the kusarigama, Simon Belmont's Vampire Killer, Scorpion's spear ("Get over here"), the reliquary's gulp
//
// Prior art: Super Smash Bros. (the four specials by the stick, the B-reverse that turns a side special behind); Melee's frame data for
// each slot's shape (Mario's tilts, Marth's and Roy's blade, Falco's blaster, Peach's turnip arc, Ness's PK Fire, Samus's bomb, Link's
// boomerang and spin, Fox's reflector, Sheik's needles, Zelda's Din's Fire, Ganondorf's Wizard's Foot); Ultimate's Hero, Joker and
// Byleth (a weapon's identity through every slot).
//
//   TOOL_KITS[ruleTool][slot] -> a move in platformfighter.js's shape   TOOL_BOXES[ruleTool][slot] -> [[x, y, r], ...] (x along the facing)
//   ROW_NAMES[ruleTool][slot] -> [name, from] (a slot a combat row fills, named for the Arena)   SLOT_ORDER (the ten, for a sheet or a lectern)
// ---------------------------------------------------------------------------------------

/** The ten slots every tool fills, normals then specials. */
export const SLOT_ORDER = ['jab1', 'ftilt', 'utilt', 'dtilt', 'dash', 'nspecial', 'sspecial', 'bspecial', 'uspecial', 'dspecial'];

const mv = (name, from, o) => ({ name, from, angle: 361, base: 20, growth: 80, ...o });

/** Each tool's own moves for the slots its combat/moves.js rows do not fill (fighterkits.js kitFor lays these under SLOTS). */
export const TOOL_KITS = {
  psygun: {
    jab2: mv('Butt stroke', 'the psygun: the grip brought back across (Ocelot\'s pistol-whip, the second beat)', { damage: 3, angle: 70, base: 10, growth: 60, startup: 3, active: [3, 5], total: 20 }),
    ftilt: mv('Point blank', 'the psygun: the muzzle at the chest (Equilibrium\'s gun kata; Falco\'s blaster\'s fizzle at the barrel)', { damage: 9, angle: 361, base: 12, growth: 95, startup: 6, active: [6, 8], total: 30 }),
    utilt: mv('Sky shot', 'the psygun: aimed straight up, the muzzle blast over the head (Fox\'s up tilt\'s arc, a shot at a bird)', { damage: 8, angle: 95, base: 28, growth: 110, startup: 5, active: [5, 9], total: 30 }),
    dtilt: mv('Dance!', 'the psygun: shots at the boots (the Western\'s "dance!"; the trip as Marth\'s down tilt\'s low angle)', { damage: 6, angle: 20, base: 25, growth: 50, startup: 5, active: [5, 7], total: 26 }),
    dash: mv('Quick draw', 'the psygun: drawn on the run, faster than its shadow (Lucky Luke; Fox\'s dash attack\'s lunge)', { damage: 8, angle: 50, base: 50, growth: 60, startup: 4, active: [4, 8], total: 36 }),
    bspecial: mv('Over the shoulder', 'the psygun: a shot behind without looking (Revolver Ocelot\'s ricochet; Falco\'s laser\'s speed)', { damage: 5, angle: 150, base: 10, growth: 40, startup: 9, active: [9, 9], total: 32, special: 'shot', shot: { back: true, speed: 20, r: 0.16 } }),
    uspecial: mv('Recoil jump', 'the psygun: fired at the floor to fly (TF2\'s rocket jump; Samus\'s screw attack\'s rise)', { damage: 7, angle: 270, base: 40, growth: 60, startup: 6, active: [6, 10], total: 34, special: 'recover', rise: 1.4, drift: 1.2 }),
    dspecial: mv('Ricochet twirl', 'the psygun: the gun spun on the finger, and what it meets sent back (Ocelot\'s twirl; Fox\'s reflector)', { damage: 4, angle: 361, base: 40, growth: 50, startup: 2, active: [2, 6], total: 30, special: 'reflect', reflect: [2, 22] }),
  },
  sondelass: {
    sspecial: mv('Hookshot', 'the Sondelass\'s hook thrown out on its line, a tether to a ledge (Link\'s hookshot; Samus\'s grapple)', { damage: 4, angle: 361, base: 20, growth: 40, startup: 10, active: [10, 18], total: 40, special: 'hook' }),
    bspecial: mv('Keelhaul', 'the Sondelass\'s hook cast behind and hauled through (the pirates\' keelhaul; Link\'s hookshot reeling in)', { damage: 7, angle: 30, base: 45, growth: 55, startup: 12, active: [12, 18], total: 44 }),
  },
  brush: {
    jab3: mv('Brush sweep', 'the Soul Brush: the third stroke (a calligrapher\'s finishing sweep)', { damage: 5, angle: 361, base: 15, growth: 100, startup: 5, active: [5, 8], total: 24 }),
    utilt: mv('Ink flick', 'the Soul Brush: a flick of paint up over the head (the Inkling\'s up tilt; a sumi splash)', { damage: 7, angle: 92, base: 30, growth: 105, startup: 5, active: [5, 10], total: 28 }),
    dtilt: mv('Floor stroke', 'the Soul Brush: a stroke laid along the floor (the Inkling\'s roller; a trip as Marth\'s down tilt)', { damage: 7, angle: 20, base: 30, growth: 60, startup: 6, active: [6, 10], total: 28 }),
    nspecial: mv('Cherry Bomb', 'the Soul Brush: a lit circle of paint lobbed to burst (Okami\'s Cherry Bomb; Peach\'s turnip\'s arc, the Inkling\'s Splat Bomb)', { damage: 9, angle: 50, base: 40, growth: 70, startup: 16, active: [16, 16], total: 44, special: 'shot', shot: { speed: 8, vy: 7, grav: 18, r: 0.32, life: 90 } }),
    sspecial: mv('Power Slash', 'the Soul Brush: one straight line drawn through them (Okami\'s Power Slash; Marth\'s Dancing Blade\'s step in)', { damage: 12, angle: 361, base: 30, growth: 75, startup: 10, active: [10, 15], total: 44, special: 'lunge', lunge: 3 }),
    bspecial: mv('Galestorm', 'the Soul Brush: a swirl of wind drawn behind (Okami\'s Galestorm; Mr. Game & Watch\'s fan)', { damage: 6, angle: 170, base: 70, growth: 40, startup: 9, active: [9, 16], total: 38 }),
    uspecial: mv('Super Jump', 'the Soul Brush: up on a jet of paint (Splatoon\'s Super Jump; the Inkling\'s up special)', { damage: 6, angle: 85, base: 35, growth: 60, startup: 5, active: [5, 9], total: 32, special: 'recover', rise: 1.35, drift: 1.8 }),
    dspecial: mv('Splashdown', 'the Soul Brush: a leap and a slam that rings paint out (Splatoon\'s Splashdown; Okami\'s Bloom\'s circle)', { damage: 13, angle: 60, base: 50, growth: 80, startup: 18, active: [18, 22], total: 50, shatter: 0.2 }),
  },
  veritome: {
    jab2: mv('Spine back', 'the Veritome: the book\'s spine brought back across (a librarian\'s rap)', { damage: 3, angle: 75, base: 10, growth: 60, startup: 3, active: [3, 5], total: 20 }),
    utilt: mv('Page fan', 'the Veritome: the pages riffled overhead, paper cuts (Robin\'s tome; a flip book\'s riffle)', { damage: 6, angle: 95, base: 25, growth: 110, startup: 5, active: [5, 12], total: 30, hits: 3 }),
    dtilt: mv('Low plate', 'the Veritome: a photograph from the floor (Pokemon Snap\'s cart-height plate; a trip)', { damage: 6, angle: 20, base: 25, growth: 55, startup: 5, active: [5, 7], total: 26 }),
    dash: mv('Paparazzo', 'the Veritome: lens first at a run (the paparazzo\'s rush; Fox\'s dash attack\'s shape)', { damage: 7, angle: 55, base: 45, growth: 60, startup: 5, active: [5, 10], total: 36 }),
    nspecial: mv('Zero Shot', 'the Veritome: the shutter at the very frame it strikes (Fatal Frame\'s Zero Shot; Marth\'s tipper: one clean frame)', { damage: 18, angle: 361, base: 40, growth: 90, startup: 14, active: [14, 14], total: 40, late: { at: 15, damage: 4, base: 10, growth: 50 } }),
    sspecial: mv('Pester ball', 'the Veritome: a pester ball thrown to make them turn (Pokemon Snap; Link\'s boomerang\'s arc)', { damage: 5, angle: 70, base: 30, growth: 40, startup: 12, active: [12, 12], total: 38, special: 'shot', shot: { speed: 10, vy: 4, grav: 10, r: 0.24, life: 80 } }),
    bspecial: mv('Over-the-shoulder flash', 'the Veritome: the flash fired behind (Fatal Frame\'s camera flash; Sheik\'s Vanish\'s burst)', { damage: 4, angle: 150, base: 60, growth: 30, startup: 6, active: [6, 9], total: 34 }),
    uspecial: mv('Elwind', 'the Veritome: up on its own pages\' wind (Robin\'s Elwind, a tome\'s recovery)', { damage: 5, angle: 270, base: 30, growth: 50, startup: 6, active: [6, 10], total: 34, special: 'recover', rise: 1.25, drift: 1.4 }),
    dspecial: mv('Capture circle', 'the Veritome: the lens raised, and what flies at it taken into the plate and sent back (Fatal Frame\'s capture circle; Fox\'s reflector)', { damage: 3, angle: 361, base: 30, growth: 40, startup: 3, active: [3, 8], total: 34, special: 'reflect', reflect: [3, 24] }),
  },
  dreamvane: {
    dtilt: mv('Staff sweep', 'the Dreamvane: the pole swept low round the ankles (the staff\'s leg sweep; Sun Wukong\'s low spin)', { damage: 8, angle: 25, base: 30, growth: 65, startup: 7, active: [7, 11], total: 32 }),
    dash: mv('Ruyi thrust', 'the Dreamvane: the pole run out long on the run (Sun Wukong\'s Ruyi Jingu Bang, that grows; Marth\'s dash attack\'s reach)', { damage: 10, angle: 40, base: 50, growth: 70, startup: 8, active: [8, 12], total: 40 }),
    sspecial: mv('Trident throw', 'the Dreamvane: its fork thrown flat (Poseidon\'s trident; Sheik\'s needles\' line)', { damage: 8, angle: 361, base: 25, growth: 50, startup: 14, active: [14, 14], total: 40, special: 'shot', shot: { speed: 16, r: 0.22, life: 60 } }),
    bspecial: mv('Lightning rod', 'the Dreamvane: planted behind, the sky\'s bolt called down it (Raiden\'s lightning, Mortal Kombat; Zelda\'s Din\'s Fire\'s column)', { damage: 12, angle: 100, base: 45, growth: 80, startup: 16, active: [16, 20], total: 46 }),
    uspecial: mv('Pole vault', 'the Dreamvane: vaulted up off the pole (the pole vault; Sun Wukong riding the staff\'s growth)', { damage: 6, angle: 80, base: 30, growth: 55, startup: 7, active: [7, 11], total: 34, special: 'recover', rise: 1.45, drift: 2.0 }),
    dspecial: mv('Geyser', 'the Dreamvane: the pick driven where it dowsed, and the water under it let up (the water witch\'s rod; Ness\'s PK Fire\'s pillar)', { damage: 11, angle: 88, base: 55, growth: 70, startup: 15, active: [15, 22], total: 48 }),
  },
  crucibelle: {
    utilt: mv('High note', 'the Crucibelle: the high note rung overhead (the carillon\'s top bell; Kirby\'s Mike, up)', { damage: 7, angle: 92, base: 30, growth: 105, startup: 6, active: [6, 10], total: 30 }),
    dtilt: mv('Low note', 'the Crucibelle: the low note struck at the floor, a ring along it (the gong struck low; a trip)', { damage: 6, angle: 20, base: 30, growth: 55, startup: 6, active: [6, 9], total: 28 }),
    dash: mv('Town crier', 'the Crucibelle: rung on the run (the town crier\'s hand bell; Mr. Game & Watch\'s dash)', { damage: 8, angle: 55, base: 45, growth: 60, startup: 6, active: [6, 11], total: 38, hits: 2 }),
    sspecial: mv('Thrown note', 'the Crucibelle: a note sent as a ring of sound (Ocarina of Time\'s songs; Kirby\'s Mike\'s wave)', { damage: 6, angle: 361, base: 35, growth: 45, startup: 12, active: [12, 12], total: 36, special: 'shot', shot: { speed: 11, r: 0.36, life: 55 } }),
    bspecial: mv('Dojoji', 'the Crucibelle: the bell brought down behind (the Noh play Dojoji, the bell dropped over the dancer; Ganondorf\'s Wizard\'s Foot\'s weight)', { damage: 13, angle: 280, base: 40, growth: 75, startup: 15, active: [15, 18], total: 46 }),
    uspecial: mv('Bell rope', 'the Crucibelle: up the bell\'s rope as it peals (Quasimodo, The Hunchback of Notre-Dame; Ness\'s PK Thunder\'s rise)', { damage: 7, angle: 85, base: 35, growth: 60, startup: 5, active: [5, 10], total: 32, special: 'recover', rise: 1.3, drift: 1.6 }),
    dspecial: mv('The toll', 'the Crucibelle: the toll that sends shots back (Fox\'s reflector, rung)', { damage: 5, angle: 361, base: 40, growth: 50, startup: 1, active: [1, 4], total: 30, special: 'reflect', reflect: [1, 20] }),
  },
  lockheart: {
    utilt: mv('Censer', 'the Lockheart: the coffin swung up over the head on its chain (the Botafumeiro of Santiago)', { damage: 9, angle: 95, base: 30, growth: 110, startup: 7, active: [7, 13], total: 34 }),
    dtilt: mv('Chain sweep', 'the Lockheart: the chain whipped round the ankles (the kusarigama\'s ground circle; a trip)', { damage: 7, angle: 20, base: 30, growth: 60, startup: 7, active: [7, 11], total: 32 }),
    dash: mv('Meteor bowl', 'the Lockheart: the coffin bowled along the floor on the run (the meteor hammer\'s low throw)', { damage: 10, angle: 45, base: 55, growth: 65, startup: 9, active: [9, 14], total: 44 }),
    nspecial: mv('Get over here', 'the Lockheart: the coffin thrown out on its chain and hauled home with them (Scorpion\'s spear, Mortal Kombat)', { damage: 7, angle: 165, base: 50, growth: 30, startup: 14, active: [14, 20], total: 46 }),
    sspecial: mv('Snare', 'the Lockheart: the chain thrown to wrap and the coffin yanked through (the kusarigama\'s throw and yank)', { damage: 9, angle: 361, base: 35, growth: 70, startup: 13, active: [13, 19], total: 44 }),
    bspecial: mv('Vampire Killer', 'the Lockheart: the chain cocked over the shoulder and cracked behind (Simon Belmont, Castlevania)', { damage: 12, angle: 150, base: 30, growth: 85, startup: 14, active: [14, 17], total: 42, late: { at: 16, damage: 6, base: 20, growth: 60 } }),
    uspecial: mv('Bell rope', 'the Lockheart: the coffin whirled overhead and ridden up on its chain (the Botafumeiro\'s ropes; the rope dart\'s whirl)', { damage: 8, angle: 85, base: 35, growth: 60, startup: 6, active: [6, 14], total: 36, special: 'recover', rise: 1.25, drift: 1.4, hits: 3 }),
    dspecial: mv('The Opening', 'the Lockheart: the reliquary opened, and what flies in swallowed and spat back (its gulp; Fox\'s reflector\'s place)', { damage: 4, angle: 361, base: 40, growth: 50, startup: 4, active: [4, 9], total: 36, special: 'reflect', reflect: [4, 24] }),
  },
};

/** Each tool's boxes where the bare set's do not fit its reach or its way (x along the facing, before the tool's reach; a back
 *  special's behind, x < 0; y up from the feet; r). */
export const TOOL_BOXES = {
  psygun: { ftilt: [[0.95, 1.15, 0.4]], utilt: [[0.15, 2.2, 0.5]], dtilt: [[0.9, 0.2, 0.4]], dash: [[0.8, 1.0, 0.45]], uspecial: [[0.1, -0.1, 0.55]], dspecial: [[0, 1.0, 0.8]] },
  sondelass: { bspecial: [[-1.2, 1.0, 0.35], [-2.0, 1.0, 0.35], [-2.8, 1.0, 0.35]] },
  brush: { jab3: [[0.85, 0.9, 0.42]], utilt: [[0.25, 1.95, 0.5]], dtilt: [[0.95, 0.15, 0.42]], sspecial: [[0.9, 1.0, 0.5]], bspecial: [[-0.95, 1.0, 0.65]], uspecial: [[0.1, 0.4, 0.55]], dspecial: [[0.95, 0.25, 0.6], [-0.95, 0.25, 0.6], [0, 0.4, 0.7]] },
  veritome: { utilt: [[0.15, 1.95, 0.48]], dtilt: [[0.85, 0.25, 0.38]], dash: [[0.75, 1.15, 0.45]], nspecial: [[1.1, 1.15, 0.5]], bspecial: [[-0.9, 1.2, 0.7]], uspecial: [[0, 1.0, 0.55]], dspecial: [[0, 1.1, 0.8]] },
  dreamvane: { dtilt: [[1.0, 0.2, 0.4], [-0.5, 0.2, 0.35]], dash: [[1.3, 1.0, 0.38]], bspecial: [[-1.3, 0.7, 0.45], [-1.3, 1.6, 0.45], [-1.3, 2.5, 0.45]], uspecial: [[0.4, 0.5, 0.5]], dspecial: [[0.8, 0.5, 0.55], [0.8, 1.4, 0.5]] },
  crucibelle: { utilt: [[0.1, 2.0, 0.55]], dtilt: [[0.9, 0.2, 0.45]], dash: [[0.8, 1.0, 0.5]], bspecial: [[-0.9, 0.6, 0.62]], uspecial: [[0.1, 1.9, 0.5]] },
  lockheart: { utilt: [[0.3, 2.2, 0.5]], dtilt: [[0.9, 0.2, 0.4], [-0.9, 0.2, 0.4]], dash: [[1.0, 0.35, 0.5]], nspecial: [[0.9, 1.0, 0.36], [1.4, 1.0, 0.36], [1.8, 1.0, 0.36]], sspecial: [[0.85, 1.0, 0.38], [1.3, 1.0, 0.38]], bspecial: [[-0.8, 1.05, 0.34], [-1.3, 1.05, 0.34], [-1.7, 1.05, 0.38]], uspecial: [[0, 2.0, 0.65]], dspecial: [[0, 1.0, 0.8]] },
};

/** The names of the slots the tools' combat rows fill (fighterkits.js SLOTS), so every one of the ten reads as its tool's own. */
export const ROW_NAMES = {
  psygun: { jab1: ['Pistol whip', 'the psygun\'s whip (Ocelot\'s pistol-whip)'], nspecial: ['Charge shot', 'the psygun\'s shot held (Samus\'s charge shot)'], sspecial: ['Fan the Hammer', 'the psygun\'s special (the gunslinger\'s fanned hammer)'] },
  sondelass: { jab1: ['Slash', 'the loadout\'s first'], jab2: ['Second cut', 'the loadout\'s second'], jab3: ['Third cut', 'the loadout\'s third'], ftilt: ['Leap strike', 'the loadout\'s fourth (Marth\'s forward tilt\'s reach)'],
    utilt: ['Launcher', 'the Sondelass\'s launcher (Devil May Cry\'s High Time)'], dtilt: ['Low Sweep', 'the Sondelass\'s low sweep'], dash: ['Dash slash', 'the Sondelass\'s dash'],
    nspecial: ['Stinger', 'the Sondelass\'s stinger (Devil May Cry)'], sspecial: ['Hookshot', 'the Sondelass\'s hook (Link\'s hookshot)'], uspecial: ['Rising Stinger', 'the stinger aimed up (Fox\'s Firefox)'], dspecial: ['Tidecutter', 'the Sondelass mastered'] },
  brush: { jab1: ['Brush stroke', 'the club\'s combo 1'], jab2: ['Return stroke', 'the club\'s combo 2'], ftilt: ['Heavy stroke', 'the club\'s combo 3'], dash: ['Brush dive', 'the Soul Brush\'s dive'] },
  dreamvane: { jab1: ['Pole jab', 'the Dreamvane\'s combo 1'], jab2: ['Pole swing', 'the Dreamvane\'s combo 2'], jab3: ['Pole spin', 'the Dreamvane\'s combo 3'], ftilt: ['Pick drive', 'the pause string\'s finisher'],
    utilt: ['Vane lift', 'the Dreamvane\'s launcher'], nspecial: ['Dreamquake', 'the Dreamvane\'s special (Donkey Kong\'s Hand Slap\'s ring)'] },
  crucibelle: { jab1: ['Toll', 'the first toll'], jab2: ['Second toll', 'the second toll'], ftilt: ['Great toll', 'the third toll'], nspecial: ['Fever peak', 'the Crucibelle at full fever (Kirby\'s Mike, its last)'] },
  lockheart: { jab1: ['Flail', 'the flail\'s first'], jab2: ['Overhead flail', 'the flail\'s second'], ftilt: ['Whirl', 'the flail\'s third'] },
  veritome: { jab1: ['Book bash', 'the Veritome\'s bash'], ftilt: ['Spine slam', 'the Veritome\'s second bash'] },
};
