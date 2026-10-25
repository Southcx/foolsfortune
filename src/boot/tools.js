// ---------------------------------------------------------------------------------------
// BOOT TOOLS: the System, the effects (with the workbench's edits put in), the cinematic events and the looks that dress the Raceway; the
// psygun; the movement techs in their priority order; the tools on the belt (psygun, Sondelass, Soul Brush, Veritome, Dreamvane,
// Crucibelle, Lockheart) and the prone holster; the parries.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootTools(game, made) -> { system, weapon, techs }
// ---------------------------------------------------------------------------------------
import { DeathTech } from '../courier/vessel/death.js';
import { UltTech } from '../tools/lockheart/ultimate.js';
import { Weapon } from '../tools/psygun/weapon.js';
import { Techs } from '../courier/moves/techs.js';
import { Parries } from '../courier/parries.js';
import { Blink } from '../courier/moves/blink.js';
import { Hover, Rocket, Skim } from '../courier/moves/jets.js';
import { Slam } from '../courier/moves/slam.js';
import { Stomp } from '../courier/moves/stomp.js';
import { Roll } from '../courier/moves/roll.js';
import { Swim } from '../courier/moves/swim.js';
import { Ladder } from '../courier/moves/ladder.js';
import { Skiffing } from '../courier/skiff/skiff.js';
import { Sondelass } from '../tools/sondelass/sondelass.js';
import { SoulBrush } from '../tools/soulbrush/soulbrush.js';
import { Veritome } from '../tools/veritome/veritome.js';
import { Grapple } from '../tools/sondelass/grapple.js';
import { Launch } from '../courier/moves/launch.js';
import { SlipDive } from '../courier/moves/slip.js';
import { Hang } from '../courier/moves/hang.js';
import { Latch } from '../courier/moves/latch.js';
import { Pole } from '../courier/moves/pole.js';
import { Grate } from '../courier/moves/grate.js';
import { Balance } from '../courier/moves/balance.js';
import { Push } from '../courier/moves/push.js';
import { Carry } from '../courier/moves/carry.js';
import { Kick } from '../courier/moves/kick.js';
import { Recoil } from '../courier/moves/recoil.js';
import { RacewayLooks } from '../vfx/racewaylooks.js';
import { SkiffSlipArc } from '../vfx/skiffsliparc.js';
import { WorldLooks } from '../vfx/worldshells.js';
import { RacewayCavern } from '../vfx/racewaycavern.js';
import { RacewayPark } from '../vfx/racewaypark.js';
import { RacewayProps } from '../vfx/racewayprops.js';
import { RacewayFog } from '../vfx/racewayfog.js';
import { RacewaySiphons } from '../vfx/racewaysiphons.js'; // (the siphon arches' look)
import { System } from '../progress/system.js';
import { Kiln } from '../courier/moves/kiln.js';
import { Vfx } from '../vfx/vfx.js';
import { Auras } from '../vfx/auras.js';
import { Temper } from '../vfx/temper.js';
import { Cine, applyCineOverrides } from '../cine/sequence.js';
import { applyVfxOverrides } from '../workbench/overrides.js'; // (the edits kept from the workbench, put in at boot; the workbench itself is fetched on its first open: debug/workbenchloader.js)
import { ChestTech } from '../world/treasure/chests.js';
import { Emote } from '../courier/moves/emote.js';
import { Talk } from '../courier/moves/talk.js';
import { RhythmHold } from '../courier/moves/rhythmhold.js';
import { ToolBelt, psygunTool, sondelassTool, soulBrushTool, veritomeTool, heldTool } from '../tools/belt.js';
import { ProneHolster } from '../tools/proneholster.js';
import { Dreamvane } from '../tools/dreamvane/dreamvane.js';
import { Crucibelle } from '../tools/crucibelle/crucibelle.js';
import { Lockheart } from '../tools/lockheart/lockheart.js';

export function bootTools(game, made) {
  const { save, env, player } = made;
  // the System (what you've learned) is up before the techs, which ask it whether they may start
  const system = new System(game);
  game.system = system;
  // (every effect, by name: vfx/vfx.js, the looks in vfx/library.js; before the tools, which ask it for their swings)
  applyVfxOverrides(save); // (effects edited in the workbench, kept in this browser)
  game.vfx = new Vfx(game);
  game.skiffSlipArc = new SkiffSlipArc(game); // (the slip arc under the board while you ride: vfx/skiffsliparc.js)
  game.worldLooks = new WorldLooks(game); // (the World shells' draw and alterations: vfx/worldshells.js; the draw itself tools/psygun/worlddraw.js)
  game.racewayLooks = new RacewayLooks(game); // (the Raceway's sun plates, countdown lamps, gates' marks, carve sparks and ghost: dressed by the Raceway, vfx/racewaylooks.js)
  game.racewayCavern = new RacewayCavern(game); game.racewayFog = new RacewayFog(game); game.racewayPark = new RacewayPark(game); game.racewayProps = new RacewayProps(game); game.racewaySiphons = new RacewaySiphons(game); // (the cavern's stone, crystals, veins and dark, and Dread's fog on the course: vfx/racewaycavern.js, vfx/racewayfog.js)
  applyCineOverrides(save); game.cine = new Cine(game); // (cinematic events as data: cine/sequences.js)
  game.auras = new Auras(game); // (a status, shown round whatever has it: vfx/auras.js)
  game.temper = new Temper(game); // (a creature's mental state and agitation, shown with its body: vfx/temper.js)
  const weapon = new Weapon(game);
  game.weapon = weapon;
  // movement techs (priority order: the first that wants the step gets it)
  const techs = new Techs(player, game);
  for (const T0 of [DeathTech, UltTech, Skim, Swim, Ladder, Pole, Grate, Hang, Latch, ChestTech, Talk, RhythmHold, Kiln, Emote, Push, SlipDive, Roll, Slam, Blink, Hover, Rocket, Stomp, Balance, Carry, Kick, Recoil, Skiffing, Grapple, Launch, Sondelass, SoulBrush, Veritome, Dreamvane, Crucibelle, Lockheart]) techs.add(new T0(techs));
  env.lobbers.game = game;
  // the psychic tools: one in the hands at a time, and one set of rules for what that means (tools/belt.js)
  game.belt = new ToolBelt(game);
  game.belt.add(psygunTool(weapon));
  game.belt.add(sondelassTool(techs.get('sondelass')));
  game.belt.add(soulBrushTool(techs.get('soulbrush')));
  game.belt.add(veritomeTool(techs.get('veritome')));
  game.belt.add(heldTool(techs.get('dreamvane'), 'THE DREAMVANE', 'back'));
  game.belt.add(heldTool(techs.get('crucibelle'), 'THE CRUCIBELLE', 'hip'));
  game.belt.add(heldTool(techs.get('lockheart'), 'THE LOCKHEART', 'neck'));
  game.proneHolster = techs.add(new ProneHolster(techs)); // (lying down: every tool put away, none drawn, the one in the hands back out once up: tools/proneholster.js)
  player.techs = techs;
  game.techs = techs;
  game.parries = new Parries(game); // (V with a tool in the hands: the tool's own parry, docs/plans/PARRY.md; courier/parries.js)
  return { system, weapon, techs };
}
