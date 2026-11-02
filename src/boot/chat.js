// ---------------------------------------------------------------------------------------
// BOOT CHAT: the chat line in the log, and the systems that add commands to it or that a command drives: the Sight's, the perf readout,
// the start place, the god hand's mudras, the calibrate buttons, and the Raceway's garage, track editor and haunt mode.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootChat(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import { Chat } from '../feedback/chat.js';
import { SkiffParts } from '../progress/skiffparts.js';
import { SkiffPaint } from '../progress/skiffpaint.js';
import { TrackEditor } from '../world/raceway/editor.js';
import { Haunt } from '../world/raceway/haunt.js';
import { PoolCaps } from '../progress/poolcaps.js';
import { SkiffSettings } from '../courier/skiff/skiffsettings.js';
import { PerfReadout } from '../debug/perfreadout.js';
import { FieldReport } from '../debug/fieldreport.js';
import { Presets } from '../debug/presetloader.js';
import { PerfAB } from '../debug/perfab.js';
import { StartAt } from '../debug/startat.js';
import { sightCommands } from '../progress/sight.js';
import { mudraCommands } from '../godhand/mudras.js';
import { installCalibrateButtons } from '../ui/calibratebutton.js';
import { installCollectionsLook } from '../ui/collectionslook.js';
import { installGodArtsLook } from '../ui/godartslook.js';
import { installGodArtSelector } from '../ui/godartselector.js';
import { installSealBookLook } from '../ui/sealbooklook.js';
import { Flourishes } from '../vfx/flourishes.js';
import { ToolSkins } from '../vfx/toolskinwear.js';
import { CardBackChoice } from '../ui/cardbackchoice.js';
import { skiffSetCommands } from '../vfx/skiffsets.js';

export function bootChat(game, made) {
  const { renderer, diag, cloud } = made;
  // the chat line in the log: words said aloud, /commands, emotes (chat.js, emotes.js)
  game.chat = new Chat(game);
  game.toolSkins = new ToolSkins(game); // (a tool's skin, looks only, kept in the save and /toolskin: vfx/toolskinwear.js, vfx/toolskins.js)
  game.systems.add('sim', game.toolSkins, { clock: 'raw', name: 'toolSkins', after: 'vessel' }); // (the `sim` phase: core/systems.js)
  game.cardBacks = new CardBackChoice(game); // (the back each deck wears, kept in the settings, and /cardback: ui/cardbackchoice.js)
  game.flourishes = new Flourishes(game); // (the Courier's flourishes: prints, dash trail, shatter, aura, arrival; /flourish: vfx/flourishes.js)
  game.systems.add('fx', game.flourishes, { clock: 'raw', name: 'flourishes' }); // (the `fx` phase: core/systems.js)
  sightCommands(game); // (/sight: the Sight's waypoint on the chat line)
  game.perfReadout = new PerfReadout(game, { diag, renderer }); // (the phone measurement panel: ?perf, /perf, the knob visual.perfReadout; debug/perfreadout.js, MOBILE.md 10.3)
  game.fieldReport = new FieldReport(game, { renderer, cloud }); // (what this load did on its device, to the page's private store: debug/fieldreport.js)
  game.perfAB = new PerfAB(game); // (/perfab: the phone timing its frame with each family of draws taken out, into the field report: debug/perfab.js)
  game.presets = new Presets(game); // (/preset: the DEBUG save put at a moment of play, debug/presetloader.js, Dovina's rows in debug/presets.js; DEBUG-MODE.md 5)
  game.startAt = new StartAt(game); // (?at=dunes|raceway|godhand|workshop: set down there after the title; debug/startat.js)
  mudraCommands(game); // (/mudra: the god hand holds one of its poses, DEBUG: godhand/mudras.js)
  installGodArtSelector(); // (the god hand's art selector dressed: arts.js's #goddomains and #godarts, ui/godartselector.js)
  installGodArtsLook(); // (the Codex's GOD ARTS shelf dressed: Dovina's codex/godarts.js classes, ui/godartslook.js)
  installCollectionsLook(); // (the Codex's COLLECTIONS shelf dressed: Dovina's codex/collections.js classes, ui/collectionslook.js)
  installSealBookLook(game); // (the Codex's SEAL BOOK shelf dressed as a goshuincho, by island: Petra's codex/sealbook.js classes, ui/sealbooklook.js)
  installCalibrateButtons(game); // (the Sight's TRACK buttons, set by a plate's pick and a charted room: ui/calibratebutton.js)
  game.skiffParts = new SkiffParts(game); game.skiffPaint = new SkiffPaint(game); skiffSetCommands(game); game.trackEditor = new TrackEditor(game); game.haunt = new Haunt(game); // (made tracks and the haunt mode: world/raceway/editor.js, haunt.js; TRACK-EDITOR.md)
  game.systems.add('world', game.trackEditor, { clock: 'raw', name: 'trackEditor', after: 'race' }); game.systems.add('world', game.haunt, { name: 'haunt', after: 'trackEditor' }); // (core/systems.js)
  game.skiffSettings = new SkiffSettings(game); game.poolCaps = new PoolCaps(game); // (the Solar Skiff's garage and settings, after the chat line they speak on: progress/skiffparts.js, courier/skiff/skiffsettings.js; caps on the pool, a cracked region 5% of its max until mended: progress/poolcaps.js)
}
