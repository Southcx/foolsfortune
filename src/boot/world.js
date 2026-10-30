// ---------------------------------------------------------------------------------------
// BOOT WORLD: the painted sky, the cubes, the room's mood and the chests; the paint map; the level, then the places that add static
// geometry to it (the Dunes, Margarite's dock, a puzzle duel's session and its foes, Raku's bazaar with its Treasury and hall, the
// moonflowers on the pond's far shore), the wipes, the weather's, the god hand's and the awakening's looks, the night sky and the shore;
// the seam; the Great Dunemaw; what the movement techs read from the environment (water, ladders, movers, rigging, lobbers); the brush's,
// the parry's and the Figment telegraphs' looks; the level built and the first room's props spawned.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootWorld(game, made) -> { level, treasuryAt, movers, env, spawnRoom }
// ---------------------------------------------------------------------------------------
import { Level } from '../world/level.js';
import { PaintMap } from '../world/ground/paintmap.js';
import { PaintTrack } from '../world/ground/painttrack.js';
import { Stains } from '../world/ground/stains.js';
import { LoadGauge } from '../feedback/loadgauge.js';
import { loadAspect } from '../tools/soulbrush/load.js';
import { NightSky } from '../vfx/nightsky.js';
import { WaterFx } from '../vfx/waterfx.js';
import { BrushLoad } from '../vfx/brushload.js';
import { ParryMark } from '../vfx/parrymark.js';
import { FigmentTelegraphs } from '../vfx/figmenttelegraph.js';
import * as RailLook from '../vfx/rail.js';
import { SHORE } from '../world/dunes/beach.js';
import { Margarite } from '../world/emocean/margarite.js';
import { Bazaar, BAZAAR } from '../world/bazaar/bazaar.js';
import { BazaarHall } from '../vfx/bazaarhall.js';
import { Touchstone } from '../world/touchstone/touchstone.js';
import { BazaarTable } from '../vfx/bazaartable.js';
import { Chips } from '../progress/casino/chips.js';
import { Rigging } from '../courier/moves/rigging.js';
import { Lobbers } from '../creatures/lobber.js';
import { Dunes, DUNE, POND } from '../world/dunes/dunes.js';
import { Dunemaw } from '../world/well/dunemaw.js';
import { Water, Ladders } from '../courier/moves/env.js';
import { Movers } from '../world/props/movers.js';
import { buildTreasury } from '../world/treasury.js';
import { Sky } from '../vfx/sky.js';
import { WeatherLook } from '../vfx/weather.js';
import { AwakeningLook } from '../vfx/awakeninglook.js';
import { GodhandLooks } from '../vfx/godhand/godhandlooks.js';
import { DomainLooks } from '../vfx/domainlooks.js';
import { PalmDieLook } from '../vfx/godhand/palmdie.js';
import { MawWipe } from '../vfx/mawwipe.js';
import { AreaWipe } from '../vfx/areawipe.js';
import { AberrantWipe } from '../vfx/aberrantwipe.js';
import { Daturas } from '../vfx/datura.js';
import { Shore } from '../vfx/shore.js';
import { Cubes } from '../world/treasure/cubes.js';
import { Mood } from '../core/mood.js';
import { Chests } from '../world/treasure/chests.js';
import { Seam } from '../render/seam.js';
import { Rave } from '../vfx/rave.js';
import { DuelSession } from '../world/duel/duelsession.js';
import { DuelFoes } from '../world/duel/duelfoes.js';

export async function bootWorld(game, made) {
  const { mark, renderer, scene, hemi, amb, sun, physics, stats, breakables } = made;
  game.sky = await new Sky(game).load(); // (the painted sky: the dunes' dome, the water's reflection, the gloss on the cubes)
  game.cubes = new Cubes(game); // (condensed Lachryma: the currency; loose ones are real bodies)
  game.mood = new Mood(game); // (the room's lights, borrowed by a ceremony: see mood.js)
  game.chests = new Chests(game); // (treasure chests, the Tithe and how they open: see chests.js)
  game.chests.rave = new Rave(game); // (what a prismatic chest does to the room: vfx/rave.js; compiled and drawn once by the warm-up below, with the rest)
  mark('sky');
  game.paintmap = new PaintMap();
  game.paintTrack = new PaintTrack(game); // (the Courier through paint: prints and smears, world/ground/painttrack.js) // (where Lachryma lies on the ground: the Soul Brush's paint, the stains; the ground's shaders read it: world/ground/paintmap.js)
  const level = new Level(scene, physics, breakables); level.paintmap = game.paintmap; // (before the places that add static geometry to it: the shore's jetty, the Dunemaw's stones)
  game.level = level;
  game.dunes = new Dunes(game, { sun, hemi, amb }); // the sand sea far below
  game.margarite = new Margarite(game); // (Margarite's dock: the far end of the crossing, built with the level's static geometry; world/emocean/margarite.js)
  game.duel = new DuelSession(game); game.duelFoes = new DuelFoes(game); // (a puzzle duel with an aberrant Figment where it was met: world/duel/, docs/plans/PUZZLE-DUELS.md 8)
  game.chips = new Chips(game); game.bazaar = new Bazaar(game); game.bazaarTable = new BazaarTable(game); // (Raku's bazaar, the casino: its hall with the level's static geometry, its chips; world/bazaar/, docs/plans/CASINO.md)
  const treasuryAt = { x: BAZAAR.treasury.x, y: BAZAAR.y, z: BAZAAR.treasury.z, yaw: BAZAAR.treasury.yaw }; buildTreasury(level, treasuryAt); // (the Treasury in its slot on the bazaar's north side: world/treasury.js)
  game.touchstone = new Touchstone(game); // (the Assay's room: the standard trials, world/touchstone/)
  game.bazaarHall = new BazaarHall(game); // (the bazaar's Gold Saucer dress: dome, mosaic, stalls, neon, lanterns, carnival props; vfx/bazaarhall.js)
  { // (the moonflowers on the pond's far shore: sacred datura is a desert native; vfx/datura.js)
    const at = (a, k = 1.12) => ({ x: DUNE.x + POND.x + Math.cos(a) * POND.rx * k, z: DUNE.z + POND.z + Math.sin(a) * POND.rz * k });
    game.daturas = new Daturas(game, [{ ...at(-2.2), n: 9 }, { ...at(-1.75, 1.18), n: 6 }, { ...at(-2.6, 1.1), n: 7 }]);
  }
  game.mawWipe = new MawWipe(game); // (the seam into a Well, covered: close(onCovered), then open() when the floor is built)
  game.areaWipe = new AreaWipe(game); // (the seam's kind 'area': a change of area covered by the island's frame, the card and the name; DOM, vfx/areawipe.js)
  game.aberrantWipe = new AberrantWipe(game); // (the battle transition into a puzzle duel with an aberrant: catch, bug, crackle on close(onCovered, { foe }), the shatter on open(); a screen volume of the glow, vfx/aberrantwipe.js)
  game.weatherLook = new WeatherLook(game); // (the weather's and the hour's look: reads game.weather; with none, the painting as it is)
  game.godhandLooks = new GodhandLooks(game); // (the god powers' marks, the miracles' falls, the drawn sign: vfx/godhand/godhandlooks.js)
  game.domainLooks = new DomainLooks(game); // (the domains' effects at their moments: a level-up at the Courier, a god power's act beside its mark; vfx/domainlooks.js)
  game.palmDieLook = new PalmDieLook(game); // (the palm die in the god hand's palm, in your stones' mineral: vfx/godhand/palmdie.js)
  game.awakeningLook = new AwakeningLook(game); // (a feeling's heavy weather flooding round the Courier on feeling.wake, its clip on feeling.embody: vfx/awakeninglook.js)
  game.nightSky = new NightSky(game, { seaBearing: SHORE.angle }); // (the night alive: the stars' wheel, meteors and showers, the aurora over the sea at the Shore, the moon's phases, the constellations, each feeling's night; vfx/nightsky.js)
  game.shore = new Shore(game); // (the shore's look: the crude sea from the sand, the swash, the wet sand; it builds once the beach exists)
  mark('dunes');
  game.seam = new Seam(game); // (a place changed under a cover: render/seam.js)
  game.well = new Dunemaw(game); // (the Great Dunemaw: the Well in the Dunes, its mouth out on the sand: world/well/dunemaw.js)
  // what the environmental movement techs read: water, ladders, slip (built with the level)
  const movers = new Movers(game);
  const env = { water: new Water(scene, game.sky), ladders: new Ladders(scene), movers, rigging: new Rigging(scene, physics), lobbers: new Lobbers(scene, physics) };
  level.env = env;
  game.loadGauge = new LoadGauge(game); // (what the brush's load spends, shown where you look: the arc, the jets' rings: feedback/loadgauge.js)
  game.stains = new Stains(game); // (spilled crude by the game day's layout and the cracked bottles, drawn as Calissa's stains: world/ground/stains.js)
  game.water = env.water; game.ladders = env.ladders; game.movers = movers; game.rigging = env.rigging; game.lobbers = env.lobbers;
  // every coat is the paint map's (docs/plans/PAINT.md, one store): the Courier's laid in the brush's feeling, anyone else's a slick
  game.paintmap.aspectOf = () => loadAspect(game);
  game.ai?.eco.provide('slip', (pos, range) => game.paintmap.spots.filter((d) => d.age > d.delay && d.life - d.age > 4 && d.r > 0.7 && d.n.y > 0.7 && d.c.distanceTo(pos) < range).slice(0, 6).map((d) => ({ pos: d.c, radius: d.r, ref: d }))); // (wet ground is water to anything made of sand and water: creatures/ai/ecology.js; the offer's id is the minds' data)
  game.waterFx = new WaterFx(game, renderer); // (a swim's feedback: the rings and the wake's V in the ripple tank, the dive's crown, the drips; vfx/waterfx.js)
  game.brushLoad = new BrushLoad(game); // (the Soul Brush's load, seen: saturate, paint, mop, the slide on wet ground; driven by the brush's mechanics, vfx/brushload.js)
  game.parryMark = new ParryMark(game); // (what can be parried wears Lachryma, and nothing else: parryMark.mark(obj, { eta }); hot, with a glint, while V would answer it: vfx/parrymark.js)
  game.figmentTelegraphs = new FigmentTelegraphs(game); // (what Divination draws of a windup: figmentTelegraphs.show(id, figmentMarkOf(...), { origin, facing, eta }); vfx/figmenttelegraph.js, wired by creatures.windup and the timeline runner)
  game.railLook = RailLook; // (the crossing's look for the rail: RAIL_VIEWS, swingLook, ShipWake, ShoalLook, BrigLook, BoarderLook, LeviathanLook; vfx/rail.js, the sloop's feeling/hurt/hoist)
  level.build();
  mark('level');
  const spawnRoom = () => {
    level.spawnDynamic();
    stats.broken = 0;
    stats.total = [...breakables.items].filter((e) => !e.def.target).length;
  };
  spawnRoom();
  game.breakables = breakables;

  mark('spawn');
  return { level, treasuryAt, movers, env, spawnRoom };
}
